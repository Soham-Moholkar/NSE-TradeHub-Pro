"""
Create comprehensive demo data for the trading platform
Including users, portfolios, transactions, and community posts
"""
import sys
from datetime import datetime, timedelta
from app.db import SessionLocal
from app.models.community import User, Post, Comment
from app.models.trading import Portfolio, Transaction, Position
from app.services.auth_service import get_password_hash
import random

def create_demo_data():
    db = SessionLocal()
    
    # Import transaction type enum
    from app.models.trading import TransactionType
    
    try:
        print("Creating demo users with portfolios and posts...\n")
        
        # Demo User 1: Successful Trader
        user1 = db.query(User).filter(User.username == "bull_trader").first()
        if not user1:
            user1 = User(
                username="bull_trader",
                email="bull@example.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Rajesh Kumar",
                reputation=150,
                is_active=True,
                is_verified=True
            )
            db.add(user1)
            db.commit()
            db.refresh(user1)
            print(f"✓ Created user: {user1.username} (ID: {user1.id})")
            
            # Portfolio for user1
            portfolio1 = Portfolio(
                user_id=user1.id,
                cash_balance=50000.0,
                total_value=250000.0
            )
            db.add(portfolio1)
            db.commit()
            db.refresh(portfolio1)
            
            # Successful transactions
            transactions1 = [
                ("RELIANCE.NS", "BUY", 20, 2300.00, datetime.now() - timedelta(days=30)),
                ("RELIANCE.NS", "SELL", 20, 2600.00, datetime.now() - timedelta(days=10)),
                ("TCS.NS", "BUY", 10, 3200.00, datetime.now() - timedelta(days=25)),
                ("HDFCBANK.NS", "BUY", 15, 1500.00, datetime.now() - timedelta(days=20)),
                ("INFY.NS", "BUY", 25, 1400.00, datetime.now() - timedelta(days=15)),
                ("INFY.NS", "SELL", 10, 1550.00, datetime.now() - timedelta(days=5)),
            ]
            
            for symbol, type_, quantity, price, date in transactions1:
                transaction = Transaction(
                    portfolio_id=portfolio1.id,
                    symbol=symbol,
                    transaction_type=TransactionType[type_],
                    quantity=quantity,
                    price=price,
                    total_amount=quantity * price,
                    created_at=date
                )
                db.add(transaction)
            
            # Current positions
            positions1 = [
                ("TCS.NS", 10, 3200.00),
                ("HDFCBANK.NS", 15, 1500.00),
                ("INFY.NS", 15, 1400.00),
            ]
            
            for symbol, quantity, avg_price in positions1:
                position = Position(
                    portfolio_id=portfolio1.id,
                    symbol=symbol,
                    quantity=quantity,
                    avg_buy_price=avg_price, invested_amount=(quantity * avg_price)
                )
                db.add(position)
            
            db.commit()
            print(f"  Added portfolio and {len(transactions1)} transactions for {user1.username}")
        
        # Demo User 2: Conservative Investor
        user2 = db.query(User).filter(User.username == "safe_investor").first()
        if not user2:
            user2 = User(
                username="safe_investor",
                email="safe@example.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Priya Sharma",
                reputation=85,
                is_active=True,
                is_verified=True
            )
            db.add(user2)
            db.commit()
            db.refresh(user2)
            print(f"✓ Created user: {user2.username} (ID: {user2.id})")
            
            # Portfolio for user2
            portfolio2 = Portfolio(
                user_id=user2.id,
                cash_balance=120000.0,
                total_value=180000.0
            )
            db.add(portfolio2)
            db.commit()
            db.refresh(portfolio2)
            
            # Conservative transactions
            transactions2 = [
                ("HDFCBANK.NS", "BUY", 30, 1480.00, datetime.now() - timedelta(days=45)),
                ("ICICIBANK.NS", "BUY", 25, 920.00, datetime.now() - timedelta(days=40)),
                ("SBIN.NS", "BUY", 50, 540.00, datetime.now() - timedelta(days=35)),
            ]
            
            for symbol, type_, quantity, price, date in transactions2:
                transaction = Transaction(
                    portfolio_id=portfolio2.id,
                    symbol=symbol,
                    transaction_type=TransactionType[type_],
                    quantity=quantity,
                    price=price,
                    total_amount=quantity * price,
                    created_at=date
                )
                db.add(transaction)
            
            # Current positions
            positions2 = [
                ("HDFCBANK.NS", 30, 1480.00),
                ("ICICIBANK.NS", 25, 920.00),
                ("SBIN.NS", 50, 540.00),
            ]
            
            for symbol, quantity, avg_price in positions2:
                position = Position(
                    portfolio_id=portfolio2.id,
                    symbol=symbol,
                    quantity=quantity,
                    avg_buy_price=avg_price, invested_amount=(quantity * avg_price)
                )
                db.add(position)
            
            db.commit()
            print(f"  Added portfolio and {len(transactions2)} transactions for {user2.username}")
        
        # Demo User 3: Active Day Trader
        user3 = db.query(User).filter(User.username == "day_trader_pro").first()
        if not user3:
            user3 = User(
                username="day_trader_pro",
                email="daytrader@example.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Amit Patel",
                reputation=120,
                is_active=True,
                is_verified=True
            )
            db.add(user3)
            db.commit()
            db.refresh(user3)
            print(f"✓ Created user: {user3.username} (ID: {user3.id})")
            
            # Portfolio for user3
            portfolio3 = Portfolio(
                user_id=user3.id,
                cash_balance=80000.0,
                total_value=220000.0
            )
            db.add(portfolio3)
            db.commit()
            db.refresh(portfolio3)
            
            # Active trading transactions
            transactions3 = [
                ("WIPRO.NS", "BUY", 40, 440.00, datetime.now() - timedelta(days=20)),
                ("WIPRO.NS", "SELL", 40, 465.00, datetime.now() - timedelta(days=18)),
                ("BAJFINANCE.NS", "BUY", 5, 6400.00, datetime.now() - timedelta(days=15)),
                ("ITC.NS", "BUY", 100, 415.00, datetime.now() - timedelta(days=12)),
                ("ITC.NS", "SELL", 50, 428.00, datetime.now() - timedelta(days=8)),
                ("TATAMOTORS.NS", "BUY", 30, 760.00, datetime.now() - timedelta(days=10)),
                ("MARUTI.NS", "BUY", 8, 10200.00, datetime.now() - timedelta(days=7)),
            ]
            
            for symbol, type_, quantity, price, date in transactions3:
                transaction = Transaction(
                    portfolio_id=portfolio3.id,
                    symbol=symbol,
                    transaction_type=TransactionType[type_],
                    quantity=quantity,
                    price=price,
                    total_amount=quantity * price,
                    created_at=date
                )
                db.add(transaction)
            
            # Current positions
            positions3 = [
                ("BAJFINANCE.NS", 5, 6400.00),
                ("ITC.NS", 50, 415.00),
                ("TATAMOTORS.NS", 30, 760.00),
                ("MARUTI.NS", 8, 10200.00),
            ]
            
            for symbol, quantity, avg_price in positions3:
                position = Position(
                    portfolio_id=portfolio3.id,
                    symbol=symbol,
                    quantity=quantity,
                    avg_buy_price=avg_price, invested_amount=(quantity * avg_price)
                )
                db.add(position)
            
            db.commit()
            print(f"  Added portfolio and {len(transactions3)} transactions for {user3.username}")
        
        # Demo User 4: Tech Stock Enthusiast
        user4 = db.query(User).filter(User.username == "tech_bull").first()
        if not user4:
            user4 = User(
                username="tech_bull",
                email="techbull@example.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Vikram Singh",
                reputation=95,
                is_active=True,
                is_verified=True
            )
            db.add(user4)
            db.commit()
            db.refresh(user4)
            print(f"✓ Created user: {user4.username} (ID: {user4.id})")
            
            # Portfolio for user4
            portfolio4 = Portfolio(
                user_id=user4.id,
                cash_balance=60000.0,
                total_value=190000.0
            )
            db.add(portfolio4)
            db.commit()
            db.refresh(portfolio4)
            
            # Tech-focused transactions
            transactions4 = [
                ("TCS.NS", "BUY", 12, 3150.00, datetime.now() - timedelta(days=50)),
                ("INFY.NS", "BUY", 30, 1380.00, datetime.now() - timedelta(days=45)),
                ("WIPRO.NS", "BUY", 35, 435.00, datetime.now() - timedelta(days=40)),
                ("TECHM.NS", "BUY", 20, 1250.00, datetime.now() - timedelta(days=35)),
            ]
            
            for symbol, type_, quantity, price, date in transactions4:
                transaction = Transaction(
                    portfolio_id=portfolio4.id,
                    symbol=symbol,
                    transaction_type=TransactionType[type_],
                    quantity=quantity,
                    price=price,
                    total_amount=quantity * price,
                    created_at=date
                )
                db.add(transaction)
            
            # Current positions
            positions4 = [
                ("TCS.NS", 12, 3150.00),
                ("INFY.NS", 30, 1380.00),
                ("WIPRO.NS", 35, 435.00),
                ("TECHM.NS", 20, 1250.00),
            ]
            
            for symbol, quantity, avg_price in positions4:
                position = Position(
                    portfolio_id=portfolio4.id,
                    symbol=symbol,
                    quantity=quantity,
                    avg_buy_price=avg_price, invested_amount=(quantity * avg_price)
                )
                db.add(position)
            
            db.commit()
            print(f"  Added portfolio and {len(transactions4)} transactions for {user4.username}")
        
        # Create Community Posts
        print("\nCreating community posts...")
        
        posts_data = [
            {
                "author_id": user1.id,
                "username": user1.username,
                "title": "RELIANCE showing strong bullish momentum! 🚀",
                "content": "Just closed my position in RELIANCE with 13% profit in 20 days! The stock is showing strong support at ₹2500 and RSI indicates room for further upside. Chart patterns suggest potential target of ₹2800. What's your take?",
                "symbol": "RELIANCE",
                "sentiment": "bullish",
                "days_ago": 10
            },
            {
                "author_id": user2.id,
                "username": user2.username,
                "title": "Banking Sector Analysis - Long term perspective",
                "content": "With the recent RBI policy changes, banking stocks like HDFCBANK and ICICIBANK are looking attractive for long-term investors. Fundamentals are strong and valuations are reasonable. I'm holding these for the next 2-3 years.",
                "symbol": "HDFCBANK",
                "sentiment": "bullish",
                "days_ago": 15
            },
            {
                "author_id": user3.id,
                "username": user3.username,
                "title": "Day Trading Strategy for IT Stocks",
                "content": "Been actively trading WIPRO and ITC this month. Key levels to watch: WIPRO support at ₹440, resistance at ₹470. Using 15-min charts with MACD and Volume indicators. Anyone else day trading these?",
                "symbol": "WIPRO",
                "sentiment": "neutral",
                "days_ago": 8
            },
            {
                "author_id": user4.id,
                "username": user4.username,
                "title": "TCS Q3 Results Preview - Bullish Outlook",
                "content": "TCS earnings coming up next week. Expecting strong numbers from the IT sector. Order book looks healthy and deal wins have been impressive. Currently holding 12 shares at ₹3150. Thoughts on target price?",
                "symbol": "TCS",
                "sentiment": "bullish",
                "days_ago": 5
            },
            {
                "author_id": user1.id,
                "username": user1.username,
                "title": "Market Correction Coming? Time to book profits?",
                "content": "Nifty at all-time highs and some indicators showing overbought conditions. Should we start booking partial profits? Or is this just the beginning of a bigger rally? What's your strategy?",
                "symbol": None,
                "sentiment": "neutral",
                "days_ago": 3
            },
            {
                "author_id": user3.id,
                "username": user3.username,
                "title": "BAJFINANCE - Breakout Alert! 📈",
                "content": "BAJFINANCE just broke through the ₹6500 resistance with good volume. This could be the start of a new uptrend. Stop loss at ₹6300. Target ₹7000 in short term. Risk-reward looks favorable!",
                "symbol": "BAJFINANCE",
                "sentiment": "bullish",
                "days_ago": 7
            },
            {
                "author_id": user2.id,
                "username": user2.username,
                "title": "Risk Management Tips for New Traders",
                "content": "After 3 years of trading, here's my advice: 1) Never invest more than 5% in a single stock, 2) Always use stop losses, 3) Don't chase the market, 4) Patience is key. What rules do you follow?",
                "symbol": None,
                "sentiment": "neutral",
                "days_ago": 12
            },
            {
                "author_id": user4.id,
                "username": user4.username,
                "title": "INFY vs TCS - Which is better for long term?",
                "content": "Both are IT giants but have different strengths. TCS has better margins, INFY has stronger digital growth. Currently holding both. What's your pick and why?",
                "symbol": "INFY",
                "sentiment": "neutral",
                "days_ago": 18
            }
        ]
        
        created_posts = []
        for post_data in posts_data:
            # Check if post already exists
            existing_post = db.query(Post).filter(
                Post.author_id == post_data["author_id"],
                Post.title == post_data["title"]
            ).first()
            
            if not existing_post:
                post = Post(
                    author_id=post_data["author_id"],
                    title=post_data["title"],
                    content=post_data["content"],
                    symbol=post_data["symbol"],
                    community="general",  # Set a community category
                    upvotes=random.randint(5, 50),
                    downvotes=random.randint(0, 10),
                    views=random.randint(50, 500),
                    created_at=datetime.now() - timedelta(days=post_data["days_ago"])
                )
                db.add(post)
                db.commit()
                db.refresh(post)
                created_posts.append(post)
                print(f"  ✓ Created post by {post_data['username']}: {post_data['title'][:50]}...")
        
        # Create Comments on Posts
        print("\nCreating comments...")
        
        comments_data = [
            {
                "post_idx": 0,
                "author_id": user2.id,
                "username": user2.username,
                "content": "Great trade! I'm also watching RELIANCE closely. Do you think it can sustain above ₹2600?",
                "days_ago": 9
            },
            {
                "post_idx": 0,
                "author_id": user3.id,
                "username": user3.username,
                "content": "Nice profit! What was your entry strategy? Breakout or pullback?",
                "days_ago": 9
            },
            {
                "post_idx": 1,
                "author_id": user1.id,
                "username": user1.username,
                "content": "Agree with the banking sector outlook. ICICI looks particularly attractive at current levels.",
                "days_ago": 14
            },
            {
                "post_idx": 3,
                "author_id": user2.id,
                "username": user2.username,
                "content": "TCS results should be strong. Holding my position too. Target ₹3500+",
                "days_ago": 4
            },
            {
                "post_idx": 4,
                "author_id": user4.id,
                "username": user4.username,
                "content": "I think we might see some consolidation but no major correction. Market fundamentals are still strong.",
                "days_ago": 2
            },
            {
                "post_idx": 6,
                "author_id": user3.id,
                "username": user3.username,
                "content": "Solid advice! I'd add: Always have an exit strategy before entering a trade.",
                "days_ago": 11
            }
        ]
        
        for comment_data in comments_data:
            if comment_data["post_idx"] < len(created_posts):
                post = created_posts[comment_data["post_idx"]]
                comment = Comment(
                    post_id=post.id,
                    author_id=comment_data["author_id"],
                    content=comment_data["content"],
                    upvotes=random.randint(2, 20),
                    downvotes=random.randint(0, 5),
                    created_at=datetime.now() - timedelta(days=comment_data["days_ago"])
                )
                db.add(comment)
                print(f"  ✓ {comment_data['username']} commented on post")
        
        db.commit()
        
        print("\n" + "="*60)
        print("✅ Demo data created successfully!")
        print("="*60)
        print("\nDemo Accounts:")
        print(f"1. Username: bull_trader      Password: demo123 (Successful Trader)")
        print(f"2. Username: safe_investor    Password: demo123 (Conservative Investor)")
        print(f"3. Username: day_trader_pro   Password: demo123 (Active Day Trader)")
        print(f"4. Username: tech_bull        Password: demo123 (Tech Stock Enthusiast)")
        print("\nAll accounts have:")
        print("- Portfolio with positions and cash balance")
        print("- Transaction history")
        print("- Community posts and comments")
        print("- Different reputation scores for leaderboard")
        print("\nCheck the leaderboard and community features!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()
