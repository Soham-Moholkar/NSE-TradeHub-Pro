"""
Test script to verify yfinance data is working
"""
from datetime import datetime, timedelta
from app.services.yfinance_service import yfinance_service

# Test 1: Get quote for RELIANCE
print("=" * 60)
print("TEST 1: Getting current quote for RELIANCE")
print("=" * 60)
quote = yfinance_service.get_quote("RELIANCE")
if quote:
    print(f"Symbol: {quote['symbol']}")
    print(f"Last Price: ₹{quote['lastPrice']}")
    print(f"Change: ₹{quote['change']} ({quote['pChange']:.2f}%)")
    print(f"Open: ₹{quote['open']}")
    print(f"High: ₹{quote['high']}")
    print(f"Low: ₹{quote['low']}")
    print(f"Previous Close: ₹{quote['previousClose']}")
    print(f"Volume: {quote['volume']:,}")
else:
    print("Failed to fetch quote")

# Test 2: Get historical data
print("\n" + "=" * 60)
print("TEST 2: Getting historical data for TCS (last 5 days)")
print("=" * 60)
end_date = datetime.now()
start_date = end_date - timedelta(days=5)
hist_data = yfinance_service.get_historical_data("TCS", start_date, end_date)

if not hist_data.empty:
    print(f"Fetched {len(hist_data)} days of data:")
    print(hist_data.to_string())
else:
    print("No historical data available")

# Test 3: Get company info
print("\n" + "=" * 60)
print("TEST 3: Getting company info for INFY")
print("=" * 60)
info = yfinance_service.get_company_info("INFY")
if info:
    print(f"Symbol: {info['symbol']}")
    print(f"Company Name: {info['company_name']}")
    print(f"Sector: {info['sector']}")
    print(f"Industry: {info['industry']}")
else:
    print("Failed to fetch company info")

print("\n" + "=" * 60)
print("Tests completed!")
print("=" * 60)
