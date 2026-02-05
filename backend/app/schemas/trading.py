from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# Portfolio Schemas
class PortfolioBase(BaseModel):
    cash_balance: float
    total_value: float
    total_invested: float
    total_returns: float
    returns_percentage: float

class PortfolioResponse(PortfolioBase):
    id: int
    user_id: int
    portfolio_beta: float
    sharpe_ratio: float
    max_drawdown: float
    volatility: float
    health_score: float
    diversification_score: float
    risk_score: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PortfolioCreate(BaseModel):
    initial_cash: float = Field(default=100000.0, gt=0)

# Position Schemas
class PositionBase(BaseModel):
    symbol: str
    quantity: int
    avg_buy_price: float
    current_price: float
    current_value: float
    invested_amount: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    sector: Optional[str] = None

class PositionResponse(PositionBase):
    id: int
    portfolio_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    symbol: Optional[str] = None
    transaction_type: str
    quantity: Optional[int] = None
    price: Optional[float] = None
    total_amount: float
    fees: float = 0.0
    notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    portfolio_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    symbol: str
    order_type: str = Field(..., pattern="^(MARKET|LIMIT)$")
    side: str = Field(..., pattern="^(BUY|SELL)$")
    quantity: int = Field(..., gt=0)
    limit_price: Optional[float] = Field(None, gt=0)

class OrderResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    order_type: str
    side: str
    quantity: int
    limit_price: Optional[float]
    filled_price: Optional[float]
    status: str
    created_at: datetime
    filled_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Trading Signal Schemas
class TradingSignalResponse(BaseModel):
    symbol: str
    signal: str  # BUY, SELL, HOLD
    strength: int  # 1-5
    confidence: float
    entry_price: Optional[float]
    target_price: Optional[float]
    stop_loss: Optional[float]
    reasoning: str
    ml_signal: Optional[str]
    technical_signal: Optional[str]
    sentiment_signal: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Portfolio Analysis Schemas
class SectorAllocation(BaseModel):
    sector: str
    value: float
    percentage: float
    count: int

class PortfolioAnalysis(BaseModel):
    health_score: float
    risk_score: str
    diversification_score: float
    sector_allocation: List[SectorAllocation]
    best_performers: List[PositionResponse]
    worst_performers: List[PositionResponse]
    total_positions: int
    concentrated_risk: bool
    recommendations: List[str]

# Alias for API compatibility
PortfolioAnalysisResponse = PortfolioAnalysis

# Achievement Schemas
class AchievementResponse(BaseModel):
    id: int
    achievement_type: str
    title: str
    description: Optional[str]
    icon: Optional[str]
    earned_at: datetime
    
    class Config:
        from_attributes = True

# Price Alert Schemas
class PriceAlertCreate(BaseModel):
    symbol: str
    alert_type: str = Field(..., pattern="^(PRICE_ABOVE|PRICE_BELOW|PERCENT_CHANGE)$")
    target_price: Optional[float] = None
    percent_change: Optional[float] = None

class PriceAlertResponse(BaseModel):
    id: int
    portfolio_id: int
    symbol: str
    alert_type: str
    target_price: Optional[float]
    percent_change: Optional[float]
    is_active: bool
    triggered: bool
    triggered_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Leaderboard Schemas
class LeaderboardEntryResponse(BaseModel):
    rank: int
    username: str
    total_returns: float
    returns_percentage: float
    total_trades: int
    win_rate: float
    sharpe_ratio: float

# Trade Simulator Schemas
class TradeSimulation(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: float

class TradeSimulationRequest(BaseModel):
    symbol: str
    side: str
    quantity: int
    price: Optional[float] = None

class TradeSimulationResult(BaseModel):
    valid: bool
    estimated_cost: float
    estimated_fees: float
    total_cost: float
    new_cash_balance: float
    new_position_quantity: int
    new_position_value: float
    warnings: List[str]
    success: bool
    message: str

# Alias for API compatibility
TradeSimulationResponse = TradeSimulationResult
