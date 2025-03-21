import { useState, useRef } from 'react';
import { Download, Upload } from 'lucide-react';

const JSONImportExport = ({ onImport, onExport, jsonData }) => {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsedData = JSON.parse(content);
        
        // Basic validation to ensure JSON structure is correct
        if (!parsedData.graph || !parsedData.graph.graph) {
          throw new Error('Invalid JSON structure: Missing graph data');
        }
        
        setError(null);
        onImport(parsedData);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setError(`Error parsing JSON: ${error.message}`);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = null;
  };

  return (
    <div className="json-import-export">
      <div className="import-section">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <button 
          className="import-btn"
          onClick={() => fileInputRef.current.click()}
        >
          <Upload size={20} /> Import JSON
        </button>
      </div>
      
      <div className="export-section">
        <button 
          className="export-btn"
          onClick={onExport}
          disabled={!jsonData}
        >
          <Download size={20} /> Export JSON
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default JSONImportExport;