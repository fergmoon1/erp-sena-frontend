import React, { useEffect, useState } from 'react';
import '../styles/ComprasPage.css';

function ComprasPage() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCompra, setEditCompra] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [filtros, setFiltros] = useState({ proveedorId: '', fecha: '' });
  const [form, setForm] = useState({
    proveedorId: '',
    fecha: '',
    usuario: '',
    detalles: []
  });
  const [detalleForm, setDetalleForm] = useState({ productoId: '', cantidad: '', precioUnitario: '' });
  const [error, setError] = useState(null);
  const [totalCompras, setTotalCompras] = useState(0);

  const token = localStorage.getItem('jwt');
  const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchProductos();
  }, []);

  const fetchCompras = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando fetch de compras...');
      
      const response = await fetch('http://localhost:8081/api/compras/demo', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Respuesta no es JSON. Content-Type: ${contentType}`);
      }

      const text = await response.text();
      console.log('Respuesta en texto:', text.substring(0, 500) + '...');
      
      if (!text || text.trim() === '') {
        throw new Error('Respuesta vacía del servidor');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        console.error('Texto recibido:', text);
        throw new Error(`Error al parsear JSON: ${parseError.message}. Respuesta: ${text.substring(0, 200)}`);
      }

      console.log('Datos parseados:', data);
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Error del servidor');
      }

      setCompras(data.compras || []);
      setTotalCompras(data.total || 0);
      
    } catch (error) {
      console.error('Error completo:', error);
      setError(`Error al cargar compras: ${error.message}`);
      setCompras([]);
      setTotalCompras(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores', config);
      const data = await res.json();
      setProveedores(data);
    } catch {
      setProveedores([]);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos', config);
      const data = await res.json();
      setProductos(data);
    } catch {
      setProductos([]);
    }
  };

  const handleFiltroChange = e => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleBuscar = e => {
    e.preventDefault();
    fetchCompras();
  };

  const handleOpenModal = (compra = null) => {
    if (compra) {
      setEditCompra(compra);
      setForm({
        proveedorId: compra.proveedor?.id || '',
        fecha: compra.fecha || '',
        usuario: compra.usuario || '',
        detalles: compra.detalles?.map(d => ({
          productoId: d.producto?.id || '',
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario
        })) || []
      });
    } else {
      setEditCompra(null);
      setForm({ proveedorId: '', fecha: '', usuario: '', detalles: [] });
    }
    setModalOpen(true);
    setFeedback('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditCompra(null);
    setForm({ proveedorId: '', fecha: '', usuario: '', detalles: [] });
    setDetalleForm({ productoId: '', cantidad: '', precioUnitario: '' });
    setFeedback('');
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = e => {
    setDetalleForm({ ...detalleForm, [e.target.name]: e.target.value });
  };

  const handleAddDetalle = () => {
    if (!detalleForm.productoId || !detalleForm.cantidad || !detalleForm.precioUnitario) return;
    setForm({
      ...form,
      detalles: [
        ...form.detalles,
        {
          productoId: detalleForm.productoId,
          cantidad: Number(detalleForm.cantidad),
          precioUnitario: Number(detalleForm.precioUnitario)
        }
      ]
    });
    setDetalleForm({ productoId: '', cantidad: '', precioUnitario: '' });
  };

  const handleRemoveDetalle = idx => {
    setForm({ ...form, detalles: form.detalles.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFeedback('');
    if (!form.proveedorId || !form.fecha || form.detalles.length === 0) {
      setFeedback('Todos los campos y al menos un producto son obligatorios.');
      return;
    }
    const compraData = {
      proveedor: { id: form.proveedorId },
      fecha: form.fecha,
      usuario: form.usuario,
      detalles: form.detalles.map(d => ({
        producto: { id: d.productoId },
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario
      }))
    };
    try {
      const url = editCompra ? `/api/compras/${editCompra.id}` : '/api/compras';
      const method = editCompra ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(compraData)
      });
      if (res.ok) {
        setFeedback('¡Compra guardada correctamente!');
        fetchCompras();
        setTimeout(handleCloseModal, 1000);
      } else {
        setFeedback('Error al guardar la compra.');
      }
    } catch {
      setFeedback('Error de red al guardar la compra.');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar esta compra?')) return;
    try {
      const res = await fetch(`/api/compras/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        fetchCompras();
      }
    } catch {}
  };

  const exportCompras = () => {
    if (!compras.length) return;
    const csv = [
      'Proveedor,Fecha,Total,Usuario',
      ...compras.map(c => `"${c.proveedor?.nombre}","${c.fecha}","${c.total}","${c.usuario}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compras-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  console.log('Renderizando ComprasPage, compras:', compras.length, 'loading:', loading);

  return (
    <div className="compras-container" style={{padding:'32px 0',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:'#2563eb'}}>Compras</h1>
        <button onClick={() => handleOpenModal()} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)'}}>
          <i className="fas fa-plus"></i> Nueva compra
        </button>
        <button onClick={exportCompras} style={{background:'linear-gradient(90deg,#2563eb 0%,#059669 100%)',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',marginLeft:12}}>
          <i className="fas fa-download"></i> Exportar CSV
        </button>
      </div>
      
      <form onSubmit={handleBuscar} style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:24,alignItems:'end'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Proveedor</label>
          <select name="proveedorId" value={filtros.proveedorId} onChange={handleFiltroChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}}>
            <option value="">Todos</option>
            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Fecha</label>
          <input type="date" name="fecha" value={filtros.fecha} onChange={handleFiltroChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}} />
        </div>
        <button type="submit" style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <i className="fas fa-search"></i> Buscar
        </button>
        <button type="button" onClick={() => { setFiltros({ proveedorId: '', fecha: '' }); fetchCompras(); }} style={{background:'#e5e7eb',color:'#222',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(100,116,139,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <i className="fas fa-eraser"></i> Limpiar
        </button>
      </form>
      
      <div className="compras-table-section" style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 8px rgba(37,99,235,0.06)',padding:'18px 0',marginBottom:32,overflowX:'auto'}}>
        <h2 style={{margin:'0 0 18px 24px',fontSize:20,fontWeight:700,color:'#2563eb'}}>Listado de Compras</h2>
        
        {loading ? (
          <div style={{textAlign:'center',padding:'48px 0',color:'#64748b',fontSize:18}}>
            <i className="fas fa-spinner fa-spin" style={{fontSize:28,marginBottom:12}}></i>
            <div>Cargando compras...</div>
          </div>
        ) : error ? (
          <div style={{textAlign:'center',padding:'48px 0',color:'#dc2626',fontSize:18}}>
            <i className="fas fa-exclamation-triangle" style={{fontSize:28,marginBottom:12}}></i>
            <div>{error}</div>
          </div>
        ) : compras.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px 0',color:'#64748b',fontSize:18}}>
            <i className="fas fa-info-circle" style={{fontSize:28,marginBottom:12}}></i>
            <div>No hay compras para mostrar.</div>
          </div>
        ) : (
          <table className="compras-table" style={{width:'100%',borderCollapse:'separate',borderSpacing:0,minWidth:900}}>
            <thead style={{position:'sticky',top:0,zIndex:2,background:'#f1f5f9'}}>
              <tr>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>ID</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Proveedor</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Fecha</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Productos</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Total</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Usuario</th>
                <th style={{padding:'16px 12px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:14,borderBottom:'1px solid #e2e8f0'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c, idx) => (
                <tr key={c.id || idx} style={{background:idx%2===0?'#f8fafc':'#fff'}}>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563',fontWeight:600}}>#{c.id}</td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background:'#e0e7ff',display:'flex',alignItems:'center',justifyContent:'center',color:'#3730a3',fontWeight:600,fontSize:12}}>
                        {c.proveedor?.nombre?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <span>{c.proveedor?.nombre || '-'}</span>
                    </div>
                  </td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <i className="fas fa-calendar" style={{color:'#6b7280',fontSize:12}}></i>
                      {new Date(c.fecha).toLocaleDateString('es-CO')}
                    </div>
                  </td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:4}}>
                      {c.detalles && c.detalles.length > 0 ? (
                        <>
                          {c.detalles.slice(0,2).map((d, detalleIdx) => {
                            const prod = productos.find(p => p.id == d.productoId);
                            return (
                              <div key={detalleIdx} style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:32,height:32,borderRadius:6,overflow:'hidden',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                  {prod?.imagenUrl ? (
                                    <img 
                                      src={`http://localhost:8081/api${prod.imagenUrl}`} 
                                      alt={prod.nombre}
                                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div style={{display:prod?.imagenUrl ? 'none' : 'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'#9ca3af',fontSize:10}}>
                                    <i className="fas fa-box"></i>
                                  </div>
                                </div>
                                <span style={{fontSize:12}}>{prod?.nombre || 'Producto'}</span>
                                <span style={{fontSize:11,color:'#6b7280',background:'#f3f4f6',padding:'2px 6px',borderRadius:4}}>x{d.cantidad}</span>
                              </div>
                            );
                          })}
                          {c.detalles.length > 2 && (
                            <div style={{fontSize:11,color:'#6b7280',fontStyle:'italic'}}>
                              +{c.detalles.length - 2} productos más
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{color:'#6b7280',fontStyle:'italic'}}>Sin productos</span>
                      )}
                    </div>
                  </td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <span style={{fontWeight:700,color:'#059669',fontSize:16}}>
                      ${c.total?.toLocaleString('es-CO') || '0'}
                    </span>
                  </td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <i className="fas fa-user" style={{color:'#6b7280',fontSize:12}}></i>
                      {c.usuario || '-'}
                    </div>
                  </td>
                  <td style={{padding:'16px 12px',borderBottom:'1px solid #f1f5f9',fontSize:14,color:'#4b5563'}}>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <button 
                        onClick={() => handleOpenModal(c)} 
                        style={{
                          background:'#3b82f6',
                          color:'#fff',
                          border:'none',
                          borderRadius:6,
                          padding:'6px 12px',
                          fontWeight:600,
                          fontSize:12,
                          cursor:'pointer',
                          transition:'all 0.2s ease',
                          display:'flex',
                          alignItems:'center',
                          gap:4
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                      >
                        <i className="fas fa-eye" style={{fontSize:10}}></i>
                        Ver
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        style={{
                          background:'#ef4444',
                          color:'#fff',
                          border:'none',
                          borderRadius:6,
                          padding:'6px 12px',
                          fontWeight:600,
                          fontSize:12,
                          cursor:'pointer',
                          transition:'all 0.2s ease',
                          display:'flex',
                          alignItems:'center',
                          gap:4
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                      >
                        <i className="fas fa-trash" style={{fontSize:10}}></i>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {modalOpen && (
        <div className="modal-backdrop" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div className="modal-content" style={{background:'#fff',borderRadius:16,boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',padding:'32px',width:'90%',maxWidth:'800px',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,paddingBottom:16,borderBottom:'1px solid #e2e8f0'}}>
              <h2 style={{fontWeight:700,fontSize:24,color:'#1e293b',margin:0}}>
                <i className="fas fa-shopping-cart" style={{marginRight:12,color:'#2563eb'}}></i>
                {editCompra ? 'Editar Compra' : 'Nueva Compra'}
              </h2>
              <button 
                onClick={handleCloseModal} 
                style={{
                  background:'none',
                  border:'none',
                  fontSize:24,
                  cursor:'pointer',
                  color:'#6b7280',
                  padding:8,
                  borderRadius:6,
                  transition:'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#6b7280';
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{width:'100%',display:'flex',flexDirection:'column',gap:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#374151',fontSize:14}}>
                    <i className="fas fa-truck" style={{marginRight:8,color:'#6b7280'}}></i>
                    Proveedor
                  </label>
                  <select 
                    name="proveedorId" 
                    value={form.proveedorId} 
                    onChange={handleFormChange} 
                    required 
                    style={{
                      width:'100%',
                      padding:12,
                      borderRadius:8,
                      border:'1px solid #d1d5db',
                      fontSize:14,
                      background:'#fff',
                      transition:'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Seleccione proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#374151',fontSize:14}}>
                    <i className="fas fa-calendar" style={{marginRight:8,color:'#6b7280'}}></i>
                    Fecha
                  </label>
                  <input 
                    type="date" 
                    name="fecha" 
                    value={form.fecha} 
                    onChange={handleFormChange} 
                    required 
                    style={{
                      width:'100%',
                      padding:12,
                      borderRadius:8,
                      border:'1px solid #d1d5db',
                      fontSize:14,
                      background:'#fff',
                      transition:'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{display:'block',marginBottom:8,fontWeight:600,color:'#374151',fontSize:14}}>
                  <i className="fas fa-user" style={{marginRight:8,color:'#6b7280'}}></i>
                  Usuario
                </label>
                <input 
                  type="text" 
                  name="usuario" 
                  value={form.usuario} 
                  onChange={handleFormChange} 
                  placeholder="Usuario que registra la compra" 
                  style={{
                    width:'100%',
                    padding:12,
                    borderRadius:8,
                    border:'1px solid #d1d5db',
                    fontSize:14,
                    background:'#fff',
                    transition:'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563eb';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{border:'1px solid #e2e8f0',borderRadius:12,padding:20,background:'#f8fafc'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <h3 style={{fontWeight:700,color:'#374151',margin:0,fontSize:16}}>
                    <i className="fas fa-boxes" style={{marginRight:8,color:'#2563eb'}}></i>
                    Productos de la Compra
                  </h3>
                  <span style={{fontSize:12,color:'#6b7280',background:'#e5e7eb',padding:'4px 8px',borderRadius:6}}>
                    {form.detalles.length} producto{form.detalles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {form.detalles.length > 0 && (
                  <div style={{marginBottom:16,background:'#fff',borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead style={{background:'#f1f5f9'}}>
                        <tr>
                          <th style={{padding:'12px',textAlign:'left',fontWeight:600,color:'#374151',fontSize:13,borderBottom:'1px solid #e2e8f0'}}>Producto</th>
                          <th style={{padding:'12px',textAlign:'center',fontWeight:600,color:'#374151',fontSize:13,borderBottom:'1px solid #e2e8f0'}}>Cantidad</th>
                          <th style={{padding:'12px',textAlign:'center',fontWeight:600,color:'#374151',fontSize:13,borderBottom:'1px solid #e2e8f0'}}>Precio Unit.</th>
                          <th style={{padding:'12px',textAlign:'center',fontWeight:600,color:'#374151',fontSize:13,borderBottom:'1px solid #e2e8f0'}}>Subtotal</th>
                          <th style={{padding:'12px',textAlign:'center',fontWeight:600,color:'#374151',fontSize:13,borderBottom:'1px solid #e2e8f0'}}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.detalles.map((d, idx) => {
                          const prod = productos.find(p => p.id == d.productoId);
                          return (
                            <tr key={idx} style={{background:idx%2===0?'#f8fafc':'#fff'}}>
                              <td style={{padding:'12px',borderBottom:'1px solid #f1f5f9',fontSize:13,color:'#4b5563'}}>
                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                  <div style={{width:32,height:32,borderRadius:6,overflow:'hidden',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    {prod?.imagenUrl ? (
                                      <img 
                                        src={`http://localhost:8081/api${prod.imagenUrl}`} 
                                        alt={prod.nombre}
                                        style={{width:'100%',height:'100%',objectFit:'cover'}}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div style={{display:prod?.imagenUrl ? 'none' : 'flex',alignItems:'center',justifyContent:'center',width:'100%',height:'100%',color:'#9ca3af',fontSize:10}}>
                                      <i className="fas fa-box"></i>
                                    </div>
                                  </div>
                                  <span style={{fontWeight:500}}>{prod?.nombre || 'Producto'}</span>
                                </div>
                              </td>
                              <td style={{padding:'12px',borderBottom:'1px solid #f1f5f9',fontSize:13,color:'#4b5563',textAlign:'center',fontWeight:600}}>{d.cantidad}</td>
                              <td style={{padding:'12px',borderBottom:'1px solid #f1f5f9',fontSize:13,color:'#4b5563',textAlign:'center'}}>${d.precioUnitario?.toLocaleString('es-CO')}</td>
                              <td style={{padding:'12px',borderBottom:'1px solid #f1f5f9',fontSize:13,color:'#059669',textAlign:'center',fontWeight:600}}>${(d.cantidad * d.precioUnitario).toLocaleString('es-CO')}</td>
                              <td style={{padding:'12px',borderBottom:'1px solid #f1f5f9',fontSize:13,color:'#4b5563',textAlign:'center'}}>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveDetalle(idx)} 
                                  style={{
                                    background:'#ef4444',
                                    color:'#fff',
                                    border:'none',
                                    borderRadius:6,
                                    padding:'6px 10px',
                                    fontWeight:600,
                                    fontSize:11,
                                    cursor:'pointer',
                                    transition:'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                                  onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                                >
                                  <i className="fas fa-trash" style={{fontSize:10,marginRight:4}}></i>
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{background:'#fff',borderRadius:8,padding:16,border:'1px solid #e2e8f0'}}>
                  <h4 style={{margin:'0 0 12px 0',fontSize:14,fontWeight:600,color:'#374151'}}>Agregar Producto</h4>
                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
                    <div>
                      <label style={{display:'block',marginBottom:4,fontSize:12,color:'#6b7280'}}>Producto</label>
                      <select 
                        name="productoId" 
                        value={detalleForm.productoId} 
                        onChange={handleDetalleChange} 
                        style={{
                          width:'100%',
                          padding:8,
                          borderRadius:6,
                          border:'1px solid #d1d5db',
                          fontSize:13,
                          background:'#fff'
                        }}
                      >
                        <option value="">Seleccione producto</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{display:'block',marginBottom:4,fontSize:12,color:'#6b7280'}}>Cantidad</label>
                      <input 
                        type="number" 
                        name="cantidad" 
                        value={detalleForm.cantidad} 
                        onChange={handleDetalleChange} 
                        min={1} 
                        style={{
                          width:'100%',
                          padding:8,
                          borderRadius:6,
                          border:'1px solid #d1d5db',
                          fontSize:13,
                          background:'#fff'
                        }} 
                      />
                    </div>
                    <div>
                      <label style={{display:'block',marginBottom:4,fontSize:12,color:'#6b7280'}}>Precio Unit.</label>
                      <input 
                        type="number" 
                        name="precioUnitario" 
                        value={detalleForm.precioUnitario} 
                        onChange={handleDetalleChange} 
                        min={0} 
                        step="0.01"
                        style={{
                          width:'100%',
                          padding:8,
                          borderRadius:6,
                          border:'1px solid #d1d5db',
                          fontSize:13,
                          background:'#fff'
                        }} 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddDetalle} 
                      style={{
                        background:'#059669',
                        color:'#fff',
                        border:'none',
                        borderRadius:6,
                        padding:'8px 16px',
                        fontWeight:600,
                        fontSize:13,
                        cursor:'pointer',
                        transition:'all 0.2s ease',
                        display:'flex',
                        alignItems:'center',
                        gap:6
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#047857'}
                      onMouseLeave={(e) => e.target.style.background = '#059669'}
                    >
                      <i className="fas fa-plus" style={{fontSize:10}}></i>
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
              {feedback && (
                <div style={{
                  padding:12,
                  borderRadius:8,
                  fontWeight:600,
                  fontSize:14,
                  background:feedback.startsWith('¡')?'#dcfce7':'#fef2f2',
                  color:feedback.startsWith('¡')?'#166534':'#dc2626',
                  border:'1px solid',
                  borderColor:feedback.startsWith('¡')?'#bbf7d0':'#fecaca'
                }}>
                  {feedback}
                </div>
              )}
              <div style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:8}}>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  style={{
                    background:'#e5e7eb',
                    color:'#374151',
                    border:'none',
                    borderRadius:8,
                    padding:'12px 24px',
                    fontWeight:600,
                    fontSize:14,
                    cursor:'pointer',
                    transition:'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{
                    background:'#2563eb',
                    color:'#fff',
                    border:'none',
                    borderRadius:8,
                    padding:'12px 24px',
                    fontWeight:600,
                    fontSize:14,
                    cursor:'pointer',
                    transition:'all 0.2s ease',
                    display:'flex',
                    alignItems:'center',
                    gap:8
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                  onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                >
                  <i className="fas fa-save" style={{fontSize:12}}></i>
                  {editCompra ? 'Actualizar' : 'Guardar'} Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComprasPage; 