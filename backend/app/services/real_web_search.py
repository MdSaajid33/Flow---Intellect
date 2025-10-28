import os
import serpapi
from dotenv import load_dotenv

load_dotenv('../.env')

class RealWebSearchService:
    async def search(self, query: str, max_results: int = 3):
        try:
            api_key = os.getenv("SERPAPI_KEY")
            if not api_key:
                return ["SerpAPI key not configured"]
                
            client = serpapi.Client(api_key=api_key)
            results = client.search({
                'q': query,
                'engine': 'google',
                'num': max_results
            })
            
            organic_results = results.get('organic_results', [])
            return [result['snippet'] for result in organic_results[:max_results]] if organic_results else []
            
        except Exception as e:
            print(f"SerpAPI Error: {e}")
            return [f"Web search error: {str(e)}"]