from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime, timedelta
import random

from app.models.trading import TradingSignal
from app.services.data_service import data_service
from app.services.ml_service import ml_service


class SignalGenerator:
    """AI-powered trading signal generation combining ML, technical, and sentiment analysis"""
    
    def generate_signal(self, db: Session, symbol: str, user_id: Optional[int] = None) -> Dict:
        """Generate comprehensive trading signal for a symbol"""
        
        # Get ML prediction
        ml_prediction = self._get_ml_prediction(db, symbol)
        
        # Get technical analysis
        technical_analysis = self._get_technical_analysis(db, symbol)
        
        # Get sentiment analysis
        sentiment_analysis = self._get_sentiment_analysis(symbol)
        
        # Combine all signals
        combined_signal = self._combine_signals(ml_prediction, technical_analysis, sentiment_analysis)
        
        # Calculate price targets
        current_price = self._get_current_price(db, symbol)
        if not current_price:
            return {"error": "Cannot get current price"}
        
        price_targets = self._calculate_price_targets(
            current_price, 
            combined_signal["signal"],
            combined_signal["strength"]
        )
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            ml_prediction, 
            technical_analysis, 
            sentiment_analysis,
            combined_signal
        )
        
        # Create signal record
        signal = TradingSignal(
            symbol=symbol,
            signal=combined_signal["signal"],
            strength=combined_signal["strength"],
            confidence=combined_signal["confidence"],
            current_price=current_price,
            entry_price=price_targets["entry"],
            target_price=price_targets["target"],
            stop_loss=price_targets["stop_loss"],
            reasoning=reasoning,
            ml_score=ml_prediction["confidence"],
            technical_score=technical_analysis["score"],
            sentiment_score=sentiment_analysis["score"]
        )
        
        db.add(signal)
        db.commit()
        db.refresh(signal)
        
        return {
            "signal": signal.signal.value,
            "strength": signal.strength,
            "confidence": signal.confidence,
            "current_price": current_price,
            "entry_price": price_targets["entry"],
            "target_price": price_targets["target"],
            "stop_loss": price_targets["stop_loss"],
            "reasoning": reasoning,
            "components": {
                "ml_prediction": ml_prediction,
                "technical_analysis": technical_analysis,
                "sentiment_analysis": sentiment_analysis
            },
            "generated_at": signal.generated_at.isoformat()
        }
    
    def _get_ml_prediction(self, db: Session, symbol: str) -> Dict:
        """Get ML model prediction"""
        try:
            prediction = ml_service.predict(db, symbol)
            
            # Extract signal from prediction
            direction = prediction.get("prediction", {}).get("direction", "HOLD")
            confidence = prediction.get("prediction", {}).get("confidence", 0.5)
            
            return {
                "signal": direction,
                "confidence": confidence,
                "details": prediction
            }
        except Exception as e:
            # Fallback if ML prediction fails
            return {
                "signal": "HOLD",
                "confidence": 0.5,
                "details": {"error": str(e)}
            }
    
    def _get_technical_analysis(self, db: Session, symbol: str) -> Dict:
        """Perform technical analysis"""
        # Get recent price data
        prices = data_service.get_symbol_prices(db, symbol, days=30)
        if not prices or len(prices) < 20:
            return {"score": 50, "indicators": {}, "signal": "HOLD"}
        
        closes = [p.close for p in prices]
        volumes = [p.volume for p in prices]
        
        # Calculate technical indicators
        current_price = closes[-1]
        
        # Simple Moving Averages
        sma_20 = sum(closes[-20:]) / 20
        sma_50 = sum(closes[-50:]) / 50 if len(closes) >= 50 else sma_20
        
        # Price vs MA signals
        price_vs_sma20 = ((current_price - sma_20) / sma_20) * 100
        price_vs_sma50 = ((current_price - sma_50) / sma_50) * 100
        
        # RSI calculation (simplified)
        gains = []
        losses = []
        for i in range(1, min(15, len(closes))):
            change = closes[i] - closes[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains) / len(gains) if gains else 0
        avg_loss = sum(losses) / len(losses) if losses else 1
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi = 100 - (100 / (1 + rs))
        
        # Volume trend
        avg_volume = sum(volumes[-20:]) / 20
        current_volume = volumes[-1]
        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
        
        # Price momentum
        price_change_5d = ((closes[-1] - closes[-5]) / closes[-5]) * 100 if len(closes) >= 5 else 0
        price_change_20d = ((closes[-1] - closes[-20]) / closes[-20]) * 100
        
        # Scoring (0-100)
        score = 50  # Neutral start
        
        # MA signals
        if price_vs_sma20 > 5:
            score += 15
        elif price_vs_sma20 > 0:
            score += 8
        elif price_vs_sma20 < -5:
            score -= 15
        elif price_vs_sma20 < 0:
            score -= 8
        
        # RSI signals
        if rsi < 30:  # Oversold - bullish
            score += 10
        elif rsi < 40:
            score += 5
        elif rsi > 70:  # Overbought - bearish
            score -= 10
        elif rsi > 60:
            score -= 5
        
        # Momentum signals
        if price_change_5d > 5:
            score += 10
        elif price_change_5d < -5:
            score -= 10
        
        # Volume signals
        if volume_ratio > 1.5:  # High volume
            if price_change_5d > 0:
                score += 5
            else:
                score -= 5
        
        score = max(0, min(100, score))
        
        # Determine signal
        if score >= 65:
            signal = "BUY"
        elif score <= 35:
            signal = "SELL"
        else:
            signal = "HOLD"
        
        return {
            "score": round(score, 1),
            "signal": signal,
            "indicators": {
                "rsi": round(rsi, 2),
                "sma_20": round(sma_20, 2),
                "sma_50": round(sma_50, 2),
                "price_vs_sma20": round(price_vs_sma20, 2),
                "momentum_5d": round(price_change_5d, 2),
                "momentum_20d": round(price_change_20d, 2),
                "volume_ratio": round(volume_ratio, 2)
            }
        }
    
    def _get_sentiment_analysis(self, symbol: str) -> Dict:
        """Analyze market sentiment (simulated)"""
        # In real system, would fetch news, social media, analyst ratings
        # For demo, generate realistic sentiment
        
        # Simulate sentiment score (0-100)
        base_sentiment = random.uniform(40, 60)
        
        # Add some variability
        sentiment_score = base_sentiment + random.uniform(-10, 10)
        sentiment_score = max(0, min(100, sentiment_score))
        
        # Determine signal
        if sentiment_score >= 65:
            signal = "BUY"
        elif sentiment_score <= 35:
            signal = "SELL"
        else:
            signal = "HOLD"
        
        # Generate realistic factors
        factors = []
        if sentiment_score > 60:
            factors = random.sample([
                "Positive analyst upgrades",
                "Strong earnings expectations",
                "Increasing institutional interest",
                "Positive news coverage",
                "Bullish social media sentiment"
            ], k=2)
        elif sentiment_score < 40:
            factors = random.sample([
                "Analyst downgrades",
                "Earnings concerns",
                "Negative news flow",
                "Bearish technical patterns",
                "Sector weakness"
            ], k=2)
        else:
            factors = ["Neutral market sentiment", "Mixed analyst views"]
        
        return {
            "score": round(sentiment_score, 1),
            "signal": signal,
            "factors": factors
        }
    
    def _combine_signals(
        self, 
        ml_prediction: Dict, 
        technical_analysis: Dict, 
        sentiment_analysis: Dict
    ) -> Dict:
        """Combine all signals into final recommendation"""
        
        # Weight each component
        ml_weight = 0.4
        technical_weight = 0.4
        sentiment_weight = 0.2
        
        # Convert signals to numeric (-1 to 1)
        signal_map = {"BUY": 1, "HOLD": 0, "SELL": -1}
        
        ml_numeric = signal_map.get(ml_prediction["signal"], 0) * ml_prediction["confidence"]
        technical_numeric = (technical_analysis["score"] - 50) / 50  # Convert 0-100 to -1 to 1
        sentiment_numeric = (sentiment_analysis["score"] - 50) / 50
        
        # Weighted combination
        combined = (
            ml_numeric * ml_weight +
            technical_numeric * technical_weight +
            sentiment_numeric * sentiment_weight
        )
        
        # Determine final signal
        if combined >= 0.3:
            signal = "BUY"
        elif combined <= -0.3:
            signal = "SELL"
        else:
            signal = "HOLD"
        
        # Calculate strength (1-5 stars)
        strength_raw = abs(combined)
        if strength_raw >= 0.8:
            strength = 5
        elif strength_raw >= 0.6:
            strength = 4
        elif strength_raw >= 0.4:
            strength = 3
        elif strength_raw >= 0.2:
            strength = 2
        else:
            strength = 1
        
        # Calculate confidence (0-100)
        confidence = min(100, abs(combined) * 100)
        
        return {
            "signal": signal,
            "strength": strength,
            "confidence": round(confidence, 1)
        }
    
    def _calculate_price_targets(self, current_price: float, signal: str, strength: int) -> Dict:
        """Calculate entry, target, and stop-loss prices"""
        
        if signal == "BUY":
            # For buy signals
            entry_price = current_price * 0.99  # Slight discount for limit order
            
            # Target based on strength (5-15% gain)
            target_multiplier = 1 + (0.02 * strength) + random.uniform(0.02, 0.05)
            target_price = current_price * target_multiplier
            
            # Stop loss (3-7% below current)
            stop_multiplier = 1 - (0.01 * strength) - random.uniform(0.02, 0.03)
            stop_loss = current_price * stop_multiplier
            
        elif signal == "SELL":
            # For sell signals (shorting or exit)
            entry_price = current_price * 1.01  # Slight premium
            
            # Target below current (5-15% lower)
            target_multiplier = 1 - (0.02 * strength) - random.uniform(0.02, 0.05)
            target_price = current_price * target_multiplier
            
            # Stop loss above current
            stop_multiplier = 1 + (0.01 * strength) + random.uniform(0.02, 0.03)
            stop_loss = current_price * stop_multiplier
            
        else:  # HOLD
            entry_price = current_price
            target_price = current_price * 1.05
            stop_loss = current_price * 0.95
        
        return {
            "entry": round(entry_price, 2),
            "target": round(target_price, 2),
            "stop_loss": round(stop_loss, 2)
        }
    
    def _generate_reasoning(
        self,
        ml_prediction: Dict,
        technical_analysis: Dict,
        sentiment_analysis: Dict,
        combined_signal: Dict
    ) -> str:
        """Generate human-readable reasoning for the signal"""
        
        signal = combined_signal["signal"]
        strength = combined_signal["strength"]
        
        # Build reasoning components
        components = []
        
        # ML component
        ml_signal = ml_prediction["signal"]
        ml_conf = ml_prediction["confidence"]
        components.append(f"ML model predicts {ml_signal} with {ml_conf*100:.0f}% confidence")
        
        # Technical component
        tech_score = technical_analysis["score"]
        indicators = technical_analysis["indicators"]
        
        tech_notes = []
        if indicators.get("rsi", 50) < 30:
            tech_notes.append("oversold RSI")
        elif indicators.get("rsi", 50) > 70:
            tech_notes.append("overbought RSI")
        
        if indicators.get("price_vs_sma20", 0) > 5:
            tech_notes.append("strong uptrend")
        elif indicators.get("price_vs_sma20", 0) < -5:
            tech_notes.append("downtrend")
        
        if tech_notes:
            components.append(f"Technical analysis shows {', '.join(tech_notes)}")
        else:
            components.append(f"Technical score: {tech_score:.0f}/100")
        
        # Sentiment component
        sent_factors = sentiment_analysis.get("factors", [])
        if sent_factors:
            components.append(f"Market sentiment: {sent_factors[0].lower()}")
        
        # Combine into reasoning
        reasoning = ". ".join(components) + f". Overall signal: {signal}"
        
        # Add strength description
        strength_desc = {
            5: "very strong",
            4: "strong",
            3: "moderate",
            2: "weak",
            1: "very weak"
        }
        
        reasoning += f" with {strength_desc[strength]} conviction ({strength}/5 stars)."
        
        return reasoning
    
    def _get_current_price(self, db: Session, symbol: str) -> Optional[float]:
        """Get current price for symbol"""
        latest = data_service.get_latest_price(db, symbol)
        return latest.close if latest else None
    
    def get_recent_signals(self, db: Session, symbol: Optional[str] = None, limit: int = 10) -> list:
        """Get recent trading signals"""
        query = db.query(TradingSignal)
        if symbol:
            query = query.filter(TradingSignal.symbol == symbol)
        
        return query.order_by(TradingSignal.generated_at.desc()).limit(limit).all()


# Singleton instance
signal_generator = SignalGenerator()
