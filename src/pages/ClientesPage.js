import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Layout from '../components/Layout';
import ImageUpload from '../components/ImageUpload';
import '../styles/DashboardPage.css';
import '../styles/ClientesPage.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://localhost:8081/api/clientes';

const tipoOptions = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Empresa', label: 'Empresa' }
];

// Modal de detalles rápidos
function ModalDetalleCliente({ show, cliente, onClose }) {
  if (!show || !cliente) return null;
  return (
    <div className="modal-overlay" style={{zIndex: 3000}}>
      <div className="modal-content modal-center">
        <div className="modal-header">
          <h3>Detalle del Cliente</h3>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">&times;</button>
        </div>
        <div className="modal-body">
          <div className="client-badge-container">
            <span className={`clientes-badge ${cliente.tipo === 'Empresa' ? 'empresa' : 'individual'}`}>{cliente.tipo}</span>
          </div>
          <div className="client-detail-item"><b>Nombre:</b> {cliente.nombre} {cliente.apellidos || ''}</div>
          <div className="client-detail-item"><b>Email:</b> {cliente.correo}</div>
          <div className="client-detail-item"><b>Teléfono:</b> {cliente.telefono}</div>
          <div className="client-detail-item"><b>Dirección:</b> {cliente.direccion}</div>
          <div className="client-detail-item"><b>Fecha de Registro:</b> {cliente.fechaCreacion}</div>
          {cliente.activo !== undefined && (
            <div className="client-detail-item"><b>Estado:</b> <span className={cliente.activo ? 'status-active' : 'status-inactive'}>{cliente.activo ? 'Activo' : 'Inactivo'}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal de confirmación y notificación reutilizable
function ModalMensaje({ show, onClose, titulo, mensaje, onConfirm, children, tipo }) {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{zIndex: 3000}}>
      <div className={`modal-content modal-center ${tipo === 'error' ? 'modal-error' : 'modal-success'}`}>
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">&times;</button>
        </div>
        <div className="modal-body">
          <p>{mensaje}</p>
        </div>
        <div className="modal-footer">
          {children ? (
            children
          ) : onConfirm ? (
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-danger" onClick={onConfirm}>Eliminar</button>
            </div>
          ) : (
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal para editar cliente
function ModalEditarCliente({ show, form, onChange, onSubmit, onCancel, error }) {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{zIndex: 3000}}>
      <div className="modal-content modal-center" style={{maxWidth: '600px', width: '90%'}}>
        <div className="modal-header">
          <h3>Editar Cliente</h3>
          <button className="modal-close-btn" onClick={onCancel} title="Cerrar">&times;</button>
        </div>
        <form onSubmit={onSubmit} className="modal-form">
          <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
            {/* Columna de imagen */}
            <div style={{flex: '0 0 150px'}}>
              <label>Foto del Cliente</label>
              <ImageUpload
                onImageUpload={(filename, url) => {
                  onChange({
                    target: {
                      name: 'imagen',
                      value: filename
                    }
                  });
                }}
                currentImage={form.imagen}
                type="cliente"
                placeholder="Cambiar imagen"
                className="modal-image-upload"
              />
            </div>
            
            {/* Columna de campos */}
            <div style={{flex: '1'}}>
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ingrese el nombre del cliente" />
              </div>
              <div className="form-group">
                <label>Apellidos</label>
                <input name="apellidos" value={form.apellidos} onChange={onChange} placeholder="Ingrese los apellidos" />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input name="correo" type="email" value={form.correo} onChange={onChange} required placeholder="Ingrese el correo electrónico" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={onChange} required placeholder="Ingrese el contacto" />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input name="direccion" value={form.direccion} onChange={onChange} placeholder="Ingrese la dirección" />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select name="tipo" value={form.tipo} onChange={onChange}>
                  <option value="Individual">Individual</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-buttons">
            <button type="submit" className="btn-primary">Actualizar</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>,
    document.body
  );
}

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    nit: '',
    fechaNacimiento: '',
    cargo: '',
    web: '',
    correo: '',
    telefono: '',
    movil: '',
    telTrabajo: '',
    direccionFiscal: '',
    ciudadFiscal: '',
    municipioFiscal: '',
    paisFiscal: '',
    direccionCorrespondencia: '',
    ciudadCorrespondencia: '',
    municipioCorrespondencia: '',
    paisCorrespondencia: '',
    direccionEntrega: '',
    ciudadEntrega: '',
    municipioEntrega: '',
    paisEntrega: '',
    observaciones: '',
    tipo: 'Individual',
    imagen: null,
    imagenPreview: null
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState({ nombre: '', apellidos: '', correo: '', nit: '', telefono: '' });
  const [searchActive, setSearchActive] = useState(false);
  const [modalDetalle, setModalDetalle] = useState({ show: false, cliente: null });
  const [modal, setModal] = useState({ show: false, titulo: '', mensaje: '', onConfirm: null });
  const [editModal, setEditModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [infoModal, setInfoModal] = useState({ show: false, titulo: '', mensaje: '', tipo: 'success' });

  // KPIs calculados
  const totalClientes = clientes.length;
  const empresas = clientes.filter(c => c.tipo === 'Empresa').length;
  const individuales = clientes.filter(c => c.tipo === 'Individual').length;
  const nuevosMes = clientes.filter(c => {
    if (!c.fechaCreacion) return false;
    const fecha = new Date(c.fechaCreacion);
    const ahora = new Date();
    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
  }).length;
  const activos = clientes.filter(c => c.activo !== false).length;
  
  // Métricas adicionales profesionales
  const clientesConEmail = clientes.filter(c => c.correo && c.correo.trim()).length;
  const clientesConTelefono = clientes.filter(c => c.telefono && c.telefono.trim()).length;
  const clientesConDireccion = clientes.filter(c => 
    (c.direccion && c.direccion.trim()) || 
    (c.direccionFiscal && c.direccionFiscal.trim()) ||
    (c.direccionCorrespondencia && c.direccionCorrespondencia.trim()) ||
    (c.direccionEntrega && c.direccionEntrega.trim())
  ).length;
  const clientesConImagen = clientes.filter(c => c.imagen && c.imagen.trim()).length;
  const clientesSinNIT = clientes.filter(c => !c.nit || !c.nit.trim()).length;
  const clientesRecientes = clientes.filter(c => {
    if (!c.fechaCreacion) return false;
    const fecha = new Date(c.fechaCreacion);
    const ahora = new Date();
    const diffTime = Math.abs(ahora - fecha);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).length;
  const porcentajeCompletitud = totalClientes > 0 ? Math.round((clientesConEmail + clientesConTelefono + clientesConDireccion) / (totalClientes * 3) * 100) : 0;
  
  // Métricas adicionales más relevantes
  const clientesConWeb = clientes.filter(c => c.web && c.web.trim()).length;
  const clientesConCargo = clientes.filter(c => c.cargo && c.cargo.trim()).length;
  const clientesConObservaciones = clientes.filter(c => c.observaciones && c.observaciones.trim()).length;
  const clientesCompletos = clientes.filter(c => 
    c.correo && c.correo.trim() && 
    c.telefono && c.telefono.trim() && 
    c.nit && c.nit.trim() &&
    (c.direccion && c.direccion.trim() || c.direccionFiscal && c.direccionFiscal.trim())
  ).length;

  const kpis = [
    { 
      label: 'Total', 
      value: totalClientes, 
      icon: 'fas fa-users', 
      color: 'blue',
      subtitle: 'Clientes',
      trend: null
    },
    { 
      label: 'Nuevos', 
      value: nuevosMes, 
      icon: 'fas fa-user-plus', 
      color: 'green',
      subtitle: 'Este mes',
      trend: nuevosMes > 0 ? 'positive' : 'neutral'
    },
    { 
      label: 'Empresas', 
      value: empresas, 
      icon: 'fas fa-building', 
      color: 'purple',
      subtitle: `${totalClientes > 0 ? Math.round((empresas/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Individuales', 
      value: individuales, 
      icon: 'fas fa-user', 
      color: 'cyan',
      subtitle: `${totalClientes > 0 ? Math.round((individuales/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Completos', 
      value: clientesCompletos, 
      icon: 'fas fa-check-circle', 
      color: 'green',
      subtitle: `${totalClientes > 0 ? Math.round((clientesCompletos/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Con Email', 
      value: clientesConEmail, 
      icon: 'fas fa-envelope', 
      color: 'orange',
      subtitle: `${totalClientes > 0 ? Math.round((clientesConEmail/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Con Teléfono', 
      value: clientesConTelefono, 
      icon: 'fas fa-phone', 
      color: 'teal',
      subtitle: `${totalClientes > 0 ? Math.round((clientesConTelefono/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Con Dirección', 
      value: clientesConDireccion, 
      icon: 'fas fa-map-marker-alt', 
      color: 'indigo',
      subtitle: `${totalClientes > 0 ? Math.round((clientesConDireccion/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Con Foto', 
      value: clientesConImagen, 
      icon: 'fas fa-camera', 
      color: 'pink',
      subtitle: `${totalClientes > 0 ? Math.round((clientesConImagen/totalClientes)*100) : 0}%`,
      trend: null
    },
    { 
      label: 'Sin NIT', 
      value: clientesSinNIT, 
      icon: 'fas fa-exclamation-triangle', 
      color: 'red',
      subtitle: 'Pendientes',
      trend: clientesSinNIT > 0 ? 'negative' : 'positive'
    },
    { 
      label: 'Recientes', 
      value: clientesRecientes, 
      icon: 'fas fa-clock', 
      color: 'lime',
      subtitle: '7 días',
      trend: clientesRecientes > 0 ? 'positive' : 'neutral'
    },
    { 
      label: 'Completitud', 
      value: `${porcentajeCompletitud}%`, 
      icon: 'fas fa-chart-pie', 
      color: 'brown',
      subtitle: 'Datos',
      trend: porcentajeCompletitud >= 80 ? 'positive' : porcentajeCompletitud >= 60 ? 'neutral' : 'negative'
    }
  ];

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) {
        setError('Error al obtener los clientes: ' + res.status);
        setClientes([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setError('La respuesta del servidor está vacía.');
        setClientes([]);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError('La respuesta del servidor no es un JSON válido.');
        setClientes([]);
        return;
      }
      setClientes(data);
    } catch (err) {
      setError('Error de red al obtener los clientes.');
      setClientes([]);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(editId ? `${API_URL}/${editId}` : API_URL, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const msg = await res.text();
        setInfoModal({ show: true, titulo: 'Error', mensaje: msg || 'Error al guardar el cliente.', tipo: 'error' });
        setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
        return;
      }
      setInfoModal({ show: true, titulo: 'Éxito', mensaje: editId ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.', tipo: 'success' });
      setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
      fetchClientes();
      handleCancel();
    } catch (err) {
      setInfoModal({ show: true, titulo: 'Error', mensaje: 'Error de red al guardar el cliente.', tipo: 'error' });
      setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) {
        setInfoModal({ show: true, titulo: 'Error', mensaje: 'Error al eliminar el cliente.', tipo: 'error' });
        setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
        return;
      }
      setInfoModal({ show: true, titulo: 'Éxito', mensaje: 'Cliente eliminado correctamente.', tipo: 'success' });
      setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
      fetchClientes();
      setModal({ show: false, titulo: '', mensaje: '', onConfirm: null });
    } catch (err) {
      setInfoModal({ show: true, titulo: 'Error', mensaje: 'Error de red al eliminar el cliente.', tipo: 'error' });
      setTimeout(() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' }), 2500);
    }
  };

  const handleEdit = (cliente) => {
    setForm({
      nombre: cliente.nombre || '',
      apellidos: cliente.apellidos || '',
      nit: cliente.nit || '',
      fechaNacimiento: cliente.fechaNacimiento || '',
      cargo: cliente.cargo || '',
      web: cliente.web || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      movil: cliente.movil || '',
      telTrabajo: cliente.telTrabajo || '',
      direccionFiscal: cliente.direccionFiscal || '',
      ciudadFiscal: cliente.ciudadFiscal || '',
      municipioFiscal: cliente.municipioFiscal || '',
      paisFiscal: cliente.paisFiscal || '',
      direccionCorrespondencia: cliente.direccionCorrespondencia || '',
      ciudadCorrespondencia: cliente.ciudadCorrespondencia || '',
      municipioCorrespondencia: cliente.municipioCorrespondencia || '',
      paisCorrespondencia: cliente.paisCorrespondencia || '',
      direccionEntrega: cliente.direccionEntrega || '',
      ciudadEntrega: cliente.ciudadEntrega || '',
      municipioEntrega: cliente.municipioEntrega || '',
      paisEntrega: cliente.paisEntrega || '',
      observaciones: cliente.observaciones || '',
      tipo: cliente.tipo || 'Individual',
      imagen: cliente.imagen || null,
      imagenPreview: cliente.imagenPreview || null
    });
    setEditId(cliente.id);
    setEditModal(true);
  };

  const handleEditModalClose = () => {
    setEditModal(false);
    setEditId(null);
    setForm({
      nombre: '',
      apellidos: '',
      nit: '',
      fechaNacimiento: '',
      cargo: '',
      web: '',
      correo: '',
      telefono: '',
      movil: '',
      telTrabajo: '',
      direccionFiscal: '',
      ciudadFiscal: '',
      municipioFiscal: '',
      paisFiscal: '',
      direccionCorrespondencia: '',
      ciudadCorrespondencia: '',
      municipioCorrespondencia: '',
      paisCorrespondencia: '',
      direccionEntrega: '',
      ciudadEntrega: '',
      municipioEntrega: '',
      paisEntrega: '',
      observaciones: '',
      tipo: 'Individual',
      imagen: null,
      imagenPreview: null
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchActive(true);
  };

  const handleSearchChange = (e) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setForm({
      nombre: '',
      apellidos: '',
      nit: '',
      fechaNacimiento: '',
      cargo: '',
      web: '',
      correo: '',
      telefono: '',
      movil: '',
      telTrabajo: '',
      direccionFiscal: '',
      ciudadFiscal: '',
      municipioFiscal: '',
      paisFiscal: '',
      direccionCorrespondencia: '',
      ciudadCorrespondencia: '',
      municipioCorrespondencia: '',
      paisCorrespondencia: '',
      direccionEntrega: '',
      ciudadEntrega: '',
      municipioEntrega: '',
      paisEntrega: '',
      observaciones: '',
      tipo: 'Individual',
      imagen: null,
      imagenPreview: null
    });
    setEditId(null);
  };

  const handleClearSearch = () => {
    setSearch({ nombre: '', apellidos: '', correo: '', nit: '', telefono: '' });
    setSearchActive(false);
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(clientes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'clientes.xlsx');
  };

  const exportarCSV = () => {
    const ws = XLSX.utils.json_to_sheet(clientes);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'clientes.csv');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Nombre', 'Email', 'Teléfono', 'Tipo', 'Dirección']],
      body: clientes.map(c => [
        `${c.nombre} ${c.apellidos || ''}`,
        c.correo || '',
        c.telefono || '',
        c.tipo || '',
        c.direccion || ''
      ])
    });
    doc.save('clientes.pdf');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm({
          ...form,
          imagen: file,
          imagenPreview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrar clientes basado en búsqueda
  const clientesFiltrados = clientes.filter(cliente => {
    if (!searchActive) return true;
    
    const nombreMatch = !search.nombre || 
      cliente.nombre?.toLowerCase().includes(search.nombre.toLowerCase()) ||
      cliente.apellidos?.toLowerCase().includes(search.nombre.toLowerCase());
    
    const apellidosMatch = !search.apellidos || 
      cliente.apellidos?.toLowerCase().includes(search.apellidos.toLowerCase());
    
    const correoMatch = !search.correo || 
      cliente.correo?.toLowerCase().includes(search.correo.toLowerCase());
    
    const nitMatch = !search.nit || 
      cliente.nit?.toLowerCase().includes(search.nit.toLowerCase());
    
    const telefonoMatch = !search.telefono || 
      cliente.telefono?.includes(search.telefono);
    
    return nombreMatch && apellidosMatch && correoMatch && nitMatch && telefonoMatch;
  });

  return (
    <Layout title="Gestión de Clientes" subtitle="Administración de clientes y contactos">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1><i className="fas fa-users"></i> Gestión de Clientes</h1>
        </div>

        {/* KPIs */}
        <div className="dashboard-content">
          <h2 className="section-title"><i className="fas fa-chart-bar"></i> Resumen de Clientes</h2>
          <div className="stats-grid">
            {kpis.map((kpi, index) => (
              <div key={index} className={`stat-card ${kpi.color}`}>
                <div className="stat-header">
                  <div className="stat-icon">
                    <i className={kpi.icon}></i>
                  </div>
                </div>
                <div className="stat-content">
                  <div className="stat-main-value">{kpi.value}</div>
                  <div className="stat-label">{kpi.label}</div>
                  <div className="stat-subtitle">{kpi.subtitle}</div>
                  {kpi.trend && (
                    <div className={`stat-trend ${kpi.trend}`}>
                      {kpi.trend === 'positive' && <i className="fas fa-arrow-up"></i>}
                      {kpi.trend === 'negative' && <i className="fas fa-arrow-down"></i>}
                      {kpi.trend === 'neutral' && <i className="fas fa-minus"></i>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Cliente */}
        <div className="dashboard-content">
          <h2 className="section-title"><i className="fas fa-user-plus"></i> {editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <form onSubmit={handleSubmit} className="client-form">
            <div className="form-row-horizontal">
              <div className="form-group">
                <label>Foto del Cliente</label>
                <ImageUpload
                  onImageUpload={(filename, url) => {
                    setForm({
                      ...form,
                      imagen: filename
                    });
                  }}
                  currentImage={form.imagen}
                  type="cliente"
                  placeholder="Arrastra una imagen aquí o haz clic para seleccionar"
                />
              </div>
              <div className="form-fields">
                <div className="form-group">
                  <label>Nombre <span className="required">*</span></label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input name="apellidos" value={form.apellidos} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>NIT <span className="required">*</span></label>
                  <input name="nit" value={form.nit} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Fecha de nacimiento</label>
                  <input name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Cargo</label>
                  <input name="cargo" value={form.cargo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Web</label>
                  <input name="web" value={form.web} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="correo" type="email" value={form.correo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Móvil</label>
                  <input name="movil" value={form.movil} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Tel. trabajo</label>
                  <input name="telTrabajo" value={form.telTrabajo} onChange={handleChange} />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Dirección Fiscal</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dirección</label>
                  <input name="direccionFiscal" value={form.direccionFiscal} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input name="ciudadFiscal" value={form.ciudadFiscal} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Municipio</label>
                  <input name="municipioFiscal" value={form.municipioFiscal} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>País</label>
                  <input name="paisFiscal" value={form.paisFiscal} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Dirección de Correspondencia</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dirección</label>
                  <input name="direccionCorrespondencia" value={form.direccionCorrespondencia} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input name="ciudadCorrespondencia" value={form.ciudadCorrespondencia} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Municipio</label>
                  <input name="municipioCorrespondencia" value={form.municipioCorrespondencia} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>País</label>
                  <input name="paisCorrespondencia" value={form.paisCorrespondencia} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Dirección de Entrega</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Dirección</label>
                  <input name="direccionEntrega" value={form.direccionEntrega} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input name="ciudadEntrega" value={form.ciudadEntrega} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Municipio</label>
                  <input name="municipioEntrega" value={form.municipioEntrega} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>País</label>
                  <input name="paisEntrega" value={form.paisEntrega} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Búsqueda */}
        <div className="dashboard-content">
          <h2 className="section-title"><i className="fas fa-search"></i> Búsqueda y Filtros</h2>
          <form onSubmit={handleSearch} className="search-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre</label>
                <input name="nombre" value={search.nombre} onChange={handleSearchChange} placeholder="Buscar cliente..." />
              </div>
              <div className="form-group">
                <label>Apellidos</label>
                <input name="apellidos" value={search.apellidos} onChange={handleSearchChange} placeholder="Buscar apellidos..." />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="correo" value={search.correo} onChange={handleSearchChange} placeholder="Buscar email..." />
              </div>
              <div className="form-group">
                <label>NIT</label>
                <input name="nit" value={search.nit} onChange={handleSearchChange} placeholder="Buscar NIT..." />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input name="telefono" value={search.telefono} onChange={handleSearchChange} placeholder="Buscar teléfono..." />
              </div>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">Buscar</button>
              <button type="button" className="btn-secondary" onClick={handleClearSearch}>Limpiar filtros</button>
            </div>
          </form>
        </div>

        {/* Tabla de Clientes */}
        <div className="dashboard-content table-card">
          <h2 className="section-title"><i className="fas fa-list"></i> Lista de Clientes</h2>
          
          {/* Botones de exportar movidos aquí */}
          <div className="header-actions" style={{ marginBottom: '20px', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={exportarExcel}>
              <i className="fas fa-file-excel"></i> Excel
            </button>
            <button className="btn-secondary" onClick={exportarCSV}>
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button className="btn-secondary" onClick={exportarPDF}>
              <i className="fas fa-file-pdf"></i> PDF
            </button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="centered">Foto</th>
                  <th className="centered">Nombre</th>
                  <th className="centered">Email</th>
                  <th className="centered">Teléfono</th>
                  <th className="centered">Tipo</th>
                  <th className="centered">Dirección</th>
                  <th className="centered">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(cliente => (
                  <tr key={cliente.id}>
                    <td className="centered">
                      <div className="client-image-container">
                        {cliente.imagen ? (
                          <img 
                            src={`http://localhost:8081/api/files/clientes/${cliente.imagen}`}
                            alt={`Foto de ${cliente.nombre}`}
                            className="client-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="client-image-placeholder" style={{display: cliente.imagen ? 'none' : 'flex'}}>
                          <i className="fas fa-user"></i>
                        </div>
                      </div>
                    </td>
                    <td className="centered">{[cliente.nombre, cliente.apellidos].filter(x => x && x.trim()).join(' ')}</td>
                    <td className="centered">{cliente.correo}</td>
                    <td className="centered">{cliente.telefono}</td>
                    <td className="centered">
                      <span className={`clientes-badge ${cliente.tipo === 'Empresa' ? 'empresa' : 'individual'}`}>{cliente.tipo}</span>
                    </td>
                    <td className="centered">{
                      [cliente.direccion, cliente.direccionFiscal, cliente.direccionCorrespondencia, cliente.direccionEntrega].find(x => x && x.trim()) || 'Sin dirección'
                    }</td>
                    <td className="centered">
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          onClick={() => setModalDetalle({ show: true, cliente })}
                          title="Ver detalles"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(cliente)}
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-danger" 
                          onClick={() => setModal({ 
                            show: true, 
                            titulo: 'Eliminar cliente', 
                            mensaje: '¿Seguro que deseas eliminar este cliente?', 
                            onConfirm: () => handleDelete(cliente.id) 
                          })}
                          title="Eliminar"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modales */}
        <ModalDetalleCliente 
          show={modalDetalle.show} 
          cliente={modalDetalle.cliente} 
          onClose={() => setModalDetalle({ show: false, cliente: null })} 
        />
        
        <ModalMensaje 
          show={modal.show} 
          titulo={modal.titulo} 
          mensaje={modal.mensaje} 
          onConfirm={modal.onConfirm}
          onClose={() => setModal({ show: false, titulo: '', mensaje: '', onConfirm: null })}
        />
        
        <ModalMensaje 
          show={infoModal.show} 
          titulo={infoModal.titulo} 
          mensaje={infoModal.mensaje} 
          tipo={infoModal.tipo}
          onClose={() => setInfoModal({ show: false, titulo: '', mensaje: '', tipo: 'success' })}
        />
        
        <ModalEditarCliente 
          show={editModal} 
          form={form} 
          onChange={handleChange} 
          onSubmit={handleSubmit} 
          onCancel={handleEditModalClose} 
          error={error} 
        />
      </div>
    </Layout>
  );
}

export default ClientesPage; 