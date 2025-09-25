import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/Sidebar.css';
import Avatar from './Avatar';

// Configuración de la API
const API_BASE_URL = 'http://localhost:8081/api';

const Sidebar = ({ visible, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configLang, setConfigLang] = useState('es');
  const [configTheme, setConfigTheme] = useState('claro');
  const [configNotif, setConfigNotif] = useState(true);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Notificaciones reales del backend
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.leida).length;

  // Función para cargar notificaciones del backend
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      // Verificar si hay token JWT
      if (!authService.isAuthenticated()) {
        setNotifications([]);
        return;
      }
      
      // Obtener el usuario del localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.id) {
        try {
          const userData = await authService.getCurrentUser();
          
          if (!userData.id) {
            setNotifications([]);
            return;
          }
        } catch (userError) {
          setNotifications([]);
          return;
        }
      }
      
      // Obtener el usuario actualizado
      const currentUser = JSON.parse(localStorage.getItem('user'));
      
      const response = await authService.authenticatedRequest(
        `${API_BASE_URL}/notificaciones/usuario/${currentUser.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Función para marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const response = await authService.authenticatedRequest(
        `${API_BASE_URL}/notificaciones/marcar-leidas`,
        { method: 'PUT' }
      );
      
      if (response.ok) {
        // Actualizar estado local
        setNotifications(notifications.map(n => ({ ...n, leida: true })));
      } else {
        console.error('Error al marcar notificaciones como leídas:', response.status);
        // Fallback: actualizar solo el estado local
        setNotifications(notifications.map(n => ({ ...n, leida: true })));
      }
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      // Fallback: actualizar solo el estado local
      setNotifications(notifications.map(n => ({ ...n, leida: true })));
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar logout local
      localStorage.removeItem('jwt');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    // Pequeño delay para asegurar que la autenticación esté completa
    const timer = setTimeout(() => {
      loadNotifications();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: 'fa-chart-line', text: 'Dashboard' },
    { path: '/inventario', icon: 'fa-box', text: 'Inventario' },
    { path: '/productos', icon: 'fa-tag', text: 'Productos' },
    { path: '/compras', icon: 'fa-shopping-cart', text: 'Compras' },
    { path: '/pedidos', icon: 'fa-truck', text: 'Pedidos' },
    { path: '/clientes', icon: 'fa-user', text: 'Clientes' },
    { path: '/usuarios', icon: 'fa-users', text: 'Usuarios' },
    { path: '/configuracion', icon: 'fa-cogs', text: 'Configuración' },
    { path: '/auditoria', icon: 'fa-shield-alt', text: 'Auditoría' }
  ];

  const favorites = [
    { id: 1, name: 'Dashboard', icon: 'fa-chart-line', path: '/dashboard' },
    { id: 2, name: 'Inventario', icon: 'fa-box', path: '/inventario' },
    { id: 3, name: 'Productos', icon: 'fa-tag', path: '/productos' },
    { id: 4, name: 'Pedidos', icon: 'fa-truck', path: '/pedidos' },
    { id: 5, name: 'Clientes', icon: 'fa-user', path: '/clientes' },
  ];

  const userProfile = {
    nombre: 'Juana Pérez',
    email: 'juana.perez@email.com',
    rol: 'Administrador',
    foto: '/imagenes/foto01 mujer.png'
  };

  const searchResults = [
    { id: 1, type: 'Producto', name: 'Producto A', extra: 'Stock: 5' },
    { id: 2, type: 'Cliente', name: 'Juan Pérez', extra: 'Pedidos: 3' },
    { id: 3, type: 'Pedido', name: 'Pedido #1234', extra: 'Estado: Pendiente' },
    { id: 4, type: 'Proveedor', name: 'Proveedor XYZ', extra: 'Última compra: 2024-06-01' },
  ];

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

  // Actualiza el usuario si cambia en localStorage (por edición de perfil)
  useEffect(() => {
    const handleStorage = () => {
      setUser(JSON.parse(localStorage.getItem('user')) || {});
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Colapsar automáticamente en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mostrar overlay y drawer solo en móvil y si visible
  return (
    <>
      {isMobile && visible && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}
      <nav className={`sidebar${collapsed ? ' collapsed' : ''}${isMobile && visible ? ' sidebar-mobile-visible' : ''}`} style={isMobile ? {position: 'fixed', left: visible ? 0 : '-100%', top: 0, height: '100vh', zIndex: 2000, transition: 'left 0.3s'} : {}}>
        <div className="logo">
          <span className="logo-icon"><i className="fa-solid fa-columns"></i></span>
          <span className="logo-icon"><i className="fa-solid fa-star"></i></span>
          <span className="logo-icon"><i className="fa-solid fa-chevron-left"></i></span>
          <span className="logo-icon"><i className="fa-solid fa-chevron-right"></i></span>
        </div>
        
        <div className="user-circles">
          <span className="user-circle user-photo" onClick={() => setShowProfile(true)} style={{cursor: 'pointer'}}>
            <Avatar src={user.avatar} alt={user.nombre || 'Usuario'} size={40} />
          </span>
          <span className="user-circle" onClick={() => setShowNotifications(true)} style={{cursor: 'pointer', position: 'relative'}}>
            <i className="fa-solid fa-bell"></i>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </span>
          <span className="user-circle" onClick={() => setShowFavorites(true)} style={{cursor: 'pointer'}}>
            <i className="fa-solid fa-star"></i>
          </span>
          <span className="user-circle" onClick={() => setShowSearch(true)} style={{cursor: 'pointer'}}><i className="fa-solid fa-magnifying-glass"></i></span>
          <span className="user-circle" onClick={() => setShowFilters(true)} style={{cursor: 'pointer'}}><i className="fa-solid fa-sliders"></i></span>
        </div>
        
        <ul className="menu">
          {menuItems.map((item) => (
            <li key={item.path} className={location.pathname === item.path ? 'activo' : ''} data-tooltip={item.text}>
              <Link to={item.path}>
                <i className={`fa-solid ${item.icon}`}></i>
                {!isMobile && <i className="fa-solid fa-chevron-right"></i>}
                {!isMobile && <span className="menu-text">{item.text}</span>}
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="footer-icons">
          <span className="icon-circle" onClick={() => setCollapsed(!collapsed)} style={{cursor: 'pointer'}}><i className="fa-solid fa-arrow-left"></i></span>
          <span className="icon-circle" onClick={() => setShowHelp(true)} style={{cursor: 'pointer'}}><i className="fa-solid fa-headphones"></i></span>
          <span className="icon-circle" onClick={() => setShowConfig(true)} style={{cursor: 'pointer'}}><i className="fa-solid fa-gear"></i></span>
          <span className="icon-circle" onClick={() => {
            const workArea = document.querySelector('.work-area');
            if (workArea) {
              workArea.scrollTo({top: 0, behavior: 'smooth'});
            }
          }} style={{cursor: 'pointer'}}><i className="fa-solid fa-arrow-up"></i></span>
          <span className="icon-circle" onClick={handleLogout} style={{cursor: 'pointer'}} title="Cerrar sesión"><i className="fa-solid fa-sign-out-alt"></i></span>
        </div>

        {showNotifications && (
          <div className="notifications-panel-overlay" onClick={() => setShowNotifications(false)}>
            <div className="notifications-panel" onClick={e => e.stopPropagation()}>
              <div className="notifications-header">
                <span>Notificaciones</span>
                <div className="notifications-actions">
                  <button 
                    className="refresh-btn" 
                    onClick={loadNotifications}
                    disabled={loadingNotifications}
                    title="Recargar notificaciones"
                  >
                    <i className={`fa-solid fa-sync-alt ${loadingNotifications ? 'fa-spin' : ''}`}></i>
                  </button>
                  <button className="close-btn" onClick={() => setShowNotifications(false)}>&times;</button>
                </div>
              </div>
              <div className="notifications-list">
                {loadingNotifications ? (
                  <div className="notification-loading">
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Cargando notificaciones...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notification-empty">
                    <i className="fa-solid fa-bell-slash"></i>
                    <span>No hay notificaciones.</span>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notification-item ${n.leida ? 'read' : 'unread'}`}>
                      <div className="notification-content">
                        <strong>{n.titulo}</strong>
                        <div className="notification-message">{n.mensaje}</div>
                        <div className="notification-time">
                          {n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleString('es-ES') : ''}
                        </div>
                      </div>
                      {!n.leida && (
                        <div className="notification-unread-indicator"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <button className="mark-all-btn" onClick={markAllAsRead}>
                  <i className="fa-solid fa-check-double"></i>
                  Marcar todas como leídas ({unreadCount})
                </button>
              )}
            </div>
          </div>
        )}

        {showFavorites && (
          <div className="favorites-panel-overlay" onClick={() => setShowFavorites(false)}>
            <div className="favorites-panel" onClick={e => e.stopPropagation()}>
              <div className="favorites-header">
                <span>Favoritos</span>
                <button className="close-btn" onClick={() => setShowFavorites(false)}>&times;</button>
              </div>
              <div className="favorites-list">
                {favorites.length === 0 ? (
                  <div className="favorites-empty">No hay favoritos.</div>
                ) : (
                  favorites.map(fav => (
                    <a key={fav.id} href={fav.path} className="favorite-item">
                      <i className={`fa-solid ${fav.icon}`}></i>
                      <span>{fav.name}</span>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {showProfile && (
          <div className="profile-panel-overlay" onClick={() => setShowProfile(false)}>
            <div className="profile-panel" onClick={e => e.stopPropagation()}>
              <div className="profile-header">
                <span>Perfil de Usuario</span>
                <button className="close-btn" onClick={() => setShowProfile(false)}>&times;</button>
              </div>
              <div className="profile-content">
                <div className="profile-avatar">
                  <img src={userProfile.foto} alt="Avatar" />
                </div>
                <div className="profile-info">
                  <div className="profile-name">{userProfile.nombre}</div>
                  <div className="profile-email">{userProfile.email}</div>
                  <div className="profile-role">{userProfile.rol}</div>
                </div>
                <button className="profile-edit-btn">Editar perfil</button>
              </div>
            </div>
          </div>
        )}

        {showSearch && (
          <div className="search-panel-overlay" onClick={() => setShowSearch(false)}>
            <div className="search-panel" onClick={e => e.stopPropagation()}>
              <div className="search-header">
                <span>Búsqueda Global</span>
                <button className="close-btn" onClick={() => setShowSearch(false)}>&times;</button>
              </div>
              <div className="search-content">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Buscar en todo el sistema..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <div className="search-results">
                  {searchTerm.trim() === '' ? (
                    <div className="search-empty">Escribe para buscar...</div>
                  ) : (
                    searchResults.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                      <div className="search-empty">Sin resultados.</div>
                    ) : (
                      searchResults.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                        <div key={r.id} className="search-result-item">
                          <span className="search-type">{r.type}</span>
                          <span className="search-name">{r.name}</span>
                          <span className="search-extra">{r.extra}</span>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showFilters && (
          <div className="filters-panel-overlay" onClick={() => setShowFilters(false)}>
            <div className="filters-panel" onClick={e => e.stopPropagation()}>
              <div className="filters-header">
                <span>Filtros Avanzados</span>
                <button className="close-btn" onClick={() => setShowFilters(false)}>&times;</button>
              </div>
              <div className="filters-content">
                <label className="filters-label">Tipo:
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="producto">Producto</option>
                    <option value="cliente">Cliente</option>
                    <option value="pedido">Pedido</option>
                    <option value="proveedor">Proveedor</option>
                  </select>
                </label>
                <label className="filters-label">Estado:
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </label>
                <label className="filters-label">Fecha:
                  <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                </label>
                <div className="filters-actions">
                  <button className="filters-apply-btn">Aplicar</button>
                  <button className="filters-clear-btn" onClick={() => {setFilterType('');setFilterStatus('');setFilterDate('');}}>Limpiar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="help-panel-overlay" onClick={() => setShowHelp(false)}>
            <div className="help-panel" onClick={e => e.stopPropagation()}>
              <div className="help-header">
                <span>Ayuda y Soporte</span>
                <button className="close-btn" onClick={() => setShowHelp(false)}>&times;</button>
              </div>
              <div className="help-content">
                <div className="help-section">
                  <strong>Contacto:</strong>
                  <div>Email: soporte@erpempresa.com</div>
                  <div>Teléfono: +57 123 456 7890</div>
                </div>
                <div className="help-section">
                  <strong>Preguntas Frecuentes:</strong>
                  <ul className="help-faq">
                    <li>¿Cómo restablezco mi contraseña?</li>
                    <li>¿Cómo registro un nuevo producto?</li>
                    <li>¿Dónde veo mis pedidos?</li>
                    <li>¿Cómo contacto al soporte?</li>
                  </ul>
                </div>
                <button className="help-send-btn">Enviar mensaje al soporte</button>
              </div>
            </div>
          </div>
        )}

        {showConfig && (
          <div className="config-panel-overlay" onClick={() => setShowConfig(false)}>
            <div className="config-panel" onClick={e => e.stopPropagation()}>
              <div className="config-header">
                <span>Configuración General</span>
                <button className="close-btn" onClick={() => setShowConfig(false)}>&times;</button>
              </div>
              <div className="config-content">
                <label className="config-label">Idioma:
                  <select value={configLang} onChange={e => setConfigLang(e.target.value)}>
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                  </select>
                </label>
                <label className="config-label">Tema:
                  <select value={configTheme} onChange={e => setConfigTheme(e.target.value)}>
                    <option value="claro">Claro</option>
                    <option value="oscuro">Oscuro</option>
                  </select>
                </label>
                <label className="config-label">
                  <input type="checkbox" checked={configNotif} onChange={e => setConfigNotif(e.target.checked)} />
                  &nbsp;Recibir notificaciones
                </label>
                <button className="config-save-btn">Guardar cambios</button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Sidebar; 