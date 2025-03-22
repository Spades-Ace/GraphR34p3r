import React, { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from "../components/CustomNode";
import { generateNodeId, createDefaultNode, isSpecialNode } from "../utils/nodeHelpers";
import NodeAttributesPanel from "../components/NodeAttributesPanel";
import { ChevronLeft, ChevronRight, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

const nodeTypes = {
  customNode: CustomNode,
};

function GraphView({ initialNodes, initialEdges, onSave, graphMetadata }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAttributes, setShowAttributes] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [attributePanelVisible, setAttributePanelVisible] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, status: "queued" }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    setSelectedNode(node);
    setShowAttributes(true);
    setAttributePanelVisible(true);
  }, [nodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      
      if (typeof nodeType === 'undefined' || !nodeType) {
        return;
      }

      const reactFlowBounds = document.querySelector('.react-flow').getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      const newNodeId = generateNodeId(nodes);
      const newNode = createDefaultNode(newNodeId, position);
      
      // If we have a module from graphMetadata, add it to the new node's steps
      if (graphMetadata?.modules?.length > 0) {
        const moduleValue = graphMetadata.modules[0];
        if (newNode.steps && newNode.steps.length > 0) {
          newNode.steps = newNode.steps.map(step => {
            const key = Object.keys(step)[0];
            return {
              [key]: {
                ...step[key],
                module: moduleValue
              }
            };
          });
        }
      }
      
      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes, graphMetadata]
  );

  const handleNodeUpdate = useCallback((updatedNode, deleteNode = false) => {
    if (deleteNode) {
      // Delete node
      setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
      
      // Delete connected edges
      setEdges((eds) => eds.filter(
        e => e.source !== selectedNode.id && e.target !== selectedNode.id
      ));
      
      setSelectedNode(null);
      setShowAttributes(false);
      setAttributePanelVisible(false);
      return;
    }
    
    if (!updatedNode) {
      setShowAttributes(false);
      setAttributePanelVisible(false);
      return;
    }
    
    // Apply module from graph metadata if available and node is not a special node
    if (graphMetadata?.modules?.length > 0 && 
        updatedNode.steps && 
        updatedNode.steps.length > 0 && 
        !isSpecialNode(updatedNode.id)) {
      
      const moduleValue = graphMetadata.modules[0];
      updatedNode.steps = updatedNode.steps.map(step => {
        const key = Object.keys(step)[0];
        return {
          [key]: {
            ...step[key],
            module: moduleValue
          }
        };
      });
    }
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === updatedNode.id) {
          return updatedNode;
        }
        return node;
      })
    );
    
    setShowAttributes(false);
    setAttributePanelVisible(false);
  }, [selectedNode, setNodes, setEdges, graphMetadata]);

  const handleSaveGraph = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleAttributePanel = () => {
    setAttributePanelVisible(!attributePanelVisible);
    if (!attributePanelVisible) {
      setShowAttributes(true);
    }
  };

  const handleCloseAttributePanel = () => {
    setShowAttributes(false);
    setAttributePanelVisible(false);
  };

  return (
    <div className="graph-view">
      <div className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="node-panel">
          <h3>Process Nodes</h3>
          <div 
            className="dndnode process" 
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', 'process');
            }}
            draggable
          >
            Process Node
          </div>
          
          <h3>Input Nodes</h3>
          <div 
            className="dndnode input" 
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow', 'input');
            }}
            draggable
          >
            Input Field
          </div>
          
          <div className="node-panel-instructions">
            <p>Drag nodes to the canvas and connect them to create your graph. Click on a node to edit its properties.</p>
          </div>
        </div>
      </div>
      
      <button 
        className={`sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`} 
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <div className="react-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          elementsSelectable={true}
          onNodeClick={(e, node) => onNodeClick(node.id)}
        >
          <Controls />
        </ReactFlow>

        {/* Attribute Panel Toggle Button */}
        <button 
          className="attribute-panel-toggle" 
          onClick={toggleAttributePanel}
          aria-label={attributePanelVisible ? 'Hide attribute panel' : 'Show attribute panel'}
        >
          {attributePanelVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        {/* Attribute Panel with visibility class */}
        {showAttributes && (
          <div className={`attribute-panel ${attributePanelVisible ? 'visible' : ''}`}>
            <NodeAttributesPanel 
              node={selectedNode} 
              onUpdate={handleNodeUpdate}
              onClose={handleCloseAttributePanel}
              graphMetadata={graphMetadata}
            />
          </div>
        )}
      </div>
      <div className="graph-actions">
        <button onClick={handleSaveGraph} className="save-btn">
          Save Graph
        </button>
      </div>
    </div>
  );
}

export default GraphView;
