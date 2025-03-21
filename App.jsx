import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import GraphView from './pages/GraphView';
import InputView from './pages/InputView';
import { parseJsonData, createFullJson } from './utils/jsonHelpers';

// Import example JSON for initial state
import exampleJson from './support/example.json';

function App() {
  // Parse the example JSON
  const initialData = parseJsonData(exampleJson);
  
  const [nodes, setNodes] = useState(initialData.nodes);
  const [edges, setEdges] = useState(initialData.edges);
  const [inputFields, setInputFields] = useState(initialData.inputFields);
  const [metadata, setMetadata] = useState({
    name: initialData.name,
    description: initialData.description,
    family: initialData.family,
    category: initialData.category,
    modules: initialData.modules
  });
  
  const [activeView, setActiveView] = useState('graph'); // 'graph' or 'input'
  const [jsonOutput, setJsonOutput] = useState('');
  
  // Function to save the complete graph
  const saveGraph = (updatedNodes, updatedEdges) => {
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    
    // Generate the full JSON
    const fullJson = createFullJson({
      nodes: updatedNodes,
      edges: updatedEdges,
      inputFields,
      ...metadata
    });
    
    // Show the JSON output
    setJsonOutput(JSON.stringify(fullJson, null, 2));
  };
  
  // Function to save input fields
  const saveInputFields = (updatedFields) => {
    setInputFields(updatedFields);
    
    // Update the JSON output
    const fullJson = createFullJson({
      nodes,
      edges,
      inputFields: updatedFields,
      ...metadata
    });
    
    setJsonOutput(JSON.stringify(fullJson, null, 2));
  };
  
  // Function to update metadata
  const updateMetadata = (field, value) => {
    setMetadata({
      ...metadata,
      [field]: value
    });
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Node Visualizer</h1>
        <div className="view-toggle">
          <button 
            className={activeView === 'graph' ? 'active' : ''} 
            onClick={() => setActiveView('graph')}
          >
            Graph View
          </button>
          <button 
            className={activeView === 'input' ? 'active' : ''} 
            onClick={() => setActiveView('input')}
          >
            Input Fields
          </button>
          <button 
            className={activeView === 'metadata' ? 'active' : ''} 
            onClick={() => setActiveView('metadata')}
          >
            Metadata
          </button>
        </div>
      </header>
      
      <main className="app-content">
        <div className="sidebar">
          <div className="sidebar-content">
            <h3>Node Types</h3>
            <div 
              className="dndnode" 
              draggable 
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'customNode');
              }}
            >
              Custom Node
            </div>
          </div>
        </div>
        
        <div className="content-area">
          {activeView === 'graph' && (
            <ReactFlowProvider>
              <GraphView 
                initialNodes={nodes} 
                initialEdges={edges}
                onSave={saveGraph}
              />
            </ReactFlowProvider>
          )}
          
          {activeView === 'input' && (
            <InputView 
              inputFields={inputFields}
              onSave={saveInputFields}
            />
          )}
          
          {activeView === 'metadata' && (
            <div className="metadata-view">
              <h2>Workflow Metadata</h2>
              <div className="form-group">
                <label>Name:</label>
                <input 
                  type="text" 
                  value={metadata.name} 
                  onChange={(e) => updateMetadata('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Description:</label>
                <textarea 
                  value={metadata.description} 
                  onChange={(e) => updateMetadata('description', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Family:</label>
                <input 
                  type="text" 
                  value={metadata.family} 
                  onChange={(e) => updateMetadata('family', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Category:</label>
                <input 
                  type="text" 
                  value={metadata.category} 
                  onChange={(e) => updateMetadata('category', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Modules (comma separated):</label>
                <input 
                  type="text" 
                  value={metadata.modules.join(',')} 
                  onChange={(e) => updateMetadata('modules', e.target.value.split(',').map(m => m.trim()))}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="output-panel">
          <h3>JSON Output</h3>
          <pre>{jsonOutput}</pre>
        </div>
      </main>
    </div>
  );
}

export default App;
