from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.config import settings
from app.db import init_db
from app.schemas import HealthCheck
from app.api import symbols, prices, watchlist, ml, news, auth, community, trading, websocket, leaderboard, ai_assistant
import os

# Initialize database on startup
init_db()

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(symbols.router)
app.include_router(prices.router)
app.include_router(watchlist.router)
app.include_router(ml.router)
app.include_router(news.router)
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(trading.router)
app.include_router(websocket.router)
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["ai-assistant"])

@app.on_event("startup")
async def startup_event():
    """Pre-train ML models for popular stocks on startup"""
    from app.services.ml_service import ml_service
    from app.services.data_service import data_service
    from app.db import SessionLocal
    import pandas as pd
    
    popular_stocks = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "WIPRO"]
    db = SessionLocal()
    
    try:
        for symbol in popular_stocks:
            try:
                # Check if model already exists
                model_path = os.path.join(settings.ML_MODELS_DIR, f"{symbol}_model.pkl")
                if not os.path.exists(model_path):
                    print(f"Pre-training model for {symbol}...")
                    
                    # Get data
                    prices = data_service.ensure_recent_data(db, symbol, days=730)
                    if len(prices) >= 100:
                        df = pd.DataFrame([{
                            'date': p.date,
                            'open': p.open,
                            'high': p.high,
                            'low': p.low,
                            'close': p.close,
                            'volume': p.volume
                        } for p in prices])
                        
                        ml_service.train_model(symbol, df)
                        print(f"[OK] Model trained for {symbol}")
                else:
                    print(f"[SKIP] Model already exists for {symbol}")
            except Exception as e:
                print(f"[FAIL] Failed to train {symbol}: {str(e)}")
    finally:
        db.close()

@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "message": "NSE Stock Analysis API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthCheck, tags=["health"])
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="ok",
        timestamp=datetime.now(),
        version=settings.API_VERSION
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
