from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from app.db import get_db
from app.services.data_service import data_service
from app.services.real_nse_service import get_real_nse_service
from app.schemas import PriceData, PriceHistory, PriceResponse
from app.config import settings
import time

router = APIRouter(prefix="/api/prices", tags=["prices"])

# In-memory cache for price data (5-minute TTL)
_price_cache = {}
_cache_timestamp = {}
CACHE_TTL = 300  # 5 minutes in seconds

@router.get("/{symbol}", response_model=PriceHistory)
async def get_price_history(
    symbol: str,
    days: int = Query(default=90, ge=1, le=settings.MAX_HISTORY_DAYS),
    source: str = Query(default="synthetic", description="Data source: 'synthetic' or 'live'"),
    db: Session = Depends(get_db)
):
    """Get historical OHLCV data for a symbol"""
    try:
        symbol = symbol.upper()
        
        # Check cache
        cache_key = f"{symbol}_{days}_{source}"
        current_time = time.time()
        
        if cache_key in _price_cache and cache_key in _cache_timestamp:
            if current_time - _cache_timestamp[cache_key] < CACHE_TTL:
                return _price_cache[cache_key]
        
        if source == "live":
            # Use real NSE service
            nse_service = get_real_nse_service(use_real_api=True)
            period_map = {30: '1M', 90: '3M', 180: '6M', 365: '1Y'}
            period = period_map.get(days, '1M')
            
            historical_data = await nse_service.get_historical_data(symbol, period)
            
            price_data = [
                PriceData(
                    date=p['date'],
                    open=p['open'],
                    high=p['high'],
                    low=p['low'],
                    close=p['close'],
                    volume=p['volume']
                )
                for p in historical_data
            ]
            
            result = PriceHistory(
                symbol=symbol,
                data=price_data,
                period=f"{days} days (live)"
            )
        else:
            # Use synthetic data service
            prices = data_service.ensure_recent_data(db, symbol, days)
            
            if not prices:
                raise HTTPException(status_code=404, detail=f"No price data found for {symbol}")
            
            price_data = [
                PriceData(
                    date=p.date.strftime("%Y-%m-%d"),
                    open=p.open,
                    high=p.high,
                    low=p.low,
                    close=p.close,
                    volume=p.volume
                )
                for p in prices
            ]
            
            result = PriceHistory(
                symbol=symbol,
                data=price_data,
                period=f"{days} days"
            )
        
        # Store in cache
        _price_cache[cache_key] = result
        _cache_timestamp[cache_key] = current_time
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/latest", response_model=PriceResponse)
async def get_latest_price(
    symbol: str, 
    source: str = Query(default="synthetic", description="Data source: 'synthetic' or 'live'"),
    db: Session = Depends(get_db)
):
    """Get latest price data for a symbol"""
    try:
        symbol = symbol.upper()
        
        if source == "live":
            # Use real NSE service
            nse_service = get_real_nse_service(use_real_api=True)
            quote = await nse_service.get_stock_quote(symbol)
            
            return PriceResponse(
                symbol=symbol,
                current_price=quote['price'],
                change=quote['change'],
                change_percent=quote['change_percent'],
                high=quote['high'],
                low=quote['low'],
                volume=quote['volume'],
                timestamp=quote['timestamp']
            )
        else:
            # Ensure we have recent data
            data_service.ensure_recent_data(db, symbol, days=30)
            
            # Get latest price
            latest = data_service.get_latest_price(db, symbol)
            
            if not latest:
                raise HTTPException(status_code=404, detail=f"No price data found for {symbol}")
            
            return latest
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/status")
async def get_market_status():
    """Get current market status (open/closed)"""
    nse_service = get_real_nse_service()
    return await nse_service.get_market_status()

@router.get("/market/indices")
async def get_market_indices():
    """Get major market indices"""
    nse_service = get_real_nse_service()
    return await nse_service.get_market_indices()

@router.get("/market/movers")
async def get_market_movers():
    """Get top gainers and losers"""
    nse_service = get_real_nse_service()
    return await nse_service.get_top_gainers_losers()
