import React, { createContext, useContext, useState, useEffect } from 'react';
import '../styles/NotificationProvider.css';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para obtener notificaciones del backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) return;

      setLoading(true);
      const response = await fetch(`http://localhost:8081/api/notificaciones/usuario/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Notificaciones recibidas del backend:', data);
        setNotifications(data);
      } else {
        console.error('Error fetching notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para marcar notificación como leída en el backend
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) return;

      const response = await fetch(`http://localhost:8081/api/notificaciones/${id}/marcar-leida`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Actualizar estado local
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, leida: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Función para marcar todas como leídas en el backend
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) return;

      const response = await fetch(`http://localhost:8081/api/notificaciones/usuario/${user.id}/marcar-todas-leidas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Actualizar estado local
        setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Función para agregar notificación local (para feedback inmediato)
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      leida: false
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
    
    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addStockAlert = (product) => {
    const existingAlert = stockAlerts.find(alert => alert.productId === product.id);
    if (!existingAlert) {
      setStockAlerts(prev => [...prev, {
        id: Date.now(),
        productId: product.id,
        product: product,
        timestamp: new Date(),
        read: false
      }]);
      
      // Add notification
      addNotification({
        type: 'warning',
        title: 'Stock Bajo',
        message: `${product.nombre} tiene stock bajo (${product.stockActual} unidades)`,
        product: product
      });
    }
  };

  const removeStockAlert = (productId) => {
    setStockAlerts(prev => prev.filter(alert => alert.productId !== productId));
  };

  const clearStockAlerts = () => {
    setStockAlerts([]);
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Check for stock alerts periodically
  useEffect(() => {
    const checkStockAlerts = async () => {
      try {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        const response = await fetch('http://localhost:8081/api/reportes/stock-bajo', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const criticalStock = await response.json();
          criticalStock.forEach(product => {
            if (product.stockActual <= 5) {
              addStockAlert(product);
            }
          });
        } else if (response.status === 403) {
          // Usuario no tiene permisos para ver reportes
          console.log('Usuario no tiene permisos para ver reportes de stock');
        } else if (response.status === 401) {
          // Token expirado o inválido
          console.log('Token de autenticación inválido');
        }
      } catch (error) {
        // Silenciar errores de red para evitar spam en consola
        if (error.name !== 'TypeError' || !error.message.includes('NetworkError')) {
          console.error('Error checking stock alerts:', error);
        }
      }
    };

    // Check immediately
    checkStockAlerts();

    // Check every 5 minutes
    const interval = setInterval(checkStockAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    notifications,
    stockAlerts,
    loading,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    addStockAlert,
    removeStockAlert,
    clearStockAlerts,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 