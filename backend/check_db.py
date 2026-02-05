from app.db import engine
from sqlalchemy import inspect

inspector = inspect(engine)
print("Users table columns:")
for col in inspector.get_columns('users'):
    print(f"  {col['name']}: {col['type']}")
