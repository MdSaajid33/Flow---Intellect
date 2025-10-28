from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv('../.env')

Base = declarative_base()

class WorkflowDB(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    components = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

def get_engine():
    database_url = os.getenv('DATABASE_URL', 'sqlite:///./flowintellect.db')
    return create_engine(database_url)

def create_tables():
    engine = get_engine()
    Base.metadata.create_all(bind=engine)