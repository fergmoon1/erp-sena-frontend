import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../styles/Layout.css';

const Layout = ({ children, title, subtitle }) => {
  // Estado para controlar la visibilidad de la Sidebar en móvil
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Función para alternar la Sidebar (se pasa a Navbar)
  const toggleSidebar = () => setSidebarVisible((v) => !v);
  // Función para cerrar la Sidebar (se pasa a Sidebar para cerrar al hacer click fuera)
  const closeSidebar = () => setSidebarVisible(false);

  return (
    <div className="container-fluid">
      <Sidebar visible={sidebarVisible} onClose={closeSidebar} />
      <main className="contenido">
        <Navbar title={title} subtitle={subtitle} onHamburgerClick={toggleSidebar} />
        <section className="work-area">
          <div className="work-area-zoom">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout; 