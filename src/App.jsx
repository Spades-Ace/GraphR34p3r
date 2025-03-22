import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import localforage from 'localforage';
import { Sun, Moon, Upload, Download, RotateCcw, Save, PanelLeft } from 'lucide-react';

// Custom node types
import CustomNode from './components/CustomNode';
import AttributePanel from './components/AttributePanel';
import NodePanel from './components/NodePanel';
import JSONImportExport from './components/JSONImportExport';
import InputFieldEditor from './components/InputFieldEditor';
import GraphView from "./pages/GraphView";
import InputView from "./pages/InputView";

// Utilities
import { generateNodeId, createDefaultNode } from "./utils/nodeHelpers";
import { createFullJson, parseJsonData } from "./utils/jsonHelpers";

// Initialize the node types
const nodeTypes = {
  customNode: CustomNode,
};

// Initial nodes with Start and End - positioning updated for better visibility
const initialNodes = [
  {
    id: 'node_start',
    type: 'customNode',
    data: { label: 'Start', status: 'queued' },
    position: { x: 250, y: 150 },
    style: { backgroundColor: '#f5f5f5', border: '2px solid #6a5acd' },
    steps: []
  },
  {
    id: 'node_end',
    type: 'customNode',
    data: { label: 'End', status: 'queued' },
    position: { x: 600, y: 150 },
    style: { backgroundColor: '#f5f5f5', border: '2px solid #6a5acd' },
    steps: []
  },
];

