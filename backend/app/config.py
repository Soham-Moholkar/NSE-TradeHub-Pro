import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API Settings
    API_TITLE: str = "NSE Stock Analysis API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "FastAPI backend for Indian stock market analysis with ML predictions"
    
    # Database
    DATABASE_URL: str = "sqlite:///./nse_stocks.db"
    
    # AI Service
    GEMINI_API_KEY: str = ""
    
    # Authentication
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 43200
    
    # News API
    NEWS_API_KEY: str = ""
    
    # Data Source
    DEFAULT_DATA_SOURCE: str = "synthetic"
    
    # CORS - can be comma-separated string or list
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS
    
    # NSE Data Settings
    NSE_BASE_URL: str = "https://www.nseindia.com"
    NSE_API_URL: str = "https://www.nseindia.com/api"
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    
    # Cache Settings
    CACHE_EXPIRE_SECONDS: int = 300  # 5 minutes
    
    # ML Settings
    ML_MODELS_DIR: str = "./ml_models"
    TRAIN_TEST_SPLIT: float = 0.2
    RANDOM_STATE: int = 42
    MIN_TRAINING_SAMPLES: int = 100
    
    # Feature Engineering
    SMA_PERIODS: List[int] = [5, 10, 20, 50]
    EMA_PERIODS: List[int] = [12, 26]
    RSI_PERIOD: int = 14
    MACD_FAST: int = 12
    MACD_SLOW: int = 26
    MACD_SIGNAL: int = 9
    BB_PERIOD: int = 20
    BB_STD: int = 2
    
    # Data Settings
    DEFAULT_HISTORY_DAYS: int = 365
    MAX_HISTORY_DAYS: int = 1825  # ~5 years
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Create necessary directories
Path(settings.ML_MODELS_DIR).mkdir(exist_ok=True)
