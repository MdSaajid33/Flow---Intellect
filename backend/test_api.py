import os
from dotenv import load_dotenv

load_dotenv('.env')
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {bool(api_key)}")
print(f"Key length: {len(api_key) if api_key else 0}")