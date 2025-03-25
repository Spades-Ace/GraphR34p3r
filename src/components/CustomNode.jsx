import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import './CustomNode.css';

const CustomNode = ({ data, isConnectable }) => {
  const [isSelected, setIsSelected] = useState(false);
  
  const StatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Activity size={14} />;
      case 'completed':
        return <CheckCircle size={14} />;
      case 'failed':
        return <AlertCircle size={14} />;
      default: // queued - not shown to user
        return null;
    }
  };

  return (
    <div 
      className={`custom-node ${isSelected ? 'selected' : ''}`}
      onClick={() => setIsSelected(!isSelected)}
      style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 14, height: 14, background: '#6a5acd' }}
        isConnectable={isConnectable}
      />
      <div className="custom-node-header">
        {data.label}
      </div>
      <div className="custom-node-content">
        {data.description && <div className="node-description">{data.description}</div>}
        {data.status && data.status !== 'queued' && (
          <div className="node-status">
            <StatusIcon /> {data.status}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 14, height: 14, background: '#6a5acd' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default CustomNode;