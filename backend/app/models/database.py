from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base


class Trade(Base):
    """Trade execution records"""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)  # 'BUY' or 'SELL'
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    order_type = Column(String, nullable=False)  # 'MARKET' or 'LIMIT'
    status = Column(String, nullable=False, index=True)  # 'PENDING', 'FILLED', 'CANCELLED'
    pnl = Column(Float, default=0.0)  # Profit/Loss for this trade
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    filled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="trades")
    
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),
        Index('idx_user_created', 'user_id', 'created_at'),
    )


class Symbol(Base):
    """NSE Stock Symbol model"""
    __tablename__ = "symbols"
    
    symbol = Column(String, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    isin = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_symbol_active', 'symbol', 'is_active'),
    )


class Price(Base):
    """Historical price data model"""
    __tablename__ = "prices"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    adjusted_close = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_symbol_date', 'symbol', 'date', unique=True),
    )


class Watchlist(Base):
    """User watchlist model"""
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, unique=True, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String, nullable=True)


class MLModel(Base):
    """ML Model metadata"""
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    model_type = Column(String, nullable=False)  # 'random_forest', 'gradient_boosting', etc.
    model_path = Column(String, nullable=False)
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    training_samples = Column(Integer, nullable=False)
    features_used = Column(String, nullable=True)  # JSON string of feature names
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        Index('idx_symbol_active_model', 'symbol', 'is_active'),
    )
