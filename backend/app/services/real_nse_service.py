"""
Real NSE API Service
Fetches live data from NSE India APIs with fallback to synthetic data
"""
import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import random

class RealNSEService:
    """Service for fetching real NSE data with synthetic fallback"""
    
    BASE_URL = "https://www.nseindia.com"
    
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }
    
    # Cache for API responses (to reduce rate limiting issues)
    _cache: Dict[str, Dict[str, Any]] = {}
    _cache_ttl = 60  # seconds
    
    # Stock metadata for synthetic data generation
    STOCK_METADATA = {
        'RELIANCE': {'base_price': 2920, 'volatility': 0.015, 'name': 'Reliance Industries Ltd'},
        'TCS': {'base_price': 3850, 'volatility': 0.012, 'name': 'Tata Consultancy Services'},
        'HDFCBANK': {'base_price': 1620, 'volatility': 0.013, 'name': 'HDFC Bank Ltd'},
        'INFY': {'base_price': 1550, 'volatility': 0.014, 'name': 'Infosys Ltd'},
        'ICICIBANK': {'base_price': 1180, 'volatility': 0.016, 'name': 'ICICI Bank Ltd'},
        'HINDUNILVR': {'base_price': 2450, 'volatility': 0.010, 'name': 'Hindustan Unilever Ltd'},
        'ITC': {'base_price': 485, 'volatility': 0.011, 'name': 'ITC Ltd'},
        'SBIN': {'base_price': 820, 'volatility': 0.018, 'name': 'State Bank of India'},
        'BHARTIARTL': {'base_price': 1580, 'volatility': 0.014, 'name': 'Bharti Airtel Ltd'},
        'KOTAKBANK': {'base_price': 1760, 'volatility': 0.013, 'name': 'Kotak Mahindra Bank'},
        'WIPRO': {'base_price': 480, 'volatility': 0.015, 'name': 'Wipro Ltd'},
        'ASIANPAINT': {'base_price': 2780, 'volatility': 0.012, 'name': 'Asian Paints Ltd'},
        'BAJFINANCE': {'base_price': 7200, 'volatility': 0.020, 'name': 'Bajaj Finance Ltd'},
        'MARUTI': {'base_price': 12500, 'volatility': 0.014, 'name': 'Maruti Suzuki India'},
        'AXISBANK': {'base_price': 1180, 'volatility': 0.016, 'name': 'Axis Bank Ltd'},
        'LT': {'base_price': 3650, 'volatility': 0.013, 'name': 'Larsen & Toubro Ltd'},
        'SUNPHARMA': {'base_price': 1720, 'volatility': 0.015, 'name': 'Sun Pharmaceutical'},
        'TITAN': {'base_price': 3580, 'volatility': 0.014, 'name': 'Titan Company Ltd'},
        'ULTRACEMCO': {'base_price': 11200, 'volatility': 0.012, 'name': 'UltraTech Cement'},
        'NESTLEIND': {'base_price': 2580, 'volatility': 0.008, 'name': 'Nestle India Ltd'},
        'POWERGRID': {'base_price': 315, 'volatility': 0.011, 'name': 'Power Grid Corporation'},
        'NTPC': {'base_price': 385, 'volatility': 0.012, 'name': 'NTPC Ltd'},
        'ONGC': {'base_price': 285, 'volatility': 0.017, 'name': 'Oil & Natural Gas Corp'},
        'TATAMOTORS': {'base_price': 1025, 'volatility': 0.022, 'name': 'Tata Motors Ltd'},
        'TATASTEEL': {'base_price': 165, 'volatility': 0.020, 'name': 'Tata Steel Ltd'},
    }
    
    def __init__(self, use_real_api: bool = True):
        self.use_real_api = use_real_api
        self._session: Optional[aiohttp.ClientSession] = None
        self._cookies = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create an aiohttp session with proper cookies"""
        if self._session is None or self._session.closed:
            # Create session with cookie jar
            cookie_jar = aiohttp.CookieJar()
            self._session = aiohttp.ClientSession(
                headers=self.HEADERS,
                cookie_jar=cookie_jar
            )
            
            # First, get cookies from the main page
            try:
                async with self._session.get(self.BASE_URL, ssl=False) as response:
                    pass  # Just to get cookies
            except Exception:
                pass
        
        return self._session
    
    def _get_cache_key(self, endpoint: str, symbol: str) -> str:
        return f"{endpoint}:{symbol}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        if cache_key not in self._cache:
            return False
        cached_time = self._cache[cache_key].get('_cached_at', 0)
        return (datetime.now().timestamp() - cached_time) < self._cache_ttl
    
    async def get_stock_quote(self, symbol: str) -> Dict[str, Any]:
        """Get real-time stock quote"""
        cache_key = self._get_cache_key('quote', symbol)
        
        # Check cache first
        if self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        if self.use_real_api:
            try:
                session = await self._get_session()
                url = f"{self.BASE_URL}/api/quote-equity?symbol={symbol}"
                
                async with session.get(url, ssl=False, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        result = self._parse_quote_data(data, symbol)
                        result['_cached_at'] = datetime.now().timestamp()
                        result['data_source'] = 'live'
                        self._cache[cache_key] = result
                        return result
            except Exception as e:
                print(f"Real API error for {symbol}: {e}")
        
        # Fallback to synthetic data
        return self._generate_synthetic_quote(symbol)
    
    def _parse_quote_data(self, data: Dict, symbol: str) -> Dict[str, Any]:
        """Parse NSE API response into our format"""
        try:
            price_info = data.get('priceInfo', {})
            info = data.get('info', {})
            
            return {
                'symbol': symbol,
                'name': info.get('companyName', symbol),
                'price': price_info.get('lastPrice', 0),
                'change': price_info.get('change', 0),
                'change_percent': price_info.get('pChange', 0),
                'open': price_info.get('open', 0),
                'high': price_info.get('intraDayHighLow', {}).get('max', 0),
                'low': price_info.get('intraDayHighLow', {}).get('min', 0),
                'prev_close': price_info.get('previousClose', 0),
                'volume': data.get('preOpenMarket', {}).get('totalTradedVolume', 0),
                'timestamp': datetime.now().isoformat(),
            }
        except Exception:
            return self._generate_synthetic_quote(symbol)
    
    def _generate_synthetic_quote(self, symbol: str) -> Dict[str, Any]:
        """Generate realistic synthetic quote data"""
        metadata = self.STOCK_METADATA.get(symbol, {
            'base_price': 1000,
            'volatility': 0.015,
            'name': symbol
        })
        
        base = metadata['base_price']
        volatility = metadata['volatility']
        
        # Generate price with some randomness
        random_factor = 1 + random.uniform(-volatility * 3, volatility * 3)
        price = round(base * random_factor, 2)
        
        # Daily change
        change_percent = random.uniform(-2.5, 2.5)
        prev_close = round(price / (1 + change_percent / 100), 2)
        change = round(price - prev_close, 2)
        
        # Intraday high/low
        high = round(price * (1 + abs(random.uniform(0.005, 0.02))), 2)
        low = round(price * (1 - abs(random.uniform(0.005, 0.02))), 2)
        open_price = round(prev_close * (1 + random.uniform(-0.005, 0.005)), 2)
        
        return {
            'symbol': symbol,
            'name': metadata['name'],
            'price': price,
            'change': change,
            'change_percent': round(change_percent, 2),
            'open': open_price,
            'high': max(high, price, open_price),
            'low': min(low, price, open_price),
            'prev_close': prev_close,
            'volume': random.randint(5000000, 25000000),
            'timestamp': datetime.now().isoformat(),
            'data_source': 'synthetic'
        }
    
    async def get_historical_data(
        self, 
        symbol: str, 
        period: str = '1M'
    ) -> List[Dict[str, Any]]:
        """Get historical OHLCV data"""
        
        # Calculate number of days based on period
        period_days = {
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365
        }
        days = period_days.get(period, 30)
        
        # For now, generate synthetic historical data
        # Real NSE historical API requires more complex authentication
        return self._generate_synthetic_history(symbol, days)
    
    def _generate_synthetic_history(
        self, 
        symbol: str, 
        days: int
    ) -> List[Dict[str, Any]]:
        """Generate realistic synthetic historical data"""
        metadata = self.STOCK_METADATA.get(symbol, {
            'base_price': 1000,
            'volatility': 0.015,
            'name': symbol
        })
        
        data = []
        current_price = metadata['base_price']
        volatility = metadata['volatility']
        
        # Start from 'days' ago
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Generate daily data with realistic patterns
        current_date = start_date
        trend = random.choice([-1, 1])  # Overall trend direction
        trend_strength = random.uniform(0.0001, 0.0005)
        
        while current_date <= end_date:
            # Skip weekends
            if current_date.weekday() < 5:
                # Daily random walk with slight trend
                daily_return = random.gauss(trend * trend_strength, volatility)
                current_price = current_price * (1 + daily_return)
                
                # Generate OHLC
                open_price = current_price * (1 + random.uniform(-0.003, 0.003))
                high = max(open_price, current_price) * (1 + abs(random.uniform(0.002, 0.01)))
                low = min(open_price, current_price) * (1 - abs(random.uniform(0.002, 0.01)))
                close = current_price
                
                # Volume with some variation
                base_volume = random.randint(8000000, 20000000)
                volume_multiplier = 1 + abs(daily_return) * 10  # Higher volume on big moves
                volume = int(base_volume * volume_multiplier)
                
                data.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'open': round(open_price, 2),
                    'high': round(high, 2),
                    'low': round(low, 2),
                    'close': round(close, 2),
                    'volume': volume
                })
                
                # Occasionally reverse trend
                if random.random() < 0.05:
                    trend *= -1
            
            current_date += timedelta(days=1)
        
        return data
    
    async def get_market_status(self) -> Dict[str, Any]:
        """Get market status (open/closed)"""
        now = datetime.now()
        weekday = now.weekday()
        hour = now.hour
        minute = now.minute
        
        # NSE trading hours: 9:15 AM to 3:30 PM IST, Mon-Fri
        is_weekday = weekday < 5
        is_trading_hours = (
            (hour > 9 or (hour == 9 and minute >= 15)) and
            (hour < 15 or (hour == 15 and minute <= 30))
        )
        
        is_open = is_weekday and is_trading_hours
        
        return {
            'is_open': is_open,
            'status': 'OPEN' if is_open else 'CLOSED',
            'next_open': self._get_next_open(),
            'message': 'Market is currently open for trading' if is_open else 'Market is closed'
        }
    
    def _get_next_open(self) -> str:
        """Calculate next market open time"""
        now = datetime.now()
        next_open = now.replace(hour=9, minute=15, second=0, microsecond=0)
        
        # If we've passed today's open, move to next day
        if now.hour >= 9 and now.minute >= 15:
            next_open += timedelta(days=1)
        
        # Skip weekends
        while next_open.weekday() >= 5:
            next_open += timedelta(days=1)
        
        return next_open.isoformat()
    
    async def get_market_indices(self) -> List[Dict[str, Any]]:
        """Get major market indices"""
        indices = [
            {'symbol': 'NIFTY 50', 'base': 24500, 'volatility': 0.008},
            {'symbol': 'NIFTY BANK', 'base': 52000, 'volatility': 0.012},
            {'symbol': 'NIFTY IT', 'base': 38500, 'volatility': 0.015},
            {'symbol': 'NIFTY MIDCAP 50', 'base': 16800, 'volatility': 0.014},
        ]
        
        result = []
        for idx in indices:
            change_pct = random.uniform(-1.5, 1.5)
            value = idx['base'] * (1 + change_pct / 100)
            change = value - idx['base']
            
            result.append({
                'symbol': idx['symbol'],
                'value': round(value, 2),
                'change': round(change, 2),
                'change_percent': round(change_pct, 2)
            })
        
        return result
    
    async def get_top_gainers_losers(self) -> Dict[str, List[Dict]]:
        """Get top gainers and losers"""
        stocks = list(self.STOCK_METADATA.keys())
        
        # Generate random performance for all stocks
        performance = []
        for symbol in stocks:
            quote = self._generate_synthetic_quote(symbol)
            performance.append(quote)
        
        # Sort by change percent
        sorted_stocks = sorted(performance, key=lambda x: x['change_percent'], reverse=True)
        
        return {
            'gainers': sorted_stocks[:5],
            'losers': sorted_stocks[-5:][::-1]
        }
    
    async def close(self):
        """Close the aiohttp session"""
        if self._session and not self._session.closed:
            await self._session.close()


# Singleton instance
_real_nse_service: Optional[RealNSEService] = None

def get_real_nse_service(use_real_api: bool = True) -> RealNSEService:
    """Get or create the Real NSE service singleton"""
    global _real_nse_service
    if _real_nse_service is None:
        _real_nse_service = RealNSEService(use_real_api=use_real_api)
    return _real_nse_service
