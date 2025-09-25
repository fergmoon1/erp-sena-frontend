import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';
import '../styles/InventarioPage.css';
import '../styles/PedidosPage.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://localhost:8081/api';

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

// Componente para mostrar el estado con color e ícono SVG
function EstadoPedido({ estado, motivo, onClick }) {
  const estadoKey = estado ? estado.toLowerCase().replace(/\s/g, '') : '';
  let className = '';
  switch (estadoKey) {
    case 'pendiente':
      className = 'estado-pendiente';
      break;
    case 'enviado':
      className = 'estado-enviado';
      break;
    case 'entregado':
      className = 'estado-entregado';
      break;
    case 'completado':
      className = 'estado-completado';
      break;
    case 'cancelado':
      className = 'estado-cancelado';
      break;
    default:
      className = 'estado-desconocido';
  }
  return (
    <span className={className + ' estado-solo-texto'} style={{cursor: motivo ? 'pointer' : 'default'}} onClick={motivo ? onClick : undefined} title={motivo ? 'Ver motivo' : ''}>
      {estado ? estado.toUpperCase() : ''}
    </span>
  );
}

function PedidosPage() {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [form, setForm] = useState({ clienteId: '', fecha: '', estado: 'pendiente', productos: [], productoId: '', cantidad: '', motivoEstado: '' });
  const [editId, setEditId] = useState(null);
  const [modal, setModal] = useState({ show: false, titulo: '', mensaje: '', onConfirm: null });
  const [busqueda, setBusqueda] = useState({ clienteId: '', fecha: '', estado: '' });
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const token = localStorage.getItem('jwt');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const [modalMotivo, setModalMotivo] = useState({ show: false, motivo: '', estado: '' });
  const [modalDetalle, setModalDetalle] = useState({ show: false, pedido: null });
  const formRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({ productoId: '', valorMin: '', valorMax: '', fechaInicio: '', fechaFin: '' });
  const [clienteInput, setClienteInput] = useState('');
  const [productoInput, setProductoInput] = useState('');
  const [showClienteSugerencias, setShowClienteSugerencias] = useState(false);
  const [showProductoSugerencias, setShowProductoSugerencias] = useState(false);
  const clienteInputRef = useRef();
  const productoInputRef = useRef();

  // KPIs simulados (puedes luego conectar a datos reales)
  const kpis = [
    { label: 'Pedidos Hoy', value: 12, icon: 'fas fa-calendar-day', color: 'primary' },
    { label: 'Pendientes', value: 8, icon: 'fas fa-hourglass-half', color: 'warning' },
    { label: 'Completados', value: 20, icon: 'fas fa-check-circle', color: 'success' },
    { label: 'Cancelados', value: 2, icon: 'fas fa-times-circle', color: 'danger' },
    { label: 'Monto Total', value: '$1,250,000', icon: 'fas fa-dollar-sign', color: 'info' },
    { label: 'Ticket Promedio', value: '$62,500', icon: 'fas fa-receipt', color: 'secondary' },
  ];

  // Productos únicos para filtro
  const productosUnicos = React.useMemo(() => {
    const ids = new Set();
    return productos.filter(p => {
      if (ids.has(p.id)) return false;
      ids.add(p.id);
      return true;
    });
  }, [productos]);

  // Sugerencias filtradas
  const clientesFiltrados = clientes.filter(c => c.nombre.toLowerCase().includes(clienteInput.toLowerCase()));
  const productosFiltrados = productosUnicos.filter(p => p.nombre.toLowerCase().includes(productoInput.toLowerCase()));

  // Al seleccionar sugerencia
  const handleSelectCliente = (c) => {
    setClienteInput(c.nombre);
    setBusqueda({ ...busqueda, clienteId: c.id });
    setShowClienteSugerencias(false);
  };
  const handleSelectProducto = (p) => {
    setProductoInput(p.nombre);
    setFiltrosAvanzados({ ...filtrosAvanzados, productoId: p.id });
    setShowProductoSugerencias(false);
  };
  // Si se borra el input, limpia el filtro
  useEffect(() => {
    if (clienteInput === '') setBusqueda({ ...busqueda, clienteId: '' });
  }, [clienteInput]);
  useEffect(() => {
    if (productoInput === '') setFiltrosAvanzados({ ...filtrosAvanzados, productoId: '' });
  }, [productoInput]);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    fetchPedidos();
  }, [pagina]);

  const fetchClientes = async () => {
    try {
      const res = await axios.get(`${API_URL}/clientes`, config);
      setClientes(res.data);
    } catch (err) {
      setClientes([]);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await axios.get(`${API_URL}/productos`, config);
      setProductos(res.data);
    } catch (err) {
      setProductos([]);
    }
  };

  const fetchPedidos = async () => {
    try {
      const params = { ...busqueda, pagina };
      const res = await axios.get(`${API_URL}/pedidos`, { ...config, params });
      setPedidos(res.data.content || res.data);
      setTotalPaginas(res.data.totalPages || 1);
    } catch (err) {
      setPedidos([]);
      setTotalPaginas(1);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddProducto = () => {
    if (!form.productoId || !form.cantidad || isNaN(form.cantidad) || Number(form.cantidad) <= 0) return;
    const prod = productos.find(p => p.id === Number(form.productoId));
    if (!prod) return;
    setForm({
      ...form,
      productos: [...form.productos, { productoId: prod.id, nombre: prod.nombre, cantidad: Math.max(1, Number(form.cantidad)), precioUnitario: prod.precio }],
      productoId: '',
      cantidad: ''
    });
  };

  const handleRemoveProducto = (idx) => {
    setForm({ ...form, productos: form.productos.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clienteId || !form.fecha || form.productos.length === 0) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Todos los campos y al menos un producto son obligatorios.' });
      return;
    }
    try {
      if (editId) {
        await axios.put(`${API_URL}/pedidos/${editId}`, {
          clienteId: form.clienteId,
          fecha: form.fecha,
          estado: form.estado.toLowerCase(),
          detalles: form.productos,
          motivoEstado: form.motivoEstado
        }, config);
        setModal({ show: true, titulo: 'Éxito', mensaje: '¡Pedido actualizado!' });
      } else {
        await axios.post(`${API_URL}/pedidos`, {
          clienteId: form.clienteId,
          fecha: form.fecha,
          estado: form.estado.toLowerCase(),
          detalles: form.productos,
          motivoEstado: form.motivoEstado
        }, config);
        setModal({ show: true, titulo: 'Éxito', mensaje: '¡Pedido agregado!' });
      }
      setForm({ clienteId: '', fecha: '', estado: 'pendiente', productos: [], productoId: '', cantidad: '', motivoEstado: '' });
      setEditId(null);
      fetchPedidos();
    } catch (err) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Error al guardar el pedido.' });
    }
  };

  const handleEdit = (pedido) => {
    setForm({
      clienteId: pedido.cliente.id,
      fecha: pedido.fecha?.substring(0, 10) || '',
      estado: pedido.estado,
      productos: pedido.detalles.map(d => ({ productoId: d.producto.id, nombre: d.producto.nombre, cantidad: d.cantidad })),
      productoId: '',
      cantidad: '',
      motivoEstado: pedido.motivoEstado || ''
    });
    setEditId(pedido.id);
    setModal({ show: false });
  };

  const handleDelete = (id) => {
    setModal({
      show: true,
      titulo: 'Confirmar eliminación',
      mensaje: '¿Seguro que desea eliminar este pedido?',
      onConfirm: () => doDelete(id)
    });
  };

  const doDelete = async (id) => {
    setModal({ show: false });
    try {
      await axios.delete(`${API_URL}/pedidos/${id}`, config);
      setModal({ show: true, titulo: 'Éxito', mensaje: '¡Pedido eliminado!' });
      fetchPedidos();
    } catch (err) {
      setModal({ show: true, titulo: 'Error', mensaje: 'Error al eliminar el pedido.' });
    }
  };

  const handleLimpiar = () => {
    setForm({ clienteId: '', fecha: '', estado: 'pendiente', productos: [], productoId: '', cantidad: '', motivoEstado: '' });
    setEditId(null);
    setModal({ show: false });
  };

  const handleBusquedaChange = (e) => {
    setBusqueda({ ...busqueda, [e.target.name]: e.target.value });
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setPagina(1);
    fetchPedidos();
  };

  const handleLimpiarBusqueda = () => {
    setBusqueda({ clienteId: '', fecha: '', estado: '' });
    setPagina(1);
    fetchPedidos();
  };

  const handleNuevoPedido = () => {
    setForm({ clienteId: '', fecha: '', estado: 'pendiente', productos: [], productoId: '', cantidad: '', motivoEstado: '' });
    setEditId(null);
    setModal({ show: false });
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Función para ordenar los pedidos
  const sortedPedidos = React.useMemo(() => {
    let sortable = [...pedidos];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'cliente') {
          aValue = a.cliente?.nombre || '';
          bValue = b.cliente?.nombre || '';
        }
        if (sortConfig.key === 'fecha') {
          aValue = a.fecha || '';
          bValue = b.fecha || '';
        }
        if (sortConfig.key === 'estado') {
          aValue = a.estado || '';
          bValue = b.estado || '';
        }
        if (sortConfig.key === 'valor') {
          // Suma de productos * precio
          aValue = a.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0;
          bValue = b.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [pedidos, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Función para filtrar y ordenar los pedidos
  const filteredAndSortedPedidos = React.useMemo(() => {
    let filtered = [...pedidos];
    // Filtro por producto
    if (filtrosAvanzados.productoId) {
      filtered = filtered.filter(ped => ped.detalles?.some(d => String(d.producto?.id) === String(filtrosAvanzados.productoId)));
    }
    // Filtro por valor
    if (filtrosAvanzados.valorMin) {
      filtered = filtered.filter(ped => (ped.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0) >= Number(filtrosAvanzados.valorMin));
    }
    if (filtrosAvanzados.valorMax) {
      filtered = filtered.filter(ped => (ped.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0) <= Number(filtrosAvanzados.valorMax));
    }
    // Filtro por rango de fechas
    if (filtrosAvanzados.fechaInicio) {
      filtered = filtered.filter(ped => ped.fecha && ped.fecha >= filtrosAvanzados.fechaInicio);
    }
    if (filtrosAvanzados.fechaFin) {
      filtered = filtered.filter(ped => ped.fecha && ped.fecha <= filtrosAvanzados.fechaFin);
    }
    // Filtros existentes (cliente, estado, fecha exacta)
    if (busqueda.clienteId) {
      filtered = filtered.filter(ped => String(ped.cliente?.id) === String(busqueda.clienteId));
    }
    if (busqueda.estado) {
      filtered = filtered.filter(ped => String(ped.estado) === String(busqueda.estado));
    }
    if (busqueda.fecha) {
      filtered = filtered.filter(ped => ped.fecha?.substring(0, 10) === busqueda.fecha);
    }
    // Ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'cliente') {
          aValue = a.cliente?.nombre || '';
          bValue = b.cliente?.nombre || '';
        }
        if (sortConfig.key === 'fecha') {
          aValue = a.fecha || '';
          bValue = b.fecha || '';
        }
        if (sortConfig.key === 'estado') {
          aValue = a.estado || '';
          bValue = b.estado || '';
        }
        if (sortConfig.key === 'valor') {
          aValue = a.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0;
          bValue = b.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0;
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [pedidos, busqueda, filtrosAvanzados, sortConfig]);

  const handleFiltrosAvanzadosChange = (e) => {
    setFiltrosAvanzados({ ...filtrosAvanzados, [e.target.name]: e.target.value });
  };

  // Exportar a Excel
  const exportarExcel = () => {
    const data = filteredAndSortedPedidos.map(ped => ({
      ID: ped.id,
      Cliente: ped.cliente?.nombre + (ped.cliente?.apellidos ? ' ' + ped.cliente.apellidos : '') || '',
      Fecha: ped.fecha?.substring(0, 10) || '',
      Estado: ped.estado,
      Valor: ped.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0,
      Productos: ped.detalles?.map(d => `${d.producto?.nombre} (x${d.cantidad})`).join('; ')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'pedidos.xlsx');
  };

  // Exportar a CSV
  const exportarCSV = () => {
    const data = filteredAndSortedPedidos.map(ped => ({
      ID: ped.id,
      Cliente: ped.cliente?.nombre + (ped.cliente?.apellidos ? ' ' + ped.cliente.apellidos : '') || '',
      Fecha: ped.fecha?.substring(0, 10) || '',
      Estado: ped.estado,
      Valor: ped.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0,
      Productos: ped.detalles?.map(d => `${d.producto?.nombre} (x${d.cantidad})`).join('; ')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'pedidos.csv');
  };

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const columns = [
      { header: 'ID', dataKey: 'id' },
      { header: 'Cliente', dataKey: 'cliente' },
      { header: 'Fecha', dataKey: 'fecha' },
      { header: 'Estado', dataKey: 'estado' },
      { header: 'Valor', dataKey: 'valor' },
      { header: 'Productos', dataKey: 'productos' }
    ];
    const rows = filteredAndSortedPedidos.map(ped => ({
      id: ped.id,
      cliente: ped.cliente?.nombre + (ped.cliente?.apellidos ? ' ' + ped.cliente.apellidos : '') || '',
      fecha: ped.fecha?.substring(0, 10) || '',
      estado: ped.estado,
      valor: ped.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0) || 0,
      productos: ped.detalles?.map(d => `${d.producto?.nombre} (x${d.cantidad})`).join('; ')
    }));
    doc.autoTable({ columns, body: rows, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } });
    doc.save('pedidos.pdf');
  };

  return (
    <div className="pedidos-area-container">
      {/* Header moderno */}
      <div className="pedidos-header">
        {/* Eliminado el div vacío */}
      </div>
      {/* Título sobre KPIs */}
      <h2 className="pedidos-kpi-title" style={{margin: '0 0 10px 0', fontWeight: 700, fontSize: '1.18rem', color: '#2563eb'}}>Resumen de Pedidos</h2>
      {/* KPIs destacados */}
      <div className="pedidos-kpi-grid">
        {kpis.map((kpi, idx) => (
          <div className={`pedidos-kpi-card ${kpi.color}`} key={idx}>
            <div className="pedidos-kpi-icon"><i className={kpi.icon}></i></div>
            <div className="pedidos-kpi-value">{kpi.value}</div>
            <div className="pedidos-kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>
      {/* Formulario Agregar Pedido */}
      {editId === null && (
        <div className="inventario-form-card" ref={formRef}>
          <div style={{background:'#2563eb', color:'#fff', borderRadius:'10px 10px 0 0', padding:'16px 24px', fontWeight:800, fontSize:'1.18rem', letterSpacing:'0.5px', boxShadow:'0 2px 8px rgba(37,99,235,0.10)', display:'flex', alignItems:'center', gap:10}}>
            <i className="fas fa-plus-circle" style={{fontSize:'1.3em'}}></i>
            Agregar Pedido
          </div>
          <form onSubmit={handleSubmit} style={{padding:'24px 18px 0 18px'}}>
            <div className="form-group" style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Cliente</label>
                <select className="form-select" name="clienteId" value={form.clienteId} onChange={handleFormChange}>
                  <option value="">Seleccione un cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos || ''}</option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1, minWidth: 140}}>
                <label className="form-label">Fecha</label>
                <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleFormChange} />
              </div>
              <div style={{flex: 1, minWidth: 140}}>
                <label className="form-label">Estado</label>
                <select className="form-select" name="estado" value={form.estado} onChange={handleFormChange}>
                  <option value="pendiente">Pendiente</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Motivo del estado</label>
                <input className="form-input" name="motivoEstado" value={form.motivoEstado} onChange={handleFormChange} maxLength={255} placeholder="Ej: Pendiente por pago, por envío, etc." />
              </div>
            </div>
            <div className="form-group" style={{display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end'}}>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Productos</label>
                <select className="form-select" name="productoId" value={form.productoId} onChange={handleFormChange}>
                  <option value="">Seleccione un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1, minWidth: 100}}>
                <label className="form-label">Cantidad</label>
                <input className="form-input" name="cantidad" type="number" min="1" value={form.cantidad} onChange={handleFormChange} />
              </div>
              <div style={{minWidth: 120}}>
                <button type="button" className="btn-guardar" style={{marginTop: 8}} onClick={handleAddProducto}>Agregar Producto</button>
              </div>
            </div>
            {/* Lista de productos agregados al pedido */}
            {form.productos.length > 0 && (
              <div style={{margin: '12px 0'}}>
                <b style={{color: '#2563eb'}}>Productos en el pedido:</b>
                <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'none'}}>
                  {form.productos.map((p, idx) => (
                    <li key={idx} style={{marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8}}>
                      <span>{p.nombre} (Cantidad: {p.cantidad})</span>
                      <button type="button" className="btn-eliminar" style={{padding: '2px 10px', fontSize: '0.95em'}} onClick={() => handleRemoveProducto(idx)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="form-buttons-area">
              <button className="btn-guardar" type="submit">Guardar</button>
              <button className="btn-limpiar" type="button" onClick={handleLimpiar}>Limpiar</button>
            </div>
          </form>
        </div>
      )}
      {/* Buscar Pedidos */}
      <h2 className="pedidos-filtros-title">Búsqueda y Filtros Avanzados</h2>
      <p className="pedidos-filtros-desc">Utiliza los campos para buscar pedidos por cliente, producto, estado, valor o fecha. Puedes combinar varios filtros para una búsqueda precisa.</p>
      <div className="pedidos-filtros-modernos">
        <form onSubmit={handleBuscar} className="pedidos-filtros-form" autoComplete="off">
          <div className="pedidos-filtros-grid">
            <div style={{position:'relative'}}>
              <label>Cliente</label>
              <input
                type="text"
                name="clienteInput"
                value={clienteInput}
                ref={clienteInputRef}
                onChange={e => { setClienteInput(e.target.value); setShowClienteSugerencias(true); }}
                onFocus={() => setShowClienteSugerencias(true)}
                placeholder="Buscar cliente..."
                autoComplete="off"
              />
              {showClienteSugerencias && clienteInput && clientesFiltrados.length > 0 && (
                <ul className="autocomplete-sugerencias" onMouseLeave={() => setShowClienteSugerencias(false)}>
                  {clientesFiltrados.slice(0,8).map(c => (
                    <li key={c.id} onClick={() => handleSelectCliente(c)}>{c.nombre} {c.apellidos || ''}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label>Estado</label>
              <select name="estado" value={busqueda.estado} onChange={handleBusquedaChange}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div style={{position:'relative'}}>
              <label>Producto</label>
              <input
                type="text"
                name="productoInput"
                value={productoInput}
                ref={productoInputRef}
                onChange={e => { setProductoInput(e.target.value); setShowProductoSugerencias(true); }}
                onFocus={() => setShowProductoSugerencias(true)}
                placeholder="Buscar producto..."
                autoComplete="off"
              />
              {showProductoSugerencias && productoInput && productosFiltrados.length > 0 && (
                <ul className="autocomplete-sugerencias" onMouseLeave={() => setShowProductoSugerencias(false)}>
                  {productosFiltrados.slice(0,8).map(p => (
                    <li key={p.id} onClick={() => handleSelectProducto(p)}>{p.nombre}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label>Valor mínimo</label>
              <input name="valorMin" type="number" min="0" value={filtrosAvanzados.valorMin} onChange={handleFiltrosAvanzadosChange} placeholder="$ Min" />
            </div>
            <div>
              <label>Valor máximo</label>
              <input name="valorMax" type="number" min="0" value={filtrosAvanzados.valorMax} onChange={handleFiltrosAvanzadosChange} placeholder="$ Max" />
            </div>
            <div>
              <label>Fecha inicio</label>
              <input name="fechaInicio" type="date" value={filtrosAvanzados.fechaInicio} onChange={handleFiltrosAvanzadosChange} />
            </div>
            <div>
              <label>Fecha fin</label>
              <input name="fechaFin" type="date" value={filtrosAvanzados.fechaFin} onChange={handleFiltrosAvanzadosChange} />
            </div>
            <div className="pedidos-filtros-botones">
              <button className="btn-guardar" type="submit">Buscar</button>
              <button className="btn-limpiar" type="button" onClick={handleLimpiarBusqueda}>Limpiar</button>
            </div>
          </div>
        </form>
      </div>
      {/* Lista de Pedidos */}
      <div className="inventario-table-card">
        <h2 className="inventario-table-title">Lista de Pedidos</h2>
        <div style={{display:'flex', gap:12, margin:'18px 0 8px 0', justifyContent:'flex-end'}}>
          <button className="btn-guardar" onClick={exportarExcel}><i className="fas fa-file-excel"></i> Exportar Excel</button>
          <button className="btn-guardar" onClick={exportarCSV}><i className="fas fa-file-csv"></i> Exportar CSV</button>
          <button className="btn-guardar" onClick={exportarPDF}><i className="fas fa-file-pdf"></i> Exportar PDF</button>
        </div>
        <table className="pedidos-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className={sortConfig.key === 'id' ? 'sorted' : ''}>ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('cliente')} className={sortConfig.key === 'cliente' ? 'sorted' : ''}>Cliente {sortConfig.key === 'cliente' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('fecha')} className={sortConfig.key === 'fecha' ? 'sorted' : ''}>Fecha {sortConfig.key === 'fecha' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('estado')} className={sortConfig.key === 'estado' ? 'sorted' : ''}>Estado {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th>Productos</th>
              <th onClick={() => handleSort('valor')} className={sortConfig.key === 'valor' ? 'sorted' : ''}>Valor {sortConfig.key === 'valor' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPedidos.map((pedido, idx) => (
              <tr key={pedido.id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                <td>{pedido.id}</td>
                <td>{pedido.cliente?.nombre} {pedido.cliente?.apellidos || ''}</td>
                <td>{pedido.fecha?.substring(0, 10) || '-'}</td>
                <td>
                  <span className={`pedidos-badge ${pedido.estado?.toLowerCase()}`}
                        title={pedido.motivoEstado || ''}
                        onClick={() => setModalDetalle({ show: true, pedido })}
                        style={{cursor: 'pointer'}}>
                    <i className={
                      pedido.estado?.toLowerCase() === 'pendiente' ? 'fas fa-hourglass-half' :
                      pedido.estado?.toLowerCase() === 'enviado' ? 'fas fa-truck' :
                      pedido.estado?.toLowerCase() === 'entregado' ? 'fas fa-box-open' :
                      pedido.estado?.toLowerCase() === 'completado' ? 'fas fa-check-circle' :
                      pedido.estado?.toLowerCase() === 'cancelado' ? 'fas fa-times-circle' :
                      'fas fa-question-circle'
                    } style={{marginRight: 6}}></i>
                    {pedido.estado ? pedido.estado.toUpperCase() : ''}
                  </span>
                </td>
                <td>
                  <ul className="pedidos-productos-list">
                    {pedido.detalles?.map((d, idx) => (
                      <li key={idx}>{d.producto?.nombre} <span className="pedidos-prod-cant">x{d.cantidad}</span></li>
                    ))}
                  </ul>
                </td>
                <td>
                  $ {pedido.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0).toLocaleString()}
                </td>
                <td className="pedidos-acciones">
                  <button className="btn-editar" title="Editar" onClick={() => handleEdit(pedido)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn-eliminar" title="Eliminar" onClick={() => handleDelete(pedido.id)}>
                    <i className="fas fa-trash"></i>
                  </button>
                  <button className="btn-detalle" title="Ver detalles" onClick={() => setModalDetalle({ show: true, pedido })}>
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16}}>
          <button className="btn-limpiar" disabled={pagina <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</button>
          <span style={{alignSelf: 'center', fontWeight: 500}}>Página {pagina} de {totalPaginas}</span>
          <button className="btn-limpiar" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>Siguiente</button>
        </div>
      </div>
      {/* Formulario Editar Pedido */}
      {editId !== null && (
        <div className="inventario-form-card" style={{marginTop: 32}}>
          <h2 className="inventario-form-title">Editar Pedido #{editId}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Cliente</label>
                <select className="form-select" name="clienteId" value={form.clienteId} onChange={handleFormChange}>
                  <option value="">Seleccione un cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellidos || ''}</option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1, minWidth: 140}}>
                <label className="form-label">Fecha</label>
                <input className="form-input" name="fecha" type="date" value={form.fecha} onChange={handleFormChange} />
              </div>
              <div style={{flex: 1, minWidth: 140}}>
                <label className="form-label">Estado</label>
                <select className="form-select" name="estado" value={form.estado} onChange={handleFormChange}>
                  <option value="pendiente">Pendiente</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Motivo del estado</label>
                <input className="form-input" name="motivoEstado" value={form.motivoEstado} onChange={handleFormChange} maxLength={255} placeholder="Ej: Pendiente por pago, por envío, etc." />
              </div>
            </div>
            <div className="form-group" style={{display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end'}}>
              <div style={{flex: 1, minWidth: 180}}>
                <label className="form-label">Productos</label>
                <select className="form-select" name="productoId" value={form.productoId} onChange={handleFormChange}>
                  <option value="">Seleccione un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1, minWidth: 100}}>
                <label className="form-label">Cantidad</label>
                <input className="form-input" name="cantidad" type="number" min="1" value={form.cantidad} onChange={handleFormChange} />
              </div>
              <div style={{minWidth: 120}}>
                <button type="button" className="btn-guardar" style={{marginTop: 8}} onClick={handleAddProducto}>Agregar Producto</button>
              </div>
            </div>
            {/* Lista de productos agregados al pedido */}
            {form.productos.length > 0 && (
              <div style={{margin: '12px 0'}}>
                <b style={{color: '#2563eb'}}>Productos en el pedido:</b>
                <ul style={{margin: '8px 0 0 0', padding: 0, listStyle: 'none'}}>
                  {form.productos.map((p, idx) => (
                    <li key={idx} style={{marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8}}>
                      <span>{p.nombre} (Cantidad: {p.cantidad})</span>
                      <button type="button" className="btn-eliminar" style={{padding: '2px 10px', fontSize: '0.95em'}} onClick={() => handleRemoveProducto(idx)}>Quitar</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="form-buttons-area">
              <button className="btn-guardar" type="submit">Guardar Cambios</button>
              <button className="btn-limpiar" type="button" onClick={handleLimpiar}>Cancelar edición</button>
            </div>
          </form>
        </div>
      )}
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
      {/* Modal para mostrar motivo del estado */}
      <ModalMensaje
        show={modalMotivo.show}
        titulo={`Motivo del estado: ${modalMotivo.estado ? modalMotivo.estado.toUpperCase() : ''}`}
        mensaje={modalMotivo.motivo}
        onClose={() => setModalMotivo({ show: false, motivo: '', estado: '' })}
      />
      {/* Modal de detalles de pedido */}
      {modalDetalle.show && modalDetalle.pedido && ReactDOM.createPortal(
        <div className="pedidos-modal-overlay" onClick={() => setModalDetalle({ show: false, pedido: null })}>
          <div className="pedidos-modal" onClick={e => e.stopPropagation()}>
            <div className="pedidos-modal-header">
              <h2>Detalle del Pedido #{modalDetalle.pedido.id}</h2>
              <button className="pedidos-modal-close" onClick={() => setModalDetalle({ show: false, pedido: null })}>&times;</button>
            </div>
            <div className="pedidos-modal-body">
              <div className="pedidos-modal-row"><b>Cliente:</b> {modalDetalle.pedido.cliente?.nombre} {modalDetalle.pedido.cliente?.apellidos || ''}</div>
              <div className="pedidos-modal-row"><b>Fecha:</b> {modalDetalle.pedido.fecha?.substring(0, 10)}</div>
              <div className="pedidos-modal-row"><b>Estado:</b> <span className={`pedidos-badge ${modalDetalle.pedido.estado?.toLowerCase()}`}>{modalDetalle.pedido.estado}</span></div>
              <div className="pedidos-modal-row"><b>Motivo estado:</b> {modalDetalle.pedido.motivoEstado || '—'}</div>
              <div className="pedidos-modal-row"><b>Productos:</b>
                <ul className="pedidos-modal-prod-list">
                  {modalDetalle.pedido.detalles?.map((d, idx) => (
                    <li key={idx}>{d.producto?.nombre} <span className="pedidos-prod-cant">x{d.cantidad}</span> <span style={{color:'#64748b', fontSize:'0.97em'}}>($ {d.producto?.precio?.toLocaleString?.() || '—'})</span></li>
                  ))}
                </ul>
              </div>
              <div className="pedidos-modal-row"><b>Monto total:</b> $ {modalDetalle.pedido.detalles?.reduce((acc, d) => acc + (d.cantidad * (d.producto?.precio || 0)), 0).toLocaleString()}</div>
            </div>
            <div className="pedidos-modal-footer">
              <button className="btn-guardar" onClick={() => setModalDetalle({ show: false, pedido: null })}>Cerrar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default PedidosPage; 