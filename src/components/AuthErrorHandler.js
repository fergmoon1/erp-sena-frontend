import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthErrorHandler = ({ error, onClearError }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      // Si es un error de autenticación, intentar refrescar el token
      if (error.status === 401 || error.message?.includes('Sesión expirada')) {
        handleAuthError();
      }
    }
  }, [error]);

  const handleAuthError = async () => {
    try {
      // Intentar refrescar el token
      await authService.refreshToken();
      // Si el refresh es exitoso, limpiar el error
      onClearError();
    } catch (refreshError) {
      // Si el refresh falla, hacer logout
      console.log('No se pudo refrescar el token, cerrando sesión...');
      await authService.logout();
      navigate('/login', { 
        state: { 
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' 
        } 
      });
    }
  };

  if (!error) return null;

  return (
    <div className="auth-error-overlay">
      <div className="auth-error-modal">
        <div className="auth-error-header">
          <i className="fa-solid fa-exclamation-triangle"></i>
          <h3>Error de Autenticación</h3>
        </div>
        <div className="auth-error-content">
          <p>{error.message || 'Ha ocurrido un error de autenticación.'}</p>
          <div className="auth-error-actions">
            <button 
              className="btn-retry" 
              onClick={handleAuthError}
            >
              Reintentar
            </button>
            <button 
              className="btn-logout" 
              onClick={async () => {
                await authService.logout();
                navigate('/login');
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorHandler; 