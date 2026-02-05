"""
Create demo trading data for demonstration purposes
Generates realistic portfolio, positions, transactions, and achievements
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models.community import User
from app.models.trading import (
    Portfolio, Position, Transaction, Order, Achievement,
    OrderType, OrderSide, OrderStatus, TransactionType, AchievementType
)
from app.services.data_service import data_service
from app.services.trading_service import trading_service
from datetime import datetime, timedelta
import random
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_demo_user(db):
    """Create a demo trading user"""
    # Check if demo user exists
    demo_user = db.query(User).filter(User.username == "demo_trader").first()
    
    if not demo_user:
        demo_user = User(
            username="demo_trader",
            email="demo@trading.com",
            hashed_password=pwd_context.hash("demo123"),
            bio="Demo account showcasing advanced trading features",
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"✓ Created demo user: {demo_user.username}")
    else:
        print(f"✓ Demo user already exists: {demo_user.username}")
    
    return demo_user


def create_demo_portfolio(db, user_id):
    """Create demo portfolio with realistic trading history"""
    # Create portfolio
    portfolio = trading_service.create_portfolio(db, user_id, initial_cash=100000.0)
    print(f"✓ Created portfolio with $100,000 initial cash")
    
    # Define demo positions to create
    demo_trades = [
        {"symbol": "RELIANCE", "buy_qty": 50, "buy_price": 2450.00, "days_ago": 45},
        {"symbol": "TCS", "buy_qty": 30, "buy_price": 3620.00, "days_ago": 38},
        {"symbol": "HDFCBANK", "buy_qty": 40, "buy_price": 1580.00, "days_ago": 32},
        {"symbol": "INFY", "buy_qty": 60, "buy_price": 1450.00, "days_ago": 25},
        {"symbol": "WIPRO", "buy_qty": 80, "buy_price": 425.00, "days_ago": 18},
        {"symbol": "ICICIBANK", "buy_qty": 45, "buy_price": 980.00, "days_ago": 12},
        {"symbol": "SBIN", "buy_qty": 100, "buy_price": 580.00, "days_ago": 8},
    ]
    
    # Execute trades
    for trade in demo_trades:
        symbol = trade["symbol"]
        buy_qty = trade["buy_qty"]
        buy_price = trade["buy_price"]
        days_ago = trade["days_ago"]
        
        # Ensure symbol exists
        symbol_obj = data_service.get_or_create_symbol(db, symbol)
        
        # Create BUY transaction manually (simulating historical trade)
        fees = buy_price * buy_qty * 0.001
        total_cost = buy_price * buy_qty + fees
        
        # Update portfolio cash
        portfolio.cash_balance -= total_cost
        
        # Create or update position
        position = db.query(Position).filter(
            Position.portfolio_id == portfolio.id,
            Position.symbol == symbol
        ).first()
        
        if position:
            total_quantity = position.quantity + buy_qty
            total_invested = position.invested_amount + (buy_price * buy_qty)
            position.quantity = total_quantity
            position.avg_buy_price = total_invested / total_quantity
            position.invested_amount = total_invested
        else:
            position = Position(
                portfolio_id=portfolio.id,
                symbol=symbol,
                quantity=buy_qty,
                avg_buy_price=buy_price,
                invested_amount=buy_price * buy_qty,
                sector=symbol_obj.sector if symbol_obj else None
            )
            db.add(position)
        
        # Create transaction record
        transaction = Transaction(
            portfolio_id=portfolio.id,
            symbol=symbol,
            transaction_type=TransactionType.BUY,
            quantity=buy_qty,
            price=buy_price,
            total_amount=total_cost,
            fees=fees,
            notes=f"Demo purchase of {symbol}"
        )
        # Backdate the transaction
        transaction.created_at = datetime.utcnow() - timedelta(days=days_ago)
        db.add(transaction)
        
        print(f"✓ Bought {buy_qty} shares of {symbol} at ₹{buy_price}")
    
    # Add some SELL transactions for realism
    sell_trades = [
        {"symbol": "WIPRO", "sell_qty": 30, "days_ago": 5},
        {"symbol": "SBIN", "sell_qty": 40, "days_ago": 3},
    ]
    
    for trade in sell_trades:
        symbol = trade["symbol"]
        sell_qty = trade["sell_qty"]
        days_ago = trade["days_ago"]
        
        position = db.query(Position).filter(
            Position.portfolio_id == portfolio.id,
            Position.symbol == symbol
        ).first()
        
        if position and position.quantity >= sell_qty:
            # Get current price (simulated)
            current_price = position.avg_buy_price * random.uniform(1.05, 1.15)
            fees = current_price * sell_qty * 0.001
            total_proceeds = current_price * sell_qty - fees
            
            # Update portfolio
            portfolio.cash_balance += total_proceeds
            
            # Update position
            position.quantity -= sell_qty
            if position.quantity == 0:
                db.delete(position)
            else:
                position.invested_amount = position.avg_buy_price * position.quantity
            
            # Create transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                symbol=symbol,
                transaction_type=TransactionType.SELL,
                quantity=sell_qty,
                price=current_price,
                total_amount=total_proceeds,
                fees=fees,
                notes=f"Demo sale of {symbol}"
            )
            transaction.created_at = datetime.utcnow() - timedelta(days=days_ago)
            db.add(transaction)
            
            print(f"✓ Sold {sell_qty} shares of {symbol} at ₹{current_price:.2f}")
    
    db.commit()
    
    # Update portfolio value with current prices
    trading_service.update_portfolio_value(db, portfolio.id)
    db.refresh(portfolio)
    
    print(f"\n✓ Portfolio Summary:")
    print(f"  Cash Balance: ₹{portfolio.cash_balance:,.2f}")
    print(f"  Total Value: ₹{portfolio.total_value:,.2f}")
    print(f"  Returns: ₹{portfolio.total_returns:,.2f} ({portfolio.returns_percentage:.2f}%)")
    
    return portfolio


def create_demo_achievements(db, user_id):
    """Create demo achievements"""
    achievements_data = [
        {
            "type": AchievementType.FIRST_TRADE,
            "title": "First Trade",
            "description": "Completed your first trade!",
            "icon": "🎯",
            "days_ago": 45
        },
        {
            "type": AchievementType.TRADES_10,
            "title": "Active Trader",
            "description": "Completed 10 trades",
            "icon": "📈",
            "days_ago": 20
        },
        {
            "type": AchievementType.PROFIT_10,
            "title": "Profit Maker",
            "description": "Achieved 10% returns",
            "icon": "💰",
            "days_ago": 15
        },
        {
            "type": AchievementType.DIVERSIFIED,
            "title": "Diversified Portfolio",
            "description": "Hold positions in 5 or more stocks",
            "icon": "🎲",
            "days_ago": 10
        },
    ]
    
    for ach_data in achievements_data:
        achievement = Achievement(
            user_id=user_id,
            achievement_type=ach_data["type"],
            title=ach_data["title"],
            description=ach_data["description"],
            icon=ach_data["icon"]
        )
        achievement.earned_at = datetime.utcnow() - timedelta(days=ach_data["days_ago"])
        db.add(achievement)
    
    db.commit()
    print(f"\n✓ Created {len(achievements_data)} achievements")


def create_demo_orders(db, portfolio_id):
    """Create some pending/cancelled orders for demo"""
    orders_data = [
        {
            "symbol": "BHARTIARTL",
            "side": OrderSide.BUY,
            "type": OrderType.LIMIT,
            "quantity": 50,
            "limit_price": 850.00,
            "status": OrderStatus.PENDING
        },
        {
            "symbol": "TATAMOTORS",
            "side": OrderSide.BUY,
            "type": OrderType.LIMIT,
            "quantity": 40,
            "limit_price": 720.00,
            "status": OrderStatus.CANCELLED
        },
    ]
    
    for order_data in orders_data:
        order = Order(
            portfolio_id=portfolio_id,
            symbol=order_data["symbol"],
            order_type=order_data["type"],
            side=order_data["side"],
            quantity=order_data["quantity"],
            limit_price=order_data.get("limit_price"),
            status=order_data["status"]
        )
        db.add(order)
    
    db.commit()
    print(f"✓ Created {len(orders_data)} demo orders")


def main():
    """Main demo data creation"""
    print("=" * 60)
    print("Creating Demo Trading Data")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Create demo user
        demo_user = create_demo_user(db)
        
        # Create portfolio with trades
        portfolio = create_demo_portfolio(db, demo_user.id)
        
        # Create achievements
        create_demo_achievements(db, demo_user.id)
        
        # Create demo orders
        create_demo_orders(db, portfolio.id)
        
        print("\n" + "=" * 60)
        print("✓ Demo Data Created Successfully!")
        print("=" * 60)
        print("\nDemo Account Login:")
        print("  Username: demo_trader")
        print("  Password: demo123")
        print("\nThe demo account has:")
        print("  • $100,000 starting capital")
        print("  • 7 active positions")
        print("  • 9 completed trades")
        print("  • 4 unlocked achievements")
        print("  • 2 pending/cancelled orders")
        print("  • Positive returns of 5-15%")
        
    except Exception as e:
        print(f"\n❌ Error creating demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
