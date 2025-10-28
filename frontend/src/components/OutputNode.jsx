import React from 'react';
import { Handle, Position } from 'reactflow';

const OutputNode = ({ data, id }) => {
  return (
    <div className="node output-node">
      <div className="node-header">
        <div className="node-icon">💬</div>
        <span>Output</span>
        <button onClick={() => data.onDelete && data.onDelete(id)} className="node-delete">×</button>
      </div>
      <Handle type="target" position={Position.Left} />
      
      <style jsx>{`
        .output-node { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 15px; border-radius: 12px; 
                      min-width: 140px; color: white; box-shadow: 0 4px 15px rgba(67, 233, 123, 0.3); border: 1px solid rgba(255,255,255,0.2); }
        .node-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
        .node-icon { font-size: 16px; margin-right: 8px; }
        .node-delete { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; border-radius: 50%; 
                      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
};

export default OutputNode;