import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/ProductosPage.css';
import '../styles/DashboardPage.css';
import ReactDOM from 'react-dom';

const API_URL = 'http://localhost:8081/api';

// Función helper para manejar URLs de imágenes
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // Si ya es una URL completa
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Si empieza con /api/, construir URL completa
  if (imageUrl.startsWith('/api/')) {
    return `http://localhost:8081${imageUrl}`;
  }
  
  // Si es una ruta relativa, agregar API_URL
  return `${API_URL}${imageUrl}`;
};

// Componente para mostrar KPIs
function ProductosKPIs({ productos }) {
  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => (p.stock || 0) <= 10 && (p.stock || 0) > 0).length;
  const agotados = productos.filter(p => (p.stock || 0) === 0).length;
  const stockTotal = productos.reduce((sum, p) => sum + (p.stock || 0), 0);
  const valorTotal = productos.reduce((sum, p) => sum + ((p.stock || 0) * (p.precio || 0)), 0);
  const promedioStock = totalProductos > 0 ? Math.round(stockTotal / totalProductos) : 0;
  const productosDisponibles = productos.filter(p => (p.stock || 0) > 10).length;
  const promedioPrecio = totalProductos > 0 ? Math.round(productos.reduce((sum, p) => sum + (p.precio || 0), 0) / totalProductos) : 0;
  const porcentajeDisponibles = totalProductos > 0 ? Math.round((productosDisponibles / totalProductos) * 100) : 0;
  const porcentajeAgotados = totalProductos > 0 ? Math.round((agotados / totalProductos) * 100) : 0;
  const productosConImagen = productos.filter(p => p.imagenUrl).length;
  const productosSinDescripcion = productos.filter(p => !p.descripcion || p.descripcion.trim() === '').length;

  const kpiData = [
    {
      title: 'Productos',
      mainValue: totalProductos,
      subValues: [
        { label: 'Disponibles', value: productosDisponibles, color: '#10b981' },
        { label: 'Stock Bajo', value: stockBajo, color: '#f59e0b' },
        { label: 'Agotados', value: agotados, color: '#ef4444' }
      ],
      icon: 'fas fa-boxes',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      trend: `${porcentajeDisponibles}%`,
      trendColor: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444'
    },
    {
      title: 'Inventario',
      mainValue: stockTotal.toLocaleString(),
      subValues: [
        { label: 'Promedio', value: promedioStock, color: '#8b5cf6' },
        { label: 'Alertas', value: stockBajo + agotados, color: (stockBajo + agotados) === 0 ? '#10b981' : (stockBajo + agotados) <= 3 ? '#f59e0b' : '#ef4444' },
        { label: 'Sin Stock', value: agotados, color: '#ef4444' }
      ],
      icon: 'fas fa-layer-group',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      trend: `${stockBajo + agotados} alertas`,
      trendColor: (stockBajo + agotados) === 0 ? '#10b981' : (stockBajo + agotados) <= 3 ? '#f59e0b' : '#ef4444'
    },
    {
      title: 'Valor',
      mainValue: `$${valorTotal.toLocaleString()}`,
      subValues: [
        { label: 'Promedio', value: `$${promedioPrecio.toLocaleString()}`, color: '#059669' },
        { label: 'Por Producto', value: `$${totalProductos > 0 ? Math.round(valorTotal / totalProductos).toLocaleString() : 0}`, color: '#10b981' },
        { label: 'Óptimo', value: productosDisponibles, color: '#10b981' }
      ],
      icon: 'fas fa-dollar-sign',
      color: '#059669',
      bgColor: '#d1fae5',
      trend: `${totalProductos > 0 ? Math.round(valorTotal / totalProductos).toLocaleString() : 0}`,
      trendColor: '#10b981'
    },
    {
      title: 'Estado',
      mainValue: `${porcentajeDisponibles}%`,
      subValues: [
        { label: 'Disponibles', value: `${productosDisponibles}/${totalProductos}`, color: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444' },
        { label: 'Agotados', value: `${porcentajeAgotados}%`, color: porcentajeAgotados > 20 ? '#ef4444' : porcentajeAgotados > 10 ? '#f59e0b' : '#10b981' },
        { label: 'Estado', value: porcentajeDisponibles > 70 ? 'Excelente' : porcentajeDisponibles > 40 ? 'Atención' : 'Crítico', color: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444' }
      ],
      icon: 'fas fa-chart-pie',
      color: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444',
      bgColor: porcentajeDisponibles > 70 ? '#d1fae5' : porcentajeDisponibles > 40 ? '#fef3c7' : '#fee2e2',
      trend: `${porcentajeAgotados}% agotados`,
      trendColor: porcentajeAgotados > 20 ? '#ef4444' : porcentajeAgotados > 10 ? '#f59e0b' : '#10b981'
    },
    {
      title: 'Calidad',
      mainValue: `${productosConImagen}/${totalProductos}`,
      subValues: [
        { label: 'Con Imagen', value: productosConImagen, color: '#10b981' },
        { label: 'Sin Descripción', value: productosSinDescripcion, color: '#f59e0b' },
        { label: 'Completos', value: totalProductos - productosSinDescripcion, color: '#10b981' }
      ],
      icon: 'fas fa-star',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      trend: `${totalProductos > 0 ? Math.round((productosConImagen / totalProductos) * 100) : 0}%`,
      trendColor: productosConImagen > totalProductos * 0.7 ? '#10b981' : productosConImagen > totalProductos * 0.4 ? '#f59e0b' : '#ef4444'
    },
    {
      title: 'Eficiencia',
      mainValue: `${Math.round((productosDisponibles / totalProductos) * 100)}%`,
      subValues: [
        { label: 'Stock Óptimo', value: productosDisponibles, color: '#10b981' },
        { label: 'Rotación', value: `${Math.round((stockTotal / totalProductos) / promedioStock * 100)}%`, color: '#8b5cf6' },
        { label: 'Rendimiento', value: porcentajeDisponibles > 70 ? 'Alto' : porcentajeDisponibles > 40 ? 'Medio' : 'Bajo', color: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444' }
      ],
      icon: 'fas fa-tachometer-alt',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      trend: `${Math.round((stockTotal / totalProductos) / promedioStock * 100)}%`,
      trendColor: porcentajeDisponibles > 70 ? '#10b981' : porcentajeDisponibles > 40 ? '#f59e0b' : '#ef4444'
    }
  ];

  return (
    <div className="productos-kpis">
      {kpiData.map((kpi, index) => (
        <div 
          key={index} 
          className="kpi-card"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}
        >
          {/* Icono */}
          <div 
            className="kpi-icon"
            style={{
              background: kpi.bgColor
            }}
          >
            <i className={kpi.icon} style={{ fontSize: '14px', color: kpi.color }}></i>
          </div>

          {/* Contenido principal */}
          <div className="kpi-content">
            <div className="kpi-header">
              <div className="kpi-title">
                {kpi.title}
              </div>
              <div 
                className="kpi-trend"
                style={{
                  color: kpi.trendColor,
                  background: kpi.trendColor === '#10b981' ? '#d1fae5' : kpi.trendColor === '#f59e0b' ? '#fef3c7' : '#fee2e2'
                }}
              >
                {kpi.trend}
              </div>
            </div>

            <div className="kpi-main-value">
              {kpi.mainValue}
            </div>

            {/* Subvalores en fila */}
            <div style={{
              display: 'flex',
              gap: '12px',
              fontSize: '10px'
            }}>
              {kpi.subValues.map((sub, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {sub.label}:
                  </span>
                  <span style={{
                    color: sub.color,
                    fontWeight: '600'
                  }}>
                    {sub.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Barra de progreso sutil */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: kpi.bgColor
          }}>
            <div style={{
              height: '100%',
              background: kpi.color,
              width: `${Math.min(100, (kpi.mainValue.toString().replace(/[^0-9]/g, '') / (totalProductos || 1)) * 100)}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalMensaje({ show, onClose, titulo, mensaje, children }) {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{zIndex: 3000}}>
      <div className="modal-content modal-center" style={{maxWidth: 400, minWidth: 260, padding: '1.5rem 1.2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <h3 style={{margin: 0, fontWeight: 700, fontSize: '1.2rem', color: '#222'}}>{titulo}</h3>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div style={{marginBottom: 18, fontSize: '1.08rem', color: '#222', fontWeight: 500}}>{mensaje}</div>
        {children ? (
          <div style={{textAlign: 'right'}}>{children}</div>
        ) : (
          <div style={{textAlign: 'right'}}>
            <button onClick={onClose} style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 600, cursor: 'pointer'}}>Cerrar</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '' });
  const [editId, setEditId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    ordenarPor: 'nombre',
    orden: 'asc'
  });
  const token = localStorage.getItem('jwt');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const [modal, setModal] = useState({ show: false, titulo: '', mensaje: '', onConfirm: null });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await axios.get(`${API_URL}/productos`, config);
      setProductos(res.data);
    } catch (err) {
      setProductos([]);
    }
  };

  // Función para filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const cumpleBusqueda = producto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
                          producto.descripcion?.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    let cumpleEstado = true;
    if (filtros.estado === 'agotados') {
      cumpleEstado = (producto.stock || 0) === 0;
    } else if (filtros.estado === 'stock_bajo') {
      cumpleEstado = (producto.stock || 0) <= 10 && (producto.stock || 0) > 0;
    } else if (filtros.estado === 'disponible') {
      cumpleEstado = (producto.stock || 0) > 10;
    }

    return cumpleBusqueda && cumpleEstado;
  });

  // Función para ordenar productos
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    let valorA, valorB;
    
    switch (filtros.ordenarPor) {
      case 'nombre':
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
        break;
      case 'precio':
        valorA = a.precio || 0;
        valorB = b.precio || 0;
        break;
      case 'stock':
        valorA = a.stock || 0;
        valorB = b.stock || 0;
        break;
      default:
        valorA = a.nombre.toLowerCase();
        valorB = b.nombre.toLowerCase();
    }

    if (filtros.orden === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.precio || !form.stock) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Todos los campos son obligatorios.' });
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API_URL}/productos/${editId}`, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: parseFloat(form.precio),
          stock: parseInt(form.stock, 10)
        }, config);
        setModal({ show: true, titulo: 'Éxito', mensaje: '¡Producto actualizado!' });
      } else {
        await axios.post(`${API_URL}/productos`, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: parseFloat(form.precio),
          stock: parseInt(form.stock, 10)
        }, config);
        setModal({ show: true, titulo: 'Éxito', mensaje: '¡Producto agregado!' });
      }
      setForm({ nombre: '', descripcion: '', precio: '', stock: '' });
      setEditId(null);
      fetchProductos();
    } catch (err) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Error al guardar el producto.' });
    }
  };

  const handleEdit = (prod) => {
    setForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio,
      stock: prod.stock
    });
    setEditId(prod.id);
    setFeedback('');
  };

  const handleDelete = (id) => {
    setModal({
      show: true,
      titulo: 'Confirmar eliminación',
      mensaje: '¿Seguro que desea eliminar este producto?',
      onConfirm: () => doDelete(id)
    });
  };

  const doDelete = async (id) => {
    setModal({ show: false });
    try {
      await axios.delete(`${API_URL}/productos/${id}`, config);
      setModal({ show: true, titulo: 'Éxito', mensaje: '¡Producto eliminado!' });
      fetchProductos();
    } catch (err) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Error al eliminar el producto.' });
    }
  };

  const handleLimpiar = () => {
    setForm({ nombre: '', descripcion: '', precio: '', stock: '' });
    setEditId(null);
    setFeedback('');
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: 'todos',
      ordenarPor: 'nombre',
      orden: 'asc'
    });
  };

  return (
    <>
      {/* Aquí va TODO el contenido principal de la página de productos, SIN contenedor extra, solo secciones internas si es necesario */}
      <ProductosKPIs productos={productos} />
      {/* Sección de Filtros y Búsqueda */}
      <div className="inventario-form-card" style={{ marginBottom: '16px' }}>
        <h2 className="inventario-form-title">
          <i className="fas fa-filter"></i> Filtros y Búsqueda
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Buscar Producto</label>
            <input 
              className="form-input" 
              name="busqueda" 
              value={filtros.busqueda} 
              onChange={handleFiltroChange} 
              placeholder="Buscar por nombre o descripción..." 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Estado del Stock</label>
            <select className="form-input" name="estado" value={filtros.estado} onChange={handleFiltroChange}>
              <option value="todos">Todos los productos</option>
              <option value="disponible">Stock disponible</option>
              <option value="stock_bajo">Stock bajo (≤10)</option>
              <option value="agotados">Agotados</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Ordenar por</label>
            <select className="form-input" name="ordenarPor" value={filtros.ordenarPor} onChange={handleFiltroChange}>
              <option value="nombre">Nombre</option>
              <option value="precio">Precio</option>
              <option value="stock">Stock</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Orden</label>
            <select className="form-input" name="orden" value={filtros.orden} onChange={handleFiltroChange}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>
          <div className="form-group">
            <button 
              type="button" 
              onClick={limpiarFiltros}
              style={{
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <i className="fas fa-times"></i> Limpiar Filtros
            </button>
          </div>
        </div>
        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#e3f2fd', borderRadius: '6px', fontSize: '14px', color: '#1976d2' }}>
          <i className="fas fa-info-circle"></i> Mostrando {productosOrdenados.length} de {productos.length} productos
        </div>
      </div>

      <div className="inventario-form-card" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Elementos decorativos de fondo */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <i className={editId ? 'fas fa-edit' : 'fas fa-plus'} style={{ fontSize: '20px', color: 'white' }}></i>
            </div>
            <div>
              <h2 style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: '700',
                color: 'white'
              }}>
                {editId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '400'
              }}>
                {editId ? 'Modifica la información del producto seleccionado' : 'Completa la información para agregar un nuevo producto'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div className="form-group-modern">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  <i className="fas fa-tag" style={{ marginRight: '8px' }}></i>
                  Nombre del Producto
                </label>
                <input 
                  className="form-input-modern" 
                  name="nombre" 
                  value={form.nombre} 
                  onChange={handleChange} 
                  placeholder="Ej: Laptop HP Pavilion" 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '4px'
                }}>
                  Nombre descriptivo del producto
                </div>
              </div>

              <div className="form-group-modern">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  <i className="fas fa-dollar-sign" style={{ marginRight: '8px' }}></i>
                  Precio
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '14px'
                  }}>$</span>
                  <input 
                    className="form-input-modern" 
                    name="precio" 
                    type="number" 
                    step="0.01" 
                    value={form.precio} 
                    onChange={handleChange} 
                    placeholder="0.00" 
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 32px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                      e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                      e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                  />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '4px'
                }}>
                  Precio en pesos colombianos
                </div>
              </div>

              <div className="form-group-modern">
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: 'white',
                  fontSize: '14px'
                }}>
                  <i className="fas fa-boxes" style={{ marginRight: '8px' }}></i>
                  Stock Inicial
                </label>
                <input 
                  className="form-input-modern" 
                  name="stock" 
                  type="number" 
                  value={form.stock} 
                  onChange={handleChange} 
                  placeholder="0" 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '4px'
                }}>
                  Cantidad disponible en inventario
                </div>
              </div>
            </div>

            <div className="form-group-modern">
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: 'white',
                fontSize: '14px'
              }}>
                <i className="fas fa-align-left" style={{ marginRight: '8px' }}></i>
                Descripción del Producto
              </label>
              <textarea 
                className="form-input-modern" 
                name="descripcion" 
                value={form.descripcion} 
                onChange={handleChange} 
                placeholder="Describe las características, especificaciones y detalles del producto..." 
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  resize: 'vertical',
                  minHeight: '100px',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              />
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '4px'
              }}>
                Información detallada del producto (opcional)
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '24px',
              flexWrap: 'wrap'
            }}>
              <button 
                type="submit" 
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 15px -1px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                }}
              >
                <i className="fas fa-save"></i>
                {editId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
              
              <button 
                type="button" 
                onClick={handleLimpiar}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <i className="fas fa-eraser"></i>
                Limpiar Formulario
              </button>

              {editId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setForm({ nombre: '', descripcion: '', precio: '', stock: '' });
                    setEditId(null);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {/* Vista de Tarjetas de Productos */}
      <div className="inventario-form-card">
        <h2 className="inventario-form-title">
          <i className="fas fa-th-large"></i> Vista de Catálogo
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px',
          marginTop: '16px'
        }}>
          {productosOrdenados.map((producto) => {
            const stock = producto.stock || 0;
            let estadoColor = '#28a745';
            let estadoTexto = 'Disponible';
            
            if (stock === 0) {
              estadoColor = '#dc3545';
              estadoTexto = 'Agotado';
            } else if (stock <= 10) {
              estadoColor = '#ffc107';
              estadoTexto = 'Stock Bajo';
            }

            return (
              <div key={producto.id} style={{
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginRight: '12px',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {producto.imagenUrl ? (
                      <img
                        src={getImageUrl(producto.imagenUrl)}
                        alt={producto.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      display: producto.imagenUrl ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      color: '#999'
                    }}>
                      <i className="fas fa-image" style={{ fontSize: '20px' }}></i>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#333'
                    }}>{producto.nombre}</h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      background: estadoColor
                    }}>{estadoTexto}</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  {producto.descripcion && (
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>{producto.descripcion}</p>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Precio</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb' }}>
                      ${producto.precio?.toLocaleString('es-CO') || '0'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Stock</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: stock === 0 ? '#dc3545' : stock <= 10 ? '#ffc107' : '#28a745' }}>
                      {stock} unidades
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => handleEdit(producto)}
                    style={{
                      flex: 1,
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(producto.id)}
                    style={{
                      flex: 1,
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#c82333'}
                    onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="inventario-table-card">
        <h2 className="inventario-table-title">Lista de Productos</h2>
        <table className="inventario-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Imagen del Producto</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosOrdenados.map((prod) => (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>
                  <div
                    className="product-image-dropzone"
                    style={{ 
                      width: 60, 
                      height: 60, 
                      border: '2px dashed #ccc', 
                      borderRadius: 8, 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: '#fafafa', 
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click para subir imagen"
                  >
                    {prod.imagenUrl ? (
                      <img
                        src={getImageUrl(prod.imagenUrl)}
                        alt={prod.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 8,
                          transition: 'transform 0.2s ease'
                        }}
                        onError={e => {
                          // Silenciar el error y mostrar el overlay de cámara
                          e.target.style.display = 'none';
                          const overlay = e.target.parentNode.querySelector('.camera-overlay');
                          if (overlay) overlay.style.display = 'flex';
                        }}
                        onLoad={e => {
                          // Ocultar el overlay cuando la imagen carga correctamente
                          const overlay = e.target.parentNode.querySelector('.camera-overlay');
                          if (overlay) overlay.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div 
                      className="camera-overlay"
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        background: prod.imagenUrl ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)', 
                        display: prod.imagenUrl ? 'none' : 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.opacity = 1}
                      onMouseLeave={e => e.target.style.opacity = 0}
                    >
                      <i className="fas fa-camera" style={{ color: '#000', fontSize: 16 }}></i>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '13px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '8px 4px' }}>{prod.nombre}</td>
                <td>${prod.precio?.toLocaleString('es-CO', {minimumFractionDigits: 0}) ?? '-'}</td>
                <td>{prod.stock}</td>
                <td className="acciones">
                  <button className="btn-editar" onClick={() => handleEdit(prod)}>Editar</button>
                  <button className="btn-eliminar" onClick={() => handleDelete(prod.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ModalMensaje
        show={modal.show}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
        onClose={() => setModal({ ...modal, show: false })}
      >
        {modal.onConfirm && (
          <>
            <button onClick={() => setModal({ ...modal, show: false })} style={{background: '#aaa', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 600, cursor: 'pointer', marginRight: 8}}>Cancelar</button>
            <button onClick={modal.onConfirm} style={{background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 600, cursor: 'pointer'}}>Eliminar</button>
          </>
        )}
      </ModalMensaje>
    </>
  );
}

export default ProductosPage; 