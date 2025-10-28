import os
import uuid
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
import requests
import json

load_dotenv('.env')

UPLOAD_DIRECTORY = "uploaded_documents"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

# Database
Base = declarative_base()

class WorkflowDB(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    components = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Database setup
def get_engine():
    return create_engine(os.getenv('DATABASE_URL', 'sqlite:///./flowintellect.db'), 
                        connect_args={"check_same_thread": False})

def create_tables():
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("✅ Database ready")
    return engine

engine = create_tables()
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enhanced Knowledge Base
class KnowledgeBase:
    def __init__(self):
        self.documents = {}
        print("✅ Knowledge Base ready")
    
    def add_document(self, file_path: str, doc_id: str, filename: str) -> bool:
        try:
            content = ""
            if filename.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            elif filename.endswith('.pdf'):
                import fitz
                doc = fitz.open(file_path)
                content = ''.join([page.get_text() for page in doc])
                doc.close()
            
            self.documents[doc_id] = {'content': content, 'filename': filename}
            print(f"✅ Added: {filename} ({len(content)} chars)")
            return True
        except Exception as e:
            print(f"❌ Document error: {e}")
            return False
    
    def search(self, query: str, max_results: int = 3) -> list:
        if not self.documents:
            print("📚 No documents in knowledge base")
            return []
        
        results = []
        query_lower = query.lower().strip()
        
        print(f"🔍 Searching for '{query}' in {len(self.documents)} documents")
        
        for doc_id, doc_data in self.documents.items():
            content = doc_data['content']
            filename = doc_data['filename']
            
            if query_lower in content.lower():
                
                content_lower = content.lower()
                index = content_lower.find(query_lower)
                
                if index != -1:
                    start = max(0, index - 50)
                    end = min(len(content), index + len(query_lower) + 100)
                    context = content[start:end]
                    
                    if start > 0:
                        context = "..." + context
                    if end < len(content):
                        context = context + "..."
                    
                    results.append({
                        'filename': filename,
                        'context': context,
                        'score': 1.0,
                        'doc_id': doc_id
                    })
                    print(f"📚 ✅ Found match in: {filename}")
        
        print(f"📚 Search completed: {len(results)} results found")
        return results[:max_results]

knowledge_base = KnowledgeBase()

class AIService:
    def __init__(self):
        self.gemini_key = os.getenv('GEMINI_API_KEY')
        if self.gemini_key:
            print("✅ Gemini AI Service ready")
        else:
            print("❌ Gemini API key not found")
    
    def generate_response(self, prompt: str) -> str:
        if not self.gemini_key:
            return "❌ Please configure GEMINI_API_KEY in .env file"
        
        try:
            
            working_models = [
                "gemini-2.0-flash",           
                "gemini-2.0-flash-001",        
                "gemini-pro-latest",          
                "gemini-flash-latest",        
            ]
            
            for model_name in working_models:
                try:
                    print(f"🔄 Trying Gemini model: {model_name}")
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
                    
                    data = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 1000,
                            "topP": 0.8,
                            "topK": 40
                        }
                    }
                    
                    response = requests.post(url, json=data, timeout=30)
                    
                    if response.status_code == 200:
                        result = response.json()
                        if 'candidates' in result and result['candidates']:
                            text = result['candidates'][0]['content']['parts'][0]['text']
                            print(f"✅ Gemini success with {model_name}")
                            return text
                    else:
                        print(f"❌ Gemini {model_name} failed: {response.status_code}")
                        continue
                        
                except Exception as e:
                    print(f"❌ Gemini {model_name} error: {e}")
                    continue
            
            return "❌ All Gemini models failed. Please check your API key configuration."
            
        except Exception as e:
            return f"❌ AI Error: {str(e)}"

