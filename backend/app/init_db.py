"""
Database initialization and seeding script
Run this to set up the database and populate with initial data
"""
from app.db import Base, engine, SessionLocal
from app.models import Symbol, Price
from app.models.community import User, Post, Comment, PostVote, CommentVote
from app.models.trading import Portfolio, Position, Transaction, Order, Achievement, PriceAlert, TradingSignal, LeaderboardEntry
from app.services.nse_service import nse_service
from app.services.data_service import data_service
from datetime import datetime, timedelta

def init_database():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")

def seed_popular_stocks():
    """Seed database with popular NSE stocks"""
    print("\nSeeding popular stocks...")
    db = SessionLocal()
    
    try:
        popular_stocks = nse_service.get_popular_stocks()
        
        for stock in popular_stocks[:10]:  # Seed first 10 stocks
            symbol_obj = data_service.get_or_create_symbol(db, stock["symbol"])
            print(f"✓ Added {stock['symbol']} - {stock['name']}")
        
        print(f"\n✓ Seeded {len(popular_stocks[:10])} popular stocks")
    finally:
        db.close()

def fetch_initial_data():
    """Fetch initial historical data for popular stocks"""
    print("\nFetching initial historical data (this may take a minute)...")
    db = SessionLocal()
    
    try:
        symbols_to_fetch = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"]
        to_date = datetime.now()
        from_date = to_date - timedelta(days=365)
        
        for symbol in symbols_to_fetch:
            print(f"Fetching data for {symbol}...")
            prices = data_service.fetch_and_store_prices(db, symbol, from_date, to_date)
            print(f"✓ Stored {len(prices)} days of data for {symbol}")
        
        print(f"\n✓ Initial data fetch complete")
    except Exception as e:
        print(f"Error fetching initial data: {e}")
        print("You can still use the app - data will be fetched on demand")
    finally:
        db.close()

def main():
    """Main initialization function"""
    print("=" * 60)
    print("NSE Stock Analysis - Database Initialization")
    print("=" * 60)
    
    init_database()
    seed_popular_stocks()
    fetch_initial_data()
    
    print("\n" + "=" * 60)
    print("✓ Initialization complete!")
    print("=" * 60)
    print("\nYou can now start the backend server:")
    print("  uvicorn app.main:app --reload --port 8000")

if __name__ == "__main__":
    main()
