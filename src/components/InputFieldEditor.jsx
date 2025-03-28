import { useState } from 'react';
import { Plus, Trash2, Save, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import './InputFieldEditor.css';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

// Create a draggable field item component
const DraggableFieldItem = ({ field, index, moveField, handleEditField, handleDeleteField, handleMoveField }) => {
  const ref = React.useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'FIELD',
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      // Time to actually perform the action
      moveField(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for performance
      item.index = hoverIndex;
    },
  });
  
  // Apply both drag and drop refs to the entire tile
  drag(drop(ref));
  
  return (
    <div 
      ref={ref} 
      className={`field-item ${isDragging ? 'dragging' : ''}`}
      style={{ 
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab'
      }}
    >
      <div className="field-item-header">
        <div className="drag-indicator">
          <GripVertical size={16} />
        </div>
        <h3>{field.label || 'Unnamed Field'}</h3>
        <div className="field-actions">
          <button onClick={() => handleMoveField(index, 'up')} className="move-btn">
            <ArrowUp size={16} />
          </button>
          <button onClick={() => handleMoveField(index, 'down')} className="move-btn">
            <ArrowDown size={16} />
          </button>
          <button onClick={() => handleEditField(index)} className="edit-btn">
            Edit
          </button>
          <button onClick={() => handleDeleteField(index)} className="delete-btn">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="field-details">
        <p><strong>Type:</strong> {field.type}</p>
        <p><strong>Key:</strong> {field.key}</p>
        <p>{field.description}</p>
        {field.required && <span className="required-badge">Required</span>}
      </div>
    </div>
  );
};

