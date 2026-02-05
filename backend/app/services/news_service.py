"""
News and Sentiment Analysis Service
Fetches news from Yahoo Finance and performs AI sentiment analysis
"""
import yfinance as yf
import feedparser
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import re
from collections import Counter
import numpy as np

# Make transformers optional to avoid Windows DLL issues
try:
    from transformers import pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
except (ImportError, OSError) as e:
    print(f"Warning: Transformers/PyTorch not available: {e}")
    TRANSFORMERS_AVAILABLE = False
    pipeline = None
    torch = None


class SentimentAnalyzer:
    """AI-powered sentiment analysis using Hugging Face transformers"""
    
    def __init__(self):
        if not TRANSFORMERS_AVAILABLE:
            print("Sentiment analysis disabled: Transformers not available")
            self.sentiment_pipeline = None
            self.model_name = "Disabled"
            self.device = -1
            return
            
        self.device = 0 if torch.cuda.is_available() else -1
        try:
            # Use FinBERT for financial sentiment analysis
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                device=self.device
            )
            self.model_name = "FinBERT"
        except Exception as e:
            print(f"FinBERT not available, using default: {e}")
            try:
                # Fallback to general sentiment model
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    device=self.device
                )
                self.model_name = "DistilBERT"
            except Exception as e2:
                print(f"No sentiment model available: {e2}")
                self.sentiment_pipeline = None
                self.model_name = "Disabled"
    
    def analyze_text(self, text: str) -> Dict:
        """Analyze sentiment of a single text"""
        if not self.sentiment_pipeline:
            return {
                "label": "neutral",
                "score": 0.5,
                "confidence": "low",
                "note": "Sentiment analysis unavailable"
            }
            
        if not text or len(text.strip()) < 10:
            return {
                "label": "neutral",
                "score": 0.5,
                "confidence": "low"
            }
        
        try:
            # Truncate text to model's max length (512 tokens)
            text = text[:2000]
            
            result = self.sentiment_pipeline(text)[0]
            
            # Normalize labels
            label = result['label'].lower()
            if label in ['positive', 'pos']:
                sentiment = 'positive'
            elif label in ['negative', 'neg']:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            score = result['score']
            
            # Determine confidence level
            if score >= 0.9:
                confidence = "very_high"
            elif score >= 0.75:
                confidence = "high"
            elif score >= 0.6:
                confidence = "medium"
            else:
                confidence = "low"
            
            return {
                "label": sentiment,
                "score": float(score),
                "confidence": confidence
            }
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return {
                "label": "neutral",
                "score": 0.5,
                "confidence": "low"
            }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """Analyze sentiment of multiple texts"""
        return [self.analyze_text(text) for text in texts]
    
    def aggregate_sentiment(self, sentiments: List[Dict]) -> Dict:
        """Aggregate multiple sentiments into overall sentiment"""
        if not sentiments:
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 0.0,
                "confidence": "low",
                "distribution": {"positive": 0, "neutral": 0, "negative": 0}
            }
        
        # Count sentiment distribution
        labels = [s['label'] for s in sentiments]
        distribution = Counter(labels)
        
        # Calculate weighted sentiment score (-1 to 1)
        sentiment_scores = []
        for s in sentiments:
            if s['label'] == 'positive':
                sentiment_scores.append(s['score'])
            elif s['label'] == 'negative':
                sentiment_scores.append(-s['score'])
            else:
                sentiment_scores.append(0)
        
        avg_score = np.mean(sentiment_scores)
        
        # Determine overall sentiment
        if avg_score > 0.15:
            overall = "positive"
        elif avg_score < -0.15:
            overall = "negative"
        else:
            overall = "neutral"
        
        # Calculate confidence
        scores = [s['score'] for s in sentiments]
        avg_confidence = np.mean(scores)
        
        if avg_confidence >= 0.8:
            confidence = "high"
        elif avg_confidence >= 0.65:
            confidence = "medium"
        else:
            confidence = "low"
        
        return {
            "overall_sentiment": overall,
            "sentiment_score": float(avg_score),
            "confidence": confidence,
            "distribution": {
                "positive": distribution.get('positive', 0),
                "neutral": distribution.get('neutral', 0),
                "negative": distribution.get('negative', 0)
            },
            "total_articles": len(sentiments)
        }


