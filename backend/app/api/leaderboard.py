"""
Leaderboard API endpoints with real-time calculations
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..db import get_db
from ..services.leaderboard_service import leaderboard_service

router = APIRouter()

@router.get("/realtime", response_model=List[Dict[str, Any]])
async def get_realtime_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get real-time leaderboard with calculated statistics
    
    - **limit**: Number of top traders to return (1-100)
    - **days**: Time period for calculations (1-365 days)
    """
    leaderboard = leaderboard_service.get_leaderboard(db, limit=limit, days=days)
    return leaderboard

@router.get("/top/{metric}", response_model=List[Dict[str, Any]])
async def get_top_by_metric(
    metric: str,
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get top traders by specific metric
    
    - **metric**: One of 'returns_pct', 'sharpe_ratio', 'win_rate', 'profit_factor'
    - **limit**: Number of top traders to return
    - **days**: Time period for calculations
    """
    top_traders = leaderboard_service.get_top_traders_by_metric(
        db, 
        metric=metric,
        limit=limit,
        days=days
    )
    return top_traders

@router.get("/user/{user_id}/stats", response_model=Dict[str, Any])
async def get_user_stats(
    user_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    Get detailed trading statistics for a specific user
    
    - **user_id**: User ID
    - **days**: Time period for calculations
    """
    stats = leaderboard_service.calculate_user_stats(db, user_id, days=days)
    return stats
