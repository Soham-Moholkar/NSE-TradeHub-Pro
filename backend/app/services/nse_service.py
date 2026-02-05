import httpx
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import time
from app.config import settings

class NSEService:
    """Service for fetching data from NSE India"""
    
    # Popular NSE stocks (seed data)
    POPULAR_STOCKS = [
        {"symbol": "RELIANCE", "name": "Reliance Industries Ltd.", "sector": "Energy"},
        {"symbol": "TCS", "name": "Tata Consultancy Services Ltd.", "sector": "IT"},
        {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd.", "sector": "Banking"},
        {"symbol": "INFY", "name": "Infosys Ltd.", "sector": "IT"},
        {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd.", "sector": "Banking"},
        {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "sector": "FMCG"},
        {"symbol": "ITC", "name": "ITC Ltd.", "sector": "FMCG"},
        {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking"},
        {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "sector": "Telecom"},
        {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd.", "sector": "Banking"},
        {"symbol": "LT", "name": "Larsen & Toubro Ltd.", "sector": "Engineering"},
        {"symbol": "AXISBANK", "name": "Axis Bank Ltd.", "sector": "Banking"},
        {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd.", "sector": "Financial Services"},
        {"symbol": "WIPRO", "name": "Wipro Ltd.", "sector": "IT"},
        {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd.", "sector": "Consumer Goods"},
        {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd.", "sector": "Automobile"},
        {"symbol": "HCLTECH", "name": "HCL Technologies Ltd.", "sector": "IT"},
        {"symbol": "TITAN", "name": "Titan Company Ltd.", "sector": "Consumer Goods"},
        {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd.", "sector": "Pharma"},
        {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd.", "sector": "Cement"},
        {"symbol": "NESTLEIND", "name": "Nestle India Ltd.", "sector": "FMCG"},
        {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd.", "sector": "Automobile"},
        {"symbol": "TECHM", "name": "Tech Mahindra Ltd.", "sector": "IT"},
        {"symbol": "POWERGRID", "name": "Power Grid Corporation of India Ltd.", "sector": "Power"},
        {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation Ltd.", "sector": "Energy"},
    ]
    
    def __init__(self):
        self.base_url = settings.NSE_BASE_URL
        self.api_url = settings.NSE_API_URL
        self.timeout = settings.REQUEST_TIMEOUT
        self.session = None
        self._init_session()
    
    def _init_session(self):
        """Initialize requests session with headers"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.nseindia.com/',
            'X-Requested-With': 'XMLHttpRequest'
        })
        
        # Get cookies by visiting homepage
        try:
            self.session.get(self.base_url, timeout=self.timeout)
        except Exception as e:
            print(f"Warning: Could not initialize NSE session: {e}")
    
    def get_popular_stocks(self) -> List[Dict]:
        """Get list of popular NSE stocks"""
        return self.POPULAR_STOCKS.copy()
    
    def search_symbols(self, query: str) -> List[Dict]:
        """Search for NSE symbols"""
        query = query.upper().strip()
        
        # Search in popular stocks first
        results = []
        for stock in self.POPULAR_STOCKS:
            if query in stock["symbol"] or query in stock["name"].upper():
                results.append({
                    "symbol": stock["symbol"],
                    "company_name": stock["name"],
                    "sector": stock["sector"]
                })
        
        return results[:20]  # Limit to 20 results
    
    def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get latest quote for a symbol"""
        try:
            url = f"{self.api_url}/quote-equity?symbol={symbol}"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                if 'priceInfo' in data:
                    price_info = data['priceInfo']
                    return {
                        'symbol': symbol,
                        'lastPrice': price_info.get('lastPrice'),
                        'change': price_info.get('change'),
                        'pChange': price_info.get('pChange'),
                        'open': price_info.get('open'),
                        'high': price_info.get('intraDayHighLow', {}).get('max'),
                        'low': price_info.get('intraDayHighLow', {}).get('min'),
                        'previousClose': price_info.get('previousClose'),
                        'volume': data.get('preOpenMarket', {}).get('totalTradedVolume', 0)
                    }
        except Exception as e:
            print(f"Error fetching quote for {symbol}: {e}")
        
        return None
    
    def get_historical_data(self, symbol: str, from_date: datetime, to_date: datetime) -> pd.DataFrame:
        """
        Get historical OHLCV data for a symbol.
        Falls back to generating synthetic data if NSE API is unavailable.
        """
        try:
            # Try to fetch from NSE API
            data = self._fetch_nse_historical(symbol, from_date, to_date)
            if data is not None and not data.empty:
                return data
        except Exception as e:
            print(f"NSE API error for {symbol}: {e}")
        
        # Fallback: Generate realistic synthetic data for testing
        print(f"Generating synthetic data for {symbol}")
        return self._generate_synthetic_data(symbol, from_date, to_date)
    
    def _fetch_nse_historical(self, symbol: str, from_date: datetime, to_date: datetime) -> Optional[pd.DataFrame]:
        """Fetch historical data from NSE (when available)"""
        try:
            # NSE historical data endpoint (may require additional authentication)
            from_str = from_date.strftime("%d-%m-%Y")
            to_str = to_date.strftime("%d-%m-%Y")
            
            url = f"{self.api_url}/historical/cm/equity?symbol={symbol}&from={from_str}&to={to_str}"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and data['data']:
                    df = pd.DataFrame(data['data'])
                    df['date'] = pd.to_datetime(df['CH_TIMESTAMP'])
                    df = df.rename(columns={
                        'CH_OPENING_PRICE': 'open',
                        'CH_TRADE_HIGH_PRICE': 'high',
                        'CH_TRADE_LOW_PRICE': 'low',
                        'CH_CLOSING_PRICE': 'close',
                        'CH_TOT_TRADED_QTY': 'volume'
                    })
                    return df[['date', 'open', 'high', 'low', 'close', 'volume']]
        except Exception as e:
            print(f"Error fetching NSE historical data: {e}")
        
        return None
    
    def _generate_synthetic_data(self, symbol: str, from_date: datetime, to_date: datetime) -> pd.DataFrame:
        """
        Generate realistic synthetic stock data for testing/demo purposes.
        Uses random walk with drift and realistic volume patterns.
        """
        import numpy as np
        
        # Determine base price based on symbol (for consistency)
        base_prices = {
            "RELIANCE": 2500, "TCS": 3500, "HDFCBANK": 1600, "INFY": 1500,
            "ICICIBANK": 1000, "HINDUNILVR": 2600, "ITC": 450, "SBIN": 600,
            "BHARTIARTL": 900, "KOTAKBANK": 1800, "LT": 3200, "AXISBANK": 1100,
            "BAJFINANCE": 7000, "WIPRO": 450, "ASIANPAINT": 3200, "MARUTI": 10000,
            "HCLTECH": 1400, "TITAN": 3200, "SUNPHARMA": 1100, "ULTRACEMCO": 8500
        }
        base_price = base_prices.get(symbol, 1000)
        
        # Generate date range
        dates = pd.date_range(start=from_date, end=to_date, freq='D')
        dates = dates[dates.weekday < 5]  # Remove weekends
        
        n_days = len(dates)
        
        # Random walk parameters
        np.random.seed(hash(symbol) % (2**32))  # Consistent seed per symbol
        daily_returns = np.random.normal(0.001, 0.02, n_days)  # Slight upward drift
        
        # Generate close prices
        close_prices = base_price * np.exp(np.cumsum(daily_returns))
        
        # Generate OHLC
        data = []
        for i, date in enumerate(dates):
            close = close_prices[i]
            daily_vol = abs(np.random.normal(0.015, 0.01))  # Daily volatility
            
            high = close * (1 + abs(np.random.uniform(0, daily_vol)))
            low = close * (1 - abs(np.random.uniform(0, daily_vol)))
            open_price = np.random.uniform(low, high)
            
            # Ensure OHLC consistency
            high = max(high, open_price, close)
            low = min(low, open_price, close)
            
            # Generate volume (higher on volatile days)
            base_volume = 1000000
            volume = int(base_volume * (1 + abs(daily_returns[i]) * 10) * np.random.uniform(0.5, 2))
            
            data.append({
                'date': date,
                'open': round(open_price, 2),
                'high': round(high, 2),
                'low': round(low, 2),
                'close': round(close, 2),
                'volume': volume
            })
        
        return pd.DataFrame(data)
    
    def get_company_info(self, symbol: str) -> Optional[Dict]:
        """Get company information"""
        # Search in popular stocks
        for stock in self.POPULAR_STOCKS:
            if stock["symbol"] == symbol:
                return {
                    "symbol": symbol,
                    "company_name": stock["name"],
                    "sector": stock["sector"],
                    "industry": stock["sector"]
                }
        
        # Try NSE API
        try:
            url = f"{self.api_url}/quote-equity?symbol={symbol}"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                info = data.get('info', {})
                return {
                    "symbol": symbol,
                    "company_name": info.get('companyName', symbol),
                    "sector": info.get('sector', 'Unknown'),
                    "industry": info.get('industry', 'Unknown'),
                    "isin": info.get('isin')
                }
        except Exception as e:
            print(f"Error fetching company info: {e}")
        
        return None

# Singleton instance
nse_service = NSEService()
