import React, { useState, useEffect } from 'react';
import { isSpecialNode } from '../utils/nodeHelpers';

function NodeAttributesPanel({ node, onUpdate, onClose }) {
  const [label, setLabel] = useState('');
  const [steps, setSteps] = useState([]);
  const isSpecial = isSpecialNode(node?.id);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      setSteps(node.steps || []);
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;
    
    onUpdate({
      ...node,
      data: {
        ...node.data,
        label,
      },
      steps,
    });
  };

  const updateStep = (index, key, field, value) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [key]: {
        ...updatedSteps[index][key],
        [field]: value
      }
    };
    setSteps(updatedSteps);
  };

  const updateFunctionName = (index, oldKey, newKey) => {
    const updatedSteps = [...steps];
    const stepData = updatedSteps[index][oldKey];
    
    // Create new object with new key
    updatedSteps[index] = {
      [newKey]: stepData
    };
    
    setSteps(updatedSteps);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        "newFunction": {
          "label": "New Function",
          "description": "Description for this function",
          "module": "",
          "mitre": "Null"
        }
      }
    ]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  if (!node) return null;

  return (
    <div className="attributes-panel">
      <div className="panel-header">
        <h3>Node Attributes</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="panel-content">
        <div className="form-group">
          <label>Node Label:</label>
          <input 
            type="text" 
            value={label} 
            onChange={(e) => setLabel(e.target.value)}
            disabled={isSpecial}
          />
        </div>
        
        {!isSpecial && (
          <>
            <h4>Steps</h4>
            {steps.map((step, index) => {
              const functionName = Object.keys(step)[0];
              const stepData = step[functionName];
              
              return (
                <div key={index} className="step-container">
                  <div className="form-group">
                    <label>Function Name:</label>
                    <input 
                      type="text" 
                      value={functionName} 
                      onChange={(e) => updateFunctionName(index, functionName, e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Label:</label>
                    <input 
                      type="text" 
                      value={stepData.label} 
                      onChange={(e) => updateStep(index, functionName, "label", e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea 
                      value={stepData.description} 
                      onChange={(e) => updateStep(index, functionName, "description", e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Module:</label>
                    <input 
                      type="text" 
                      value={stepData.module} 
                      onChange={(e) => updateStep(index, functionName, "module", e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>MITRE:</label>
                    <input 
                      type="text" 
                      value={stepData.mitre} 
                      onChange={(e) => updateStep(index, functionName, "mitre", e.target.value)}
                    />
                  </div>
                  
                  <button className="remove-btn" onClick={() => removeStep(index)}>
                    Remove Step
                  </button>
                </div>
              );
            })}
            
            <button className="add-btn" onClick={addStep}>
              Add Step
            </button>
          </>
        )}
        
        <div className="panel-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          {!isSpecial && (
            <button className="delete-btn" onClick={() => onUpdate(null, true)}>
              Delete Node
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NodeAttributesPanel;
