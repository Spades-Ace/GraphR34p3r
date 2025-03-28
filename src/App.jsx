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
import icon7 from './assets/Icons/icon7-t.png';
import titleSvg from './assets/Fonts/Title.svg';

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
      localforage.setItem('GraphR34p3r-Flow', jsonOutput);
      
      // Make available for export
      setJsonData(jsonOutput);
      
      // Optional: Download JSON file
      const dataStr = JSON.stringify(jsonOutput, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'GraphR34p3r-Flow.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  }, [rfInstance, graphMetadata, inputFields]);

  // Function to distribute nodes based on graph structure
  const distributeNodes = (nodes, edges = []) => {
    const spacingX = 300; // Horizontal spacing between nodes
    const spacingY = 150; // Vertical spacing between nodes
    const nodeMap = {}; // Map of node id to node
    const childrenMap = {}; // Map of node id to its children
    const parentMap = {}; // Map of node id to its parents
    const nodeLevels = {}; // Map of node id to its level in the graph
    
    // Prepare node map
    nodes.forEach(node => {
      nodeMap[node.id] = node;
      childrenMap[node.id] = [];
      parentMap[node.id] = [];
    });
    
    // Build graph connections
    edges.forEach(edge => {
      if (childrenMap[edge.source]) {
        childrenMap[edge.source].push(edge.target);
      }
      if (parentMap[edge.target]) {
        parentMap[edge.target].push(edge.source);
      }
    });
    
    // Find start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter(node => 
      parentMap[node.id].length === 0 || node.id === 'node_start'
    );
    
    // Assign levels to nodes using BFS
    let queue = startNodes.map(node => ({ id: node.id, level: 0 }));
    let visited = {};
    let maxLevel = 0; // Track max level for end node placement
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      
      if (visited[id]) {
        nodeLevels[id] = Math.max(nodeLevels[id], level);
        maxLevel = Math.max(maxLevel, level);
        continue;
      }
      
      visited[id] = true;
      nodeLevels[id] = level;
      maxLevel = Math.max(maxLevel, level);
      
      childrenMap[id].forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }
    
    // Group nodes by level and parent
    const nodesByLevel = {};
    Object.entries(nodeLevels).forEach(([id, level]) => {
      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      nodesByLevel[level].push(id);
    });

    // Create parent-to-children mapping
    const parentToChildrenMap = {};
    edges.forEach(edge => {
      const parentId = edge.source;
      const childId = edge.target;
      
      if (!parentToChildrenMap[parentId]) {
        parentToChildrenMap[parentId] = [];
      }
      
      // Group children by their level to handle cases where a parent has children at different levels
      if (nodeLevels[childId] && !parentToChildrenMap[parentId].includes(childId)) {
        parentToChildrenMap[parentId].push(childId);
      }
    });
    
    // Position nodes based on level and parent-child relationships
    const positionedNodes = [...nodes];
    Object.entries(nodesByLevel).forEach(([level, nodeIds]) => {
      const x = parseInt(level) * spacingX;
      
      // Process nodes at this level
      nodeIds.forEach(nodeId => {
        // Skip end node for now, we'll position it separately
        if (nodeId === 'node_end') return;
        
        // Find node index in original array to update
        const nodeIndex = positionedNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return;
        
        // Get all parents of this node
        const parents = parentMap[nodeId];
        
        if (parents.length > 0) {
          // For simplicity, position based on the first parent
          const primaryParentId = parents[0];
          
          // Get all children of this parent at the same level
          const siblings = parentToChildrenMap[primaryParentId]?.filter(id => 
            nodeLevels[id] === parseInt(level) && id !== 'node_end'
          ) || [];
          
          if (siblings.length > 0) {
            // Sort siblings to ensure consistent ordering
            siblings.sort();
            
            // Find position in siblings
            const siblingIndex = siblings.indexOf(nodeId);
            
            if (siblingIndex !== -1) {
              // Calculate vertical positioning of siblings centered around parent
              const totalSiblings = siblings.length;
              
              // If even number of children, offset from center
              // If odd number, the middle child will be directly in front of parent
              let offset;
              if (totalSiblings % 2 === 1) {
                // Odd number of children, can be perfectly centered
                offset = siblingIndex - Math.floor(totalSiblings / 2);
              } else {
                // Even number of children, offset from center
                offset = siblingIndex - (totalSiblings / 2) + 0.5;
              }
              
              const y = spacingY * offset + spacingY; // Base y-position plus offset
              
              positionedNodes[nodeIndex] = {
                ...positionedNodes[nodeIndex],
                position: { x, y }
              };
            }
          } else {
            // No siblings, just place it in front of parent
            positionedNodes[nodeIndex] = {
              ...positionedNodes[nodeIndex],
              position: { x, y: spacingY }
            };
          }
        } else {
          // No parents, position at default position
          positionedNodes[nodeIndex] = {
            ...positionedNodes[nodeIndex],
            position: { x, y: spacingY }
          };
        }
      });
    });
    
    // Special handling for the end node
    const endNodeIndex = positionedNodes.findIndex(n => n.id === 'node_end');
    if (endNodeIndex !== -1) {
      // Position the end node at the highest level + 1 to ensure it's at the end
      const endNodeLevel = maxLevel + 1;
      const endNodeX = endNodeLevel * spacingX;
      
      // Find nodes at the highest level that connect to end node
      const endNodeParents = parentMap['node_end'] || [];
      const parentsAtMaxLevel = endNodeParents.filter(id => nodeLevels[id] === maxLevel);
      
      let endNodeY = spacingY; // Default y position
      
      if (parentsAtMaxLevel.length > 0) {
        // Calculate the average y position of all parents that connect to the end node
        let totalY = 0;
        let count = 0;
        
        parentsAtMaxLevel.forEach(parentId => {
          const parentNode = positionedNodes.find(n => n.id === parentId);
          if (parentNode && parentNode.position) {
            totalY += parentNode.position.y;
            count++;
          }
        });
        
        if (count > 0) {
          endNodeY = totalY / count; // Average y position
        }
      }
      
      positionedNodes[endNodeIndex] = {
        ...positionedNodes[endNodeIndex],
        position: { x: endNodeX, y: endNodeY }
      };
    }
    
    // Fallback positioning for any nodes that didn't get positioned
    return positionedNodes.map(node => {
      if (!node.position || (node.position.x === undefined || node.position.y === undefined)) {
        return {
          ...node,
          position: { x: 0, y: 0 },
        };
      }
      return node;
    });
  };

  // Restore saved graph
  const onRestore = useCallback(() => {
    localforage.getItem('GraphR34p3r-Flow').then((savedFlow) => {
      if (savedFlow) {
        try {
          const parsedData = parseJsonData(savedFlow);
          const distributedNodes = distributeNodes(parsedData.nodes || [], parsedData.edges || []);

          // Update states
          setNodes(distributedNodes);
          setEdges(parsedData.edges || []);
          setInputFields(parsedData.inputFields || []);
          setGraphMetadata({
            name: parsedData.name || "",
            label: parsedData.label || "",
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
        const distributedNodes = distributeNodes(parsedData.nodes || [], parsedData.edges || []);

        // Update states
        setNodes(distributedNodes);
        setEdges(parsedData.edges || []);
        setInputFields(parsedData.inputFields || []);
        setGraphMetadata({
          name: parsedData.name || "",
          label: parsedData.label || "",
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
              "description": "",
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
        <div className="header-logo-title">
          <a href="https://graphr34p3r.exace.in/">
            <img src={icon7} alt="App Icon" className="app-icon" />
          </a>
            <img src={titleSvg} alt="Graph R34p3r" className="app-title" />        
        </div>
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
