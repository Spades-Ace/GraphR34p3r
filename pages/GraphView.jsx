import React, { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from '../components/CustomNode';
import { generateNodeId, createDefaultNode, isSpecialNode } from '../utils/nodeHelpers';
import NodeAttributesPanel from '../components/NodeAttributesPanel';

const nodeTypes = {
  customNode: CustomNode,
};

function GraphView({ initialNodes, initialEdges, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAttributes, setShowAttributes] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, status: "queued" }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    setSelectedNode(node);
    setShowAttributes(true);
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
      
      setNodes((nds) => nds.concat(newNode));
    },
    [nodes, setNodes]
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
      return;
    }
    
    if (!updatedNode) {
      setShowAttributes(false);
      return;
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
  }, [selectedNode, setNodes, setEdges]);

  const handleSaveGraph = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  return (
    <div className="graph-view">
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
        >
          <Controls />
        </ReactFlow>
        {showAttributes && (
          <NodeAttributesPanel 
            node={selectedNode} 
            onUpdate={handleNodeUpdate}
            onClose={() => setShowAttributes(false)}
          />
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
