from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import pandas as pd
from app.models import Symbol, Price, Watchlist, MLModel
from app.services.yfinance_service import yfinance_service as nse_service
from app.config import settings

class DataService:
    """Service for managing stock data in database"""
    
    @staticmethod
    def get_or_create_symbol(db: Session, symbol: str) -> Symbol:
        """Get symbol from DB or create if not exists"""
        db_symbol = db.query(Symbol).filter(Symbol.symbol == symbol).first()
        
        if not db_symbol:
            # Fetch company info
            company_info = nse_service.get_company_info(symbol)
            if company_info:
                db_symbol = Symbol(
                    symbol=symbol,
                    company_name=company_info.get('company_name', symbol),
                    sector=company_info.get('sector'),
                    industry=company_info.get('industry'),
                    isin=company_info.get('isin')
                )
                db.add(db_symbol)
                db.commit()
                db.refresh(db_symbol)
        
        return db_symbol
    
    @staticmethod
    def get_price_data(db: Session, symbol: str, from_date: datetime, to_date: datetime) -> List[Price]:
        """Get price data from database"""
        return db.query(Price).filter(
            Price.symbol == symbol,
            Price.date >= from_date,
            Price.date <= to_date
        ).order_by(Price.date).all()
    
    @staticmethod
    def fetch_and_store_prices(db: Session, symbol: str, from_date: datetime, to_date: datetime) -> List[Price]:
        """Fetch prices from NSE and store in database"""
        
        # Fetch from NSE
        df = nse_service.get_historical_data(symbol, from_date, to_date)
        
        if df.empty:
            return []
        
        # Ensure symbol exists
        DataService.get_or_create_symbol(db, symbol)
        
        # Store in database
        stored_prices = []
        for _, row in df.iterrows():
            # Check if already exists
            existing = db.query(Price).filter(
                Price.symbol == symbol,
                Price.date == row['date']
            ).first()
            
            if not existing:
                price = Price(
                    symbol=symbol,
                    date=row['date'],
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    volume=int(row['volume'])
                )
                db.add(price)
                stored_prices.append(price)
        
        db.commit()
        
        # Return all prices in range
        return DataService.get_price_data(db, symbol, from_date, to_date)
    
    @staticmethod
    def get_latest_price(db: Session, symbol: str) -> Optional[Price]:
        """Get latest price for a symbol"""
        return db.query(Price).filter(
            Price.symbol == symbol
        ).order_by(Price.date.desc()).first()
    
    @staticmethod
    def ensure_recent_data(db: Session, symbol: str, days: int = None) -> List[Price]:
        """Ensure we have recent price data, fetch if needed"""
        if days is None:
            days = settings.DEFAULT_HISTORY_DAYS
        
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days)
        
        # Check if we have recent data
        latest = DataService.get_latest_price(db, symbol)
        
        if not latest or (datetime.now() - latest.date).days > 1:
            # Fetch new data
            return DataService.fetch_and_store_prices(db, symbol, from_date, to_date)
        
        # Return existing data
        return DataService.get_price_data(db, symbol, from_date, to_date)

class WatchlistService:
    """Service for managing user watchlist"""
    
    @staticmethod
    def get_watchlist(db: Session) -> List[Watchlist]:
        """Get all watchlist items"""
        return db.query(Watchlist).order_by(Watchlist.added_at.desc()).all()
    
    @staticmethod
    def add_to_watchlist(db: Session, symbol: str, notes: str = None) -> Watchlist:
        """Add symbol to watchlist"""
        # Ensure symbol exists
        DataService.get_or_create_symbol(db, symbol)
        
        # Check if already in watchlist
        existing = db.query(Watchlist).filter(Watchlist.symbol == symbol).first()
        if existing:
            return existing
        
        watchlist_item = Watchlist(symbol=symbol, notes=notes)
        db.add(watchlist_item)
        db.commit()
        db.refresh(watchlist_item)
        return watchlist_item
    
    @staticmethod
    def remove_from_watchlist(db: Session, symbol: str) -> bool:
        """Remove symbol from watchlist"""
        item = db.query(Watchlist).filter(Watchlist.symbol == symbol).first()
        if item:
            db.delete(item)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_watchlist_with_prices(db: Session) -> List[dict]:
        """Get watchlist with current prices"""
        watchlist = WatchlistService.get_watchlist(db)
        result = []
        
        for item in watchlist:
            symbol_info = db.query(Symbol).filter(Symbol.symbol == item.symbol).first()
            latest_price = DataService.get_latest_price(db, item.symbol)
            
            # Try to get previous price for change calculation
            previous_price = None
            if latest_price:
                previous = db.query(Price).filter(
                    Price.symbol == item.symbol,
                    Price.date < latest_price.date
                ).order_by(Price.date.desc()).first()
                if previous:
                    previous_price = previous.close
            
            result.append({
                "id": item.id,
                "symbol": item.symbol,
                "company_name": symbol_info.company_name if symbol_info else item.symbol,
                "sector": symbol_info.sector if symbol_info else None,
                "notes": item.notes,
                "added_at": item.added_at,
                "current_price": latest_price.close if latest_price else None,
                "change_percent": ((latest_price.close - previous_price) / previous_price * 100) if (latest_price and previous_price) else None
            })
        
        return result

# Service instances
data_service = DataService()
watchlist_service = WatchlistService()
