"""
YFinance Service - Fetch real stock data using yfinance
"""
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.services.nse_service import NSEService

class YFinanceService(NSEService):
    """
    Service for fetching real Indian stock data using yfinance.
    Extends NSEService to maintain compatibility.
    """
    
    def __init__(self):
        super().__init__()
        print("YFinanceService initialized - using real market data")
    
    def _get_yf_symbol(self, symbol: str) -> str:
        """Convert NSE symbol to Yahoo Finance format"""
        # Yahoo Finance uses .NS suffix for NSE stocks
        return f"{symbol}.NS"
    
    def get_quote(self, symbol: str) -> Optional[Dict]:
        """Get latest quote for a symbol using yfinance"""
        try:
            yf_symbol = self._get_yf_symbol(symbol)
            ticker = yf.Ticker(yf_symbol)
            
            # Get current data
            info = ticker.info
            
            if not info or 'regularMarketPrice' not in info:
                print(f"No data from yfinance for {symbol}, trying fast_info")
                # Try fast_info as fallback
                fast_info = ticker.fast_info
                return {
                    'symbol': symbol,
                    'lastPrice': fast_info.get('last_price'),
                    'change': 0,
                    'pChange': 0,
                    'open': fast_info.get('open'),
                    'high': fast_info.get('day_high'),
                    'low': fast_info.get('day_low'),
                    'previousClose': fast_info.get('previous_close'),
                    'volume': fast_info.get('last_volume', 0)
                }
            
            current_price = info.get('regularMarketPrice') or info.get('currentPrice')
            prev_close = info.get('regularMarketPreviousClose') or info.get('previousClose')
            
            if current_price and prev_close:
                change = current_price - prev_close
                pchange = (change / prev_close) * 100
            else:
                change = 0
                pchange = 0
            
            return {
                'symbol': symbol,
                'lastPrice': current_price,
                'change': change,
                'pChange': pchange,
                'open': info.get('regularMarketOpen') or info.get('open'),
                'high': info.get('regularMarketDayHigh') or info.get('dayHigh'),
                'low': info.get('regularMarketDayLow') or info.get('dayLow'),
                'previousClose': prev_close,
                'volume': info.get('regularMarketVolume') or info.get('volume', 0)
            }
        except Exception as e:
            print(f"Error fetching yfinance quote for {symbol}: {e}")
            return None
    
    def get_historical_data(self, symbol: str, from_date: datetime, to_date: datetime) -> pd.DataFrame:
        """
        Get historical OHLCV data for a symbol using yfinance.
        Returns real market data - no synthetic fallback.
        """
        try:
            yf_symbol = self._get_yf_symbol(symbol)
            
            # Add one day buffer to ensure we get data up to to_date
            end_date = to_date + timedelta(days=1)
            
            # Fetch data from yfinance
            ticker = yf.Ticker(yf_symbol)
            df = ticker.history(start=from_date, end=end_date)
            
            if df.empty:
                print(f"No historical data from yfinance for {symbol}")
                # Fall back to synthetic data only if no data available
                return super()._generate_synthetic_data(symbol, from_date, to_date)
            
            # Reset index to get date as column
            df = df.reset_index()
            
            # Rename columns to match expected format
            df = df.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            
            # Select only required columns
            df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
            
            # Convert date to datetime if it's not already
            df['date'] = pd.to_datetime(df['date'])
            
            # Filter to exact date range
            df = df[(df['date'] >= from_date) & (df['date'] <= to_date)]
            
            # Round prices to 2 decimal places
            for col in ['open', 'high', 'low', 'close']:
                df[col] = df[col].round(2)
            
            print(f"Fetched {len(df)} days of real data for {symbol} from yfinance")
            return df
            
        except Exception as e:
            print(f"Error fetching yfinance historical data for {symbol}: {e}")
            # Fall back to synthetic data
            return super()._generate_synthetic_data(symbol, from_date, to_date)
    
    def get_company_info(self, symbol: str) -> Optional[Dict]:
        """Get company information using yfinance"""
        try:
            yf_symbol = self._get_yf_symbol(symbol)
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info
            
            if not info:
                # Fallback to parent class method
                return super().get_company_info(symbol)
            
            return {
                "symbol": symbol,
                "company_name": info.get('longName') or info.get('shortName', symbol),
                "sector": info.get('sector', 'Unknown'),
                "industry": info.get('industry', 'Unknown'),
            }
        except Exception as e:
            print(f"Error fetching company info from yfinance: {e}")
            # Fallback to parent class method
            return super().get_company_info(symbol)

# Singleton instance
yfinance_service = YFinanceService()
