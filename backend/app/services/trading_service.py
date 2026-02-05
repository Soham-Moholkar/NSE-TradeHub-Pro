from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import random

from app.models.trading import (
    Portfolio, Position, Transaction, Order, Achievement, 
    TradingSignal, LeaderboardEntry, PriceAlert,
    OrderType, OrderSide, OrderStatus, TransactionType, AchievementType, AlertType
)
from app.models.community import User
from app.services.data_service import data_service


class TradingService:
    """Comprehensive trading service for paper trading platform"""
    
    INITIAL_CASH = 100000.0
    TRANSACTION_FEE_PERCENT = 0.001  # 0.1% fee
    
    def create_portfolio(self, db: Session, user_id: int, initial_cash: float = None) -> Portfolio:
        """Create a new portfolio for a user"""
        # Check if portfolio already exists
        existing = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
        if existing:
            return existing
        
        cash = initial_cash or self.INITIAL_CASH
        portfolio = Portfolio(
            user_id=user_id,
            cash_balance=cash,
            total_value=cash,
            total_invested=0.0,
            total_returns=0.0,
            returns_percentage=0.0
        )
        
        db.add(portfolio)
        
        # Create initial transaction
        transaction = Transaction(
            portfolio=portfolio,
            transaction_type=TransactionType.DEPOSIT,
            total_amount=cash,
            fees=0.0,
            notes="Initial deposit"
        )
        db.add(transaction)
        
        # Create leaderboard entry
        leaderboard_entry = LeaderboardEntry(
            user_id=user_id,
            total_returns=0.0,
            returns_percentage=0.0,
            total_trades=0,
            win_rate=0.0,
            sharpe_ratio=0.0
        )
        db.add(leaderboard_entry)
        
        db.commit()
        db.refresh(portfolio)
        
        return portfolio
    
    def get_portfolio(self, db: Session, user_id: int) -> Optional[Portfolio]:
        """Get user's portfolio"""
        return db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    
    def place_order(
        self, 
        db: Session, 
        portfolio_id: int, 
        symbol: str, 
        side: OrderSide, 
        quantity: int, 
        order_type: OrderType, 
        limit_price: Optional[float] = None
    ) -> Order:
        """Place a trading order"""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            raise ValueError("Portfolio not found")
        
        # Get current price
        current_price = self._get_current_price(db, symbol)
        if not current_price:
            raise ValueError(f"Cannot get price for {symbol}")
        
        # Validate order
        if side == OrderSide.BUY:
            estimated_cost = current_price * quantity * (1 + self.TRANSACTION_FEE_PERCENT)
            if estimated_cost > portfolio.cash_balance:
                raise ValueError("Insufficient funds")
        elif side == OrderSide.SELL:
            position = db.query(Position).filter(
                Position.portfolio_id == portfolio_id,
                Position.symbol == symbol
            ).first()
            if not position or position.quantity < quantity:
                raise ValueError("Insufficient shares to sell")
        
        # Create order
        order = Order(
            portfolio_id=portfolio_id,
            symbol=symbol,
            order_type=order_type,
            side=side,
            quantity=quantity,
            limit_price=limit_price,
            status=OrderStatus.PENDING
        )
        db.add(order)
        db.commit()
        
        # Execute market orders immediately
        if order_type == OrderType.MARKET:
            self._execute_order(db, order.id, current_price)
        
        db.refresh(order)
        return order
    
    def _execute_order(self, db: Session, order_id: int, execution_price: float):
        """Execute a pending order"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or order.status != OrderStatus.PENDING:
            return
        
        portfolio = order.portfolio
        fees = execution_price * order.quantity * self.TRANSACTION_FEE_PERCENT
        
        if order.side == OrderSide.BUY:
            total_cost = execution_price * order.quantity + fees
            
            # Update portfolio
            portfolio.cash_balance -= total_cost
            
            # Update or create position
            position = db.query(Position).filter(
                Position.portfolio_id == portfolio.id,
                Position.symbol == order.symbol
            ).first()
            
            if position:
                # Update existing position
                total_quantity = position.quantity + order.quantity
                total_invested = position.invested_amount + (execution_price * order.quantity)
                position.quantity = total_quantity
                position.avg_buy_price = total_invested / total_quantity
                position.invested_amount = total_invested
            else:
                # Create new position
                symbol_obj = data_service.get_or_create_symbol(db, order.symbol)
                position = Position(
                    portfolio_id=portfolio.id,
                    symbol=order.symbol,
                    quantity=order.quantity,
                    avg_buy_price=execution_price,
                    invested_amount=execution_price * order.quantity,
                    sector=symbol_obj.sector if symbol_obj else None
                )
                db.add(position)
            
            # Create transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                symbol=order.symbol,
                transaction_type=TransactionType.BUY,
                quantity=order.quantity,
                price=execution_price,
                total_amount=total_cost,
                fees=fees
            )
            db.add(transaction)
            
        elif order.side == OrderSide.SELL:
            total_proceeds = execution_price * order.quantity - fees
            
            # Update portfolio
            portfolio.cash_balance += total_proceeds
            
            # Update position
            position = db.query(Position).filter(
                Position.portfolio_id == portfolio.id,
                Position.symbol == order.symbol
            ).first()
            
            if position:
                position.quantity -= order.quantity
                if position.quantity == 0:
                    db.delete(position)
                else:
                    position.invested_amount = position.avg_buy_price * position.quantity
            
            # Create transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                symbol=order.symbol,
                transaction_type=TransactionType.SELL,
                quantity=order.quantity,
                price=execution_price,
                total_amount=total_proceeds,
                fees=fees
            )
            db.add(transaction)
        
        # Update order status
        order.status = OrderStatus.FILLED
        order.filled_price = execution_price
        order.filled_at = datetime.utcnow()
        
        # Update portfolio metrics
        self.update_portfolio_value(db, portfolio.id)
        
        # Check for achievements
        self._check_achievements(db, portfolio)
        
        # Update leaderboard
        self._update_leaderboard(db, portfolio)
        
        db.commit()
    
    def cancel_order(self, db: Session, order_id: int) -> bool:
        """Cancel a pending order"""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or order.status != OrderStatus.PENDING:
            return False
        
        order.status = OrderStatus.CANCELLED
        order.cancelled_at = datetime.utcnow()
        db.commit()
        return True
    
    def update_portfolio_value(self, db: Session, portfolio_id: int):
        """Update portfolio total value and metrics"""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return
        
        positions = db.query(Position).filter(Position.portfolio_id == portfolio_id).all()
        
        total_position_value = 0.0
        for position in positions:
            current_price = self._get_current_price(db, position.symbol)
            if current_price:
                position.current_price = current_price
                position.current_value = current_price * position.quantity
                position.unrealized_pnl = position.current_value - position.invested_amount
                position.unrealized_pnl_percent = (position.unrealized_pnl / position.invested_amount * 100) if position.invested_amount > 0 else 0
                total_position_value += position.current_value
        
        portfolio.total_value = portfolio.cash_balance + total_position_value
        portfolio.total_returns = portfolio.total_value - self.INITIAL_CASH
        portfolio.returns_percentage = (portfolio.total_returns / self.INITIAL_CASH * 100) if self.INITIAL_CASH > 0 else 0
        
        db.commit()
    
    def get_positions(self, db: Session, portfolio_id: int) -> List[Position]:
        """Get all positions for a portfolio"""
        self.update_portfolio_value(db, portfolio_id)
        return db.query(Position).filter(Position.portfolio_id == portfolio_id).all()
    
    def get_transactions(self, db: Session, portfolio_id: int, limit: int = 50) -> List[Transaction]:
        """Get transaction history"""
        return db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio_id
        ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    def get_orders(self, db: Session, portfolio_id: int, status: Optional[OrderStatus] = None) -> List[Order]:
        """Get orders for a portfolio"""
        query = db.query(Order).filter(Order.portfolio_id == portfolio_id)
        if status:
            query = query.filter(Order.status == status)
        return query.order_by(Order.created_at.desc()).all()
    
    def simulate_trade(
        self, 
        db: Session, 
        portfolio_id: int, 
        symbol: str, 
        side: OrderSide, 
        quantity: int
    ) -> Dict:
        """Simulate a trade without executing it"""
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
        if not portfolio:
            return {"valid": False, "message": "Portfolio not found"}
        
        current_price = self._get_current_price(db, symbol)
        if not current_price:
            return {"valid": False, "message": "Cannot get current price"}
        
        fees = current_price * quantity * self.TRANSACTION_FEE_PERCENT
        warnings = []
        
        if side == OrderSide.BUY:
            total_cost = current_price * quantity + fees
            new_cash = portfolio.cash_balance - total_cost
            
            if new_cash < 0:
                return {
                    "valid": False,
                    "message": "Insufficient funds",
                    "estimated_cost": total_cost,
                    "available_cash": portfolio.cash_balance
                }
            
            if new_cash < portfolio.cash_balance * 0.1:
                warnings.append("This trade will leave you with less than 10% cash")
            
            position = db.query(Position).filter(
                Position.portfolio_id == portfolio_id,
                Position.symbol == symbol
            ).first()
            
            new_quantity = (position.quantity if position else 0) + quantity
            
            return {
                "valid": True,
                "estimated_cost": current_price * quantity,
                "estimated_fees": fees,
                "total_cost": total_cost,
                "new_cash_balance": new_cash,
                "new_position_quantity": new_quantity,
                "new_position_value": current_price * new_quantity,
                "warnings": warnings,
                "success": True,
                "message": "Trade simulation successful"
            }
        
        else:  # SELL
            position = db.query(Position).filter(
                Position.portfolio_id == portfolio_id,
                Position.symbol == symbol
            ).first()
            
            if not position or position.quantity < quantity:
                return {
                    "valid": False,
                    "message": "Insufficient shares to sell",
                    "available_quantity": position.quantity if position else 0
                }
            
            total_proceeds = current_price * quantity - fees
            new_quantity = position.quantity - quantity
            
            if new_quantity > 0 and new_quantity < 10:
                warnings.append("This will leave you with a very small position")
            
            return {
                "valid": True,
                "estimated_cost": current_price * quantity,
                "estimated_fees": fees,
                "total_cost": total_proceeds,
                "new_cash_balance": portfolio.cash_balance + total_proceeds,
                "new_position_quantity": new_quantity,
                "new_position_value": current_price * new_quantity if new_quantity > 0 else 0,
                "warnings": warnings,
                "success": True,
                "message": "Trade simulation successful"
            }
    
    def _get_current_price(self, db: Session, symbol: str) -> Optional[float]:
        """Get current price for a symbol"""
        latest = data_service.get_latest_price(db, symbol)
        return latest.close if latest else None
    
    def _check_achievements(self, db: Session, portfolio: Portfolio):
        """Check and award achievements"""
        user_id = portfolio.user_id
        existing_achievements = {a.achievement_type for a in db.query(Achievement).filter(Achievement.user_id == user_id).all()}
        
        # Count trades
        trade_count = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio.id,
            Transaction.transaction_type.in_([TransactionType.BUY, TransactionType.SELL])
        ).count()
        
        # First trade
        if trade_count == 1 and AchievementType.FIRST_TRADE not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.FIRST_TRADE,
                title="First Trade",
                description="Completed your first trade!",
                icon="🎯"
            ))
        
        # Trading milestones
        if trade_count >= 10 and AchievementType.TRADES_10 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.TRADES_10,
                title="Active Trader",
                description="Completed 10 trades",
                icon="📈"
            ))
        
        if trade_count >= 50 and AchievementType.TRADES_50 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.TRADES_50,
                title="Veteran Trader",
                description="Completed 50 trades",
                icon="💼"
            ))
        
        if trade_count >= 100 and AchievementType.TRADES_100 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.TRADES_100,
                title="Trading Master",
                description="Completed 100 trades",
                icon="🏆"
            ))
        
        # Profit achievements
        if portfolio.returns_percentage >= 10 and AchievementType.PROFIT_10 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.PROFIT_10,
                title="Profit Maker",
                description="Achieved 10% returns",
                icon="💰"
            ))
        
        if portfolio.returns_percentage >= 25 and AchievementType.PROFIT_25 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.PROFIT_25,
                title="Big Winner",
                description="Achieved 25% returns",
                icon="💎"
            ))
        
        if portfolio.returns_percentage >= 50 and AchievementType.PROFIT_50 not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.PROFIT_50,
                title="Market Wizard",
                description="Achieved 50% returns",
                icon="🧙"
            ))
        
        # Diversification
        position_count = db.query(Position).filter(Position.portfolio_id == portfolio.id).count()
        if position_count >= 5 and AchievementType.DIVERSIFIED not in existing_achievements:
            db.add(Achievement(
                user_id=user_id,
                achievement_type=AchievementType.DIVERSIFIED,
                title="Diversified Portfolio",
                description="Hold positions in 5 or more stocks",
                icon="🎲"
            ))
        
        db.commit()
    
    def _update_leaderboard(self, db: Session, portfolio: Portfolio):
        """Update leaderboard entry"""
        entry = db.query(LeaderboardEntry).filter(LeaderboardEntry.user_id == portfolio.user_id).first()
        if not entry:
            return
        
        # Count trades
        trades = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio.id,
            Transaction.transaction_type.in_([TransactionType.BUY, TransactionType.SELL])
        ).all()
        
        entry.total_returns = portfolio.total_returns
        entry.returns_percentage = portfolio.returns_percentage
        entry.total_trades = len(trades)
        
        # Calculate win rate
        winning_trades = sum(1 for t in trades if t.transaction_type == TransactionType.SELL and t.total_amount > t.price * t.quantity)
        entry.win_rate = (winning_trades / len(trades) * 100) if trades else 0
        
        entry.sharpe_ratio = portfolio.sharpe_ratio
        
        db.commit()
        
        # Update rankings
        self._update_rankings(db)
    
    def _update_rankings(self, db: Session):
        """Update all leaderboard rankings"""
        entries = db.query(LeaderboardEntry).order_by(LeaderboardEntry.returns_percentage.desc()).all()
        for idx, entry in enumerate(entries, start=1):
            entry.rank = idx
        db.commit()
    
    def get_leaderboard(self, db: Session, limit: int = 100) -> List[Dict]:
        """Get leaderboard with user info"""
        entries = db.query(LeaderboardEntry).order_by(LeaderboardEntry.rank).limit(limit).all()
        
        result = []
        for entry in entries:
            user = db.query(User).filter(User.id == entry.user_id).first()
            if user:
                result.append({
                    "rank": entry.rank,
                    "username": user.username,
                    "total_returns": entry.total_returns,
                    "returns_percentage": entry.returns_percentage,
                    "total_trades": entry.total_trades,
                    "win_rate": entry.win_rate,
                    "sharpe_ratio": entry.sharpe_ratio
                })
        
        return result
    
    def get_achievements(self, db: Session, user_id: int) -> List[Achievement]:
        """Get user achievements"""
        return db.query(Achievement).filter(Achievement.user_id == user_id).order_by(Achievement.earned_at.desc()).all()


# Singleton instance
trading_service = TradingService()
