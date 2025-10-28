import React from 'react';
import { Handle, Position } from 'reactflow';

const LLMEngineNode = ({ data, id }) => {
  return (
    <div className="node llm-engine-node">
      <div className="node-header">
        <div className="node-icon">🤖</div>
        <span>LLM Engine</span>
        <button onClick={() => data.onDelete && data.onDelete(id)} className="node-delete">×</button>
      </div>
      <div className="node-status">
        {data?.webSearch ? '🌐 Web Search ON' : '🔒 Web Search OFF'}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <style jsx>{`
        .llm-engine-node { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 15px; border-radius: 12px; 
                          min-width: 140px; color: white; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3); border: 1px solid rgba(255,255,255,0.2); }
        .node-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; margin-bottom: 8px; }
        .node-icon { font-size: 16px; margin-right: 8px; }
        .node-delete { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; border-radius: 50%; 
                      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
        .node-status { font-size: 11px; opacity: 0.9; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LLMEngineNode;