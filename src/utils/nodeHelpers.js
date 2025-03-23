/**
 * Utility functions for node handling
 */

// Generate unique node ID based on existing nodes
export const generateNodeId = (nodes) => {
  // Special nodes are handled separately
  
  // Count existing numbered nodes
  const numberedNodes = nodes.filter(node => 
    node.id.startsWith('node_') && 
    !['node_start', 'node_end'].includes(node.id)
  );
  
  // Find the highest number in existing nodes
  let highestNumber = 0;
  
  numberedNodes.forEach(node => {
    const idNumber = parseInt(node.id.replace('node_', ''), 10);
    if (!isNaN(idNumber) && idNumber > highestNumber) {
      highestNumber = idNumber;
    }
  });
  
  // Get the next number in sequence
  const nextNumber = highestNumber + 1;
  
  return `node_${nextNumber}`;
};

// Check if a node is a special node (start or end)
export const isSpecialNode = (nodeId) => {
  return nodeId === 'node_start' || nodeId === 'node_end';
};

// Create a new default node with proper structure
export const createDefaultNode = (id, position) => {
  return {
    id,
    type: 'customNode',
    data: {
      label: id === 'node_start' ? 'Start' : 
             id === 'node_end' ? 'End' : 'New Node',
      status: 'queued' // Included in JSON but not shown in UI
    },
    position,
    steps: id === 'node_start' || id === 'node_end' ? [] : [
      {
        "newFunction": {
          "label": "New Function",
          "description": "Description for this function",
          "module": "",
          "mitre": "Null"
        }
      }
    ],
    info: {}
  };
};

// Format node data for saving to JSON
export const formatNodesForSave = (nodes, edges) => {
  // Format according to example.json structure
  return {
    graph: {
      nodes: nodes,
      edges: edges
    },
    modules: []
  };
};
