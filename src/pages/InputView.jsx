import React, { useState } from 'react';

function InputView({ inputFields, onSave, graphMetadata }) {
  const [fields, setFields] = useState(inputFields || []);
  const [metadata, setMetadata] = useState(graphMetadata || {
    name: '',
    label: '',
    group: '',
    family: '',
    category: '',
    description: '',
    type: null,
    subType: null,
    modules: [],
    requirec2: 'False'
  });

  const addInputField = () => {
    setFields([
      ...fields,
      {
        key: `fc_field_${fields.length + 1}`,
        description: "Field description",
        type: "text",
        label: "New Field",
        required: true,
        editable: true,
        example: ""
      }
    ]);
  };

  const updateField = (index, field, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFields(updatedFields);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateDropdownOptions = (index, optionIndex, field, value) => {
    const updatedFields = [...fields];
    const options = [...updatedFields[index].options];
    options[optionIndex] = { ...options[optionIndex], [field]: value };
    updatedFields[index] = { ...updatedFields[index], options };
    setFields(updatedFields);
  };

  const addDropdownOption = (index) => {
    const updatedFields = [...fields];
    if (!updatedFields[index].options) {
      updatedFields[index].options = [];
    }
    updatedFields[index].options.push({ name: "New Option", value: "new_option" });
    setFields(updatedFields);
  };

  const removeDropdownOption = (fieldIndex, optionIndex) => {
    const updatedFields = [...fields];
    updatedFields[fieldIndex].options = updatedFields[fieldIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setFields(updatedFields);
  };

  const updateMetadata = (field, value) => {
    setMetadata({
      ...metadata,
      [field]: value
    });
  };

  const updateModules = (value) => {
    // Convert comma-separated string to array
    const moduleArray = value.split(',').map(item => item.trim()).filter(item => item);
    setMetadata({
      ...metadata,
      modules: moduleArray
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(fields, metadata);
    }
  };

  const renderFieldEditor = (field, index) => {
    return (
      <div key={index} className="input-field-editor">
        <div className="form-group">
          <label>Field Key:</label>
          <input
            type="text"
            value={field.key}
            onChange={(e) => updateField(index, "key", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Label:</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(index, "label", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Type:</label>
          <select
            value={field.type}
            onChange={(e) => updateField(index, "type", e.target.value)}
          >
            <option value="text">Text</option>
            <option value="dropdown">Dropdown</option>
            <option value="file">File</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={field.description}
            onChange={(e) => updateField(index, "description", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Example:</label>
          <input
            type="text"
            value={field.example || ""}
            onChange={(e) => updateField(index, "example", e.target.value)}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => updateField(index, "required", e.target.checked)}
            />
            Required
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={field.editable}
              onChange={(e) => updateField(index, "editable", e.target.checked)}
            />
            Editable
          </label>
        </div>

        {field.type === "dropdown" && (
          <div className="dropdown-options">
            <h4>Dropdown Options</h4>
            {(field.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="dropdown-option">
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) =>
                      updateDropdownOptions(index, optionIndex, "name", e.target.value)
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Value:</label>
                  <input
                    type="text"
                    value={option.value}
                    onChange={(e) =>
                      updateDropdownOptions(index, optionIndex, "value", e.target.value)
                    }
                  />
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeDropdownOption(index, optionIndex)}
                >
                  Remove Option
                </button>
              </div>
            ))}
            <button className="add-btn" onClick={() => addDropdownOption(index)}>
              Add Option
            </button>
          </div>
        )}

        <button className="remove-btn" onClick={() => removeField(index)}>
          Remove Field
        </button>
      </div>
    );
  };

  return (
    <div className="input-view">
      {/* Graph Metadata Section */}
      <div className="input-metadata">
        <h2>Graph Metadata</h2>
        <div className="metadata-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={metadata.name}
                onChange={(e) => updateMetadata("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Label:</label>
              <input
                type="text"
                value={metadata.label}
                onChange={(e) => updateMetadata("label", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Group:</label>
              <input
                type="text"
                value={metadata.group}
                onChange={(e) => updateMetadata("group", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Family:</label>
              <input
                type="text"
                value={metadata.family}
                onChange={(e) => updateMetadata("family", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <input
                type="text"
                value={metadata.category}
                onChange={(e) => updateMetadata("category", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Modules (comma-separated):</label>
            <input
              type="text"
              value={metadata.modules.join(', ')}
              onChange={(e) => updateModules(e.target.value)}
              placeholder="Enter modules separated by commas"
            />
            <small className="helper-text">These modules will apply to all nodes by default</small>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={metadata.description}
              onChange={(e) => updateMetadata("description", e.target.value)}
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type:</label>
              <input
                type="text"
                value={metadata.type || ''}
                onChange={(e) => updateMetadata("type", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Sub-Type:</label>
              <input
                type="text"
                value={metadata.subType || ''}
                onChange={(e) => updateMetadata("subType", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="requirec2"
              checked={metadata.requirec2 === 'True'}
              onChange={(e) => updateMetadata("requirec2", e.target.checked ? 'True' : 'False')}
            />
            <label htmlFor="requirec2">Require C2</label>
          </div>
        </div>
      </div>

      {/* Input Fields Section */}
      <h2>Input Fields</h2>
      <div className="input-fields-list">
        {fields.map((field, index) => renderFieldEditor(field, index))}
      </div>
      <div className="input-view-actions">
        <button className="add-btn" onClick={addInputField}>
          Add Input Field
        </button>
        <button className="save-btn" onClick={handleSave}>
          Save Fields
        </button>
      </div>
    </div>
  );
}

export default InputView;
