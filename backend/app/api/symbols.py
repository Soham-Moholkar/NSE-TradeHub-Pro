from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.db import get_db
from app.services.nse_service import nse_service
from app.services.data_service import data_service
from app.schemas import SymbolResponse, SymbolSearch

router = APIRouter(prefix="/api/symbols", tags=["symbols"])

class PopularSymbolsResponse(BaseModel):
    symbols: List[SymbolSearch]
    count: int

@router.get("/popular", response_model=PopularSymbolsResponse)
async def get_popular_symbols():
    """Get list of popular NSE stocks"""
    try:
        stocks = nse_service.get_popular_stocks()
        symbols = [
            SymbolSearch(
                symbol=stock["symbol"],
                company_name=stock["name"],
                sector=stock.get("sector")
            )
            for stock in stocks
        ]
        return PopularSymbolsResponse(symbols=symbols, count=len(symbols))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=List[SymbolSearch])
async def search_symbols(q: str = Query(..., min_length=1)):
    """Search for NSE symbols"""
    try:
        results = nse_service.search_symbols(q)
        return [
            SymbolSearch(
                symbol=r["symbol"],
                company_name=r["company_name"],
                sector=r.get("sector")
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}", response_model=SymbolResponse)
async def get_symbol(symbol: str, db: Session = Depends(get_db)):
    """Get symbol details"""
    try:
        symbol = symbol.upper()
        db_symbol = data_service.get_or_create_symbol(db, symbol)
        return db_symbol
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
