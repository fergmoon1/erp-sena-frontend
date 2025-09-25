import React, { useState, useEffect } from 'react';
import '../styles/AuditoriaPage.css';

const acciones = [
  '', 'LOGIN', 'LOGOUT', 'CREAR', 'EDITAR', 'ELIMINAR', 'EXPORTAR', 'IMPORTAR', 'CAMBIAR_PASSWORD', 'MARCAR_LEIDAS', 'MARCAR_LEIDA'
];
const modulos = [
  '', 'Autenticación', 'Usuarios', 'Productos', 'Clientes', 'Inventario', 'Pedidos', 'ConfiguraciónEmpresa', 'VisualConfig', 'PasswordPolicy', 'RolesPermisos', 'Notificaciones'
];
const severidades = ['', 'info', 'warning', 'critical'];

function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    usuario: '',
    accion: '',
    modulo: '',
    severidad: '',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      let url = 'http://localhost:8081/api/auditoria';
      const params = [];
      if (filters.usuario) url = `/api/auditoria/usuario/${filters.usuario}`;
      else if (filters.accion) url = `/api/auditoria/accion/${filters.accion}`;
      else if (filters.modulo) url = `/api/auditoria/modulo/${filters.modulo}`;
      else if (filters.severidad) url = `/api/auditoria/severidad/${filters.severidad}`;
      else if (filters.fechaInicio && filters.fechaFin) {
        url = `/api/auditoria/fecha?desde=${filters.fechaInicio}T00:00:00&hasta=${filters.fechaFin}T23:59:59`;
      }
      if (!url.startsWith('http')) url = 'http://localhost:8081' + url;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ usuario: '', accion: '', modulo: '', severidad: '', fechaInicio: '', fechaFin: '' });
    setTimeout(fetchLogs, 100);
  };

  const exportLogs = () => {
    if (!logs.length) return;
    const csv = [
      'Fecha,Usuario,Acción,Módulo,Detalle,Severidad',
      ...logs.map(l => `"${l.fecha}","${l.usuario}","${l.accion}","${l.modulo}","${l.detalle}","${l.severidad}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getSeverityClass = sev => {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'critical';
      case 'warning': return 'high';
      case 'info': return 'info';
      default: return 'info';
    }
  };
  const getActionIcon = accion => {
    switch ((accion || '').toLowerCase()) {
      case 'login': return 'fas fa-sign-in-alt';
      case 'logout': return 'fas fa-sign-out-alt';
      case 'crear': return 'fas fa-plus';
      case 'editar': return 'fas fa-edit';
      case 'eliminar': return 'fas fa-trash';
      case 'cambiar_password': return 'fas fa-key';
      case 'marcar_leidas': return 'fas fa-envelope-open-text';
      case 'marcar_leida': return 'fas fa-envelope-open';
      default: return 'fas fa-info-circle';
    }
  };

  return (
    <>
      <div className="auditoria-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:'#2563eb'}}>Auditoría del Sistema</h1>
        <button onClick={exportLogs} style={{background:'linear-gradient(90deg,#2563eb 0%,#059669 100%)',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <i className="fas fa-download"></i> Exportar CSV
        </button>
      </div>
      <form onSubmit={handleFilterSubmit} style={{display:'flex',gap:18,flexWrap:'wrap',marginBottom:24,alignItems:'end'}}>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Usuario</label>
          <input type="text" name="usuario" value={filters.usuario} onChange={handleFilterChange} placeholder="Buscar usuario..." style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}} />
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Acción</label>
          <select name="accion" value={filters.accion} onChange={handleFilterChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}}>
            {acciones.map(a => <option key={a} value={a}>{a ? a : 'Todas'}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Módulo</label>
          <select name="modulo" value={filters.modulo} onChange={handleFilterChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}}>
            {modulos.map(m => <option key={m} value={m}>{m ? m : 'Todos'}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Severidad</label>
          <select name="severidad" value={filters.severidad} onChange={handleFilterChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}}>
            {severidades.map(s => <option key={s} value={s}>{s ? s : 'Todas'}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Fecha Inicio</label>
          <input type="date" name="fechaInicio" value={filters.fechaInicio} onChange={handleFilterChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}} />
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          <label>Fecha Fin</label>
          <input type="date" name="fechaFin" value={filters.fechaFin} onChange={handleFilterChange} style={{padding:8,borderRadius:6,border:'1.5px solid #d1d5db',fontSize:14}} />
        </div>
        <button type="submit" style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <i className="fas fa-search"></i> Buscar
        </button>
        <button type="button" onClick={clearFilters} style={{background:'#fbbf24',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontWeight:700,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(251,191,36,0.10)',display:'flex',alignItems:'center',gap:8}}>
          <i className="fas fa-eraser"></i> Limpiar
        </button>
      </form>
      <div className="logs-section" style={{background:'#fff',borderRadius:14,boxShadow:'0 2px 8px rgba(37,99,235,0.06)',padding:'18px 24px 0 24px',marginBottom:32,overflowX:'auto',width:'100%'}}>
        <h2 style={{margin:'0 0 18px 24px',fontSize:20,fontWeight:700,color:'#2563eb'}}>Registros de Auditoría</h2>
        {loading ? (
          <div style={{textAlign:'center',padding:'48px 0',color:'#64748b',fontSize:18}}>
            <i className="fas fa-spinner fa-spin" style={{fontSize:28,marginBottom:12}}></i>
            <div>Cargando registros...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px 0',color:'#64748b',fontSize:18}}>
            <i className="fas fa-info-circle" style={{fontSize:28,marginBottom:12}}></i>
            <div>No hay registros para mostrar.</div>
          </div>
        ) : (
          <table className="logs-table" style={{width:'100%',minWidth:1100,borderCollapse:'collapse',margin:0,padding:0}}>
            <thead style={{position:'sticky',top:0,zIndex:2,background:'#374151',color:'#fff'}}>
              <tr>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>ID</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Fecha y Hora</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Usuario</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Acción</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Módulo</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Detalle / Descripción</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>IP</th>
                <th style={{padding:'12px 8px',fontWeight:700,fontSize:15,color:'#fff',borderBottom:'2px solid #e5e7eb',textAlign:'left'}}>Severidad</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id || idx} style={{background:idx%2===0?'#f8fafc':'#fff',transition:'background 0.2s'}}>
                  <td style={{padding:'10px 8px',fontSize:15,color:'#222',textAlign:'left'}}>{log.id}</td>
                  <td style={{padding:'10px 8px',fontSize:15,color:'#222',textAlign:'left'}}>{log.fecha ? new Date(log.fecha).toLocaleString('es-CO') : '-'}</td>
                  <td style={{padding:'10px 8px',fontSize:15,color:'#2563eb',fontWeight:600,textAlign:'left'}}>{log.usuario}</td>
                  <td style={{padding:'10px 8px',fontSize:15,textAlign:'left'}}><i className={getActionIcon(log.accion)} style={{marginRight:7}}></i>{log.accion}</td>
                  <td style={{padding:'10px 8px',fontSize:15,textAlign:'left'}}>{log.modulo}</td>
                  <td style={{padding:'10px 8px',fontSize:15,maxWidth:320,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'left'}} title={log.detalle}>{log.detalle}</td>
                  <td style={{padding:'10px 8px',fontSize:15,textAlign:'left'}}>{log.ip || (log.detalle && log.detalle.match(/IP: ([\d\.]+)/) ? log.detalle.match(/IP: ([\d\.]+)/)[1] : '-')}</td>
                  <td style={{padding:'10px 8px',fontSize:15,textAlign:'left'}}>
                    <span className={`severity-badge ${getSeverityClass(log.severidad)}`} style={{padding:'4px 12px',borderRadius:8,fontWeight:700,fontSize:14,background:getSeverityClass(log.severidad)==='critical'?'#fee2e2':getSeverityClass(log.severidad)==='high'?'#fef3c7':getSeverityClass(log.severidad)==='medium'?'#e0e7ff':'#e0f2fe',color:getSeverityClass(log.severidad)==='critical'?'#e11d48':getSeverityClass(log.severidad)==='high'?'#f59e42':getSeverityClass(log.severidad)==='medium'?'#2563eb':'#0891b2'}}>
                      {log.severidad}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default AuditoriaPage; 