from app.db import SessionLocal
from app.models.community import User, Post, Comment, PostVote, CommentVote
from datetime import datetime, timedelta
import random

db = SessionLocal()

try:
    # Get demo user
    demo_user = db.query(User).filter(User.username == "demo_trader").first()
    if not demo_user:
        print("Demo user not found!")
        exit(1)
    
    print(f"[OK] Found user: {demo_user.username} (ID: {demo_user.id})")
    
    # Create sample posts
    posts_data = [
        {
            "title": "RELIANCE breaking resistance at ₹2,850 - Bullish signal?",
            "content": """Just noticed RELIANCE has finally broken the resistance level at ₹2,850 with strong volume. 
            
Technical indicators:
- RSI at 62 (not overbought yet)
- MACD showing bullish crossover
- Volume 25% above average

What do you all think? Is this the start of a new uptrend or just a temporary breakout?""",
            "symbol": "RELIANCE",
            "community": "technical",
            "views": 145,
            "upvotes": 12,
            "downvotes": 2
        },
        {
            "title": "TCS Q3 results exceeded expectations - Long term hold",
            "content": """TCS just announced their Q3 results and they're better than expected!

Key highlights:
- Revenue up 15% YoY
- EPS increased by 18%
- Strong order book for FY24
- Dividend announced: ₹18 per share

I've been holding TCS for 2 years and this validates my thesis. Great for long-term investors.""",
            "symbol": "TCS",
            "community": "longterm",
            "views": 89,
            "upvotes": 8,
            "downvotes": 1
        },
        {
            "title": "Market sentiment analysis - Cautiously optimistic",
            "content": """Based on recent market movements and news sentiment, I'm seeing:

📈 Positive factors:
- FII inflows increasing
- Strong corporate earnings
- Stable crude oil prices

📉 Risk factors:
- Global recession concerns
- Rising interest rates
- Geopolitical tensions

What's your take on the current market?""",
            "symbol": None,
            "community": "fundamental",
            "views": 203,
            "upvotes": 15,
            "downvotes": 3,
            "is_pinned": True
        }
    ]
    
    created_posts = []
    for i, post_data in enumerate(posts_data):
        post = Post(
            title=post_data["title"],
            content=post_data["content"],
            symbol=post_data.get("symbol"),
            community=post_data.get("community"),
            author_id=demo_user.id,
            views=post_data["views"],
            upvotes=post_data["upvotes"],
            downvotes=post_data["downvotes"],
            is_pinned=post_data.get("is_pinned", False),
            created_at=datetime.utcnow() - timedelta(hours=i*2)
        )
        db.add(post)
        db.flush()  # Get the post ID
        created_posts.append(post)
        print(f"[OK] Created post: {post.title[:50]}... (ID: {post.id})")
    
    # Create sample comments
    comments_data = [
        {
            "post_index": 0,
            "content": "Great analysis! I'm also seeing similar patterns on the daily chart. Might enter a position tomorrow.",
            "upvotes": 5,
            "downvotes": 0
        },
        {
            "post_index": 0,
            "content": "Be careful though, there's a bearish divergence on RSI. Watch for a pullback.",
            "upvotes": 3,
            "downvotes": 1
        },
        {
            "post_index": 1,
            "content": "TCS is always a solid blue chip choice. Been holding since ₹2,800 and very happy!",
            "upvotes": 4,
            "downvotes": 0
        },
        {
            "post_index": 2,
            "content": "I think we'll see some correction before year-end. Market has run up too fast.",
            "upvotes": 6,
            "downvotes": 2
        }
    ]
    
    for i, comment_data in enumerate(comments_data):
        post = created_posts[comment_data["post_index"]]
        comment = Comment(
            content=comment_data["content"],
            post_id=post.id,
            author_id=demo_user.id,
            upvotes=comment_data["upvotes"],
            downvotes=comment_data["downvotes"],
            created_at=datetime.utcnow() - timedelta(hours=i)
        )
        db.add(comment)
        print(f"[OK] Created comment on post {post.id}")
    
    # Update user reputation based on activity
    # +5 per post, +2 per comment, +10 per post upvote, +5 per comment upvote
    total_rep = (len(posts_data) * 5) + (len(comments_data) * 2) + \
                (sum(p["upvotes"] for p in posts_data) * 10) + \
                (sum(c["upvotes"] for c in comments_data) * 5)
    
    demo_user.reputation = total_rep
    print(f"[OK] Updated user reputation: {total_rep} points")
    
    db.commit()
    print("\n[SUCCESS] Sample data created successfully!")
    print(f"   - {len(created_posts)} posts")
    print(f"   - {len(comments_data)} comments")
    print(f"   - User reputation: {demo_user.reputation}")
    
except Exception as e:
    print(f"[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
