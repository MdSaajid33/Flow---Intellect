FlowIntellect - No-Code AI Workflow Builder
### 🚀 Overview

- Visual AI workflow builder with drag-drop interface. Create intelligent automation systems without coding.

### ✨ Features

## 🚀 Features

- 🧩 **Drag-Drop Workflow Builder** - React Flow based visual designer
- 🤖 **Multi-AI Integration** - Gemini AI with web search  
- 📚 **Smart Knowledge Base** - PDF/DOCX/TXT processing with semantic search
- 💬 **Context-Aware Chat** - Blends document knowledge with web data
- 💾 **Workflow Persistence** - Save, load, and manage workflows
- 🎨 **Professional UI** - Glass morphism design with animations


### 🛠 Tech Stack
- Frontend: React.js, React Flow, CSS-in-JS
- Backend: FastAPI, SQLite, PyMuPDF
- AI: Google Gemini, SerpAPI

## 📁 Project Structure

```
flowintellect/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database_models.py
│   │   └── services/
│   │       ├── real_ai_service.py
│   │       └── real_web_search.py
│   ├── requirements.txt
│   ├── .env
│   └── uploaded_documents/
├── Demo/
│   └── project-demo.mp4
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── UserQueryNode.jsx
│   │   │   ├── LLMEngineNode.jsx
│   │   │   ├── KnowledgeBaseNode.jsx
│   │   │   └── OutputNode.jsx
│   │   └── styles/
│   ├── package.json
│   └── .env
├── README.md
├── .gitignore
└── requirements.txt
```


### 🚀 Quick Start
Prerequisites

- Python 3.8+
- Node.js 16+
- Gemini API Key

### 1- Installation
Backend Setup
- cd backend
- pip install -r requirements.txt

### 2- Environment Setup
Create backend/.env:
- GEMINI_API_KEY=your_gemini_api_key
- DATABASE_URL=sqlite:///./flowintellect.db

### 3- Frontend Setup
- cd frontend
- npm install

### 4- Run Application
# Terminal 1 - Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev

## Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

💡 Usage
### Build Workflow
- Drag components: User Query → Knowledge Base → LLM Engine → Output
- Upload documents to Knowledge Base
- Enable "Use Context" for AI knowledge
- Toggle web search in LLM Engine
- Validate and save workflow
- Start chatting with AI

### Components
- 👤 User Query - Input interface

- 📚 Knowledge Base - Document upload & search

- 🤖 LLM Engine - AI processing with web search

- 💬 Output - Chat interface

### ✅ Requirements Met

## ✅ Core Features Implemented

✅ **4 Core Components** with drag-drop  
✅ **Workflow Validation & Execution**  
✅ **Document Processing** (PyMuPDF)  
✅ **AI Integration** (Gemini)  
✅ **Web Search** (SerpAPI)  
✅ **Database Persistence**  
✅ **Professional UI/UX**  
✅ **Chat Interface**

### 🐛 Troubleshooting

## 1- Chat not working?
- Check Gemini API key in .env
- Ensure backend running on port 8000
- Validate workflow before chatting

## 2- File upload issues?
- Supported: PDF, TXT, DOCX
- Check file size limits
- Verify PyMuPDF installed

## 3- API quota exceeded?
- Gemini free tier: 50 requests/day
- Wait 24 hours or use new API key


## 🚀 Quick Demo
<video width="800" controls>
  <source src="https://github.com/MdSaajid33/Flow---Intellect/raw/main/Demo/project-demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

**Click the video above to watch the demo!**

## Finally..!!

- Start building: npm run dev + python -m uvicorn app.main:app --reload --port 8000
- Built with React, FastAPI, and cutting-edge AI technologies.

