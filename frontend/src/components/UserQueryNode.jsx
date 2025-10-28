import React from 'react';
import { Handle, Position } from 'reactflow';

const UserQueryNode = ({ data, id }) => {
  return (
    <div className="node user-query-node">
      <div className="node-header">
        <div className="node-icon">👤</div>
        <span>User Query</span>
        <button onClick={() => data.onDelete && data.onDelete(id)} className="node-delete">×</button>
      </div>
      <Handle type="source" position={Position.Right} />
      
      <style jsx>{`
        .user-query-node { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 12px; 
                          min-width: 140px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); border: 1px solid rgba(255,255,255,0.2); }
        .node-header { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
        .node-icon { font-size: 16px; margin-right: 8px; }
        .node-delete { background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; border-radius: 50%; 
                      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
};

export default UserQueryNode;