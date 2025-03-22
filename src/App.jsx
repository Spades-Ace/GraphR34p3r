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
import { Sun, Moon, Upload, Download, RotateCcw, Save, PanelLeft, ChevronLeft, ChevronRight } from 'lucide-react';

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
    steps: []
  },
  {
    id: 'node_end',
    type: 'customNode',
    data: { label: 'End', status: 'queued' },
    position: { x: 600, y: 150 },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [graphMetadata, setGraphMetadata] = useState({
    name: "",
    label: "",
    group: "",
    family: "",
    category: "",
    description: "",
    type: null,
    subType: null,
    requirec2: false, // Change to boolean
    version: "1.0.0",
    modules: [] // Add modules field
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

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prevState => !prevState);
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
      localforage.setItem('Graph-Visualizer-Flow', jsonOutput);
      
      // Make available for export
      setJsonData(jsonOutput);
      
      // Optional: Download JSON file
      const dataStr = JSON.stringify(jsonOutput, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'Graph-Visualizer-Flow.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [rfInstance, graphMetadata, inputFields]);

  // Function to distribute nodes evenly
  const distributeNodes = (nodes) => {
    const spacingX = 300; // Horizontal spacing between nodes
    const spacingY = 150; // Vertical spacing between nodes
    let currentX = 0;
    let currentY = 0;

    return nodes.map((node, index) => {
      if (index % 5 === 0 && index !== 0) { // Move to the next row after 5 nodes
        currentX = 0;
        currentY += spacingY;
      }
      const newNode = {
        ...node,
        position: { x: currentX, y: currentY },
      };
      currentX += spacingX;
      return newNode;
    });
  };

  // Restore saved graph
  const onRestore = useCallback(() => {
    localforage.getItem('Graph-Visualizer-Flow').then((savedFlow) => {
      if (savedFlow) {
        try {
          const parsedData = parseJsonData(savedFlow);
          const distributedNodes = distributeNodes(parsedData.nodes || []);

          // Update states
          setNodes(distributedNodes);
          setEdges(parsedData.edges || []);
          setInputFields(parsedData.inputFields || []);
          setGraphMetadata({
            name: parsedData.name || "Graph Visualizer",
            label: parsedData.label || "Graph Visualizer",
            group: parsedData.group || "",
            family: parsedData.family || "",
            category: parsedData.category || "",
            description: parsedData.description || "",
            type: parsedData.type || null,
            subType: parsedData.subType || null,
            requirec2: parsedData.requirec2 === false, // Convert to boolean
            version: parsedData.version || "1.0.0",
            modules: parsedData.modules || [] // Add modules field
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
        const distributedNodes = distributeNodes(parsedData.nodes || []);

        // Update states
        setNodes(distributedNodes);
        setEdges(parsedData.edges || []);
        setInputFields(parsedData.inputFields || []);
        setGraphMetadata({
          name: parsedData.name || "Graph Visualizer",
          label: parsedData.label || "Graph Visualizer",
          group: parsedData.group || "",
          family: parsedData.family || "",
          category: parsedData.category || "",
          description: parsedData.description || "",
          type: parsedData.type || null,
          subType: parsedData.subType || null,
          requirec2: parsedData.requirec2 === false, // Convert to boolean
          version: parsedData.version || "1.0.0",
          modules: parsedData.modules || [] // Add modules field
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
      name: "Graph Visualizer",
      label: "Graph Visualizer",
      group: "",
      family: "",
      category: "",
      description: "",
      type: null,
      subType: null,
      requirec2: false, // Change to boolean
      version: "1.0.0",
      modules: [] // Add modules field
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
              "label": "Process Name",
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
      [key]: key === 'requirec2' ? Boolean(value) : value // Convert to boolean
    }));
  };

  // Save input fields from editor
  const handleSaveInputFields = (updatedFields) => {
    setInputFields(updatedFields);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <h1>Graph R34p3r</h1>
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
              <div className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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
              
              <button 
                className={`sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`} 
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              
              <div 
                className={`flow-container 
                  ${sidebarCollapsed ? 'sidebar-collapsed' : ''} 
                  ${selectedNode ? 'flow-container-with-panel' : ''}
                `}
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
                      placeholder="Enter graph name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Version:</label>
                    <input
                      type="text"
                      value={graphMetadata.version || '1.0.0'}
                      onChange={(e) => handleMetadataChange('version', e.target.value)}
                      placeholder="Enter version"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Label:</label>
                  <input
                    type="text"
                    value={graphMetadata.label || ''}
                    onChange={(e) => handleMetadataChange('label', e.target.value)}
                    placeholder="Enter label"
                  />
                </div>
                
                <div className="form-group">
                  <label>Group:</label>
                  <input
                    type="text"
                    value={graphMetadata.group || ''}
                    onChange={(e) => handleMetadataChange('group', e.target.value)}
                    placeholder="Enter group"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Family:</label>
                    <input
                      type="text"
                      value={graphMetadata.family || ''}
                      onChange={(e) => handleMetadataChange('family', e.target.value)}
                      placeholder="Enter family"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category:</label>
                    <input
                      type="text"
                      value={graphMetadata.category || ''}
                      onChange={(e) => handleMetadataChange('category', e.target.value)}
                      placeholder="Enter category"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Module:</label>
                  <input
                    type="text"
                    value={graphMetadata.modules[0] || ''}
                    onChange={(e) => handleMetadataChange('modules', [e.target.value.trim()])}
                    placeholder="Enter module"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={graphMetadata.description || ''}
                    onChange={(e) => handleMetadataChange('description', e.target.value)}
                    rows={4}
                    placeholder="Enter description"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type:</label>
                    <input
                      type="text"
                      value={graphMetadata.type || ''}
                      onChange={(e) => handleMetadataChange('type', e.target.value)}
                      placeholder="Enter type"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Sub-Type:</label>
                    <input
                      type="text"
                      value={graphMetadata.subType || ''}
                      onChange={(e) => handleMetadataChange('subType', e.target.value)}
                      placeholder="Enter sub-type"
                    />
                  </div>
                </div>
                
                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="requirec2"
                    checked={graphMetadata.requirec2}
                    onChange={(e) => handleMetadataChange('requirec2', e.target.checked)}
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
