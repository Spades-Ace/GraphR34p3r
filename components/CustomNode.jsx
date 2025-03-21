import React from 'react';
import { Handle, Position } from 'reactflow';
import { isSpecialNode } from '../utils/nodeHelpers';

function CustomNode({ data, id, selected, onClick }) {
  // Don't display status in UI as requested
  const isSpecial = isSpecialNode(id);
  
  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''} ${isSpecial ? 'special-node' : ''}`}
      onClick={() => onClick(id)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="custom-node-content">
        <div className="node-label">{data.label}</div>
        {!isSpecial && (
          <div className="node-controls">
            <button className="edit-btn" onClick={(e) => {
              e.stopPropagation();
              onClick(id);
            }}>Edit</button>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default CustomNode;