# SMARTER Web Search Service
class WebSearchService:
    def __init__(self):
        self.api_key = os.getenv('SERPAPI_KEY')
        self.available = bool(self.api_key)
        if self.available:
            print("✅ SerpAPI Web Search ready")
        else:
            print("❌ SerpAPI key not found")
    
    async def search(self, query: str) -> str:
        if not self.available:
            return ""
        
        # DON'T use web search for simple greetings
        simple_queries = ['hello', 'hi', 'hey', 'how are you', 'what is your name', 'good morning', 'good afternoon']
        if any(simple in query.lower() for simple in simple_queries):
            print("🌐 Skipping web search for simple query")
            return ""
        
        try:
            print(f"🌐 Searching web for: {query}")
            
            params = {
                'q': query,
                'api_key': self.api_key,
                'engine': 'google',
                'num': 3
            }
            
            response = requests.get('https://serpapi.com/search', params=params, timeout=30)
            
            if response.status_code == 200:
                results = response.json()
                web_context = self._parse_serp_results(results, query)
                result_count = len(web_context.splitlines())
                print(f"✅ Web search found {result_count} relevant results")
                return web_context
            else:
                print(f"❌ SerpAPI error: {response.status_code}")
                return ""
                
        except Exception as e:
            print(f"❌ Web search error: {e}")
            return ""
    
    def _parse_serp_results(self, results: dict, original_query: str) -> str:
        """Parse SerpAPI results into readable text with relevance filtering"""
        context_parts = []
        
        irrelevant_queries = ['hello', 'hi', 'hey', 'how are you']
        if any(query in original_query.lower() for query in irrelevant_queries):
            return ""
        
        if 'organic_results' in results:
            for i, result in enumerate(results['organic_results'][:3]):
                title = result.get('title', '')
                snippet = result.get('snippet', '')
                if title and snippet:
                  
                    if any(keyword in title.lower() or keyword in snippet.lower() 
                           for keyword in original_query.lower().split()):
                        context_parts.append(f"{i+1}. {title}: {snippet}")
        
        
        if 'answer_box' in results and results['answer_box']:
            answer = results['answer_box'].get('answer') or results['answer_box'].get('snippet')
            if answer:
                context_parts.append(f"Direct Answer: {answer}")
        
        return "\n".join(context_parts) if context_parts else ""


ai_service = AIService()
web_search = WebSearchService()

# FastAPI App
app = FastAPI(title="FlowIntellect API - Gemini + SerpAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    workflow_id: Optional[str] = "default"

# Routes
@app.get("/")
async def root():
    return {"message": "FlowIntellect API - Optimized & Working"}

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "gemini_ready": bool(ai_service.gemini_key),
        "web_search_ready": web_search.available,
        "knowledge_base_docs": len(knowledge_base.documents)
    }

@app.get("/workflows")
async def get_workflows(db: Session = Depends(get_db)):
    try:
        workflows = db.query(WorkflowDB).order_by(WorkflowDB.created_at.desc()).all()
        return {
            "workflows": [
                {
                    "id": wf.id,
                    "name": wf.name, 
                    "components": wf.components,
                    "created_at": wf.created_at.isoformat()
                }
                for wf in workflows
            ]
        }
    except Exception as e:
        print(f"❌ Get workflows error: {e}")
        return {"workflows": []}

