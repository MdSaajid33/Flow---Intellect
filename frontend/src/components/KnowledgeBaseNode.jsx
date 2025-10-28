import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

const KnowledgeBaseNode = ({ data, id }) => {
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return setUploadStatus('❌ Select a file first');
    setUploadStatus('⏳ Uploading...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workflow_id', data.workflowId || 'default');
    try {
      const response = await fetch('http://localhost:8000/api/upload-document', { method: 'POST', body: formData });
      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`✅ ${result.message}`);
        data.documentId = result.document_id;
      } else setUploadStatus('❌ Upload failed');
    } catch (error) {
      setUploadStatus(`❌ ${error.message}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return setSearchResults([]);
    setSearching(true);
    try {
      const response = await fetch('http://localhost:8000/api/search-knowledge', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ query: searchQuery, max_results: 3 })
      });
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.results || []);
      } else setSearchResults([]);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="node knowledge-base-node">
      <div className="node-header">
        <div className="node-icon">📚</div>
        <span>Knowledge Base</span>
        <button onClick={() => data.onDelete && data.onDelete(id)} className="node-delete">×</button>
      </div>
      
      <div className="upload-section">
        <input type="file" onChange={handleFileChange} accept=".pdf,.txt,.docx" className="file-input" />
        <button onClick={handleUpload} className="btn-upload">📤 Upload</button>
        {uploadStatus && <div className={`status ${uploadStatus.includes('✅') ? 'success' : 'error'}`}>{uploadStatus}</div>}
      </div>

      <div className="search-section">
        <div className="search-header">🔍 Search Documents</div>
        <div className="search-input">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                 onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Enter search query..." />
          <button onClick={handleSearch} disabled={searching} className="btn-search">
            {searching ? '⏳' : '🔍'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="results-count">📊 Found {searchResults.length} results:</div>
            {searchResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-filename">{result.filename}</div>
                <div className="result-context">{result.context}...</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="config-option">
        <input type="checkbox" checked={data.useContext || false} onChange={(e) => data.useContext = e.target.checked} />
        <span>Use Context in AI</span>
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <style jsx>{`
        .knowledge-base-node { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 15px; border-radius: 12px; 
                              min-width: 200px; color: white; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3); border: 1px solid rgba(255,255,255,0.2); }
        .node-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; margin-bottom: 12px; }
        .node-icon { font-size: 16px; margin-right: 8px; }
        .node-delete { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; border-radius: 50%; 
                      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
        .upload-section, .search-section { margin-bottom: 12px; }
        .file-input { width: 100%; margin-bottom: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
                     border-radius: 6px; padding: 6px; color: white; }
        .btn-upload, .btn-search { width: 100%; padding: 8px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); 
                                  border-radius: 6px; color: white; cursor: pointer; font-weight: 600; }
        .status { font-size: 10px; margin-top: 5px; padding: 4px; border-radius: 4px; text-align: center; }
        .success { background: rgba(76, 175, 80, 0.3); }
        .error { background: rgba(244, 67, 54, 0.3); }
        .search-header { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .search-input { display: flex; gap: 5px; margin-bottom: 8px; }
        .search-input input { flex: 1; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); 
                            border-radius: 6px; color: white; }
        .search-results { font-size: 10px; }
        .results-count { font-weight: 600; margin-bottom: 5px; }
        .result-item { background: rgba(255,255,255,0.1); padding: 6px; margin: 4px 0; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); }
        .result-filename { font-weight: 600; margin-bottom: 2px; }
        .result-context { color: rgba(255,255,255,0.8); }
        .config-option { display: flex; align-items: center; gap: 6px; font-size: 11px; margin-top: 8px; }
      `}</style>
    </div>
  );
};

export default KnowledgeBaseNode;