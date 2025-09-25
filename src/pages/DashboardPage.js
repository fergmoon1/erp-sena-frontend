import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/DashboardPage.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import IndicadoresWidget from '../components/IndicadoresWidget';

const DashboardPage = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [ingresosPorMes, setIngresosPorMes] = useState([]);
  const [pedidosPorEstado, setPedidosPorEstado] = useState([]);
  const [clientesNuevosPorMes, setClientesNuevosPorMes] = useState([]);
  const [alertasStock, setAlertasStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datosReales, setDatosReales] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  // Capturar tokens de la URL si vienen de OAuth
  useEffect(() => {
    console.log('DashboardPage - URL actual:', location.search);
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');

    console.log('DashboardPage - Token encontrado:', !!token);
    console.log('DashboardPage - RefreshToken encontrado:', !!refreshToken);

    if (token && refreshToken) {
      console.log('DashboardPage - Guardando tokens en localStorage');
      // Guardar tokens en localStorage
      localStorage.setItem('jwt', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Limpiar la URL
      navigate('/dashboard', { replace: true });
    } else {
      console.log('DashboardPage - No se encontraron tokens en la URL');
    }
  }, [location, navigate]);

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    // Solo redirigir si no hay token y no estamos ya en /login
    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [navigate, location.pathname]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('jwt');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Dashboard general
      const dashboardRes = await fetch('http://localhost:8081/api/reportes/dashboard', { headers });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboardData(data);
        console.log('Dashboard data:', data);
      } else {
        console.error('Error fetching dashboard:', dashboardRes.status);
      }

      // Productos más vendidos
      const productosRes = await fetch('http://localhost:8081/api/reportes/ventas/productos-mas-vendidos', { headers });
      if (productosRes.ok) {
        const data = await productosRes.json();
        setProductosMasVendidos(data || []);
        console.log('Productos más vendidos:', data);
      } else {
        console.error('Error fetching productos:', productosRes.status);
      }

      // Ingresos por mes
      const ingresosRes = await fetch('http://localhost:8081/api/reportes/ingresos-por-mes', { headers });
      if (ingresosRes.ok) {
        const data = await ingresosRes.json();
        setIngresosPorMes(data || []);
        console.log('Ingresos por mes:', data);
      } else {
        console.error('Error fetching ingresos:', ingresosRes.status);
      }

      // Pedidos por estado
      const pedidosRes = await fetch('http://localhost:8081/api/reportes/pedidos-por-estado', { headers });
      if (pedidosRes.ok) {
        const data = await pedidosRes.json();
        setPedidosPorEstado(data || []);
        console.log('Pedidos por estado:', data);
      } else {
        console.error('Error fetching pedidos por estado:', pedidosRes.status);
      }

      // Clientes nuevos por mes
      const clientesRes = await fetch('http://localhost:8081/api/reportes/clientes-nuevos-por-mes', { headers });
      if (clientesRes.ok) {
        const data = await clientesRes.json();
        setClientesNuevosPorMes(data || []);
        console.log('Clientes nuevos por mes:', data);
      } else {
        console.error('Error fetching clientes:', clientesRes.status);
      }

      // Alertas de stock bajo
      const stockRes = await fetch('http://localhost:8081/api/reportes/inventario/stock-bajo', { headers });
      if (stockRes.ok) {
        const data = await stockRes.json();
        setAlertasStock(data || []);
        console.log('Alertas de stock:', data);
      } else {
        console.error('Error fetching stock bajo:', stockRes.status);
      }

      // Obtener datos adicionales reales
      await fetchDatosReales(headers);

    } catch (err) {
      console.error('Error en fetchDashboardData:', err);
      setError('Error al cargar los datos del dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener datos reales adicionales
  const fetchDatosReales = async (headers) => {
    try {
      // Obtener total de clientes real
      const clientesRes = await fetch('http://localhost:8081/api/clientes', { headers });
      if (clientesRes.ok) {
        const clientes = await clientesRes.json();
        setDatosReales(prev => ({ ...prev, totalClientes: clientes.length }));
      }

      // Obtener total de productos real
      const productosRes = await fetch('http://localhost:8081/api/productos', { headers });
      if (productosRes.ok) {
        const productos = await productosRes.json();
        setDatosReales(prev => ({ ...prev, totalProductos: productos.length }));
      }

      // Obtener total de proveedores real
      const proveedoresRes = await fetch('http://localhost:8081/api/proveedores', { headers });
      if (proveedoresRes.ok) {
        const proveedores = await proveedoresRes.json();
        setDatosReales(prev => ({ ...prev, totalProveedores: proveedores.length }));
      }

      // Obtener pedidos reales para análisis
      const pedidosRes = await fetch('http://localhost:8081/api/pedidos', { headers });
      if (pedidosRes.ok) {
        const pedidos = await pedidosRes.json();
        setDatosReales(prev => ({ ...prev, pedidos: pedidos }));
      }

    } catch (err) {
      console.error('Error obteniendo datos reales:', err);
    }
  };

  // Función para crear datos híbridos (reales + simulados)
  const crearDatosHibridos = (datosReales, tipo) => {
    switch (tipo) {
      case 'clientesRecurrentes':
        const totalClientes = datosReales.totalClientes || 0;
        return [
          { mes: 'Ene', recurrentes: Math.floor(totalClientes * 0.7), nuevos: Math.floor(totalClientes * 0.15) },
          { mes: 'Feb', recurrentes: Math.floor(totalClientes * 0.75), nuevos: Math.floor(totalClientes * 0.18) },
          { mes: 'Mar', recurrentes: Math.floor(totalClientes * 0.72), nuevos: Math.floor(totalClientes * 0.16) },
          { mes: 'Abr', recurrentes: Math.floor(totalClientes * 0.8), nuevos: Math.floor(totalClientes * 0.22) },
          { mes: 'May', recurrentes: Math.floor(totalClientes * 0.78), nuevos: Math.floor(totalClientes * 0.19) },
          { mes: 'Jun', recurrentes: Math.floor(totalClientes * 0.85), nuevos: Math.floor(totalClientes * 0.25) }
        ];

      case 'flujoCaja':
        const ventasReales = dashboardData?.ventasMes || 0;
        return [
          { mes: 'Ene', ingresos: ventasReales * 0.8, gastos: ventasReales * 0.6 },
          { mes: 'Feb', ingresos: ventasReales * 0.9, gastos: ventasReales * 0.65 },
          { mes: 'Mar', ingresos: ventasReales * 0.85, gastos: ventasReales * 0.62 },
          { mes: 'Abr', ingresos: ventasReales * 1.1, gastos: ventasReales * 0.7 },
          { mes: 'May', ingresos: ventasReales * 1.05, gastos: ventasReales * 0.68 },
          { mes: 'Jun', ingresos: ventasReales * 1.2, gastos: ventasReales * 0.75 }
        ];

      case 'pronosticoVentas':
        const ventasActuales = dashboardData?.ventasMes || 0;
        return [
          { mes: 'Jul', real: ventasActuales, pronostico: ventasActuales * 1.02 },
          { mes: 'Ago', real: null, pronostico: ventasActuales * 1.08 },
          { mes: 'Sep', real: null, pronostico: ventasActuales * 1.12 },
          { mes: 'Oct', real: null, pronostico: ventasActuales * 1.16 },
          { mes: 'Nov', real: null, pronostico: ventasActuales * 1.22 },
          { mes: 'Dic', real: null, pronostico: ventasActuales * 1.27 }
        ];

      case 'topClientes':
        if (datosReales.pedidos && datosReales.pedidos.length > 0) {
          // Crear top clientes basado en pedidos reales
          const clientesPorPedidos = {};
          datosReales.pedidos.forEach(pedido => {
            if (clientesPorPedidos[pedido.cliente]) {
              clientesPorPedidos[pedido.cliente].totalCompras++;
              clientesPorPedidos[pedido.cliente].valorTotal += pedido.total || 0;
            } else {
              clientesPorPedidos[pedido.cliente] = {
                cliente: pedido.cliente,
                totalCompras: 1,
                valorTotal: pedido.total || 0,
                ultimaCompra: pedido.fecha
              };
            }
          });

          return Object.values(clientesPorPedidos)
            .sort((a, b) => b.valorTotal - a.valorTotal)
            .slice(0, 5)
            .map(cliente => ({
              cliente: cliente.cliente,
              totalCompras: cliente.totalCompras,
              valorTotal: `$${cliente.valorTotal.toLocaleString()}`,
              ultimaCompra: cliente.ultimaCompra
            }));
        }
        return [];

      default:
        return [];
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFiltrar = () => {
    // Aquí se implementaría la lógica de filtrado
    console.log('Filtrando desde:', fechaInicio, 'hasta:', fechaFin);
    fetchDashboardData(); // Recargar datos con filtros
  };

  // Colores para PieChart
  const pieColors = ['#1976d2', '#10b981', '#fbc02d', '#e53935', '#ff9800', '#8e24aa'];

  // Utilidad para iconos y colores por estado
  const estadoConfig = {
    'Pendiente': { icon: '🕒', color: '#fbc02d' },
    'PENDIENTE': { icon: '🕒', color: '#fbc02d' },
    'Enviado': { icon: '🚚', color: '#1976d2' },
    'ENVIADO': { icon: '🚚', color: '#1976d2' },
    'Entregado': { icon: '✅', color: '#10b981' },
    'ENTREGADO': { icon: '✅', color: '#10b981' },
    'Cancelado': { icon: '❌', color: '#e53935' },
    'CANCELADO': { icon: '❌', color: '#e53935' },
    'Completado': { icon: '✔️', color: '#43a047' },
    'completado': { icon: '✔️', color: '#43a047' },
    'pendiente': { icon: '🕒', color: '#fbc02d' },
    // Otros estados...
  };

  // Calcular total de pedidos
  const totalPedidos = pedidosPorEstado.reduce((acc, p) => acc + (p.cantidad || 0), 0);

  // Agrupar estados ignorando mayúsculas/minúsculas
  const groupedEstados = pedidosPorEstado.reduce((acc, curr) => {
    const key = curr.estado.trim().toLowerCase();
    if (!acc[key]) {
      acc[key] = { ...curr, estado: curr.estado.charAt(0).toUpperCase() + curr.estado.slice(1).toLowerCase(), cantidad: 0 };
    }
    acc[key].cantidad += curr.cantidad;
    return acc;
  }, {});
  const estadosUnicos = Object.values(groupedEstados);

  // Simulación de últimos pedidos por estado (en producción, consumir endpoint real)
  const ultimosPedidosPorEstado = {
    pendiente: [
      { numero: 'PED-001', cliente: 'Juan Pérez', fecha: '2024-06-01' },
      { numero: 'PED-002', cliente: 'Ana Gómez', fecha: '2024-06-02' },
      { numero: 'PED-003', cliente: 'Carlos Ruiz', fecha: '2024-06-03' },
    ],
    enviado: [
      { numero: 'PED-004', cliente: 'Luis Torres', fecha: '2024-06-01' },
      { numero: 'PED-005', cliente: 'Marta Díaz', fecha: '2024-06-02' },
    ],
    entregado: [
      { numero: 'PED-006', cliente: 'Pedro López', fecha: '2024-06-01' },
    ],
    // ...otros estados
  };

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Cargando datos...">
        <div className="dashboard-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard" subtitle="Error">
        <div className="dashboard-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={fetchDashboardData}>Reintentar</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" subtitle="Métricas y Reportes del Sistema">
      <div className="dashboard-container">
        <IndicadoresWidget />
        {/* Filtro de fechas */}
        <div className="filter-section">
          <h2>Filtrar por Fechas</h2>
          <div className="filter-grid">
            <div>
              <label htmlFor="fecha-inicio">Fecha Inicio:</label>
              <input
                type="date"
                id="fecha-inicio"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="fecha-fin">Fecha Fin:</label>
              <input
                type="date"
                id="fecha-fin"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="filter-button">
              <button onClick={handleFiltrar}>Filtrar</button>
            </div>
          </div>
        </div>

        {/* Tarjetas de estadísticas mejoradas */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +12.5%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">${(dashboardData?.ventasMes || 0).toLocaleString()}</p>
              <p className="stat-extra-info">Ticket promedio: $12,500</p>
              <p className="stat-secondary-value">vs $128,000 mes anterior</p>
              <p className="stat-label">Ventas del Mes</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="stat-trend negative">
                <i className="fas fa-arrow-down"></i>
                -5.2%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.pedidosPendientes || 0}</p>
              <p className="stat-extra-info">Pedidos hoy: 8</p>
              <p className="stat-secondary-value">de 45 totales</p>
              <p className="stat-label">Pedidos Pendientes</p>
            </div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="stat-trend neutral">
                <i className="fas fa-minus"></i>
                0%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{alertasStock.length}</p>
              <p className="stat-extra-info">Stock crítico: 3 productos</p>
              <p className="stat-secondary-value">productos críticos</p>
              <p className="stat-label">Alertas de Stock</p>
            </div>
          </div>
          <div className="stat-card red">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +8.3%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.clientesNuevos || 0}</p>
              <p className="stat-extra-info">Clientes recurrentes: 12</p>
              <p className="stat-secondary-value">este mes</p>
              <p className="stat-label">Clientes Nuevos</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-boxes"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +2.1%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{datosReales.totalProductos || dashboardData?.totalProductos || 0}</p>
              <p className="stat-extra-info">Nuevos este mes: 4</p>
              <p className="stat-secondary-value">activos en catálogo</p>
              <p className="stat-label">Total Productos</p>
            </div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-truck"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +15.7%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.pedidosEnviados || 0}</p>
              <p className="stat-extra-info">Entregados hoy: 5</p>
              <p className="stat-secondary-value">en tránsito</p>
              <p className="stat-label">Pedidos Enviados</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +18.2%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.crecimientoVentas || 0}%</p>
              <p className="stat-extra-info">Meta: 20%</p>
              <p className="stat-secondary-value">vs mes anterior</p>
              <p className="stat-label">Crecimiento Ventas</p>
            </div>
          </div>
          <div className="stat-card pink">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +6.8%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{datosReales.totalClientes || dashboardData?.totalClientes || 0}</p>
              <p className="stat-extra-info">Activos: 32</p>
              <p className="stat-secondary-value">registrados</p>
              <p className="stat-label">Total Clientes</p>
            </div>
          </div>
          <div className="stat-card teal">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-warehouse"></i>
              </div>
              <div className="stat-trend negative">
                <i className="fas fa-arrow-down"></i>
                -3.4%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.stockTotal || 0}</p>
              <p className="stat-extra-info">Stock mínimo: 120</p>
              <p className="stat-secondary-value">unidades disponibles</p>
              <p className="stat-label">Stock Total</p>
            </div>
          </div>
          <div className="stat-card indigo">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <div className="stat-trend neutral">
                <i className="fas fa-minus"></i>
                0%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{datosReales.totalProveedores || dashboardData?.totalProveedores || 0}</p>
              <p className="stat-extra-info">Nuevos este mes: 1</p>
              <p className="stat-secondary-value">activos</p>
              <p className="stat-label">Total Proveedores</p>
            </div>
          </div>
          <div className="stat-card lime">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +22.1%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.pedidosCompletados || 0}</p>
              <p className="stat-extra-info">Tiempo promedio: 2d</p>
              <p className="stat-secondary-value">este mes</p>
              <p className="stat-label">Pedidos Completados</p>
            </div>
          </div>
          <div className="stat-card brown">
            <div className="stat-header">
              <div className="stat-icon">
                <i className="fas fa-percentage"></i>
              </div>
              <div className="stat-trend positive">
                <i className="fas fa-arrow-up"></i>
                +4.7%
              </div>
            </div>
            <div className="stat-content">
              <p className="stat-main-value">{dashboardData?.tasaConversion || 0}%</p>
              <p className="stat-extra-info">Visitas: 1,200</p>
              <p className="stat-secondary-value">de visitas a ventas</p>
              <p className="stat-label">Tasa de Conversión</p>
            </div>
          </div>
        </div>
        {/* Separador visual */}
        <hr className="dashboard-separator" />

        {/* Alertas de Stock Bajo */}
        {alertasStock.length > 0 && (
          <div className="alert-section">
            <h2><i className="fas fa-exclamation-triangle"></i> Alertas de Stock Bajo</h2>
            <div className="alert-grid">
              {alertasStock.map((producto, index) => (
                <div key={index} className="alert-card">
                  <div className="alert-header">
                    <h3>{producto.nombre}</h3>
                    <span className="stock-badge critical">Stock Crítico</span>
                  </div>
                  <div className="alert-content">
                    <p><strong>Stock Actual:</strong> {producto.stockActual} unidades</p>
                    <p><strong>Stock Mínimo:</strong> {producto.stockMinimo} unidades</p>
                    <p><strong>Proveedor:</strong> {producto.proveedor || 'No especificado'}</p>
                  </div>
                  <div className="alert-actions">
                    <button className="btn-primary" onClick={() => navigate('/inventario')}>
                      <i className="fas fa-plus"></i> Reponer Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tablas de información mejoradas */}
        <div className="tables-grid enhanced">
          <div className="table-card">
            <h2 className="productos-title">Productos Más Vendidos</h2>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad Vendida</th>
                  <th>Ingreso Total</th>
                </tr>
              </thead>
              <tbody>
                {productosMasVendidos.length > 0 ? (
                  productosMasVendidos.map((producto, index) => (
                    <tr key={index}>
                      <td>{producto.nombre}</td>
                      <td>${producto.precio?.toFixed(2) || '0.00'}</td>
                      <td>{producto.cantidadVendida}</td>
                      <td>${producto.ingreso?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4">No hay datos de productos vendidos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="table-card enhanced">
            <h2 className="pedidos-title">Pedidos por Estado</h2>
            <table className="pedidos-estado-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Cantidad</th>
                  <th>% del total</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {estadosUnicos.length > 0 ? (
                  estadosUnicos.map((pedido, index) => {
                    const config = estadoConfig[pedido.estado] || { icon: '📦', color: '#bdbdbd' };
                    const porcentaje = totalPedidos > 0 ? ((pedido.cantidad / totalPedidos) * 100).toFixed(1) : 0;
                    const key = pedido.estado.trim().toLowerCase();
                    const ultimos = ultimosPedidosPorEstado[key] || [];
                    return (
                      <tr key={index} data-tip data-for={`tooltip-${key}`} style={{ cursor: ultimos.length ? 'pointer' : 'default' }}>
                        <td style={{ color: config.color, fontWeight: 600 }}>
                          <span style={{ fontSize: '1.3rem', marginRight: 8 }}>{config.icon}</span>
                          {pedido.estado}
                        </td>
                        <td style={{ fontWeight: 600 }}>{pedido.cantidad}</td>
                        <td>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${porcentaje}%`, background: config.color }}></div>
                          </div>
                          <span style={{ fontSize: '0.95rem', color: '#555' }}>{porcentaje}%</span>
                        </td>
                        <td>
                          <button className="btn-filter" onClick={() => navigate(`/pedidos?estado=${encodeURIComponent(pedido.estado)}`)}>
                            Ver pedidos
                          </button>
                        </td>
                        <td></td>
                        {ultimos.length > 0 && (
                          <ReactTooltip id={`tooltip-${key}`} effect="solid" place="top">
                            <div style={{ minWidth: 180 }}>
                              <strong>Últimos pedidos:</strong>
                              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                {ultimos.slice(0, 3).map((p, i) => (
                                  <li key={i} style={{ fontSize: '0.97rem', margin: '0.2rem 0' }}>
                                    <span style={{ fontWeight: 600 }}>{p.numero}</span> - {p.cliente} <br /> <span style={{ color: '#888' }}>{p.fecha}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </ReactTooltip>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5">No hay datos de pedidos por estado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de ingresos por mes */}
        <div className="table-card full-width">
          <h2 className="ventas-title">Ingresos por Mes</h2>
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Ingreso Total</th>
                <th>Número de Pedidos</th>
                <th>Promedio por Pedido</th>
              </tr>
            </thead>
            <tbody>
              {ingresosPorMes.length > 0 ? (
                ingresosPorMes.map((ingreso, index) => (
                  <tr key={index}>
                    <td>{ingreso.mes}</td>
                    <td>${ingreso.ingreso?.toFixed(2) || '0.00'}</td>
                    <td>{ingreso.numeroPedidos || 0}</td>
                    <td>${((ingreso.ingreso || 0) / (ingreso.numeroPedidos || 1)).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4">No hay datos de ingresos por mes.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Gráficos mejorados con espaciado profesional */}
        <div className="charts-grid enhanced">
          <div className="chart-card">
            <h2 className="ventas-title">Ingresos por Mes</h2>
            {ingresosPorMes && ingresosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={ingresosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`$${value?.toFixed(2) || '0.00'}`, 'Ingreso']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ingreso" 
                    stroke="#1976d2" 
                    name="Ingreso Total" 
                    strokeWidth={3}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No hay datos de ingresos para mostrar</div>
            )}
          </div>
          
          <div className="chart-card">
            <h2 className="pedidos-title">Pedidos por Estado</h2>
            {pedidosPorEstado && pedidosPorEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <Pie 
                    data={pedidosPorEstado} 
                    dataKey="cantidad" 
                    nameKey="estado" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={120} 
                    innerRadius={60}
                    label={({estado, cantidad, percent}) => `${estado}: ${cantidad} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pedidosPorEstado.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No hay datos de pedidos por estado para mostrar</div>
            )}
          </div>
          
          <div className="chart-card">
            <h2 className="productos-title">Productos Más Vendidos</h2>
            {productosMasVendidos && productosMasVendidos.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productosMasVendidos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="nombre" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Cantidad Vendida']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="cantidadVendida" 
                    fill="#1976d2" 
                    name="Cantidad Vendida"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No hay datos de productos vendidos para mostrar</div>
            )}
          </div>
          
          <div className="chart-card">
            <h2 className="clientes-title">Clientes Nuevos por Mes</h2>
            {clientesNuevosPorMes && clientesNuevosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={clientesNuevosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value, name) => [value, 'Clientes Nuevos']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cantidad" 
                    stroke="#10b981" 
                    name="Clientes Nuevos" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No hay datos de clientes nuevos para mostrar</div>
            )}
          </div>
        </div>

        {/* NUEVAS SECCIONES - Análisis de Rendimiento */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-chart-line"></i> Análisis de Rendimiento</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="ventas-title">Tendencias de Ventas por Hora</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { hora: '8:00', ventas: 1200 },
                  { hora: '10:00', ventas: 1800 },
                  { hora: '12:00', ventas: 2500 },
                  { hora: '14:00', ventas: 2200 },
                  { hora: '16:00', ventas: 3000 },
                  { hora: '18:00', ventas: 2800 },
                  { hora: '20:00', ventas: 1500 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="hora" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`$${value?.toFixed(2) || '0.00'}`, 'Ventas']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="#f97316" 
                    name="Ventas por Hora" 
                    strokeWidth={3}
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#f97316', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h2 className="productos-title">Productos con Mayor Margen</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { producto: 'Laptop Pro', margen: 45 },
                  { producto: 'Mouse Gaming', margen: 38 },
                  { producto: 'Teclado Mecánico', margen: 32 },
                  { producto: 'Monitor 4K', margen: 28 },
                  { producto: 'Auriculares', margen: 25 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="producto" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Margen']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="margen" 
                    fill="#10b981" 
                    name="Margen de Ganancia"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Métricas de Clientes */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-users"></i> Análisis de Clientes</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="clientes-title">Clientes Recurrentes vs Nuevos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={crearDatosHibridos(datosReales, 'clientesRecurrentes')} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="recurrentes" 
                    stroke="#8b5cf6" 
                    name="Clientes Recurrentes" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="nuevos" 
                    stroke="#06b6d4" 
                    name="Clientes Nuevos" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="table-card">
              <h2 className="clientes-title">Top Clientes por Volumen</h2>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Total Compras</th>
                    <th>Valor Total</th>
                    <th>Última Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {crearDatosHibridos(datosReales, 'topClientes').length > 0 ? (
                    crearDatosHibridos(datosReales, 'topClientes').map((cliente, index) => (
                      <tr key={index}>
                        <td>{cliente.cliente}</td>
                        <td>{cliente.totalCompras}</td>
                        <td>{cliente.valorTotal}</td>
                        <td>{cliente.ultimaCompra}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No hay datos de clientes disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Análisis de Inventario */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-boxes"></i> Análisis de Inventario</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="inventario-title">Rotación de Inventario por Categoría</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { categoria: 'Electrónicos', rotacion: 8.5 },
                  { categoria: 'Accesorios', rotacion: 12.3 },
                  { categoria: 'Software', rotacion: 15.7 },
                  { categoria: 'Periféricos', rotacion: 6.2 },
                  { categoria: 'Gaming', rotacion: 9.8 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="categoria" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`${value} veces/mes`, 'Rotación']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="rotacion" 
                    fill="#f59e0b" 
                    name="Rotación Mensual"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="table-card">
              <h2 className="inventario-title">Productos Próximos a Vencer</h2>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>Fecha Vencimiento</th>
                    <th>Días Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Baterías AA</td>
                    <td>150</td>
                    <td>2024-07-15</td>
                    <td>15 días</td>
                  </tr>
                  <tr>
                    <td>Cables USB</td>
                    <td>200</td>
                    <td>2024-07-20</td>
                    <td>20 días</td>
                  </tr>
                  <tr>
                    <td>Adaptadores</td>
                    <td>75</td>
                    <td>2024-07-10</td>
                    <td>10 días</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Métricas Financieras */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-dollar-sign"></i> Análisis Financiero</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="financiero-title">Flujo de Caja Mensual</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={crearDatosHibridos(datosReales, 'flujoCaja')} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`$${value?.toLocaleString()}`, 'Valor']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#10b981" 
                    name="Ingresos" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#ef4444" 
                    name="Gastos" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h2 className="financiero-title">Distribución de Gastos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <Pie 
                    data={[
                      { categoria: 'Inventario', valor: 45 },
                      { categoria: 'Personal', valor: 25 },
                      { categoria: 'Marketing', valor: 15 },
                      { categoria: 'Operaciones', valor: 10 },
                      { categoria: 'Otros', valor: 5 }
                    ]} 
                    dataKey="valor" 
                    nameKey="categoria" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    innerRadius={50}
                    label={({categoria, valor}) => `${categoria}: ${valor}%`}
                    labelLine={false}
                  >
                    {[
                      { categoria: 'Inventario', valor: 45 },
                      { categoria: 'Personal', valor: 25 },
                      { categoria: 'Marketing', valor: 15 },
                      { categoria: 'Operaciones', valor: 10 },
                      { categoria: 'Otros', valor: 5 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Porcentaje']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Análisis de Proveedores */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-truck"></i> Análisis de Proveedores</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="proveedores-title">Volumen de Compras por Proveedor</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { proveedor: 'TechCorp', volumen: 85000 },
                  { proveedor: 'ElectroMax', volumen: 72000 },
                  { proveedor: 'DigitalPro', volumen: 65000 },
                  { proveedor: 'GadgetPlus', volumen: 48000 },
                  { proveedor: 'SmartTech', volumen: 42000 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="proveedor" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`$${value?.toLocaleString()}`, 'Volumen']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="volumen" 
                    fill="#6366f1" 
                    name="Volumen de Compras"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="table-card">
              <h2 className="proveedores-title">Rendimiento de Proveedores</h2>
              <table>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Tiempo Promedio</th>
                    <th>Calidad</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>TechCorp</td>
                    <td>3.2 días</td>
                    <td>95%</td>
                    <td>Competitivo</td>
                  </tr>
                  <tr>
                    <td>ElectroMax</td>
                    <td>4.1 días</td>
                    <td>92%</td>
                    <td>Alto</td>
                  </tr>
                  <tr>
                    <td>DigitalPro</td>
                    <td>2.8 días</td>
                    <td>88%</td>
                    <td>Bajo</td>
                  </tr>
                  <tr>
                    <td>GadgetPlus</td>
                    <td>5.5 días</td>
                    <td>85%</td>
                    <td>Medio</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Métricas Operacionales */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-cogs"></i> Métricas Operacionales</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="operacional-title">Tiempo de Procesamiento de Pedidos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { mes: 'Ene', tiempo: 2.5 },
                  { mes: 'Feb', tiempo: 2.3 },
                  { mes: 'Mar', tiempo: 2.1 },
                  { mes: 'Abr', tiempo: 1.9 },
                  { mes: 'May', tiempo: 1.8 },
                  { mes: 'Jun', tiempo: 1.6 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`${value} días`, 'Tiempo Promedio']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tiempo" 
                    stroke="#ec4899" 
                    name="Tiempo Promedio" 
                    strokeWidth={3}
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h2 className="operacional-title">Eficiencia por Departamento</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { departamento: 'Ventas', eficiencia: 92 },
                  { departamento: 'Inventario', eficiencia: 88 },
                  { departamento: 'Logística', eficiencia: 95 },
                  { departamento: 'Atención', eficiencia: 89 },
                  { departamento: 'Administración', eficiencia: 91 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="departamento" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Eficiencia']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="eficiencia" 
                    fill="#14b8a6" 
                    name="Eficiencia"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Análisis Predictivo */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-chart-area"></i> Análisis Predictivo</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="predictivo-title">Pronóstico de Ventas (Próximos 6 Meses)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={crearDatosHibridos(datosReales, 'pronosticoVentas')} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`$${value?.toLocaleString()}`, 'Ventas']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="real" 
                    stroke="#1976d2" 
                    name="Ventas Reales" 
                    strokeWidth={3}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pronostico" 
                    stroke="#f59e0b" 
                    name="Pronóstico" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-card">
              <h2 className="predictivo-title">Tendencias de Productos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { producto: 'Laptops', tendencia: 15 },
                  { producto: 'Smartphones', tendencia: 8 },
                  { producto: 'Auriculares', tendencia: 22 },
                  { producto: 'Monitores', tendencia: 12 },
                  { producto: 'Teclados', tendencia: 18 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <XAxis 
                    dataKey="producto" 
                    stroke="#1976d2" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={11}
                  />
                  <YAxis stroke="#1976d2" fontSize={12}/>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Crecimiento']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Bar 
                    dataKey="tendencia" 
                    fill="#84cc16" 
                    name="Crecimiento Esperado"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Métricas de Calidad */}
        <div className="dashboard-section">
          <h2 className="section-title"><i className="fas fa-award"></i> Métricas de Calidad</h2>
          <div className="charts-grid enhanced">
            <div className="chart-card">
              <h2 className="calidad-title">Satisfacción del Cliente</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { mes: 'Ene', satisfaccion: 4.2 },
                  { mes: 'Feb', satisfaccion: 4.3 },
                  { mes: 'Mar', satisfaccion: 4.4 },
                  { mes: 'Abr', satisfaccion: 4.5 },
                  { mes: 'May', satisfaccion: 4.6 },
                  { mes: 'Jun', satisfaccion: 4.7 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="mes" stroke="#1976d2" fontSize={12}/>
                  <YAxis stroke="#1976d2" fontSize={12} domain={[0, 5]}/>
                  <Tooltip 
                    formatter={(value) => [`${value}/5`, 'Satisfacción']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaccion" 
                    stroke="#10b981" 
                    name="Satisfacción" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="table-card">
              <h2 className="calidad-title">Productos con Más Devoluciones</h2>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Devoluciones</th>
                    <th>% del Total</th>
                    <th>Motivo Principal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Auriculares Bluetooth</td>
                    <td>8</td>
                    <td>2.1%</td>
                    <td>Defecto de fábrica</td>
                  </tr>
                  <tr>
                    <td>Mouse Gaming</td>
                    <td>6</td>
                    <td>1.8%</td>
                    <td>No cumple expectativas</td>
                  </tr>
                  <tr>
                    <td>Teclado Mecánico</td>
                    <td>5</td>
                    <td>1.5%</td>
                    <td>Ruido excesivo</td>
                  </tr>
                  <tr>
                    <td>Monitor 4K</td>
                    <td>4</td>
                    <td>1.2%</td>
                    <td>Píxeles muertos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Separador visual */}
        <hr className="dashboard-separator" />
      </div>
    </Layout>
  );
};

export default DashboardPage;