@app.post("/workflows")
async def save_workflow(workflow_data: Dict[str, Any], db: Session = Depends(get_db)):
    try:
        print(f"💾 Saving workflow: {workflow_data.get('name')}")
        
        workflow = WorkflowDB(
            name=workflow_data.get("name", "Unnamed"),
            components=workflow_data.get("components", {})
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        print(f"✅ Workflow saved with ID: {workflow.id}")
        return {"status": "success", "workflow_id": workflow.id, "message": "Workflow saved!"}
    except Exception as e:
        db.rollback()
        print(f"❌ Save workflow error: {e}")
        raise HTTPException(500, f"Save failed: {str(e)}")

@app.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    try:
        workflow = db.query(WorkflowDB).filter(WorkflowDB.id == workflow_id).first()
        if not workflow:
            raise HTTPException(404, "Workflow not found")
        
        db.delete(workflow)
        db.commit()
        print(f"✅ Workflow {workflow_id} deleted")
        return {"status": "success", "message": "Workflow deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Delete failed: {str(e)}")

@app.post("/chat")
async def chat(message: ChatMessage, db: Session = Depends(get_db)):
    try:
        print(f"💬 Chat request: '{message.message}' (Workflow: {message.workflow_id})")
        
        # Validate workflow selection
        if message.workflow_id in ["canvas_live", "default"]:
            return {
                "response": "❌ Please select a saved workflow from the dropdown to start chatting.",
                "workflow_required": True
            }
      
        web_search_enabled = False
        knowledge_base_enabled = False
        workflow_name = "Unknown"
        
        if message.workflow_id:
            workflow = db.query(WorkflowDB).filter(WorkflowDB.id == int(message.workflow_id)).first()
            if workflow:
                workflow_name = workflow.name
                components = workflow.components
                
                # Handle both list and dict formats
                if isinstance(components, dict):
                    for comp_id, comp_data in components.items():
                        if isinstance(comp_data, dict):
                            if comp_data.get('type') == 'llmEngine':
                                web_search_enabled = comp_data.get('data', {}).get('webSearch', False)
                            elif comp_data.get('type') == 'knowledgeBase':
                                knowledge_base_enabled = comp_data.get('data', {}).get('useContext', False)
                elif isinstance(components, list):
                    for component in components:
                        if isinstance(component, dict):
                            if component.get('type') == 'llmEngine':
                                web_search_enabled = component.get('data', {}).get('webSearch', False)
                            elif component.get('type') == 'knowledgeBase':
                                knowledge_base_enabled = component.get('data', {}).get('useContext', False)
        
        print(f"🔧 Workflow: {workflow_name}, Web Search: {web_search_enabled}, KB: {knowledge_base_enabled}")
        
        
        web_context = ""
        if web_search_enabled:
            web_context = await web_search.search(message.message)
        
        
        kb_context = ""
        kb_results = knowledge_base.search(message.message)
        
        if kb_results:
            kb_context = "\n".join([f"📄 {r['filename']}: {r['context']}" for r in kb_results])
            print(f"📚 Found {len(kb_results)} knowledge base results")
            
            
            if knowledge_base_enabled or (not web_search_enabled and kb_results):
                print(f"📚 Using knowledge base results")
            else:
                print("📚 Knowledge base results available but not used (both KB and web search disabled)")
                kb_context = ""
        else:
            print("📚 No knowledge base results found")
        
        prompt_parts = []
        
        if web_context:
            prompt_parts.append(f"🌐 WEB SEARCH RESULTS:\n{web_context}")
        
        if kb_context:
            prompt_parts.append(f"📚 KNOWLEDGE BASE DOCUMENTS:\n{kb_context}")
        
        if prompt_parts:
            context_section = "\n\n".join(prompt_parts)
            prompt = f"""{context_section}

👤 USER QUESTION: {message.message}

🤖 Please provide a helpful response using the available information above:"""
        else:
            
            prompt = f"User: {message.message}\n\nPlease provide a helpful and natural response."
        
        response_text = ai_service.generate_response(prompt)
        
        return {
            "response": response_text,
            "workflow_used": workflow_name,
            "web_search_used": web_search_enabled and bool(web_context),
            "kb_used": bool(kb_context)
        }
        
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        return {"response": f"❌ System error: {str(e)}", "error": True}
    
@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(400, "No file provided")
        
        
        allowed_extensions = {'.pdf', '.txt', '.docx'}
        file_extension = os.path.splitext(file.filename.lower())[1]
        if file_extension not in allowed_extensions:
            raise HTTPException(400, f"File type not supported. Allowed: {', '.join(allowed_extensions)}")
        
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIRECTORY, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        success = knowledge_base.add_document(file_path, file_id, file.filename)
        
        if success:
            return {
                "status": "success",
                "message": f"✅ {file.filename} uploaded successfully",
                "document_id": file_id,
                "filename": file.filename
            }
        else:
            raise HTTPException(500, "Failed to process document")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.post("/api/search-knowledge")
async def search_knowledge(search_data: dict):
    try:
        query = search_data.get('query', '')
        if not query.strip():
            return {"results": [], "total_found": 0, "query": query}
        
        results = knowledge_base.search(query)
        return {
            "results": results,
            "total_found": len(results),
            "query": query
        }
    except Exception as e:
        raise HTTPException(500, f"Search failed: {str(e)}")

@app.get("/api/documents")
async def get_documents():
    """Get list of all documents in knowledge base"""
    try:
        documents = []
        for doc_id, doc_data in knowledge_base.documents.items():
            documents.append({
                "id": doc_id,
                "filename": doc_data['filename'],
                "size": len(doc_data.get('content', '')),
                "content_preview": doc_data.get('content', '')[:100] + '...' if len(doc_data.get('content', '')) > 100 else doc_data.get('content', '')
            })
        
        return {
            "documents": documents,
            "total": len(documents)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)