class NewsService:
    """Service for fetching and analyzing stock news"""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove HTML tags
        text = BeautifulSoup(text, 'html.parser').get_text()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def fetch_news_yfinance(self, symbol: str, limit: int = 10) -> List[Dict]:
        """Fetch news using yfinance"""
        try:
            ticker = yf.Ticker(f"{symbol}.NS")  # NSE stocks
            news = ticker.news
            
            if not news:
                # Try without .NS suffix for some stocks
                ticker = yf.Ticker(symbol)
                news = ticker.news
            
            articles = []
            for item in news[:limit]:
                article = {
                    "title": item.get('title', ''),
                    "description": self._clean_text(item.get('summary', '')),
                    "url": item.get('link', ''),
                    "publisher": item.get('publisher', 'Unknown'),
                    "published_at": datetime.fromtimestamp(item.get('providerPublishTime', 0)),
                    "thumbnail": item.get('thumbnail', {}).get('resolutions', [{}])[0].get('url', '') if item.get('thumbnail') else ''
                }
                articles.append(article)
            
            return articles
        except Exception as e:
            print(f"Error fetching yfinance news: {e}")
            return []
    
    def fetch_news_google(self, symbol: str, company_name: str, limit: int = 10) -> List[Dict]:
        """Fetch news using Google News RSS"""
        try:
            # Create search query
            query = f"{company_name} OR {symbol} stock market"
            query = query.replace(' ', '+')
            
            # Google News RSS feed
            url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
            
            feed = feedparser.parse(url)
            
            articles = []
            for entry in feed.entries[:limit]:
                # Parse published date
                try:
                    published = datetime(*entry.published_parsed[:6])
                except:
                    published = datetime.now()
                
                article = {
                    "title": entry.title,
                    "description": self._clean_text(entry.get('summary', '')),
                    "url": entry.link,
                    "publisher": entry.get('source', {}).get('title', 'Google News'),
                    "published_at": published,
                    "thumbnail": ""
                }
                articles.append(article)
            
            return articles
        except Exception as e:
            print(f"Error fetching Google news: {e}")
            return []
    
    def get_news_with_sentiment(self, symbol: str, company_name: str = None, limit: int = 15) -> Dict:
        """Fetch news and perform sentiment analysis"""
        
        # Try yfinance first
        articles = self.fetch_news_yfinance(symbol, limit)
        
        # If yfinance fails or returns too few, try Google News
        if len(articles) < 5 and company_name:
            google_articles = self.fetch_news_google(symbol, company_name, limit)
            articles.extend(google_articles)
        
        # Remove duplicates based on title
        seen_titles = set()
        unique_articles = []
        for article in articles:
            title_normalized = article['title'].lower().strip()
            if title_normalized not in seen_titles and len(title_normalized) > 10:
                seen_titles.add(title_normalized)
                unique_articles.append(article)
        
        articles = unique_articles[:limit]
        
        if not articles:
            return {
                "symbol": symbol,
                "articles": [],
                "sentiment_analysis": {
                    "overall_sentiment": "neutral",
                    "sentiment_score": 0.0,
                    "confidence": "low",
                    "distribution": {"positive": 0, "neutral": 0, "negative": 0},
                    "total_articles": 0
                },
                "ai_insights": {
                    "summary": "No recent news articles found for this symbol.",
                    "recommendation": "neutral",
                    "key_themes": [],
                    "risk_level": "unknown"
                }
            }
        
        # Perform sentiment analysis on each article
        for article in articles:
            text_to_analyze = f"{article['title']}. {article['description']}"
            sentiment = self.sentiment_analyzer.analyze_text(text_to_analyze)
            article['sentiment'] = sentiment
        
        # Aggregate sentiments
        sentiments = [a['sentiment'] for a in articles]
        aggregated_sentiment = self.sentiment_analyzer.aggregate_sentiment(sentiments)
        
        # Generate AI insights
        ai_insights = self._generate_ai_insights(articles, aggregated_sentiment)
        
        return {
            "symbol": symbol,
            "articles": articles,
            "sentiment_analysis": aggregated_sentiment,
            "ai_insights": ai_insights,
            "fetched_at": datetime.now(),
            "model_used": self.sentiment_analyzer.model_name
        }
    
    def _generate_ai_insights(self, articles: List[Dict], sentiment: Dict) -> Dict:
        """Generate AI-powered insights from news and sentiment"""
        
        # Extract key themes from titles
        all_words = []
        for article in articles:
            words = re.findall(r'\b[A-Z][a-z]+\b', article['title'])
            all_words.extend(words)
        
        # Get most common themes
        word_freq = Counter(all_words)
        key_themes = [word for word, count in word_freq.most_common(5) if count > 1]
        
        # Generate summary
        overall = sentiment['overall_sentiment']
        score = sentiment['sentiment_score']
        confidence = sentiment['confidence']
        total = sentiment['total_articles']
        
        if overall == 'positive':
            summary = f"Analysis of {total} recent articles shows POSITIVE market sentiment (score: {score:.2f}). "
            summary += "News coverage suggests favorable market conditions and investor optimism."
            recommendation = "bullish"
            risk_level = "low_to_medium"
        elif overall == 'negative':
            summary = f"Analysis of {total} recent articles shows NEGATIVE market sentiment (score: {score:.2f}). "
            summary += "News coverage indicates concerns and potential headwinds."
            recommendation = "bearish"
            risk_level = "medium_to_high"
        else:
            summary = f"Analysis of {total} recent articles shows NEUTRAL market sentiment (score: {score:.2f}). "
            summary += "Mixed signals from news coverage suggest a wait-and-see approach."
            recommendation = "neutral"
            risk_level = "medium"
        
        # Add confidence context
        if confidence == "high":
            summary += f" High confidence in sentiment assessment ({confidence})."
        elif confidence == "low":
            summary += f" Low confidence suggests mixed or unclear signals ({confidence})."
        
        # Recent news urgency
        recent_count = sum(1 for a in articles if (datetime.now() - a['published_at']).days < 1)
        if recent_count >= 3:
            summary += f" {recent_count} articles published in the last 24 hours indicate high market activity."
        
        return {
            "summary": summary,
            "recommendation": recommendation,
            "key_themes": key_themes,
            "risk_level": risk_level,
            "confidence": confidence,
            "recent_news_count": recent_count if 'recent_count' in locals() else 0
        }
    
    def get_sentiment_features(self, symbol: str, company_name: str = None) -> Dict:
        """Get sentiment features for ML model integration"""
        
        news_data = self.get_news_with_sentiment(symbol, company_name, limit=20)
        sentiment = news_data['sentiment_analysis']
        insights = news_data['ai_insights']
        
        # Create numerical features for ML models
        features = {
            # Sentiment scores
            'sentiment_score': sentiment['sentiment_score'],
            'sentiment_positive_ratio': sentiment['distribution']['positive'] / max(sentiment['total_articles'], 1),
            'sentiment_negative_ratio': sentiment['distribution']['negative'] / max(sentiment['total_articles'], 1),
            'sentiment_neutral_ratio': sentiment['distribution']['neutral'] / max(sentiment['total_articles'], 1),
            
            # Confidence and volume
            'sentiment_confidence': self._confidence_to_numeric(sentiment['confidence']),
            'news_volume': sentiment['total_articles'],
            'recent_news_activity': insights['recent_news_count'],
            
            # Risk and recommendation
            'news_risk_score': self._risk_to_numeric(insights['risk_level']),
            'news_recommendation_score': self._recommendation_to_numeric(insights['recommendation']),
            
            # Recency weight (how recent is the news)
            'news_recency_score': min(insights['recent_news_count'] / 5.0, 1.0)
        }
        
        return features
    
    def _confidence_to_numeric(self, confidence: str) -> float:
        """Convert confidence level to numeric score"""
        mapping = {
            'very_high': 1.0,
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4
        }
        return mapping.get(confidence, 0.5)
    
    def _risk_to_numeric(self, risk_level: str) -> float:
        """Convert risk level to numeric score"""
        mapping = {
            'low': 0.2,
            'low_to_medium': 0.4,
            'medium': 0.6,
            'medium_to_high': 0.8,
            'high': 1.0,
            'unknown': 0.5
        }
        return mapping.get(risk_level, 0.5)
    
    def _recommendation_to_numeric(self, recommendation: str) -> float:
        """Convert recommendation to numeric score (-1 to 1)"""
        mapping = {
            'bullish': 1.0,
            'neutral': 0.0,
            'bearish': -1.0
        }
        return mapping.get(recommendation, 0.0)


# Singleton instance
news_service = NewsService()
