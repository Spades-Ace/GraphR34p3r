import { Box } from 'lucide-react';
import './NodePanel.css';

const NodePanel = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-panel">
      <h3>Node Types</h3>
      <div 
        className="dndnode process"
        onDragStart={(event) => onDragStart(event, 'processNode')}
        draggable
      >
        <div className="node-icon">
          <Box size={16} />
        </div>
        <span>Process Node</span>
      </div>
      
      <div className="node-panel-instructions">
        <p>Drag nodes to add them to the graph</p>
        <p>Connect nodes by dragging from one handle to another</p>
      </div>
    </div>
  );
};

export default NodePanel;