const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'input'
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [inputFields, setInputFields] = useState([]);
  const [graphMetadata, setGraphMetadata] = useState({
    name: "Node Visualizer Graph",
    label: "Node Visualizer Graph",
    group: "",
    family: "",
    category: "",
    description: "",
    type: null,
    subType: null,
    requirec2: "False",
    version: "1.0.0"
  });

  // Load theme preference on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    // Try to restore data from localStorage
    onRestore();
  }, []);

  // Connect nodes with edges
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      id: `e${params.source}-${params.target}`,
      status: 'queued',
      info: {},
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Handle node click to show attributes
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle edge double click to delete
  const onEdgeDoubleClick = useCallback((event, edge) => {
    // Delete the edge
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, [setEdges]);

  // Handle node updates, including deletion
  const handleNodeUpdate = useCallback((updatedNode, deleteNode = false) => {
    if (deleteNode && selectedNode) {
      // Delete the node
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      
      // Delete connected edges
      setEdges((eds) => eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      ));
      
      setSelectedNode(null);
      return;
    }
    
    if (updatedNode) {
      setNodes((nds) =>
        nds.map((n) => (n.id === updatedNode.id ? updatedNode : n))
      );
    }
  }, [selectedNode, setNodes, setEdges]);

  // Close the attribute panel
  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Save current graph state
  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      
      // Format the data according to the required JSON structure
      const jsonOutput = createFullJson({
        nodes: flow.nodes,
        edges: flow.edges,
        inputFields,
        ...graphMetadata
      });

      // Save to local storage
      localforage.setItem('node-visualizer-flow', jsonOutput);
      
      // Make available for export
      setJsonData(jsonOutput);
      
      // Optional: Download JSON file
      const dataStr = JSON.stringify(jsonOutput, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'node-visualizer-flow.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [rfInstance, graphMetadata, inputFields]);

  // Restore saved graph
  const onRestore = useCallback(() => {
    localforage.getItem('node-visualizer-flow').then((savedFlow) => {
      if (savedFlow) {
        try {
          const parsedData = parseJsonData(savedFlow);
          
          // Update states
          setNodes(parsedData.nodes || []);
          setEdges(parsedData.edges || []);
          setInputFields(parsedData.inputFields || []);
          setGraphMetadata({
            name: parsedData.name || "Node Visualizer Graph",
            label: parsedData.label || "Node Visualizer Graph",
            group: parsedData.group || "",
            family: parsedData.family || "",
            category: parsedData.category || "",
            description: parsedData.description || "",
            type: parsedData.type || null,
            subType: parsedData.subType || null,
            requirec2: parsedData.requirec2 || "False",
            version: parsedData.version || "1.0.0"
          });
          setJsonData(savedFlow);
        } catch (error) {
          console.error('Error restoring saved flow:', error);
        }
      }
    });
  }, [setNodes, setEdges]);

  // Handle file upload for JSON import
  const onFileUpload = (jsonData) => {
    try {
      if (jsonData) {
        const parsedData = parseJsonData(jsonData);
        
        // Update states
        setNodes(parsedData.nodes || []);
        setEdges(parsedData.edges || []);
        setInputFields(parsedData.inputFields || []);
        setGraphMetadata({
          name: parsedData.name || "Node Visualizer Graph",
          label: parsedData.label || "Node Visualizer Graph",
          group: parsedData.group || "",
          family: parsedData.family || "",
          category: parsedData.category || "",
          description: parsedData.description || "",
          type: parsedData.type || null,
          subType: parsedData.subType || null,
          requirec2: parsedData.requirec2 || "False",
          version: parsedData.version || "1.0.0"
        });
        setJsonData(jsonData);
      }
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
  };

  // Reset to initial state
  const onReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    setInputFields([]);
    setGraphMetadata({
      name: "Node Visualizer Graph",
      label: "Node Visualizer Graph",
      group: "",
      family: "",
      category: "",
      description: "",
      type: null,
      subType: null,
      requirec2: "False",
      version: "1.0.0"
    });
  }, [setNodes, setEdges]);

  // Toggle dark/light mode
  const toggleTheme = useCallback(() => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle between graph view and input view
  const toggleView = useCallback(() => {
    setViewMode(viewMode === 'graph' ? 'input' : 'graph');
  }, [viewMode]);

  // Store the instance of ReactFlow
  const onInit = useCallback((reactFlowInstance) => {
    setRfInstance(reactFlowInstance);
    
    // Fit the view to show all nodes
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 50);
  }, []);
  
  // Handle drag over for react-flow
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for react-flow
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = rfInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Create a unique node ID with proper sequence
      const id = generateNodeId(nodes);
      
      // Create node based on type
      let newNode = createDefaultNode(id, position);

      // Handle different node types
      switch (type) {
        case 'textInput':
          newNode.data.label = 'Text Input';
          newNode.data.inputType = 'text';
          break;
        case 'dropdown':
          newNode.data.label = 'Dropdown';
          newNode.data.inputType = 'dropdown';
          newNode.steps = [{
            "dropdown_input": {
              "label": "Dropdown Input",
              "description": "A dropdown selection input",
              "module": "input",
              "mitre": "Null"
            }
          }];
          break;
        case 'fileUpload':
          newNode.data.label = 'File Upload';
          newNode.data.inputType = 'file';
          newNode.steps = [{
            "file_upload": {
              "label": "File Upload",
              "description": "A file upload input field",
              "module": "input",
              "mitre": "Null"
            }
          }];
          break;
        case 'processNode':
          newNode.data.label = 'Process Node';
          newNode.steps = [{
            "process_step": {
              "label": "Process Step",
              "description": "Add description for this step",
              "module": "default",
              "mitre": "Null"
            }
          }];
          break;
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes, nodes]
  );

  // Handle metadata change
  const handleMetadataChange = (key, value) => {
    setGraphMetadata(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save input fields from editor
  const handleSaveInputFields = (updatedFields) => {
    setInputFields(updatedFields);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <h1>Node Visualizer</h1>
        <div className="header-controls">
          <button onClick={toggleView} className="view-toggle-btn">
            {viewMode === 'graph' ? <PanelLeft size={16} /> : <PanelLeft size={16} />}
            {viewMode === 'graph' ? 'Input View' : 'Graph View'}
          </button>
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onReset} className="reset-btn">
            <RotateCcw size={16} />
          </button>
          <JSONImportExport onImport={onFileUpload} onExport={onSave} jsonData={jsonData} />
        </div>
      </div>

      <div className="content">
        {viewMode === 'graph' ? (
          <div className="graph-view">
            <ReactFlowProvider>
              <div className="sidebar">
                <NodePanel />
                <div className="node-panel-instructions">
                  <strong>How to use:</strong>
                  <ol>
                    <li>Drag node types from the sidebar to the canvas</li>
                    <li>Connect nodes by dragging from one handle to another</li>
                    <li>Click on a node to edit its properties</li>
                    <li>Double-click on an edge to delete it</li>
                  </ol>
                </div>
              </div>
              <div 
                className={`flow-container ${selectedNode ? 'flow-container-with-panel' : ''}`} 
                ref={reactFlowWrapper}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onEdgeDoubleClick={onEdgeDoubleClick}
                  onInit={onInit}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  defaultZoom={1}
                  minZoom={0.2}
                  maxZoom={4}
                  fitView
                >
                  <Controls />
                  <Background color="#aaa" gap={16} />
                  <Panel position="bottom-right">
                    <div className="panel-buttons">
                      <button onClick={onSave} className="save-btn">
                        <Save size={16} /> Save
                      </button>
                      <button onClick={onRestore} className="restore-btn">
                        <Upload size={16} /> Load
                      </button>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
              
              {selectedNode && (
                <AttributePanel 
                  node={selectedNode} 
                  onUpdate={handleNodeUpdate}
                  onClose={handleClosePanel}
                />
              )}
            </ReactFlowProvider>
          </div>
        ) : (
          <div className="input-view">
            <div className="input-metadata">
              <h2>Graph Metadata</h2>
              <div className="metadata-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={graphMetadata.name || ''}
                      onChange={(e) => handleMetadataChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Version:</label>
                    <input
                      type="text"
                      value={graphMetadata.version || '1.0.0'}
                      onChange={(e) => handleMetadataChange('version', e.target.value)}
                      placeholder="1.0.0"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Label:</label>
                  <input
                    type="text"
                    value={graphMetadata.label || ''}
                    onChange={(e) => handleMetadataChange('label', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Group:</label>
                  <input
                    type="text"
                    value={graphMetadata.group || ''}
                    onChange={(e) => handleMetadataChange('group', e.target.value)}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Family:</label>
                    <input
                      type="text"
                      value={graphMetadata.family || ''}
                      onChange={(e) => handleMetadataChange('family', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category:</label>
                    <input
                      type="text"
                      value={graphMetadata.category || ''}
                      onChange={(e) => handleMetadataChange('category', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={graphMetadata.description || ''}
                    onChange={(e) => handleMetadataChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type:</label>
                    <input
                      type="text"
                      value={graphMetadata.type || ''}
                      onChange={(e) => handleMetadataChange('type', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Sub-Type:</label>
                    <input
                      type="text"
                      value={graphMetadata.subType || ''}
                      onChange={(e) => handleMetadataChange('subType', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="requirec2"
                    checked={graphMetadata.requirec2 === "True"}
                    onChange={(e) => handleMetadataChange('requirec2', e.target.checked ? "True" : "False")}
                  />
                  <label htmlFor="requirec2">Require C2</label>
                </div>
              </div>
            </div>
            
            <InputFieldEditor 
              inputFields={inputFields}
              onSave={handleSaveInputFields}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
