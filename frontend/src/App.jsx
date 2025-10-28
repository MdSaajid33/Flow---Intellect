import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Controls, MiniMap, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import UserQueryNode from './components/UserQueryNode';
import LLMEngineNode from './components/LLMEngineNode';
import KnowledgeBaseNode from './components/KnowledgeBaseNode';
import OutputNode from './components/OutputNode';
import axios from 'axios';

const nodeTypes = { 
  userQuery: UserQueryNode, 
  llmEngine: LLMEngineNode, 
  knowledgeBase: KnowledgeBaseNode, 
  output: OutputNode 
};

const components = [
  { type: 'userQuery', label: '👤 User Query', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { type: 'llmEngine', label: '🤖 LLM Engine', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { type: 'knowledgeBase', label: '📚 Knowledge Base', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { type: 'output', label: '💬 Output', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
];

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [workflowValid, setWorkflowValid] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedWorkflowId) {
      setMessages([]);
      console.log(`🔄 Chat cleared for workflow: ${selectedWorkflowId}`);
    }
  }, [selectedWorkflowId]);

  useEffect(() => { loadWorkflows(); }, []);

  const onDeleteNode = useCallback((nodeId) => setNodes(nds => nds.filter(node => node.id !== nodeId)), []);
  const onConnect = useCallback(params => setEdges(eds => addEdge(params, eds)), []);
  const onDragStart = (event, nodeType) => event.dataTransfer.setData('application/reactflow', nodeType);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const position = { x: event.clientX - 250, y: event.clientY - 100 };
    
    setNodes(nds => nds.concat({
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type, position,
      data: { 
        onDelete: onDeleteNode, 
        webSearch: type === 'llmEngine',
        useContext: type === 'knowledgeBase'
      }
    }));
  }, [onDeleteNode, setNodes]);

  const validateWorkflow = useCallback(() => {
    const valid = nodes.some(n => n.type === 'userQuery') && 
                 nodes.some(n => n.type === 'llmEngine') && 
                 nodes.some(n => n.type === 'output') && 
                 edges.length > 0;
    setWorkflowValid(valid);
    alert(valid ? '✅ Workflow Valid!' : '❌ Need: User Query → LLM Engine → Output with connections');
  }, [nodes, edges]);

  const loadWorkflows = async () => {
    try {
      const response = await axios.get('http://localhost:8000/workflows');
      setWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const saveWorkflow = async () => {
    if (!workflowValid) return alert('❌ Validate workflow first!');
    try {
      const response = await axios.post('http://localhost:8000/workflows', {
        name: `Workflow-${Date.now()}`,
        components: nodes.map(node => ({ type: node.type, position: node.position, data: node.data }))
      });
      if (response.data.workflow_id) {
        setSelectedWorkflowId(response.data.workflow_id.toString());
        await loadWorkflows();
        alert(`✅ Workflow Saved! ID: ${response.data.workflow_id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Save failed');
    }
  };

  const deleteWorkflow = async () => {
    if (!selectedWorkflowId) return alert('❌ Select a workflow first');
    if (!confirm('🗑️ Delete this workflow?')) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/workflows/${selectedWorkflowId}`);
      setSelectedWorkflowId('');
      setNodes([]); setEdges([]); setWorkflowValid(false);
      await loadWorkflows();
      alert('✅ Workflow deleted');
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadSelectedWorkflow = useCallback(async (workflowId) => {
    try {
      const response = await axios.get('http://localhost:8000/workflows');
      const workflow = response.data.workflows?.find(w => w.id.toString() === workflowId.toString());
      
      if (workflow?.components) {
        setNodes([]); setEdges([]);
        const componentsArray = Array.isArray(workflow.components) ? 
          workflow.components : Object.values(workflow.components);
        
        const loadedNodes = componentsArray.map((comp, index) => ({
          id: `${comp.type}-${Date.now()}-${index}`,
          type: comp.type,
          position: comp.position || { x: 100 + (index * 200), y: 100 },
          data: { ...comp.data, onDelete: onDeleteNode }
        }));
        
        setNodes(loadedNodes);
        setWorkflowValid(true);
        console.log('✅ Workflow loaded:', workflow.name);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  }, [setNodes, setEdges, onDeleteNode]);

  const handleWorkflowSelect = useCallback((workflowId) => {
    setSelectedWorkflowId(workflowId);
    workflowId ? loadSelectedWorkflow(workflowId) : (setNodes([]), setEdges([]), setWorkflowValid(false));
  }, [loadSelectedWorkflow, setNodes, setEdges]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return alert('❌ Please enter a message');
    if (!workflowValid) return alert('❌ Validate workflow first!');
    if (!selectedWorkflowId) return alert('❌ Select or save a workflow first!');

    const userMessage = { text: inputMessage, sender: 'user', timestamp: new Date(), workflowId: selectedWorkflowId };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      console.log(`🔄 Sending to workflow ${selectedWorkflowId}: ${inputMessage}`);
      const response = await axios.post('http://localhost:8000/chat', {
        message: inputMessage,
        workflow_id: selectedWorkflowId
      });

      const aiMessage = { text: response.data.response, sender: 'ai', timestamp: new Date(), workflowId: selectedWorkflowId };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage = { 
        text: `❌ Error: ${error.response?.data?.detail || error.message}`, 
        sender: 'ai', 
        timestamp: new Date(),
        workflowId: selectedWorkflowId
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Optimized ConfigPanel
  const ConfigPanel = () => {
    if (!selectedNode) return (
      <div className="config-panel">
        <h3>⚙️ Configuration</h3>
        <p>Click any node to configure</p>
      </div>
    );

    const updateNodeData = (updates) => {
      const updatedData = { ...selectedNode.data, ...updates };
      setNodes(nds => nds.map(node => node.id === selectedNode.id ? { ...node, data: updatedData } : node));
      setSelectedNode(prev => prev ? { ...prev, data: updatedData } : null);
    };

    return (
      <div className="config-panel">
        <h3>⚙️ Configure {selectedNode.type}</h3>
        {selectedNode.type === 'llmEngine' && (
          <label className="config-option">
            <input type="checkbox" checked={selectedNode.data.webSearch || false} 
                   onChange={(e) => updateNodeData({ webSearch: e.target.checked })} />
            🌐 Enable Web Search
          </label>
        )}
        {selectedNode.type === 'knowledgeBase' && (
          <label className="config-option">
            <input type="checkbox" checked={selectedNode.data.useContext || false} 
                   onChange={(e) => updateNodeData({ useContext: e.target.checked })} />
            📚 Use Context in AI
          </label>
        )}
        <button onClick={() => setSelectedNode(null)} className="btn-danger">❌ Close Config</button>
      </div>
    );
  };

  
  const currentWorkflow = workflows.find(w => w.id.toString() === selectedWorkflowId.toString());

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🚀 FlowIntellect</h1>
          <p>Next-Gen AI Workflows</p>
        </div>
        
        <div className="components-section">
          <h3>🧩 Components</h3>
          {components.map(comp => (
            <div key={comp.type} className="component-item" style={{ background: comp.color }} 
                 onDragStart={e => onDragStart(e, comp.type)} draggable>
              {comp.label}
            </div>
          ))}
        </div>

        <div className="workflow-section">
          <h3>📋 Workflows</h3>
          <select value={selectedWorkflowId} onChange={(e) => handleWorkflowSelect(e.target.value)} className="workflow-select">
            <option value="">🎯 Create New Workflow</option>
            {workflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>📁 {workflow.name} (ID: {workflow.id})</option>
            ))}
          </select>
        </div>

        <div className="controls">
          <button onClick={validateWorkflow} className={`btn ${workflowValid ? 'btn-success' : 'btn-warning'}`}>
            {workflowValid ? '✅ Valid' : '🔍 Validate'}
          </button>
          <button onClick={saveWorkflow} className="btn btn-info">💾 Save</button>
          <button onClick={deleteWorkflow} disabled={isDeleting || !selectedWorkflowId} className="btn btn-danger">
            {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
          </button>
          <button onClick={() => setChatOpen(true)} disabled={!workflowValid || !selectedWorkflowId} className="btn btn-chat">
            💬 Chat
          </button>
        </div>
      </div>

      <div className="workspace" onDrop={onDrop} onDragOver={e => e.preventDefault()}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} 
                   onConnect={onConnect} onNodeClick={(e, node) => setSelectedNode(node)} nodeTypes={nodeTypes} fitView>
          <Controls className="controls-panel" />
          <MiniMap className="minimap" />
          <Background variant="dots" gap={20} size={1} color="#4a5568" />
        </ReactFlow>

        {chatOpen && (
          <div className="chat-container">
            <div className="chat-header">
              {/* FIX: Show workflow name in chat header */}
              <span>💬 {currentWorkflow ? `Workflow: ${currentWorkflow.name}` : 'AI Chat'}</span>
              <button onClick={() => setChatOpen(false)}>✖</button>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  <div className="message-bubble">
                    {msg.text}
                    <div className="message-time">{msg.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} 
                     onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type your message... 🚀" />
              <button onClick={sendMessage} className="btn-send">📤 Send</button>
            </div>
          </div>
        )}
      </div>
      
      <ConfigPanel />
      
      <style jsx>{`
        .app { display: flex; width: 100vw; height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); font-family: 'Segoe UI', sans-serif; }
        .sidebar { width: 280px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); padding: 20px; border-right: 1px solid rgba(255,255,255,0.1); }
        .sidebar-header { text-align: center; margin-bottom: 30px; }
        .sidebar-header h1 { color: #fff; font-size: 24px; margin: 0; background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sidebar-header p { color: #a0aec0; margin: 5px 0 0; }
        .components-section h3, .workflow-section h3 { color: #fff; margin-bottom: 15px; font-size: 16px; }
        .component-item { color: white; padding: 12px; margin: 8px 0; border-radius: 10px; cursor: grab; font-weight: 600; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); }
        .component-item:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .workflow-select { width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; margin-bottom: 15px; }
        .controls { display: flex; flex-direction: column; gap: 10px; }
        .btn { padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-success { background: linear-gradient(135deg, #43e97b, #38f9d7); color: #000; }
        .btn-warning { background: linear-gradient(135deg, #fa709a, #fee140); color: #000; }
        .btn-info { background: linear-gradient(135deg, #4facfe, #00f2fe); color: #000; }
        .btn-danger { background: linear-gradient(135deg, #ff6b6b, #feca57); color: #000; }
        .btn-chat { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .workspace { flex: 1; position: relative; }
        .config-panel { width: 280px; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); padding: 20px; border-left: 1px solid rgba(255,255,255,0.1); color: white; }
        .config-option { display: flex; align-items: center; gap: 10px; margin: 15px 0; cursor: pointer; }
        .chat-container { position: absolute; bottom: 20px; right: 20px; width: 400px; height: 500px; background: rgba(255,255,255,0.05); backdrop-filter: blur(15px); border-radius: 15px; border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; }
        .chat-header { padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
        .chat-messages { flex: 1; padding: 15px; overflow-y: auto; }
        .message { margin-bottom: 15px; display: flex; }
        .message.user { justify-content: flex-end; }
        .message.ai { justify-content: flex-start; }
        .message-bubble { max-width: 80%; padding: 12px 16px; border-radius: 18px; position: relative; }
        .message.user .message-bubble { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-bottom-right-radius: 5px; }
        .message.ai .message-bubble { background: rgba(255,255,255,0.1); color: white; border-bottom-left-radius: 5px; border: 1px solid rgba(255,255,255,0.2); }
        .message-time { font-size: 10px; opacity: 0.7; margin-top: 5px; }
        .chat-input { padding: 15px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; }
        .chat-input input { flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; color: white; outline: none; }
        .btn-send { background: linear-gradient(135deg, #43e97b, #38f9d7); color: #000; border: none; padding: 12px 20px; border-radius: 20px; cursor: pointer; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default App;