const InputFieldEditor = ({ inputFields = [], onSave }) => {
  const [fields, setFields] = useState(inputFields);
  const [editMode, setEditMode] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);

  // Handler for adding a new input field
  const handleAddField = () => {
    const newField = {
      key: `Field_key_${fields.length + 1}`,
      description: "",
      type: "text", // Default type
      label: `Field ${fields.length + 1}`,
      required: true,
      editable: true,
      example: ""
    };
    
    setCurrentField(newField);
    setCurrentIndex(fields.length);
    setEditMode(true);
  };

  // Handler for editing an existing field
  const handleEditField = (index) => {
    setCurrentField({...fields[index]});
    setCurrentIndex(index);
    setEditMode(true);
  };

  // Handler for deleting a field
  const handleDeleteField = (index) => {
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
    
    // If currently editing the removed field, exit edit mode
    if (currentIndex === index) {
      setEditMode(false);
      setCurrentField(null);
      setCurrentIndex(null);
    }
    
    // Automatically save changes after deletion
    onSave(updatedFields);
  };

  // Handler for saving field changes
  const handleFieldSave = () => {
    if (!currentField) return;
    
    const updatedFields = [...fields];
    
    if (currentIndex !== null && currentIndex < fields.length) {
      // Update existing field
      updatedFields[currentIndex] = currentField;
    } else {
      // Add new field
      updatedFields.push(currentField);
    }
    
    setFields(updatedFields);
    setEditMode(false);
    setCurrentField(null);
    setCurrentIndex(null);
    
    // Save changes
    onSave(updatedFields);
  };

  // Handler for field change
  const handleFieldChange = (key, value) => {
    setCurrentField({
      ...currentField,
      [key]: value
    });
  };

  // Handler for adding dropdown options
  const handleAddOption = () => {
    const newOption = { name: "New Option", value: "new_option" };
    const updatedOptions = currentField.options ? [...currentField.options, newOption] : [newOption];
    
    setCurrentField({
      ...currentField,
      options: updatedOptions
    });
  };

  // Handler for editing dropdown options
  const handleOptionChange = (index, key, value) => {
    const updatedOptions = [...currentField.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [key]: value
    };
    
    setCurrentField({
      ...currentField,
      options: updatedOptions
    });
  };

  // Handler for deleting dropdown options
  const handleDeleteOption = (index) => {
    const updatedOptions = [...currentField.options];
    updatedOptions.splice(index, 1);
    
    setCurrentField({
      ...currentField,
      options: updatedOptions
    });
  };

  // Move a field up or down in the list
  const handleMoveField = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === fields.length - 1)) {
      return;
    }
    
    const updatedFields = [...fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap fields
    [updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]];
    
    setFields(updatedFields);
    onSave(updatedFields);
  };
  
  // Function for drag-and-drop reordering
  const moveField = (dragIndex, hoverIndex) => {
    const updatedFields = [...fields];
    const draggedField = updatedFields[dragIndex];
    
    // Remove dragged item
    updatedFields.splice(dragIndex, 1);
    // Add it at the new position
    updatedFields.splice(hoverIndex, 0, draggedField);
    
    setFields(updatedFields);
    onSave(updatedFields);
  };

  return (
    <div className="input-field-editor">
      <div className="editor-header">
        <div className="editor-title">
          <h2>Input Fields</h2>
        </div>
        <button onClick={handleAddField} className="add-field-btn">
          <Plus size={16} /> Add Input Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="no-fields-message">
          <p>No input fields defined. Click "Add Input Field" to create one.</p>
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="fields-list">
            {fields.map((field, index) => (
              <DraggableFieldItem
                key={index}
                field={field}
                index={index}
                moveField={moveField}
                handleEditField={handleEditField}
                handleDeleteField={handleDeleteField}
                handleMoveField={handleMoveField}
              />
            ))}
          </div>
        </DndProvider>
      )}

      {editMode && currentField && (
        <div className="field-editor-modal">
          <div className="field-editor-content">
            <h3>{currentIndex !== null && currentIndex < fields.length ? 'Edit Field' : 'Add Field'}</h3>
            
            <div className="form-group">
              <label>Field Key:</label>
              <input
                type="text"
                value={currentField.key || ''}
                onChange={(e) => handleFieldChange('key', e.target.value)}
                placeholder="Enter field key"
              />
            </div>
            
            <div className="form-group">
              <label>Label:</label>
              <input
                type="text"
                value={currentField.label || ''}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                placeholder="Enter field label"
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={currentField.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={3}
                placeholder="Enter description"
              />
            </div>
            
            <div className="form-group">
              <label>Type:</label>
              <select
                value={currentField.type || 'text'}
                onChange={(e) => handleFieldChange('type', e.target.value)}
              >
                <option value="text">Text</option>
                <option value="dropdown">Dropdown</option>
                <option value="file">File Upload</option>
              </select>
            </div>
            
            {currentField.type === 'dropdown' && (
              <div className="dropdown-options">
                <label>Dropdown Options:</label>
                {currentField.options && currentField.options.map((option, idx) => (
                  <div key={idx} className="option-item">
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={option.name}
                      onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={option.value}
                      onChange={(e) => handleOptionChange(idx, 'value', e.target.value)}
                    />
                    <button type="button" onClick={() => handleDeleteOption(idx)} className="delete-option-btn">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleAddOption} className="add-option-btn">
                  <Plus size={14} /> Add Option
                </button>
              </div>
            )}
            
            <div className="form-group">
              <label>Example:</label>
              <input
                type="text"
                value={currentField.example || ''}
                onChange={(e) => handleFieldChange('example', e.target.value)}
                placeholder="Enter example"
              />
            </div>
            
            <div className="form-group checkboxes">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="required"
                  checked={currentField.required || false}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                />
                <label htmlFor="required">Required</label>
              </div>
              
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="editable"
                  checked={currentField.editable || false}
                  onChange={(e) => handleFieldChange('editable', e.target.checked)}
                />
                <label htmlFor="editable">Editable</label>
              </div>
            </div>
            
            <div className="editor-actions">
              <button onClick={() => setEditMode(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleFieldSave} className="save-btn">
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputFieldEditor;