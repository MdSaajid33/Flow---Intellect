import os
import sys
from sqlalchemy import create_engine

sys.path.append(os.path.dirname(__file__))

from app.main import Base, get_engine

def reset_database():
    print("🔄 Starting database reset...")
    
    engine = get_engine()
    
   
    print("🗑️  Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Dropped all tables")
    
  
    print("🔧 Recreating tables with updated schema...")
    Base.metadata.create_all(bind=engine)
    print("✅ Recreated tables with updated schema")
    
    print("🚀 Database reset complete!")
    print("💡 You can now start your server normally")

if __name__ == "__main__":
    reset_database()