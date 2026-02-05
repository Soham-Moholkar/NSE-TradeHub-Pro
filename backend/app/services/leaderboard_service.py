"""
Leaderboard calculation service with real-time statistics
"""
import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..models.database import Trade
from ..models.community import User

class LeaderboardService:
    """Service for calculating real trading statistics and leaderboard rankings"""
    
    RISK_FREE_RATE = 0.05  # 5% annual risk-free rate
    TRADING_DAYS = 252
    
    def calculate_user_stats(self, db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Calculate comprehensive trading statistics for a user"""
        
        # Get trades within timeframe
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        trades = db.query(Trade).filter(
            Trade.user_id == user_id,
            Trade.created_at >= cutoff_date,
            Trade.status == 'FILLED'
        ).all()
        
        if not trades:
            return self._empty_stats()
        
        # Calculate basic metrics
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl < 0]
        
        win_count = len(winning_trades)
        loss_count = len(losing_trades)
        win_rate = win_count / total_trades if total_trades > 0 else 0
        
        # Calculate P&L metrics
        total_pnl = sum(t.pnl for t in trades)
        avg_win = np.mean([t.pnl for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t.pnl for t in losing_trades]) if losing_trades else 0
        
        # Calculate profit factor
        gross_profit = sum(t.pnl for t in winning_trades) if winning_trades else 0
        gross_loss = abs(sum(t.pnl for t in losing_trades)) if losing_trades else 0
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Calculate max drawdown
        cumulative_pnl = np.cumsum([t.pnl for t in trades])
        running_max = np.maximum.accumulate(cumulative_pnl)
        drawdown = running_max - cumulative_pnl
        max_drawdown = np.max(drawdown) if len(drawdown) > 0 else 0
        max_drawdown_pct = (max_drawdown / 100000) * 100  # Assuming 100k starting capital
        
        # Calculate Sharpe ratio
        daily_returns = [t.pnl / 100000 for t in trades]  # Returns as percentage
        sharpe_ratio = self._calculate_sharpe_ratio(daily_returns)
        
        # Calculate returns percentage
        starting_capital = 100000
        returns_pct = (total_pnl / starting_capital) * 100
        
        return {
            'total_trades': total_trades,
            'win_rate': win_rate,
            'total_pnl': total_pnl,
            'returns_pct': returns_pct,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': profit_factor,
            'max_drawdown': max_drawdown,
            'max_drawdown_pct': max_drawdown_pct,
            'sharpe_ratio': sharpe_ratio,
            'win_count': win_count,
            'loss_count': loss_count,
        }
    
    def _calculate_sharpe_ratio(self, returns: List[float]) -> float:
        """Calculate Sharpe ratio from daily returns"""
        if not returns or len(returns) < 2:
            return 0.0
        
        returns_array = np.array(returns)
        
        # Calculate daily excess returns
        daily_risk_free = self.RISK_FREE_RATE / self.TRADING_DAYS
        excess_returns = returns_array - daily_risk_free
        
        # Calculate mean and std of excess returns
        mean_excess = np.mean(excess_returns)
        std_excess = np.std(excess_returns, ddof=1)
        
        if std_excess == 0:
            return 0.0
        
        # Annualized Sharpe ratio
        sharpe = (mean_excess / std_excess) * np.sqrt(self.TRADING_DAYS)
        return float(sharpe)
    
    def _empty_stats(self) -> Dict[str, Any]:
        """Return empty statistics"""
        return {
            'total_trades': 0,
            'win_rate': 0.0,
            'total_pnl': 0.0,
            'returns_pct': 0.0,
            'avg_win': 0.0,
            'avg_loss': 0.0,
            'profit_factor': 0.0,
            'max_drawdown': 0.0,
            'max_drawdown_pct': 0.0,
            'sharpe_ratio': 0.0,
            'win_count': 0,
            'loss_count': 0,
        }
    
    def get_leaderboard(self, db: Session, limit: int = 50, days: int = 30) -> List[Dict[str, Any]]:
        """Generate leaderboard with real calculated statistics"""
        
        # Get all users who have made trades
        users = db.query(User).join(Trade).group_by(User.id).all()
        
        leaderboard = []
        for user in users:
            stats = self.calculate_user_stats(db, user.id, days)
            
            leaderboard.append({
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'total_trades': stats['total_trades'],
                'win_rate': stats['win_rate'],
                'total_returns': stats['total_pnl'],
                'returns_pct': stats['returns_pct'],
                'sharpe_ratio': stats['sharpe_ratio'],
                'profit_factor': stats['profit_factor'],
                'max_drawdown_pct': stats['max_drawdown_pct'],
                'rank': 0,  # Will be assigned after sorting
            })
        
        # Sort by returns percentage (primary), then Sharpe ratio (secondary)
        leaderboard.sort(key=lambda x: (x['returns_pct'], x['sharpe_ratio']), reverse=True)
        
        # Assign ranks
        for idx, entry in enumerate(leaderboard):
            entry['rank'] = idx + 1
        
        return leaderboard[:limit]
    
    def get_top_traders_by_metric(
        self, 
        db: Session, 
        metric: str = 'returns_pct',
        limit: int = 10,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get top traders by specific metric (returns_pct, sharpe_ratio, win_rate, profit_factor)"""
        
        leaderboard = self.get_leaderboard(db, limit=100, days=days)
        
        if metric not in ['returns_pct', 'sharpe_ratio', 'win_rate', 'profit_factor']:
            metric = 'returns_pct'
        
        # Sort by specified metric
        leaderboard.sort(key=lambda x: x[metric], reverse=True)
        
        return leaderboard[:limit]

# Singleton instance
leaderboard_service = LeaderboardService()
