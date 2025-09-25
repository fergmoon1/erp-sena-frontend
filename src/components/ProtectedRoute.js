import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

export default ProtectedRoute; 