import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple, Optional
from app.config import settings


class FeatureEngineer:
    """Feature engineering for stock price data"""
    
    @staticmethod
    def calculate_sma(df: pd.DataFrame, periods: list) -> pd.DataFrame:
        """Calculate Simple Moving Averages"""
        for period in periods:
            df[f'SMA_{period}'] = df['close'].rolling(window=period).mean()
        return df
    
    @staticmethod
    def calculate_ema(df: pd.DataFrame, periods: list) -> pd.DataFrame:
        """Calculate Exponential Moving Averages"""
        for period in periods:
            df[f'EMA_{period}'] = df['close'].ewm(span=period, adjust=False).mean()
        return df
    
    @staticmethod
    def calculate_rsi(df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate Relative Strength Index"""
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        return df
    
    @staticmethod
    def calculate_macd(df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """Calculate MACD indicators"""
        exp1 = df['close'].ewm(span=fast, adjust=False).mean()
        exp2 = df['close'].ewm(span=slow, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['MACD_Signal'] = df['MACD'].ewm(span=signal, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
        return df
    
    @staticmethod
    def calculate_bollinger_bands(df: pd.DataFrame, period: int = 20, std: int = 2) -> pd.DataFrame:
        """Calculate Bollinger Bands"""
        sma = df['close'].rolling(window=period).mean()
        std_dev = df['close'].rolling(window=period).std()
        df['BB_Upper'] = sma + (std_dev * std)
        df['BB_Middle'] = sma
        df['BB_Lower'] = sma - (std_dev * std)
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['BB_Middle']
        df['BB_Position'] = (df['close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])
        return df
    
    @staticmethod
    def calculate_volume_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volume-based indicators"""
        df['Volume_SMA_20'] = df['volume'].rolling(window=20).mean()
        df['Volume_Ratio'] = df['volume'] / df['Volume_SMA_20']
        
        # On-Balance Volume (OBV)
        df['OBV'] = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
        return df
    
    @staticmethod
    def calculate_momentum_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate momentum indicators"""
        # Rate of Change
        df['ROC'] = df['close'].pct_change(periods=10) * 100
        
        # Stochastic Oscillator
        period = 14
        low_min = df['low'].rolling(window=period).min()
        high_max = df['high'].rolling(window=period).max()
        df['Stochastic'] = 100 * (df['close'] - low_min) / (high_max - low_min)
        
        return df
    
    @staticmethod
    def calculate_volatility(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate volatility indicators"""
        # Historical volatility
        df['Volatility'] = df['close'].pct_change().rolling(window=20).std() * np.sqrt(252)
        
        # Average True Range (ATR)
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = np.max(ranges, axis=1)
        df['ATR'] = true_range.rolling(14).mean()
        
        return df
    
    @staticmethod
    def calculate_price_changes(df: pd.DataFrame) -> pd.DataFrame:
        """Calculate price change indicators"""
        df['Price_Change'] = df['close'].pct_change()
        df['Price_Change_5d'] = df['close'].pct_change(periods=5)
        df['Price_Change_10d'] = df['close'].pct_change(periods=10)
        return df
    
    @staticmethod
    def create_target(df: pd.DataFrame) -> pd.DataFrame:
        """Create target variable: 1 if price goes up next day, 0 otherwise"""
        df['Target'] = (df['close'].shift(-1) > df['close']).astype(int)
        return df
    
    @classmethod
    def engineer_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Apply all feature engineering"""
        df = df.copy()
        df = df.sort_values('date').reset_index(drop=True)
        
        # Calculate all features
        df = cls.calculate_sma(df, settings.SMA_PERIODS)
        df = cls.calculate_ema(df, settings.EMA_PERIODS)
        df = cls.calculate_rsi(df, settings.RSI_PERIOD)
        df = cls.calculate_macd(df, settings.MACD_FAST, settings.MACD_SLOW, settings.MACD_SIGNAL)
        df = cls.calculate_bollinger_bands(df, settings.BB_PERIOD, settings.BB_STD)
        df = cls.calculate_volume_indicators(df)
        df = cls.calculate_momentum_indicators(df)
        df = cls.calculate_volatility(df)
        df = cls.calculate_price_changes(df)
        df = cls.create_target(df)
        
        return df


class MLService:
    """Machine Learning service for stock predictions"""
    
    def __init__(self):
        self.model_dir = Path(settings.ML_MODELS_DIR)
        self.model_dir.mkdir(exist_ok=True)
        self.feature_engineer = FeatureEngineer()
    
    def _get_feature_columns(self) -> list:
        """Get list of feature columns to use for training"""
        features = []
        
        # SMA features
        features.extend([f'SMA_{p}' for p in settings.SMA_PERIODS])
        
        # EMA features
        features.extend([f'EMA_{p}' for p in settings.EMA_PERIODS])
        
        # Technical indicators
        features.extend([
            'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
            'BB_Upper', 'BB_Middle', 'BB_Lower', 'BB_Width', 'BB_Position',
            'Volume_SMA_20', 'Volume_Ratio', 'OBV',
            'ROC', 'Stochastic', 'Volatility', 'ATR',
            'Price_Change', 'Price_Change_5d', 'Price_Change_10d'
        ])
        
        return features
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, list]:
        """Prepare data for training"""
        # Engineer features
        df = self.feature_engineer.engineer_features(df)
        
        # Get feature columns
        feature_cols = self._get_feature_columns()
        
        # Drop rows with NaN values
        df_clean = df.dropna()
        
        if len(df_clean) < settings.MIN_TRAINING_SAMPLES:
            raise ValueError(f"Insufficient data: need at least {settings.MIN_TRAINING_SAMPLES} samples, got {len(df_clean)}")
        
        # Separate features and target
        X = df_clean[feature_cols]
        y = df_clean['Target']
        
        return X, y, feature_cols
    
    def train_model(self, symbol: str, df: pd.DataFrame, force_retrain: bool = False) -> Dict:
        """Train a Random Forest model for the given symbol"""
        
        # Check if model already exists
        model_path = self.model_dir / f"{symbol}_model.joblib"
        if model_path.exists() and not force_retrain:
            return {
                "message": "Model already exists. Use force_retrain=True to retrain.",
                "model_path": str(model_path)
            }
        
        # Prepare data
        X, y, feature_cols = self.prepare_data(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=settings.TRAIN_TEST_SPLIT,
            random_state=settings.RANDOM_STATE,
            shuffle=False  # Time series - don't shuffle
        )
        
        # Train Random Forest model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=settings.RANDOM_STATE,
            n_jobs=-1
        )
        
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Save model
        joblib.dump({
            'model': model,
            'feature_cols': feature_cols,
            'trained_at': datetime.now()
        }, model_path)
        
        return {
            "symbol": symbol,
            "model_type": "random_forest",
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "model_path": str(model_path),
            "feature_count": len(feature_cols),
            "trained_at": datetime.now()
        }
    
    def predict(self, symbol: str, df: pd.DataFrame) -> Dict:
        """Make prediction for the given symbol"""
        
        # Load model
        model_path = self.model_dir / f"{symbol}_model.joblib"
        if not model_path.exists():
            raise ValueError(f"Model not found for {symbol}. Please train the model first.")
        
        model_data = joblib.load(model_path)
        model = model_data['model']
        feature_cols = model_data['feature_cols']
        
        # Engineer features
        df_features = self.feature_engineer.engineer_features(df)
        df_features = df_features.dropna()
        
        if len(df_features) == 0:
            raise ValueError("Insufficient data for prediction")
        
        # Get latest features
        latest_features = df_features[feature_cols].iloc[-1:].values
        latest_date = df_features['date'].iloc[-1]
        
        # Make prediction
        prediction = model.predict(latest_features)[0]
        prediction_proba = model.predict_proba(latest_features)[0]
        
        # Get feature importances
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        top_features = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Prepare feature values
        feature_values = dict(zip(feature_cols, latest_features[0]))
        
        return {
            "symbol": symbol,
            "prediction": "UP" if prediction == 1 else "DOWN",
            "confidence": float(max(prediction_proba)),
            "probability_up": float(prediction_proba[1]),
            "probability_down": float(prediction_proba[0]),
            "predicted_at": datetime.now(),
            "based_on_date": latest_date,
            "top_features": {k: float(v) for k, v in top_features.items()},
            "current_features": {k: float(v) for k, v in feature_values.items()}
        }
    
    def get_feature_importance(self, symbol: str) -> Dict:
        """Get feature importance for a trained model"""
        
        model_path = self.model_dir / f"{symbol}_model.joblib"
        if not model_path.exists():
            raise ValueError(f"Model not found for {symbol}")
        
        model_data = joblib.load(model_path)
        model = model_data['model']
        feature_cols = model_data['feature_cols']
        
        # Get feature importances
        importances = model.feature_importances_
        feature_importance = [
            {"feature": feature, "importance": float(importance)}
            for feature, importance in zip(feature_cols, importances)
        ]
        
        # Sort by importance
        feature_importance = sorted(feature_importance, key=lambda x: x['importance'], reverse=True)
        
        return {
            "symbol": symbol,
            "features": feature_importance,
            "trained_at": model_data['trained_at']
        }

# Singleton instance
ml_service = MLService()
