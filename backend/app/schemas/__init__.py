from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Import trading schemas
from app.schemas.trading import (
    PortfolioResponse, PortfolioCreate, PositionResponse,
    TransactionResponse, OrderCreate, OrderResponse,
    TradingSignalResponse, PortfolioAnalysis, SectorAllocation,
    AchievementResponse, PriceAlertCreate, PriceAlertResponse,
    LeaderboardEntryResponse, TradeSimulation, TradeSimulationResult
)

# Symbol schemas
class SymbolBase(BaseModel):
    symbol: str
    company_name: str
    industry: Optional[str] = None
    sector: Optional[str] = None
    isin: Optional[str] = None

class SymbolCreate(SymbolBase):
    pass

class SymbolResponse(SymbolBase):
    is_active: bool
    last_updated: datetime
    
    class Config:
        from_attributes = True

class SymbolSearch(BaseModel):
    symbol: str
    company_name: str
    sector: Optional[str] = None

# Price schemas
class PriceBase(BaseModel):
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    adjusted_close: Optional[float] = None

class PriceCreate(PriceBase):
    symbol: str

class PriceResponse(PriceBase):
    id: int
    symbol: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PriceData(BaseModel):
    """Simplified price data for frontend"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class PriceHistory(BaseModel):
    symbol: str
    data: List[PriceData]
    period: str

# Watchlist schemas
class WatchlistBase(BaseModel):
    symbol: str
    notes: Optional[str] = None

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistResponse(WatchlistBase):
    id: int
    added_at: datetime
    
    class Config:
        from_attributes = True

class WatchlistItem(BaseModel):
    """Enhanced watchlist item with current price"""
    id: int
    symbol: str
    company_name: str
    notes: Optional[str] = None
    added_at: datetime
    current_price: Optional[float] = None
    change_percent: Optional[float] = None

# ML schemas
class MLPrediction(BaseModel):
    symbol: str
    prediction: str  # 'UP', 'DOWN', 'NEUTRAL'
    confidence: float
    predicted_at: datetime
    features: dict
    model_accuracy: Optional[float] = None

class MLTrainRequest(BaseModel):
    symbol: str
    force_retrain: bool = False

class MLTrainResponse(BaseModel):
    symbol: str
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_samples: int
    trained_at: datetime
    message: str

class MLFeatureImportance(BaseModel):
    feature: str
    importance: float

class MLFeatureAnalysis(BaseModel):
    symbol: str
    features: List[MLFeatureImportance]
    latest_features: dict

# Health check
class HealthCheck(BaseModel):
    status: str = "ok"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"

# Error response
class ErrorResponse(BaseModel):
    detail: str
    timestamp: datetime = Field(default_factory=datetime.now)
