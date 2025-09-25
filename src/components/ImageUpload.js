import React, { useState, useRef } from 'react';
import '../styles/ImageUpload.css';

const ImageUpload = ({ 
  onImageUpload, 
  currentImage, 
  placeholder = "Arrastra una imagen aquí o haz clic para seleccionar",
  type = "cliente", // "cliente" o "usuario"
  className = ""
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
    console.log('Drag over detected');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    console.log('Drag leave detected');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    console.log('Drop detected');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log('File dropped:', files[0].name);
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      console.log('File selected:', files[0].name);
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    console.log('Processing file:', file.name, file.type, file.size);
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        console.log('Preview created');
      };
      reader.readAsDataURL(file);

      // Subir archivo
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('jwt');
      console.log('Uploading to:', `http://localhost:8081/api/files/upload/${type}`);
      
      const response = await fetch(`http://localhost:8081/api/files/upload/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error al subir la imagen: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (onImageUpload) {
        onImageUpload(result.filename, result.url);
      }

    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen: ' + error.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    return `http://localhost:8081/api/files/${type === 'usuario' ? 'usuarios' : 'clientes'}/${imageName}`;
  };

  const displayImage = preview || getImageUrl(currentImage);

  const handleClick = () => {
    console.log('Image upload area clicked');
    fileInputRef.current?.click();
  };

  return (
    <div className={`image-upload-container ${className}`}>
      <div
        className={`image-upload-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: '2px dashed #ddd',
          borderRadius: '50%',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? '#e3f2fd' : '#f8f9fa',
          transition: 'all 0.3s ease'
        }}
      >
        {uploading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Subiendo imagen...</p>
          </div>
        ) : displayImage ? (
          <div className="image-preview">
            <img 
              src={displayImage} 
              alt="Preview" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="image-placeholder" style={{display: 'none'}}>
              <i className="fas fa-user"></i>
              <p>Imagen no disponible</p>
            </div>
          </div>
        ) : (
          <div className="image-placeholder" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: '#6c757d',
            padding: '10px'
          }}>
            <i className="fas fa-cloud-upload-alt" style={{fontSize: '2rem', marginBottom: '8px', color: '#adb5bd'}}></i>
            <p style={{margin: 0, fontSize: '0.8rem', fontWeight: 500}}>{placeholder}</p>
            <small style={{fontSize: '0.7rem', color: '#adb5bd', marginTop: '4px'}}>Formatos: JPG, PNG, GIF (máx. 5MB)</small>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {displayImage && (
        <div className="image-actions" style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
          <button 
            type="button" 
            className="btn-change-image"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#007bff',
              color: 'white'
            }}
          >
            <i className="fas fa-edit"></i> Cambiar
          </button>
          {currentImage && (
            <button 
              type="button" 
              className="btn-remove-image"
              onClick={() => {
                setPreview(null);
                if (onImageUpload) {
                  onImageUpload(null, null);
                }
              }}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#dc3545',
                color: 'white'
              }}
            >
              <i className="fas fa-trash"></i> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 