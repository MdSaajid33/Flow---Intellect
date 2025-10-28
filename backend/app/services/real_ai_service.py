import os
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

class RealAIService:
    def __init__(self):
        load_dotenv('../.env')
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    async def get_response(self, query: str, context: str = None) -> str:
        try:
            # Configure Gemini
            genai.configure(api_key=self.api_key)
 
            if context:
                prompt = f"""Context: {context}

Question: {query}

Please answer the question based on the context provided."""
            else:
                prompt = query

            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content(prompt)
            
            return response.text
            
        except Exception as e:
            return f"Error getting AI response: {str(e)}"