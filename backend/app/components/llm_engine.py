import os
from typing import Dict, Any
import logging
from services.real_ai_service import RealAIService
from services.real_web_search import RealWebSearchService  

logger = logging.getLogger(__name__)

class LLMEngine:
    def __init__(self):
        self.ai_service = RealAIService()
        self.web_search = RealWebSearchService()  
    
    async def process(self, query: str, context: str = None, use_web_search: bool = False) -> Dict[str, Any]:
        """
        Process query through LLM with optional context and web search
        """
        try:
            logger.info(f"LLM Engine processing query: {query}")
            
            web_context = ""
            if use_web_search:
                logger.info("Web search enabled")
                web_search_result = await self.web_search.search(query)
                web_context = web_search_result if web_search_result else ""
            
            final_context = ""
            if context:
                final_context += f"Document Context: {context}\n"
            if web_context:
                final_context += f"Web Search Results: {web_context}\n"
            
            logger.info(f"Final context length: {len(final_context)}")
            
            # Get AI response
            ai_response = await self.ai_service.get_response(query, final_context)
            
            logger.info(f"AI response received: {ai_response[:100]}...")
            
            return {
                "success": True,
                "response": ai_response,
                "context_used": bool(final_context)
            }
            
        except Exception as e:
            error_msg = f"LLM Engine error: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "response": f"Sorry, I encountered an error while processing your request: {str(e)}"
            }