import React, { useState } from 'react';
import '../styles/Avatar.css';

const Avatar = ({ src, alt, size = 40, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const getImageSrc = () => {
    if (imageError) {
      return '/imagenes/foto01 mujer.png';
    }
    if (!src) {
      return '/imagenes/foto01 mujer.png';
    }
    if (src.startsWith('http')) {
      return src;
    }
    if (src.startsWith('/api/files/usuarios/')) {
      return `http://localhost:8081${src}`;
    }
    // Si es solo el nombre del archivo
    return `http://localhost:8081/api/files/usuarios/${src}`;
  };

  return (
    <div 
      className={`avatar-container ${className} ${!imageLoaded ? 'loading' : ''}`}
      style={{
        width: size,
        height: size
      }}
    >
      {!imageLoaded && (
        <div className="avatar-placeholder">
          <i className="fas fa-user" style={{ fontSize: size * 0.4 }}></i>
        </div>
      )}
      <img
        src={getImageSrc()}
        alt={alt}
        style={{
          display: imageLoaded ? 'block' : 'none'
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};

export default Avatar; 