import os
import asyncio
from dotenv import load_dotenv

load_dotenv('../.env')

async def test_web_search():
    api_key = os.getenv('SERPAPI_KEY')
    print(f"🔑 SerpAPI Key: {'✅ Found' if api_key else '❌ Not found'}")
    
    if not api_key or api_key == "your_actual_serpapi_key_here":
        print("❌ Please add your actual SerpAPI key to .env file")
        return
    
    try:
        import serpapi
        print("🌐 Testing web search...")
        
        client = serpapi.Client(api_key=api_key)
        results = client.search({
            'q': 'current weather in Bangalore',
            'engine': 'google',
            'num': 2
        })
        
        print("✅ Web Search Successful!")
        organic_results = results.get('organic_results', [])
        
        if organic_results:
            print("📰 Search Results:")
            for i, result in enumerate(organic_results[:2], 1):
                title = result.get('title', 'No title')
                snippet = result.get('snippet', 'No description')
                print(f"{i}. {title}")
                print(f"   {snippet}\n")
        else:
            print("No results found")
            
    except Exception as e:
        print(f"❌ Web Search Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_web_search())