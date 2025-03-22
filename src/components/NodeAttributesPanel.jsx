import React, { useState, useEffect } from 'react';
import { isSpecialNode } from '../utils/nodeHelpers';
import { X } from 'lucide-react';

function NodeAttributesPanel({ node, onUpdate, onClose, graphMetadata }) {
  const [label, setLabel] = useState('');
  const [steps, setSteps] = useState([]);
  const isSpecial = isSpecialNode(node?.id);
  
  // Get the module value from graph metadata
  const moduleValue = graphMetadata?.modules?.[0] || '';

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      setSteps(node.steps || []);
    }
  }, [node]);

  const handleSave = () => {
    if (!node) return;
    
    // Update all steps with the module value from graph metadata
    const updatedSteps = steps.map(step => {
      const key = Object.keys(step)[0];
      return {
        [key]: {
          ...step[key],
          module: moduleValue // Use the module from graph metadata
        }
      };
    });
    
    onUpdate({
      ...node,
      data: {
        ...node.data,
        label,
      },
      steps: updatedSteps,
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
          "module": moduleValue, // Use the module from graph metadata
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
    <div className="attribute-panel">
      <div className="attribute-panel-header">
        <h3>Node Attributes</h3>
        <button className="close-panel-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="attribute-form">
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
            <div className="form-group">
              <label>Module:</label>
              <input 
                type="text" 
                value={moduleValue} 
                disabled
                placeholder="Module defined in graph metadata"
              />
              <small className="helper-text">This module value is applied from graph metadata</small>
            </div>

            <div className="steps-section">
              <h4>Steps</h4>
              {steps.map((step, index) => {
                const functionName = Object.keys(step)[0];
                const stepData = step[functionName];
                
                return (
                  <div key={index} className="step-item">
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
            </div>
          </>
        )}
        
        <div className="panel-actions">
          <button onClick={handleSave} className="save-btn">Save</button>
          {!isSpecial && (
            <button className="delete-node-btn" onClick={() => onUpdate(null, true)}>
              Delete Node
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NodeAttributesPanel;
