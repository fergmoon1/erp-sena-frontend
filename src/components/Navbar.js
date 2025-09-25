import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import Avatar from './Avatar';

const Navbar = ({ title, subtitle, onHamburgerClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
  const navigate = useNavigate();

  // Debug: mostrar el título que se recibe
  // console.log('Navbar recibió title:', title);
  // console.log('Navbar recibió subtitle:', subtitle);

  // Actualiza el usuario si cambia en localStorage (por edición de perfil)
  useEffect(() => {
    const handleStorage = () => {
      setUser(JSON.parse(localStorage.getItem('user')) || {});
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const zoomDiv = document.querySelector('.work-area-zoom');
    if (zoomDiv) {
      zoomDiv.style.transform = `scale(${zoom})`;
      zoomDiv.style.transformOrigin = 'top left';
      zoomDiv.style.width = `${100 / zoom}%`;
      zoomDiv.style.height = `${100 / zoom}%`;
    }
  }, [zoom]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('refreshToken');
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Ignorar errores de red
    }
    navigate('/login?logout=true', { replace: true });
  };

  return (
    <header className="topbar">
      <div className="hamburger" onClick={onHamburgerClick}>
        <i className="fa-solid fa-bars"></i>
      </div>

      <div className={`topbar-content ${isMenuOpen ? 'active' : ''}`}>
        <div className="dashboard-texto">
          <h1>{title || "ERP SENA"}</h1>
          <p>{subtitle || "Sistema de Gestión Empresarial"}</p>
        </div>

        {/* Fecha y hora como elemento independiente */}
        <div className="hora-modern">
          <div className="fecha-modern">
            <i className="fa-regular fa-calendar"></i> {formatDate(currentTime)}
          </div>
          <div className="tiempo-modern">{formatTime(currentTime)}</div>
        </div>

        <div className="spacer"></div>

        {/* Solo el avatar y datos del usuario */}
        <div className="perfil">
          <div className="perfil-texto">
            <Avatar 
              src={user.avatar}
              alt="Usuario"
              size={52}
              className=""
            />
            <strong>{`${user.nombre ? user.nombre : ''}${user.apellido ? ' ' + user.apellido : ''}`.trim() || 'Usuario'}</strong>
            <span>{user.rol || "Rol"}</span>
          </div>
        </div>

        <div className="navbar-derecha" style={{marginLeft: '8px'}}>
          <div className="busqueda" style={{marginRight: '0'}}>
            <input type="text" placeholder="Buscar..." />
            <i className="fa-solid fa-moon" onClick={() => setDarkMode(dm => !dm)} style={{cursor: 'pointer'}}></i>
            <i className="fa-solid fa-magnifying-glass-plus" onClick={() => setZoom(z => Math.min(z + 0.1, 1.3))} style={{cursor: 'pointer'}}></i>
            <i className="fa-solid fa-magnifying-glass-minus" onClick={() => setZoom(z => Math.max(z - 0.1, 0.8))} style={{cursor: 'pointer'}}></i>
          </div>
          <div className="logout-modern" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '18px', gap: '0px'}}>
            <i
              className="fa-solid fa-right-from-bracket logout-icon"
              style={{fontSize: '1.35rem', color: '#444', cursor: 'pointer', marginBottom: '2px'}}
              onClick={handleLogout}
              title="Cerrar sesión"
            ></i>
            <span style={{fontSize: '15px', fontFamily: 'inherit', color: '#444', fontWeight: 500, lineHeight: 1.1, marginTop: '0px'}}>Cerrar sesión</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 