"""
Neural Network Pattern Recognition Service
Sophisticated pattern detection and correlation analysis for stock market data
"""
import pandas as pd
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from scipy import stats
from app.config import settings


class PatternRecognizer:
    """Advanced pattern recognition for stock price movements"""
    
    @staticmethod
    def detect_head_shoulders(df: pd.DataFrame, window: int = 20) -> Dict:
        """Detect head and shoulders pattern"""
        prices = df['close'].values
        patterns = []
        
        for i in range(window, len(prices) - window):
            left_shoulder = prices[i - window:i - window//2].max()
            head = prices[i - window//2:i + window//2].max()
            right_shoulder = prices[i + window//2:i + window].max()
            
            # Head and shoulders: head higher than shoulders, shoulders roughly equal
            if (head > left_shoulder * 1.02 and 
                head > right_shoulder * 1.02 and
                abs(left_shoulder - right_shoulder) / left_shoulder < 0.05):
                patterns.append({
                    'type': 'head_shoulders',
                    'index': i,
                    'confidence': 0.8,
                    'signal': 'bearish'
                })
        
        return {'head_shoulders': patterns}
    
    @staticmethod
    def detect_double_top_bottom(df: pd.DataFrame, window: int = 15) -> Dict:
        """Detect double top/bottom patterns"""
        prices = df['close'].values
        patterns = []
        
        for i in range(window, len(prices) - window):
            segment = prices[i - window:i + window]
            peaks_idx = np.where((segment[1:-1] > segment[:-2]) & (segment[1:-1] > segment[2:]))[0] + 1
            
            if len(peaks_idx) >= 2:
                peak1, peak2 = segment[peaks_idx[-2]], segment[peaks_idx[-1]]
                if abs(peak1 - peak2) / peak1 < 0.03:  # Peaks at similar levels
                    patterns.append({
                        'type': 'double_top',
                        'index': i,
                        'confidence': 0.75,
                        'signal': 'bearish'
                    })
            
            troughs_idx = np.where((segment[1:-1] < segment[:-2]) & (segment[1:-1] < segment[2:]))[0] + 1
            
            if len(troughs_idx) >= 2:
                trough1, trough2 = segment[troughs_idx[-2]], segment[troughs_idx[-1]]
                if abs(trough1 - trough2) / trough1 < 0.03:
                    patterns.append({
                        'type': 'double_bottom',
                        'index': i,
                        'confidence': 0.75,
                        'signal': 'bullish'
                    })
        
        return {'double_patterns': patterns}
    
    @staticmethod
    def detect_triangles(df: pd.DataFrame, window: int = 30) -> Dict:
        """Detect triangle consolidation patterns"""
        patterns = []
        prices = df['close'].values
        
        for i in range(window, len(prices)):
            segment = prices[i - window:i]
            
            # Calculate trend lines
            x = np.arange(len(segment))
            highs = pd.Series(segment).rolling(5).max().values
            lows = pd.Series(segment).rolling(5).min().values
            
            # Fit lines
            if not np.isnan(highs).any() and not np.isnan(lows).any():
                high_slope = np.polyfit(x, highs, 1)[0]
                low_slope = np.polyfit(x, lows, 1)[0]
                
                # Ascending triangle: flat top, rising bottom
                if abs(high_slope) < 0.01 and low_slope > 0.02:
                    patterns.append({
                        'type': 'ascending_triangle',
                        'index': i,
                        'confidence': 0.7,
                        'signal': 'bullish'
                    })
                
                # Descending triangle: falling top, flat bottom
                elif high_slope < -0.02 and abs(low_slope) < 0.01:
                    patterns.append({
                        'type': 'descending_triangle',
                        'index': i,
                        'confidence': 0.7,
                        'signal': 'bearish'
                    })
                
                # Symmetrical triangle: converging lines
                elif high_slope < -0.01 and low_slope > 0.01:
                    patterns.append({
                        'type': 'symmetrical_triangle',
                        'index': i,
                        'confidence': 0.65,
                        'signal': 'neutral'
                    })
        
        return {'triangles': patterns}
    
    @staticmethod
    def detect_support_resistance(df: pd.DataFrame, window: int = 20) -> Dict:
        """Detect support and resistance levels"""
        prices = df['close'].values
        
        # Find local maxima and minima
        highs = []
        lows = []
        
        for i in range(window, len(prices) - window):
            if prices[i] == max(prices[i - window:i + window]):
                highs.append(prices[i])
            if prices[i] == min(prices[i - window:i + window]):
                lows.append(prices[i])
        
        # Cluster similar levels
        resistance_levels = []
        support_levels = []
        
        if highs:
            resistance_levels = list(set([round(h, 2) for h in highs]))
        if lows:
            support_levels = list(set([round(l, 2) for l in lows]))
        
        return {
            'resistance_levels': sorted(resistance_levels, reverse=True)[:5],
            'support_levels': sorted(support_levels)[:5],
            'current_price': float(prices[-1])
        }


class CorrelationAnalyzer:
    """Analyze correlations between technical and fundamental factors"""
    
    @staticmethod
    def calculate_technical_correlations(df: pd.DataFrame) -> Dict:
        """Calculate correlations between technical indicators"""
        technical_cols = ['RSI', 'MACD', 'Stochastic', 'Volatility', 'Volume_Ratio']
        
        # Ensure columns exist
        available_cols = [col for col in technical_cols if col in df.columns]
        
        if len(available_cols) < 2:
            return {'correlations': {}}
        
        corr_matrix = df[available_cols].corr()
        
        correlations = {}
        for i, col1 in enumerate(available_cols):
            for col2 in available_cols[i+1:]:
                correlations[f"{col1}_vs_{col2}"] = float(corr_matrix.loc[col1, col2])
        
        return {'correlations': correlations}
    
    @staticmethod
    def analyze_volume_price_relationship(df: pd.DataFrame) -> Dict:
        """Analyze relationship between volume and price movements"""
        df = df.copy()
        df['price_change'] = df['close'].pct_change()
        df['volume_change'] = df['volume'].pct_change()
        
        # Correlation
        correlation = df[['price_change', 'volume_change']].corr().iloc[0, 1]
        
        # Volume patterns
        high_volume_days = df[df['volume'] > df['volume'].quantile(0.75)]
        avg_price_change_high_vol = high_volume_days['price_change'].mean()
        
        low_volume_days = df[df['volume'] < df['volume'].quantile(0.25)]
        avg_price_change_low_vol = low_volume_days['price_change'].mean()
        
        return {
            'volume_price_correlation': float(correlation),
            'avg_change_high_volume': float(avg_price_change_high_vol),
            'avg_change_low_volume': float(avg_price_change_low_vol),
            'volume_confirms_trend': abs(correlation) > 0.3
        }
    
    @staticmethod
    def detect_divergence(df: pd.DataFrame) -> Dict:
        """Detect divergence between price and indicators"""
        divergences = []
        
        if 'RSI' in df.columns:
            # Last 20 days
            recent = df.tail(20)
            price_trend = np.polyfit(range(len(recent)), recent['close'].values, 1)[0]
            rsi_trend = np.polyfit(range(len(recent)), recent['RSI'].values, 1)[0]
            
            # Bullish divergence: price falling, RSI rising
            if price_trend < 0 and rsi_trend > 0:
                divergences.append({
                    'type': 'bullish_divergence',
                    'indicator': 'RSI',
                    'confidence': 0.7,
                    'signal': 'bullish'
                })
            
            # Bearish divergence: price rising, RSI falling
            if price_trend > 0 and rsi_trend < 0:
                divergences.append({
                    'type': 'bearish_divergence',
                    'indicator': 'RSI',
                    'confidence': 0.7,
                    'signal': 'bearish'
                })
        
        return {'divergences': divergences}


class NeuralPatternService:
    """Neural network-based pattern recognition and prediction"""
    
    def __init__(self):
        self.model_dir = Path(settings.ML_MODELS_DIR)
        self.model_dir.mkdir(exist_ok=True)
        self.pattern_recognizer = PatternRecognizer()
        self.correlation_analyzer = CorrelationAnalyzer()
    
    def _create_advanced_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create advanced features for neural network"""
        df = df.copy()
        
        # Price momentum features
        for period in [3, 5, 10, 20]:
            df[f'momentum_{period}'] = df['close'].pct_change(period)
        
        # Volatility features
        for period in [5, 10, 20]:
            df[f'volatility_{period}'] = df['close'].pct_change().rolling(period).std()
        
        # Volume features
        df['volume_ma_ratio'] = df['volume'] / df['volume'].rolling(20).mean()
        df['volume_trend'] = df['volume'].pct_change(5)
        
        # Price position features
        for period in [20, 50]:
            rolling_max = df['high'].rolling(period).max()
            rolling_min = df['low'].rolling(period).min()
            df[f'price_position_{period}'] = (df['close'] - rolling_min) / (rolling_max - rolling_min)
        
        # Trend strength
        df['trend_strength'] = abs(df['close'].pct_change(20))
        
        return df
    
    def add_sentiment_features(self, df: pd.DataFrame, sentiment_features: Dict) -> pd.DataFrame:
        """Add news sentiment features to the dataframe"""
        # Add sentiment features as constant columns for the latest prediction
        for key, value in sentiment_features.items():
            df[f'sentiment_{key}'] = value
        
        return df
    
    def train_neural_model(self, symbol: str, df: pd.DataFrame, sentiment_features: Optional[Dict] = None, force_retrain: bool = False) -> Dict:
        """Train neural network model for pattern recognition"""
        
        model_path = self.model_dir / f"{symbol}_neural_model.joblib"
        
        if model_path.exists() and not force_retrain:
            return {
                "message": "Neural model already exists. Use force_retrain=True to retrain.",
                "model_path": str(model_path)
            }
        
        # Create features
        df_features = self._create_advanced_features(df)
        
        # Add sentiment features if provided
        if sentiment_features:
            df_features = self.add_sentiment_features(df_features, sentiment_features)
        
        # Create target: multi-class prediction
        # 0: Down > 2%, 1: Flat, 2: Up > 2%
        df_features['future_return'] = df_features['close'].pct_change(1).shift(-1)
        df_features['target'] = pd.cut(
            df_features['future_return'],
            bins=[-np.inf, -0.02, 0.02, np.inf],
            labels=[0, 1, 2]
        )
        
        # Select features
        feature_cols = [col for col in df_features.columns if any(
            x in col for x in ['momentum_', 'volatility_', 'volume_', 'price_position_', 'trend_', 
                              'RSI', 'MACD', 'Stochastic', 'BB_', 'sentiment_']
        )]
        
        df_clean = df_features[feature_cols + ['target']].dropna()
        
        if len(df_clean) < 100:
            raise ValueError(f"Insufficient data for neural training: {len(df_clean)} samples")
        
        X = df_clean[feature_cols]
        y = df_clean['target'].astype(int)
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Apply PCA for dimensionality reduction
        pca = PCA(n_components=min(15, len(feature_cols)))
        X_pca = pca.fit_transform(X_scaled)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_pca, y, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Train neural network
        model = MLPClassifier(
            hidden_layer_sizes=(100, 50, 25),
            activation='relu',
            solver='adam',
            alpha=0.001,
            batch_size='auto',
            learning_rate='adaptive',
            max_iter=500,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )
        
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model and preprocessors
        joblib.dump({
            'model': model,
            'scaler': scaler,
            'pca': pca,
            'feature_cols': feature_cols,
            'trained_at': datetime.now()
        }, model_path)
        
        return {
            "symbol": symbol,
            "model_type": "neural_network",
            "architecture": "MLP(100-50-25)",
            "accuracy": float(accuracy),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "feature_count": len(feature_cols),
            "pca_components": pca.n_components_,
            "explained_variance": float(sum(pca.explained_variance_ratio_)),
            "sentiment_integrated": sentiment_features is not None,
            "trained_at": datetime.now()
        }
    
    def predict_neural(self, symbol: str, df: pd.DataFrame, sentiment_features: Optional[Dict] = None) -> Dict:
        """Make prediction using neural network"""
        
        model_path = self.model_dir / f"{symbol}_neural_model.joblib"
        if not model_path.exists():
            raise ValueError(f"Neural model not found for {symbol}. Train the model first.")
        
        # Load model
        model_data = joblib.load(model_path)
        model = model_data['model']
        scaler = model_data['scaler']
        pca = model_data['pca']
        feature_cols = model_data['feature_cols']
        
        # Create features
        df_features = self._create_advanced_features(df)
        
        # Add sentiment features if provided
        if sentiment_features:
            df_features = self.add_sentiment_features(df_features, sentiment_features)
        
        df_clean = df_features[feature_cols].dropna()
        
        if len(df_clean) == 0:
            raise ValueError("Insufficient data for prediction")
        
        # Latest features
        latest_features = df_clean.iloc[-1:].values
        
        # Scale and transform
        X_scaled = scaler.transform(latest_features)
        X_pca = pca.transform(X_scaled)
        
        # Predict
        prediction = model.predict(X_pca)[0]
        probabilities = model.predict_proba(X_pca)[0]
        
        labels = ["strong_down", "neutral", "strong_up"]
        
        return {
            "symbol": symbol,
            "prediction": labels[prediction],
            "confidence": float(max(probabilities)),
            "probabilities": {
                "strong_down": float(probabilities[0]),
                "neutral": float(probabilities[1]),
                "strong_up": float(probabilities[2])
            },
            "sentiment_integrated": sentiment_features is not None,
            "predicted_at": datetime.now().isoformat()
        }
    
    def analyze_patterns(self, symbol: str, df: pd.DataFrame) -> Dict:
        """Comprehensive pattern and correlation analysis"""
        
        # Detect patterns
        head_shoulders = self.pattern_recognizer.detect_head_shoulders(df)
        double_patterns = self.pattern_recognizer.detect_double_top_bottom(df)
        triangles = self.pattern_recognizer.detect_triangles(df)
        support_resistance = self.pattern_recognizer.detect_support_resistance(df)
        
        # Correlation analysis
        tech_correlations = self.correlation_analyzer.calculate_technical_correlations(df)
        volume_analysis = self.correlation_analyzer.analyze_volume_price_relationship(df)
        divergences = self.correlation_analyzer.detect_divergence(df)
        
        # Combine all patterns
        all_patterns = []
        all_patterns.extend(head_shoulders.get('head_shoulders', []))
        all_patterns.extend(double_patterns.get('double_patterns', []))
        all_patterns.extend(triangles.get('triangles', []))
        all_patterns.extend(divergences.get('divergences', []))
        
        # Get recent patterns (last 30 days)
        recent_patterns = [p for p in all_patterns if isinstance(p.get('index'), int) and p['index'] >= len(df) - 30]
        
        # Calculate pattern signals
        bullish_signals = len([p for p in recent_patterns if p.get('signal') == 'bullish'])
        bearish_signals = len([p for p in recent_patterns if p.get('signal') == 'bearish'])
        
        # Overall sentiment
        if bullish_signals > bearish_signals:
            sentiment = 'BULLISH'
            confidence = bullish_signals / (bullish_signals + bearish_signals) if (bullish_signals + bearish_signals) > 0 else 0.5
        elif bearish_signals > bullish_signals:
            sentiment = 'BEARISH'
            confidence = bearish_signals / (bullish_signals + bearish_signals) if (bullish_signals + bearish_signals) > 0 else 0.5
        else:
            sentiment = 'NEUTRAL'
            confidence = 0.5
        
        return {
            "symbol": symbol,
            "analysis_date": datetime.now().isoformat(),
            "patterns_detected": {
                "head_shoulders": len(head_shoulders.get('head_shoulders', [])),
                "double_patterns": len(double_patterns.get('double_patterns', [])),
                "triangles": len(triangles.get('triangles', [])),
                "total": len(all_patterns)
            },
            "recent_patterns": recent_patterns[-5:],  # Last 5 patterns
            "support_resistance": support_resistance,
            "correlations": tech_correlations.get('correlations', {}),
            "volume_analysis": volume_analysis,
            "divergences": divergences.get('divergences', []),
            "pattern_sentiment": sentiment,
            "pattern_confidence": confidence
        }
    
    def _calculate_correlation_strength(self, pattern_analysis: Dict) -> float:
        """Calculate overall correlation strength from pattern analysis"""
        
        # Get pattern confidence
        pattern_confidence = pattern_analysis.get('pattern_confidence', 0.5)
        
        # Get volume correlation strength
        volume_analysis = pattern_analysis.get('volume_analysis', {})
        volume_confirms = volume_analysis.get('volume_confirms_trend', False)
        volume_corr = abs(volume_analysis.get('volume_price_correlation', 0))
        
        # Count divergences (divergences reduce correlation strength)
        divergences = len(pattern_analysis.get('divergences', []))
        divergence_penalty = min(0.3, divergences * 0.1)
        
        # Calculate weighted correlation
        base_strength = pattern_confidence * 0.6  # Pattern confidence: 60% weight
        volume_strength = (volume_corr * 0.3) if volume_confirms else (volume_corr * 0.1)  # Volume: 30% or 10% weight
        
        correlation_strength = (base_strength + volume_strength) - divergence_penalty
        
        # Clamp between 0 and 1
        return max(0.0, min(1.0, float(correlation_strength)))
    
    def get_comprehensive_insights(self, symbol: str, df: pd.DataFrame, sentiment_features: Optional[Dict] = None) -> Dict:
        """Get comprehensive neural network insights with pattern correlation"""
        
        try:
            # Get neural prediction
            neural_pred = self.predict_neural(symbol, df, sentiment_features)
        except ValueError:
            neural_pred = None
        
        # Get pattern analysis
        pattern_analysis = self.analyze_patterns(symbol, df)
        
        # Combine insights with sentiment
        insights = {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "neural_prediction": neural_pred,
            "pattern_analysis": pattern_analysis,
            "correlation_strength": self._calculate_correlation_strength(pattern_analysis),
            "recommendation": self._generate_recommendation(neural_pred, pattern_analysis, sentiment_features)
        }
        
        # Add sentiment summary if available
        if sentiment_features:
            insights['sentiment_impact'] = {
                "sentiment_score": sentiment_features.get('sentiment_score', 0),
                "news_volume": sentiment_features.get('news_volume', 0),
                "recommendation": sentiment_features.get('news_recommendation_score', 0)
            }
        
        return insights
    
    
    
    def _generate_recommendation(self, neural_pred: Optional[Dict], pattern_analysis: Dict, sentiment_features: Optional[Dict] = None) -> Dict:
        """Generate trading recommendation based on all factors including sentiment"""
        
        if not neural_pred:
            return {
                "action": "HOLD",
                "confidence": 0.3,
                "reason": "Insufficient neural model data"
            }
        
        neural_direction = neural_pred.get('prediction', 'NEUTRAL')
        pattern_sentiment = pattern_analysis.get('pattern_sentiment', 'NEUTRAL')
        
        # Factor in news sentiment if available
        sentiment_boost = 0
        if sentiment_features:
            news_recommendation = sentiment_features.get('news_recommendation_score', 0)
            sentiment_confidence = sentiment_features.get('sentiment_confidence', 0.5)
            sentiment_boost = news_recommendation * sentiment_confidence * 0.15  # 15% weight
        
        # Calculate base confidence
        base_confidence = neural_pred.get('confidence', 0.5)
        
        # Both agree
        if 'UP' in neural_direction and pattern_sentiment == 'BULLISH':
            confidence = min(0.95, base_confidence + sentiment_boost)
            if sentiment_boost > 0.1:
                reason = "Neural network, technical patterns, and positive news sentiment all indicate strong bullish trend"
                action = "STRONG_BUY"
            else:
                reason = "Neural network and technical patterns both indicate bullish trend"
                action = "STRONG_BUY"
        elif 'DOWN' in neural_direction and pattern_sentiment == 'BEARISH':
            confidence = min(0.95, base_confidence - sentiment_boost)
            if sentiment_boost < -0.1:
                reason = "Neural network, technical patterns, and negative news sentiment all indicate strong bearish trend"
                action = "STRONG_SELL"
            else:
                reason = "Neural network and technical patterns both indicate bearish trend"
                action = "STRONG_SELL"
        # Mixed signals
        elif 'UP' in neural_direction and pattern_sentiment == 'NEUTRAL':
            confidence = min(0.85, 0.65 + sentiment_boost)
            reason = "Neural network indicates upward movement"
            if sentiment_boost > 0.05:
                reason += " with positive news support"
            action = "BUY"
        elif 'DOWN' in neural_direction and pattern_sentiment == 'NEUTRAL':
            confidence = min(0.85, 0.65 - sentiment_boost)
            reason = "Neural network indicates downward movement"
            if sentiment_boost < -0.05:
                reason += " with negative news pressure"
            action = "SELL"
        else:
            confidence = 0.5 + abs(sentiment_boost)
            if sentiment_boost > 0.1:
                action = "BUY"
                reason = "Strong positive news sentiment despite mixed technical signals"
            elif sentiment_boost < -0.1:
                action = "SELL"
                reason = "Strong negative news sentiment despite mixed technical signals"
            else:
                action = "HOLD"
                reason = "Mixed signals from neural network, technical analysis, and news sentiment"
        
        return {
            "action": action,
            "confidence": float(confidence),
            "reason": reason
        }


# Singleton instance
neural_service = NeuralPatternService()
