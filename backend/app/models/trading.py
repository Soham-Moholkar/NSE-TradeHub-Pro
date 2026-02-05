from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base

class OrderType(enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"

class OrderSide(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderStatus(enum.Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

class TransactionType(enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"

class AlertType(enum.Enum):
    PRICE_ABOVE = "PRICE_ABOVE"
    PRICE_BELOW = "PRICE_BELOW"
    PERCENT_CHANGE = "PERCENT_CHANGE"

class AchievementType(enum.Enum):
    FIRST_TRADE = "FIRST_TRADE"
    PROFIT_10 = "PROFIT_10"
    PROFIT_25 = "PROFIT_25"
    PROFIT_50 = "PROFIT_50"
    TRADES_10 = "TRADES_10"
    TRADES_50 = "TRADES_50"
    TRADES_100 = "TRADES_100"
    DIVERSIFIED = "DIVERSIFIED"
    LONG_TERM_HOLDER = "LONG_TERM_HOLDER"
    DAY_TRADER = "DAY_TRADER"
    RISK_MANAGER = "RISK_MANAGER"

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    cash_balance = Column(Float, default=100000.0, nullable=False)
    total_value = Column(Float, default=100000.0)
    total_invested = Column(Float, default=0.0)
    total_returns = Column(Float, default=0.0)
    returns_percentage = Column(Float, default=0.0)
    
    # Risk metrics
    portfolio_beta = Column(Float, default=1.0)
    sharpe_ratio = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    volatility = Column(Float, default=0.0)
    
    # Health score
    health_score = Column(Float, default=100.0)
    diversification_score = Column(Float, default=0.0)
    risk_score = Column(String(20), default="MODERATE")  # LOW, MODERATE, HIGH
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="portfolio")
    positions = relationship("Position", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="portfolio", cascade="all, delete-orphan")
    alerts = relationship("PriceAlert", back_populates="portfolio", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    avg_buy_price = Column(Float, nullable=False)
    current_price = Column(Float, default=0.0)
    current_value = Column(Float, default=0.0)
    invested_amount = Column(Float, nullable=False)
    unrealized_pnl = Column(Float, default=0.0)
    unrealized_pnl_percent = Column(Float, default=0.0)
    sector = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="positions")
    
    __table_args__ = (
        {'extend_existing': True}
    )

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity = Column(Integer)
    price = Column(Float)
    total_amount = Column(Float, nullable=False)
    fees = Column(Float, default=0.0)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="transactions")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    order_type = Column(SQLEnum(OrderType), nullable=False)
    side = Column(SQLEnum(OrderSide), nullable=False)
    quantity = Column(Integer, nullable=False)
    limit_price = Column(Float)
    filled_price = Column(Float)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    filled_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="orders")

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_type = Column(SQLEnum(AchievementType), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="achievements")

class PriceAlert(Base):
    __tablename__ = "price_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), nullable=False, index=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    target_price = Column(Float)
    percent_change = Column(Float)
    is_active = Column(Boolean, default=True)
    triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    portfolio = relationship("Portfolio", back_populates="alerts")

class TradingSignal(Base):
    __tablename__ = "trading_signals"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    signal = Column(String(10), nullable=False)  # BUY, SELL, HOLD
    strength = Column(Integer, nullable=False)  # 1-5 stars
    confidence = Column(Float, nullable=False)
    entry_price = Column(Float)
    target_price = Column(Float)
    stop_loss = Column(Float)
    reasoning = Column(Text)
    
    # Signal components
    ml_signal = Column(String(10))
    technical_signal = Column(String(10))
    sentiment_signal = Column(String(10))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime)

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_returns = Column(Float, default=0.0)
    returns_percentage = Column(Float, default=0.0)
    total_trades = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, default=0.0)
    rank = Column(Integer)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="leaderboard_entry")
