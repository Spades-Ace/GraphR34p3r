import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AttributePanel.css';

const AttributePanel = ({ node, onUpdate, onClose }) => {
  const [nodeData, setNodeData] = useState({ ...node });
  const [functionName, setFunctionName] = useState('');
  const [stepData, setStepData] = useState({});
  
  useEffect(() => {
    setNodeData({ ...node });
    
    // If there's a step, get the first one
    if (node.steps && node.steps.length > 0) {
      const firstStep = node.steps[0];
      const firstFunctionName = Object.keys(firstStep)[0] || '';
      setFunctionName(firstFunctionName);
      const { module, ...rest } = firstStep[firstFunctionName] || {};
      setStepData(rest);
    } else if (!isSpecialNode) {
      // Create default step if node doesn't have any
      const defaultFunctionName = "new_function";
      const defaultStep = {
        "label": node.data.label || "New Function",
        "description": "Add description here",
        "mitre": "Null"
      };
      setFunctionName(defaultFunctionName);
      setStepData(defaultStep);
    }
  }, [node]);

  const isSpecialNode = node.id === 'node_start' || node.id === 'node_end';

  const handleLabelChange = (e) => {
    const updatedData = {
      ...nodeData,
      data: {
        ...nodeData.data,
        label: e.target.value
      }
    };
    setNodeData(updatedData);
    onUpdate(updatedData);
  };

  const handleFunctionNameChange = (e) => {
    setFunctionName(e.target.value);
    const { module, ...rest } = stepData;
    updateNodeWithCurrentStepData(e.target.value, rest);
  };

  const handleStepDataChange = (key, value) => {
    const updatedStepData = {
      ...stepData,
      [key]: value
    };
    const { module, ...rest } = updatedStepData;
    setStepData(rest);
    updateNodeWithCurrentStepData(functionName, rest);
  };
  
  const updateNodeWithCurrentStepData = (funcName, stepDataObj) => {
    // Create step object with function name as key
    const step = {
      [funcName]: stepDataObj
    };
    
    const updatedNode = {
      ...nodeData,
      steps: [step]
    };
    
    setNodeData(updatedNode);
    onUpdate(updatedNode);
  };
  
  const handleDeleteNode = () => {
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(null, true);
    }
  };

  if (!node) return null;

  return (
    <div className="attribute-panel">
      <div className="attribute-panel-header">
        <h3>Node Attributes</h3>
        {onClose && (
          <button className="close-panel-btn" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>
      
      <div className="attribute-form">
        <div className="form-row">
          <div className="form-group">
            <label>Label:</label>
            <input
              type="text"
              value={nodeData.data.label || ''}
              onChange={handleLabelChange}
              placeholder="Enter label"
            />
          </div>
          
          <div className="form-group">
            <label>Node ID:</label>
            <input type="text" value={nodeData.id} disabled />
          </div>
        </div>

        {/* Single Step Section - Only show for non-special nodes */}
        {!isSpecialNode && (
          <div className="step-section">
            <h4>Function Details</h4>
            
            <div className="step-item">
              <div className="form-group">
                <label>Function Name:</label>
                <input
                  type="text"
                  value={functionName || ''}
                  onChange={handleFunctionNameChange}
                  placeholder="Enter function name"
                />
              </div>
              
              <div className="form-group">
                <label>Label:</label>
                <input
                  type="text"
                  value={stepData.label || ''}
                  onChange={(e) => handleStepDataChange('label', e.target.value)}
                  placeholder="Enter step label"
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={stepData.description || ''}
                  onChange={(e) => handleStepDataChange('description', e.target.value)}
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              
              <div className="form-group">
                <label>MITRE:</label>
                <input
                  type="text"
                  value={stepData.mitre || 'Null'}
                  onChange={(e) => handleStepDataChange('mitre', e.target.value)}
                  placeholder="Enter MITRE"
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="panel-actions">
          {!isSpecialNode && (
            <button onClick={handleDeleteNode} className="delete-node-btn">
              Delete Node
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttributePanel;