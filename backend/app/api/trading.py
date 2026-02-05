from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import get_db
from app.services.auth_service import get_current_user
from app.models.community import User
from app.models.trading import OrderSide, OrderType, OrderStatus
from app.schemas.trading import (
    PortfolioResponse,
    PositionResponse,
    OrderCreate,
    OrderResponse,
    TransactionResponse,
    TradingSignalResponse,
    PortfolioAnalysisResponse,
    TradeSimulationRequest,
    TradeSimulationResponse,
    LeaderboardEntryResponse,
    AchievementResponse
)
from app.services.trading_service import trading_service
from app.services.portfolio_analyzer import portfolio_analyzer
from app.services.signal_generator import signal_generator

router = APIRouter(prefix="/trading", tags=["trading"])


@router.get("/portfolio", response_model=PortfolioResponse)
def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's portfolio"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    
    if not portfolio:
        # Create portfolio if doesn't exist
        portfolio = trading_service.create_portfolio(db, current_user.id)
    
    # Update values before returning
    trading_service.update_portfolio_value(db, portfolio.id)
    db.refresh(portfolio)
    
    return portfolio


@router.post("/portfolio/create", response_model=PortfolioResponse)
def create_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio (if doesn't exist)"""
    existing = trading_service.get_portfolio(db, current_user.id)
    if existing:
        return existing
    
    portfolio = trading_service.create_portfolio(db, current_user.id)
    return portfolio


@router.get("/positions", response_model=List[PositionResponse])
def get_positions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all positions"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    positions = trading_service.get_positions(db, portfolio.id)
    return positions


@router.post("/orders", response_model=OrderResponse)
def place_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a trading order"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found. Create one first.")
    
    try:
        order = trading_service.place_order(
            db=db,
            portfolio_id=portfolio.id,
            symbol=order_data.symbol,
            side=OrderSide(order_data.side),
            quantity=order_data.quantity,
            order_type=OrderType(order_data.order_type),
            limit_price=order_data.limit_price
        )
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order history"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    order_status = OrderStatus(status) if status else None
    orders = trading_service.get_orders(db, portfolio.id, order_status)
    return orders


@router.delete("/orders/{order_id}")
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending order"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    success = trading_service.cancel_order(db, order_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel order")
    
    return {"message": "Order cancelled successfully"}


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get transaction history"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    transactions = trading_service.get_transactions(db, portfolio.id, limit)
    return transactions


@router.post("/simulate", response_model=TradeSimulationResponse)
def simulate_trade(
    simulation: TradeSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate a trade without executing"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    result = trading_service.simulate_trade(
        db=db,
        portfolio_id=portfolio.id,
        symbol=simulation.symbol,
        side=OrderSide(simulation.side),
        quantity=simulation.quantity
    )
    
    return result


@router.get("/analysis", response_model=PortfolioAnalysisResponse)
def get_portfolio_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered portfolio analysis"""
    portfolio = trading_service.get_portfolio(db, current_user.id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    analysis = portfolio_analyzer.analyze_portfolio(db, portfolio.id)
    return analysis


@router.get("/signals/{symbol}", response_model=TradingSignalResponse)
def get_trading_signal(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get trading signal for a symbol"""
    try:
        signal = signal_generator.generate_signal(db, symbol, current_user.id)
        return signal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating signal: {str(e)}")


@router.get("/signals", response_model=List[TradingSignalResponse])
def get_recent_signals(
    symbol: Optional[str] = None,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent trading signals"""
    signals = signal_generator.get_recent_signals(db, symbol, limit)
    
    return [
        {
            "signal": s.signal.value,
            "strength": s.strength,
            "confidence": s.confidence,
            "current_price": s.current_price,
            "entry_price": s.entry_price,
            "target_price": s.target_price,
            "stop_loss": s.stop_loss,
            "reasoning": s.reasoning,
            "generated_at": s.generated_at.isoformat()
        }
        for s in signals
    ]


@router.get("/leaderboard", response_model=List[LeaderboardEntryResponse])
def get_leaderboard(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get leaderboard rankings"""
    leaderboard = trading_service.get_leaderboard(db, limit)
    return leaderboard


@router.get("/achievements", response_model=List[AchievementResponse])
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user achievements"""
    achievements = trading_service.get_achievements(db, current_user.id)
    return achievements
