/**
 * Utility functions for JSON operations
 */

// Parse JSON from example format
export const parseJsonData = (jsonData) => {
  try {
    // Extract nodes and edges
    const nodes = jsonData.graph?.graph?.nodes || [];
    const edges = jsonData.graph?.graph?.edges || [];
    const modules = jsonData.graph?.modules || [];
    const inputFields = jsonData.input_fields || [];
    
    // Sort nodes by id
    nodes.sort((a, b) => {
      if (a.id === 'node_start') return -1;
      if (b.id === 'node_start') return 1;
      if (a.id === 'node_end') return 1;
      if (b.id === 'node_end') return -1;
      return a.id.localeCompare(b.id);
    });
    
    return { 
      nodes, 
      edges, 
      modules,
      inputFields,
      name: jsonData.name || '',
      description: jsonData.description || '',
      category: jsonData.category || '',
      family: jsonData.family || '',
      version: jsonData.version || '1.0.0',
      requirec2: jsonData.requirec2 === 'True' // Convert to boolean
    };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { nodes: [], edges: [], modules: [], inputFields: [], version: '1.0.0' };
  }
};

// Create full JSON in the example format
export const createFullJson = (data) => {
  return {
    "_id": {
      "$oid": ""
    },
    "version": data.version || "1.0.0",
    "graph": {
      "graph": {
        "nodes": data.nodes.map(node => {
          const { width, height, selected, positionAbsolute, dragging, ...rest } = node;
          return {
            ...rest,
            position: { x: 0, y: 0 },
            steps: node.steps.map(step => {
              const key = Object.keys(step)[0];
              return {
                [key]: {
                  ...step[key],
                  module: data.modules[0] || ''
                }
              };
            })
          };
        }),
        "edges": data.edges.map(edge => {
          const { sourceHandle, targetHandle, ...rest } = edge;
          return {
            ...rest,
            id: edge.id.replace(/^e/, '')
          };
        })
      },
      "modules": data.modules || []
    },
    "name": data.name || "New Graph",
    "label": data.name || "New Graph",
    "group": "",
    "family": data.family || "Network",
    "category": data.category || "Vulnerability Assessment",
    "description": data.description || "",
    "type": null,
    "subType": null,
    "input_fields": data.inputFields || [],
    "requirec2": data.requirec2 || false // Change to boolean
  };
};
