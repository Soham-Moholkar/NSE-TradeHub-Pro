from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.services.data_service import watchlist_service
from app.schemas import WatchlistCreate, WatchlistResponse, WatchlistItem

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])

@router.get("", response_model=List[WatchlistItem])
async def get_watchlist(db: Session = Depends(get_db)):
    """Get user's watchlist with current prices"""
    try:
        return watchlist_service.get_watchlist_with_prices(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=WatchlistResponse)
async def add_to_watchlist(
    item: WatchlistCreate,
    db: Session = Depends(get_db)
):
    """Add symbol to watchlist"""
    try:
        symbol = item.symbol.upper()
        watchlist_item = watchlist_service.add_to_watchlist(db, symbol, item.notes)
        return watchlist_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{symbol}")
async def remove_from_watchlist(symbol: str, db: Session = Depends(get_db)):
    """Remove symbol from watchlist"""
    try:
        symbol = symbol.upper()
        success = watchlist_service.remove_from_watchlist(db, symbol)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"{symbol} not found in watchlist")
        
        return {"message": f"{symbol} removed from watchlist"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
