import os
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class KnowledgeBaseComponent:
    def __init__(self):
        self.documents_loaded = False
        self.documents = []
    
    async def process(self, query: str) -> str:
        """
        Process query against knowledge base and return relevant context
        """
        try:
            logger.info(f"KnowledgeBase processing query: {query}")
            
            if not self.documents_loaded:
                logger.info("No documents loaded in knowledge base yet")
                return ""
            
            relevant_docs = []
            query_words = query.lower().split()
            
            for doc in self.documents:
                if any(word in doc.lower() for word in query_words):
                    relevant_docs.append(doc)
                    if len(relevant_docs) >= 3:
                        break
            
            if relevant_docs:
                context = "\n".join(relevant_docs)
                logger.info(f"Found {len(relevant_docs)} relevant documents")
                return context
            else:
                logger.info("No relevant documents found in knowledge base")
                return ""
                
        except Exception as e:
            error_msg = f"KnowledgeBase error: {str(e)}"
            logger.error(error_msg)
            return ""
    
    def add_document(self, file_path: str) -> bool:
        """
        Add a document to the knowledge base
        """
        try:
            
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
            
            if not text_content:
                logger.error(f"Failed to read content from {file_path}")
                return False
            
            self.documents.append(text_content)
            self.documents_loaded = True
            
            logger.info(f"Successfully added document: {os.path.basename(file_path)}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document to knowledge base: {e}")
            return False