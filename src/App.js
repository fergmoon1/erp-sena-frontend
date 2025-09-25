import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventarioPage from "./pages/InventarioPage";
import ProductosPage from "./pages/ProductosPage";
import PedidosPage from "./pages/PedidosPage";
import ClientesPage from "./pages/ClientesPage";
import UsuariosPage from "./pages/UsuariosPage";
import ConfiguracionPage from "./pages/ConfiguracionPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./components/NotificationProvider";
import './App.css';
import './styles/theme.css';
import authService from "./services/authService";
import ComprasPage from "./pages/ComprasPage";

function App() {
  // Manejar tokens de OAuth2 si vienen en la URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refreshToken');
  
  if (token && refreshToken) {
    localStorage.setItem('jwt', token);
    localStorage.setItem('refreshToken', refreshToken);
    // Obtener el usuario actual y guardarlo en localStorage
    authService.getCurrentUser().catch(() => {});
    // Limpia la URL
    window.history.replaceState({}, document.title, '/');
  }

  return (
    <NotificationProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inventario"
              element={
                <ProtectedRoute>
                  <Layout title="Inventarios" subtitle="Gestión de Inventario"><InventarioPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/productos"
              element={
                <ProtectedRoute>
                  <Layout title="Productos" subtitle="Gestión de Productos"><ProductosPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/pedidos"
              element={
                <ProtectedRoute>
                  <Layout title="Pedidos" subtitle="Gestión de Pedidos"><PedidosPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/clientes"
              element={
                <ProtectedRoute>
                  <ClientesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/usuarios"
              element={
                <ProtectedRoute>
                  <Layout title="Usuarios" subtitle="Gestión de Usuarios"><UsuariosPage /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracion"
              element={
                <ProtectedRoute>
                  <Layout title="Configuración" subtitle="Ajustes del Sistema"><ConfiguracionPage /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auditoria"
              element={
                <ProtectedRoute>
                  <Layout title="Auditoría" subtitle="Logs de Seguridad"><AuditoriaPage /></Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/compras"
              element={
                <ProtectedRoute>
                  <Layout title="Compras" subtitle="Gestión de Compras"><ComprasPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
