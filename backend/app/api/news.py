from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.news_service_lite import news_service_lite as news_service
from app.services.data_service import data_service
from typing import Optional

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/{symbol}")
async def get_news_with_sentiment(
    symbol: str,
    limit: int = Query(default=15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get news articles with AI sentiment analysis for a stock symbol
    
    - Fetches latest news from Yahoo Finance and Google News
    - Performs AI-powered sentiment analysis using FinBERT/DistilBERT
    - Provides aggregated sentiment metrics
    - Generates AI insights and recommendations
    """
    try:
        symbol = symbol.upper()
        
        # Fetch news with sentiment
        result = news_service.get_news_with_sentiment(symbol, limit)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/sentiment")
async def get_sentiment_only(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Get aggregated sentiment analysis without full article details
    Useful for quick sentiment checks
    """
    try:
        symbol = symbol.upper()
        
        result = news_service.get_news_with_sentiment(symbol, limit=20)
        
        return {
            "symbol": symbol,
            "sentiment_analysis": result['sentiment_analysis'],
            "ai_insights": result['ai_insights'],
            "total_articles_analyzed": result['sentiment_analysis']['total_articles'],
            "model_used": result.get('model_used', 'Unknown')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{symbol}/features")
async def get_sentiment_features(
    symbol: str,
    db: Session = Depends(get_db)
):
    """
    Get sentiment features for ML model integration
    Returns numerical features derived from news sentiment
    """
    try:
        symbol = symbol.upper()
        
        features = news_service.get_sentiment_features(symbol)
        
        return {
            "symbol": symbol,
            "features": features,
            "description": "Numerical sentiment features for ML model integration"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
