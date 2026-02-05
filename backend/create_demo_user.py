import sys
from app.db import SessionLocal
from app.schemas.community import UserCreate
from app.services.auth_service import get_password_hash
from app.models.community import User

# Create test user
db = SessionLocal()
try:
    # Check if user exists
    existing = db.query(User).filter(User.username == "demo_trader").first()
    if existing:
        print("User already exists!")
        sys.exit(0)
    
    # Create new user
    user_data = UserCreate(
        username="demo_trader",
        email="demo@example.com",
        password="demo123",
        full_name="Demo Trader"
    )
    
    hashed_password = get_password_hash(user_data.password)
    
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        reputation=0,
        is_active=True,
        is_verified=False
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"✓ Created user: {db_user.username}")
    print(f"  Email: {db_user.email}")
    print(f"  ID: {db_user.id}")
    print(f"  Reputation: {db_user.reputation}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
