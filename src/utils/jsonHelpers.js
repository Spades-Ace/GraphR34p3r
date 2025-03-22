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
        "nodes": data.nodes.map(node => ({
          ...node,
          // Ensure each node has status property but it's not shown to user
          data: {
            ...node.data,
            status: node.data.status || 'queued'
          },
          steps: node.steps || [],
          info: node.info || {}
        })),
        "edges": data.edges.map(edge => ({
          ...edge,
          info: edge.info || {},
          status: edge.status || 'queued'
        }))
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
