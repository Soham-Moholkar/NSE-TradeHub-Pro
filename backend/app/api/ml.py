from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.data_service import data_service
from app.services.ml_service import ml_service
from app.services.neural_service import neural_service
from app.services.news_service_lite import news_service_lite as news_service

# Using lightweight VADER sentiment (no PyTorch needed)
NEWS_SERVICE_AVAILABLE = True

from app.schemas import MLPrediction, MLTrainRequest, MLTrainResponse, MLFeatureAnalysis, MLFeatureImportance
import pandas as pd
from datetime import datetime
import os

router = APIRouter(prefix="/api/ml", tags=["machine-learning"])

@router.post("/train/{symbol}", response_model=MLTrainResponse)
async def train_model_endpoint(
    symbol: str,
    request: MLTrainRequest = None,
    db: Session = Depends(get_db)
):
    """Train ML model for a symbol"""
    try:
        symbol = symbol.upper()
        force_retrain = request.force_retrain if request else False
        
        # Ensure we have data
        prices = data_service.ensure_recent_data(db, symbol, days=730)  # 2 years
        
        if len(prices) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for training. Need at least 100 days, got {len(prices)}"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Train model
        result = ml_service.train_model(symbol, df, force_retrain)
        
        return MLTrainResponse(
            symbol=result['symbol'],
            model_type=result['model_type'],
            accuracy=result['accuracy'],
            precision=result['precision'],
            recall=result['recall'],
            f1_score=result['f1_score'],
            training_samples=result['training_samples'],
            trained_at=result['trained_at'],
            message=f"Model trained successfully with {result['accuracy']:.2%} accuracy"
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predict/{symbol}", response_model=MLPrediction)
async def predict(symbol: str, db: Session = Depends(get_db)):
    """Get ML prediction for a symbol"""
    try:
        symbol = symbol.upper()
        
        # Ensure we have recent data
        prices = data_service.ensure_recent_data(db, symbol, days=365)
        
        if len(prices) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for prediction. Need at least 100 days, got {len(prices)}"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Make prediction
        try:
            result = ml_service.predict(symbol, df)
        except ValueError as e:
            if "Model not found" in str(e):
                # Auto-train if model doesn't exist
                ml_service.train_model(symbol, df)
                result = ml_service.predict(symbol, df)
            else:
                raise
        
        return MLPrediction(
            symbol=result['symbol'],
            prediction=result['prediction'],
            confidence=result['confidence'],
            predicted_at=result['predicted_at'],
            features=result['top_features']
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/features/{symbol}", response_model=MLFeatureAnalysis)
async def get_feature_analysis(symbol: str, db: Session = Depends(get_db)):
    """Get feature importance analysis for a symbol"""
    try:
        symbol = symbol.upper()
        
        # Get feature importance
        try:
            result = ml_service.get_feature_importance(symbol)
        except ValueError as e:
            if "Model not found" in str(e):
                raise HTTPException(
                    status_code=404,
                    detail=f"Model not found for {symbol}. Please train the model first."
                )
            raise
        
        # Get latest features
        prices = data_service.ensure_recent_data(db, symbol, days=365)
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        df_features = ml_service.feature_engineer.engineer_features(df)
        df_features = df_features.dropna()
        
        if len(df_features) > 0:
            latest_row = df_features.iloc[-1]
            feature_cols = ml_service._get_feature_columns()
            latest_features = {col: float(latest_row[col]) for col in feature_cols if col in latest_row}
        else:
            latest_features = {}
        
        # Convert features list to MLFeatureImportance objects
        feature_list = [
            MLFeatureImportance(feature=f['feature'], importance=f['importance'])
            for f in result['features'][:15]
        ]
        
        return MLFeatureAnalysis(
            symbol=result['symbol'],
            features=feature_list,
            latest_features=latest_features
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/neural/train/{symbol}")
async def train_neural_model(
    symbol: str,
    force_retrain: bool = False,
    include_sentiment: bool = True,
    db: Session = Depends(get_db)
):
    """Train neural network model for advanced pattern recognition with optional sentiment integration"""
    try:
        symbol = symbol.upper()
        
        # Get historical data
        prices = data_service.ensure_recent_data(db, symbol, days=730)
        
        if len(prices) < 200:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for neural training. Need at least 200 days, got {len(prices)}"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Engineer features first (needed for neural model)
        df = ml_service.feature_engineer.engineer_features(df)
        
        # Get sentiment features if requested
        sentiment_features = None
        if include_sentiment and NEWS_SERVICE_AVAILABLE:
            try:
                sentiment_features = news_service.get_sentiment_features(symbol)
            except Exception as e:
                print(f"Could not get sentiment features: {e}")
        
        # Train neural model
        result = neural_service.train_neural_model(symbol, df, sentiment_features, force_retrain)
        
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/neural/predict/{symbol}")
async def predict_neural(
    symbol: str,
    include_sentiment: bool = True,
    db: Session = Depends(get_db)
):
    """Get neural network prediction with confidence scores and optional sentiment integration"""
    try:
        symbol = symbol.upper()
        
        # Get data
        prices = data_service.ensure_recent_data(db, symbol, days=365)
        
        if len(prices) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for prediction. Need at least 100 days"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Engineer features
        df = ml_service.feature_engineer.engineer_features(df)
        
        # Get sentiment features if requested
        sentiment_features = None
        if include_sentiment and NEWS_SERVICE_AVAILABLE:
            try:
                sentiment_features = news_service.get_sentiment_features(symbol)
            except Exception as e:
                print(f"Could not get sentiment features: {e}")
        
        # Make prediction
        try:
            result = neural_service.predict_neural(symbol, df, sentiment_features)
        except ValueError as e:
            if "not found" in str(e):
                # Auto-train if model doesn't exist
                neural_service.train_neural_model(symbol, df, sentiment_features)
                result = neural_service.predict_neural(symbol, df, sentiment_features)
            else:
                raise
        
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/neural/patterns/{symbol}")
async def analyze_patterns(symbol: str, db: Session = Depends(get_db)):
    """Analyze chart patterns and correlations"""
    try:
        symbol = symbol.upper()
        
        # Get data
        prices = data_service.ensure_recent_data(db, symbol, days=365)
        
        if len(prices) < 60:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for pattern analysis. Need at least 60 days"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Detect patterns using neural service
        patterns = neural_service.detect_patterns(df)
        
        return {
            "symbol": symbol,
            "patterns": patterns,
            "data_points": len(df),
            "analysis_date": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/neural/insights/{symbol}")
async def get_comprehensive_insights(
    symbol: str,
    include_sentiment: bool = True,
    db: Session = Depends(get_db)
):
    """Get comprehensive neural network insights with pattern recognition, correlation analysis, and sentiment integration"""
    try:
        symbol = symbol.upper()
        
        # Get data
        prices = data_service.ensure_recent_data(db, symbol, days=730)
        
        if len(prices) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient data for comprehensive analysis"
            )
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'open': p.open,
            'high': p.high,
            'low': p.low,
            'close': p.close,
            'volume': p.volume
        } for p in prices])
        
        # Engineer features
        df = ml_service.feature_engineer.engineer_features(df)
        
        # Get sentiment features if requested
        sentiment_features = None
        if include_sentiment and NEWS_SERVICE_AVAILABLE:
            try:
                sentiment_features = news_service.get_sentiment_features(symbol)
            except Exception as e:
                print(f"Could not get sentiment features: {e}")
        
        # Get comprehensive insights
        result = neural_service.get_comprehensive_insights(symbol, df, sentiment_features)
        
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
