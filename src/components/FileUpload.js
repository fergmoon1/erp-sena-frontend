import React, { useState, useRef } from 'react';
import '../styles/FileUpload.css';
import Avatar from './Avatar';

const FileUpload = ({ onFileUpload, currentAvatar, userId, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Solo preview y pasar archivo y url al padre
  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onFileUpload(null, e.target.result, file); // url preview, file
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setPreview(null);
    onFileUpload('', null, null);
  };

  return (
    <div className="file-upload-container">
      {(preview || currentAvatar) ? (
        <div className="avatar-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar 
            src={preview || currentAvatar}
            alt="Avatar actual"
            size={80}
          />
          <div className="avatar-actions" style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'center' }}>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="upload-btn"
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', minWidth: 0, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', padding: '0 10px', gap: 5 }}
              title="Cambiar foto"
            >
              <i className="fas fa-edit" style={{ fontSize: 14, marginRight: 4 }}></i>
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.1 }}>Editar</span>
            </button>
            <button 
              type="button"
              onClick={removeAvatar}
              disabled={disabled}
              className="remove-btn"
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', minWidth: 0, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', padding: '0 10px', gap: 5 }}
              title="Eliminar foto"
            >
              <i className="fas fa-trash" style={{ fontSize: 14, marginRight: 4 }}></i>
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.1 }}>Eliminar</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: isDragging ? '#f3f4f6' : '#fafafa',
            borderColor: isDragging ? '#3b82f6' : '#d1d5db'
          }}
        >
          <div style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '8px' }}>
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <div style={{ fontSize: '16px', color: '#374151', marginBottom: '4px' }}>
            {'Arrastra una imagen aquí o haz clic'}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            PNG, JPG, GIF hasta 5MB
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 