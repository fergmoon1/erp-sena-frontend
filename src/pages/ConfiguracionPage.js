import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../styles/ConfiguracionPage.css';

// Modal de notificación global reutilizable para empresa
const EmpresaModal = ({ show, type, message, onClose }) => {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.35)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'modalBackdropFadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 8px 32px rgba(37,99,235,0.13)',
        padding: '38px 36px 30px 36px',
        minWidth: 340,
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        position: 'relative',
        animation: 'modalFadeIn 0.3s cubic-bezier(.4,2,.6,1)'
      }}>
        <div style={{fontSize: 44, color: type === 'success' ? '#059669' : '#d32f2f', marginBottom: 8}}>
          <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
        </div>
        <div style={{fontWeight: 700, fontSize: 20, color: '#222', textAlign: 'center', marginBottom: 6}}>
          {type === 'success' ? '¡Éxito!' : 'Error'}
        </div>
        <div style={{fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 8}}>
          {message}
        </div>
        <button onClick={onClose} style={{marginTop: 8, background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:600,fontSize:16,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)'}}>
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
};

// Modal de confirmación de eliminación
const ConfirmModal = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return ReactDOM.createPortal(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 8px 32px rgba(37,99,235,0.13)',padding:'32px 28px',minWidth:320,maxWidth:400,display:'flex',flexDirection:'column',alignItems:'center',gap:18,position:'relative'}}>
        <div style={{fontSize:38,color:'#e11d48',marginBottom:8}}><i className="fas fa-exclamation-triangle"></i></div>
        <div style={{fontWeight:700,fontSize:18,color:'#e11d48',textAlign:'center',marginBottom:6}}>Confirmar eliminación</div>
        <div style={{fontSize:15,color:'#374151',textAlign:'center',marginBottom:8}}>{message}</div>
        <div style={{display:'flex',gap:16,marginTop:8}}>
          <button onClick={onCancel} style={{background:'#e5e7eb',color:'#222',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Cancelar</button>
          <button onClick={onConfirm} style={{background:'#e11d48',color:'#fff',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal para ver datos de empresa (solo lectura)
const VerEmpresaModal = ({ show, empresa, onClose, onEdit }) => {
  if (!show || !empresa) return null;
  return ReactDOM.createPortal(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',zIndex:3100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:18,boxShadow:'0 8px 32px rgba(37,99,235,0.13)',padding:'38px 36px 30px 36px',minWidth:340,maxWidth:480,display:'flex',flexDirection:'column',alignItems:'center',gap:18,position:'relative'}}>
        <div style={{fontWeight:700,fontSize:22,color:'#2563eb',marginBottom:8,display:'flex',alignItems:'center',gap:10}}><i className="fas fa-building"></i>Datos de la Empresa</div>
        {empresa.logoUrl && (
          <img src={`/api/files/${empresa.logoUrl}`} alt="Logo" style={{maxWidth:120,maxHeight:120,borderRadius:10,objectFit:'contain',marginBottom:10}} />
        )}
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Nombre:</b> {empresa.nombreEmpresa}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Dirección:</b> {empresa.direccionEmpresa}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Teléfono:</b> {empresa.telefonoEmpresa}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Email:</b> {empresa.emailEmpresa}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Sitio Web:</b> {empresa.sitioWeb}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Horario:</b> {empresa.horarioLaboral}</div>
        <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Zona Horaria:</b> {empresa.zonaHoraria}</div>
        <div style={{display:'flex',gap:12,marginTop:10}}>
          <button onClick={onClose} style={{background:'#e5e7eb',color:'#222',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Cerrar</button>
          <button onClick={() => { onClose(); onEdit(); }} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Editar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal para editar datos de empresa
const EditarEmpresaModal = ({ show, empresa, onClose, onSave }) => {
  const [form, setForm] = useState(empresa || {});
  useEffect(() => { setForm(empresa || {}); }, [empresa]);
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  if (!show || !empresa) return null;
  return ReactDOM.createPortal(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',zIndex:3200,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:18,boxShadow:'0 8px 32px rgba(37,99,235,0.13)',padding:'38px 36px 30px 36px',minWidth:340,maxWidth:500,display:'flex',flexDirection:'column',alignItems:'center',gap:18,position:'relative'}}>
        <div style={{fontWeight:700,fontSize:22,color:'#2563eb',marginBottom:8,display:'flex',alignItems:'center',gap:10}}><i className="fas fa-edit"></i>Editar Empresa</div>
        {form.logoUrl && (
          <img src={`/api/files/${form.logoUrl}`} alt="Logo" style={{maxWidth:120,maxHeight:120,borderRadius:10,objectFit:'contain',marginBottom:10}} />
        )}
        <form style={{width:'100%',display:'flex',flexDirection:'column',gap:10}} onSubmit={e => {e.preventDefault();onSave(form);}}>
          <input type="text" name="nombreEmpresa" value={form.nombreEmpresa||''} onChange={handleChange} placeholder="Nombre de la empresa" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <input type="text" name="direccionEmpresa" value={form.direccionEmpresa||''} onChange={handleChange} placeholder="Dirección" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <input type="tel" name="telefonoEmpresa" value={form.telefonoEmpresa||''} onChange={handleChange} placeholder="Teléfono" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <input type="email" name="emailEmpresa" value={form.emailEmpresa||''} onChange={handleChange} placeholder="Email corporativo" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <input
            type="url"
            name="sitioWeb"
            value={form.sitioWeb || ''}
            onChange={e => {
              let value = e.target.value;
              if (value && !/^https?:\/\//i.test(value)) {
                value = 'https://' + value;
              }
              setForm(prev => ({ ...prev, sitioWeb: value }));
            }}
            placeholder="https://www.empresa.com"
            title="Incluye el prefijo https:// para URLs válidas"
            autoComplete="url"
          />
          <input type="text" name="horarioLaboral" value={form.horarioLaboral||''} onChange={handleChange} placeholder="Horario laboral" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <input type="text" name="zonaHoraria" value={form.zonaHoraria||''} onChange={handleChange} placeholder="Zona horaria" style={{padding:8,borderRadius:6,border:'1px solid #d1d5db'}} />
          <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:10}}>
            <button type="button" onClick={onClose} style={{background:'#e5e7eb',color:'#222',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Cancelar</button>
            <button type="submit" style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer'}}>Guardar</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

function ConfiguracionPage() {
  // Estado para los parámetros del sistema
  const [params, setParams] = useState({
    stockBajo: 10,
    diasRetencion: 30,
    moneda: 'USD',
    iva: 19,
    monedaSecundaria: 'EUR',
    unidadMedida: 'unidades',
    formatoFecha: 'dd/MM/yyyy',
    formatoHora: '24h',
    idioma: 'español',
    maxStock: 1000,
    diasAnticipacion: 7,
    numeroFacturaInicial: 1001,
    prefijoFacturas: 'FAC-',
    terminosPago: 30,
    horarioLaboral: '8:00-18:00',
    zonaHoraria: 'America/Bogota',
    // Ventas
    comisionVendedores: 5,
    descuentoAutomatico: 0,
    politicaDevolucion: 30,
    minimoCompra: 0,
    // Clientes
    categoriaCliente: 'estandar',
    nivelServicio: 'basico',
    politicaCredito: 30,
    programaFidelizacion: 'puntos',
    // Logística
    proveedorPredeterminado: '',
    tiempoEntrega: 3,
    costoEnvio: 0,
    almacenPrincipal: 'central'
  });
  const [historial, setHistorial] = useState([]); // Aquí se cargaría el historial real
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [activeAvatarId, setActiveAvatarId] = useState(null);
  // Estado para roles y permisos (simulado)
  const [rolesPermisos, setRolesPermisos] = useState([]);
  const [rolesMsg, setRolesMsg] = useState('');
  const [rolesMsgType, setRolesMsgType] = useState(''); // 'success' o 'error'
  // Estado para políticas de contraseña
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSymbol: false,
    expireDays: 90
  });
  const [policyMsg, setPolicyMsg] = useState('');
  const [policyMsgType, setPolicyMsgType] = useState('');
  // Estado para personalización visual
  const [visualConfig, setVisualConfig] = useState({
    logo: null,
    logoPreview: null,
    colorPrimario: '#2563eb',
    colorSecundario: '#374151',
    tema: 'claro',
    formatoFecha: 'dd/MM/yyyy',
    formatoHora: '24h',
    // Nuevas opciones de personalización
    fuente: 'Inter',
    tamanoFuente: '14px',
    espaciado: 'normal',
    bordesRedondeados: '8px',
    sombras: true,
    animaciones: true,
    densidad: 'normal', // compact, normal, spacious
    // Configuración de componentes
    estiloBotones: 'moderno', // moderno, clasico, minimalista
    estiloTablas: 'moderno',
    estiloFormularios: 'moderno',
    // Configuración de notificaciones visuales
    notificacionesPosicion: 'top-right',
    notificacionesDuracion: 5000,
    notificacionesSonido: true,
    // Configuración de empresa
    nombreEmpresa: '',
    direccionEmpresa: '',
    telefonoEmpresa: '',
    emailEmpresa: '',
    sitioWeb: '',
    horarioLaboral: '8:00-18:00',
    zonaHoraria: 'America/Bogota',
    // Configuración de seguridad
    tiempoSesion: 30, // minutos
    maxIntentosLogin: 5,
    bloqueoTemporal: 15, // minutos
    requiereCaptcha: true,
    // Configuración de notificaciones
    notificacionesEmail: true,
    notificacionesPush: true,
    notificacionesSMS: false,
    // Configuración de reportes
    formatoReporte: 'PDF',
    frecuenciaReportes: 'semanal',
    incluirGraficos: true,
    // Configuración de backup
    backupAutomatico: true,
    frecuenciaBackup: 'diario',
    retenerBackups: 30, // días
    tipoDegradado: 'linear',
    anguloDegradado: 135,
    textoPreview: 'Ejemplo de texto'
  });
  const [visualMsg, setVisualMsg] = useState('');
  const [visualMsgType, setVisualMsgType] = useState('');
  // Estado para modal de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
    userId: null,
    userName: ''
  });
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
    match: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandDirection, setExpandDirection] = useState('down'); // 'down' o 'up'
  const [expandCoords, setExpandCoords] = useState({ top: 0, left: 0 });

  const avatarRefs = useRef({});

  const [pendingAvatarId, setPendingAvatarId] = useState(null);

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  // Modal de notificación global
  const [showVisualModal, setShowVisualModal] = useState(false);

  // Estado para mostrar el modal de empresa
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);

  // Estado para empresa cargada y modal de ver empresa
  const [empresaActual, setEmpresaActual] = useState(null);
  const [showEmpresaViewModal, setShowEmpresaViewModal] = useState(false);

  // Estado para mostrar el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Estado para saber si se debe proceder con la eliminación
  const [pendingDelete, setPendingDelete] = useState(false);

  // Estado para mostrar aviso de edición
  const [showEditMsg, setShowEditMsg] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // Estado para mostrar los modales de ver y editar
  const [showVerModal, setShowVerModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);

  const handleChange = e => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setSuccess('Cambios guardados correctamente.');
    setError('');
    // Aquí iría la lógica para guardar en backend y actualizar historial
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRolesPermisos();
    fetchPasswordPolicy();
    fetchVisualConfig();
    
    // Actualizar automáticamente las imágenes cada 30 segundos
    const imageUpdateInterval = setInterval(() => {
      // Solo actualizar si no está cargando y hay usuarios
      if (!loadingUsers && usuarios.length > 0) {
        // Limpiar errores de imagen para forzar recarga
        setImageErrors(new Set());
      }
    }, 30000); // 30 segundos
    
    return () => {
      clearInterval(imageUpdateInterval);
    };
  }, []);

  // Cerrar ampliación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeAvatarId && !event.target.closest('.user-avatar') && !event.target.closest('.expanded-image-container')) {
        setActiveAvatarId(null);
      }
    };

    if (activeAvatarId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeAvatarId]);

  useEffect(() => {
    if (userError || userSuccess) {
      const timer = setTimeout(() => {
        setUserError('');
        setUserSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userError, userSuccess]);

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    setUserError('');
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/usuarios', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) {
        setUserError('Error al obtener los usuarios: ' + res.status);
        setUsuarios([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setUserError('La respuesta del servidor está vacía.');
        setUsuarios([]);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setUserError('La respuesta del servidor no es un JSON válido.');
        setUsuarios([]);
        return;
      }
      setUsuarios(data);
      // Limpiar errores de imagen al recargar usuarios
      setImageErrors(new Set());
    } catch (err) {
      setUserError('Error de red al obtener los usuarios.');
      setUsuarios([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (id, newRol) => {
    setUserError(''); setUserSuccess('');
    try {
      const token = localStorage.getItem('jwt');
      const usuario = usuarios.find(u => u.id === id);
      const res = await fetch(`http://localhost:8081/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ ...usuario, rol: newRol })
      });
      if (!res.ok) {
        setUserError('Error al cambiar el rol.');
        return;
      }
      setUserSuccess('Rol actualizado.');
      fetchUsuarios();
    } catch {
      setUserError('Error de red al cambiar el rol.');
    }
  };

  const handleToggleActivo = async (id, activo) => {
    setUserError(''); setUserSuccess('');
    // Actualizar estado local inmediatamente
    setUsuarios(prevUsuarios => prevUsuarios.map(u => u.id === id ? { ...u, activo: !activo } : u));
    try {
      const token = localStorage.getItem('jwt');
      const usuario = usuarios.find(u => u.id === id);
      const res = await fetch(`http://localhost:8081/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ ...usuario, activo: !activo })
      });
      if (!res.ok) {
        // Revertir el cambio local si hay error
        setUsuarios(prevUsuarios => prevUsuarios.map(u => u.id === id ? { ...u, activo: activo } : u));
        setUserError('Error al cambiar el estado.');
        return;
      }
      setUserSuccess('Estado actualizado.');
      fetchUsuarios();
    } catch {
      // Revertir el cambio local si hay error
      setUsuarios(prevUsuarios => prevUsuarios.map(u => u.id === id ? { ...u, activo: activo } : u));
      setUserError('Error de red al cambiar el estado.');
    }
  };

  const handleForcePassword = (id, activo, userName) => {
    setUserError(''); setUserSuccess('');
    if (!activo) {
      setUserError('Debes activar el usuario antes de cambiar la contraseña.');
      return;
    }
    setPasswordForm({
      password: '',
      confirmPassword: '',
      userId: id,
      userName: userName
    });
    setPasswordValidation({
      length: false,
      upper: false,
      lower: false,
      number: false,
      symbol: false,
      match: false
    });
    setShowPasswordModal(true);
  };

  const validatePassword = (password, confirmPassword) => {
    const validation = {
      length: password.length >= passwordPolicy.minLength,
      upper: passwordPolicy.requireUpper ? /[A-Z]/.test(password) : true,
      lower: passwordPolicy.requireLower ? /[a-z]/.test(password) : true,
      number: passwordPolicy.requireNumber ? /\d/.test(password) : true,
      symbol: passwordPolicy.requireSymbol ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
      match: password === confirmPassword && password !== ''
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(v => v);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password' || name === 'confirmPassword') {
      validatePassword(
        name === 'password' ? value : passwordForm.password,
        name === 'confirmPassword' ? value : passwordForm.confirmPassword
      );
    }
  };

  const handleSubmitPassword = async () => {
    if (!validatePassword(passwordForm.password, passwordForm.confirmPassword)) {
      setUserError('Por favor, verifica que la contraseña cumpla con todos los requisitos.');
      return;
    }

    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`http://localhost:8081/api/usuarios/${passwordForm.userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ password: passwordForm.password })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        setUserError(errorText || 'Error al cambiar la contraseña.');
        return;
      }
      
      setUserSuccess('Contraseña actualizada correctamente.');
      setShowPasswordModal(false);
      setPasswordForm({
        password: '',
        confirmPassword: '',
        userId: null,
        userName: ''
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch {
      setUserError('Error de red al cambiar la contraseña.');
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      password: '',
      confirmPassword: '',
      userId: null,
      userName: ''
    });
    setPasswordValidation({
      length: false,
      upper: false,
      lower: false,
      number: false,
      symbol: false,
      match: false
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePermisoChange = (rolIdx, permiso) => {
    setRolesPermisos(prev => prev.map((r, idx) => idx === rolIdx ? { ...r, [permiso]: !r[permiso] } : r));
  };

  const handleGuardarRoles = async () => {
    setRolesMsg('');
    setRolesMsgType('');
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/roles-permisos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(rolesPermisos)
      });
      if (!res.ok) {
        setRolesMsg('Error al guardar los permisos.');
        setRolesMsgType('error');
        return;
      }
      setRolesMsg('Permisos guardados correctamente.');
      setRolesMsgType('success');
    } catch {
      setRolesMsg('Error de red al guardar los permisos.');
      setRolesMsgType('error');
    }
  };

  // Mostrar mensaje temporalmente
  useEffect(() => {
    if (rolesMsg) {
      const timer = setTimeout(() => {
        setRolesMsg('');
        setRolesMsgType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rolesMsg]);

  // Nuevo: cargar permisos desde backend al montar
  useEffect(() => {
    fetchRolesPermisos();
  }, []);

  const fetchRolesPermisos = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/roles-permisos', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      setRolesPermisos(data);
    } catch (e) {
      // Puedes mostrar un mensaje de error si quieres
    }
  };

  const handlePolicyChange = e => {
    const { name, type, checked, value } = e.target;
    setPasswordPolicy(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Nuevo: cargar política de contraseña desde backend al montar
  useEffect(() => {
    fetchPasswordPolicy();
  }, []);

  const fetchPasswordPolicy = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/password-policy', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data) setPasswordPolicy(data);
    } catch (e) {}
  };

  const handleGuardarPolicy = async e => {
    e.preventDefault();
    setPolicyMsg('');
    setPolicyMsgType('');
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/password-policy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(passwordPolicy)
      });
      if (!res.ok) {
        setPolicyMsg('Error al guardar la política.');
        setPolicyMsgType('error');
        return;
      }
      setPolicyMsg('Política guardada correctamente.');
      setPolicyMsgType('success');
    } catch {
      setPolicyMsg('Error de red al guardar la política.');
      setPolicyMsgType('error');
    }
  };

  useEffect(() => {
    if (policyMsg) {
      const timer = setTimeout(() => {
        setPolicyMsg('');
        setPolicyMsgType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [policyMsg]);

  const applyVisualConfig = (config) => {
    // Aplicar colores principales
    document.documentElement.style.setProperty('--primary-color', config.colorPrimario);
    document.documentElement.style.setProperty('--secondary-color', config.colorSecundario);
    
    // Aplicar tema
    if (config.tema === 'oscuro') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Aplicar fuente
    document.documentElement.style.setProperty('--font-family', config.fuente);
    document.documentElement.style.setProperty('--font-size', config.tamanoFuente);
    
    // Aplicar espaciado y densidad
    document.documentElement.style.setProperty('--spacing', config.espaciado);
    document.documentElement.style.setProperty('--border-radius', config.bordesRedondeados);
    
    // Aplicar sombras y animaciones
    if (config.sombras) {
      document.body.classList.add('shadows-enabled');
    } else {
      document.body.classList.remove('shadows-enabled');
    }
    
    if (config.animaciones) {
      document.body.classList.add('animations-enabled');
    } else {
      document.body.classList.remove('animations-enabled');
    }
  };

  // Temas predefinidos
  const temasPredefinidos = {
    claro: {
      colorPrimario: '#2563eb',
      colorSecundario: '#374151',
      tema: 'claro',
      fuente: 'Inter',
      sombras: true,
      animaciones: true
    },
    oscuro: {
      colorPrimario: '#3b82f6',
      colorSecundario: '#1f2937',
      tema: 'oscuro',
      fuente: 'Inter',
      sombras: true,
      animaciones: true
    },
    azulCorporativo: {
      colorPrimario: '#1e40af',
      colorSecundario: '#1e293b',
      tema: 'claro',
      fuente: 'Roboto',
      sombras: true,
      animaciones: false
    },
    verde: {
      colorPrimario: '#059669',
      colorSecundario: '#064e3b',
      tema: 'claro',
      fuente: 'Inter',
      sombras: true,
      animaciones: true
    },
    minimalista: {
      colorPrimario: '#000000',
      colorSecundario: '#6b7280',
      tema: 'claro',
      fuente: 'Inter',
      sombras: false,
      animaciones: false,
      bordesRedondeados: '0px'
    }
  };

  const aplicarTemaPredefinido = (nombreTema) => {
    const tema = temasPredefinidos[nombreTema];
    if (tema) {
      setVisualConfig(prev => ({ ...prev, ...tema }));
      applyVisualConfig({ ...visualConfig, ...tema });
    }
  };

  const handleVisualChange = e => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      setVisualConfig(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onload = ev => setVisualConfig(prev => ({ ...prev, logoPreview: ev.target.result }));
      reader.readAsDataURL(file);
    } else {
      const newValue = type === 'checkbox' ? e.target.checked : value;
      setVisualConfig(prev => ({ ...prev, [name]: newValue }));
      
      // Aplicar cambios en tiempo real para ciertos campos
      if (['colorPrimario', 'colorSecundario', 'tema', 'fuente', 'tamanoFuente', 'bordesRedondeados', 'sombras', 'animaciones'].includes(name)) {
        applyVisualConfig({ ...visualConfig, [name]: newValue });
      }
    }
  };

  const fetchVisualConfig = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/visual-config', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const text = await res.text();
        if (!text) return; // No intentes parsear si está vacío
        const config = JSON.parse(text);
        setVisualConfig(prev => ({
          ...prev,
          ...config,
          logoPreview: config.logoUrl || null
        }));
      }
    } catch (err) {
      console.error('Error al cargar configuración visual:', err);
    }
  };

  const handleGuardarVisual = async e => {
    e.preventDefault();
    setVisualMsg('');
    setVisualMsgType('');
    let logoUrl = visualConfig.logoUrl;
    try {
      // Subir logo si hay uno nuevo
      if (logoFile) {
        const formData = new window.FormData();
        formData.append('file', logoFile);
        const res = await fetch('http://localhost:8081/api/files/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          logoUrl = data.filename;
          setVisualConfig(prev => ({ ...prev, logoUrl: data.filename })); // <-- AJUSTE CLAVE
        } else {
          setVisualMsg('Error al subir el logo.');
          setVisualMsgType('error');
          return;
        }
      }
      // Guardar configuración visual con el nombre del logo y todos los campos de empresa
      const token = localStorage.getItem('jwt');
      const configData = {
        ...visualConfig,
        logoUrl,
        nombreEmpresa: visualConfig.nombreEmpresa,
        direccionEmpresa: visualConfig.direccionEmpresa,
        telefonoEmpresa: visualConfig.telefonoEmpresa,
        emailEmpresa: visualConfig.emailEmpresa,
        sitioWeb: visualConfig.sitioWeb,
        horarioLaboral: visualConfig.horarioLaboral,
        zonaHoraria: visualConfig.zonaHoraria
      };
      const res2 = await fetch('http://localhost:8081/api/visual-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(configData)
      });
      if (res2.ok) {
        setVisualMsg('Personalización guardada correctamente.');
        setVisualMsgType('success');
        setLogoFile(null); // Limpiar archivo local
      } else {
        setVisualMsg('Error al guardar la personalización.');
        setVisualMsgType('error');
      }
    } catch (err) {
      setVisualMsg('Error de red al guardar la personalización.');
      setVisualMsgType('error');
    }
  };

  useEffect(() => {
    if (visualMsg) {
      const timer = setTimeout(() => {
        setVisualMsg('');
        setVisualMsgType('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visualMsg]);

  const handleImageError = (userId) => {
    setImageErrors(prev => new Set(prev).add(userId));
  };

  const handleImageLoad = (userId) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const handleImageClick = (usuario) => {
    if (usuario.avatar && !imageErrors.has(usuario.id)) {
      if (activeAvatarId === usuario.id) {
        setActiveAvatarId(null);
        setPendingAvatarId(null);
      } else {
        setPendingAvatarId(usuario.id);
        // Log de depuración
        setTimeout(() => {
          const avatarElem = avatarRefs.current[usuario.id];
          if (avatarElem) {
            const rect = avatarElem.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            console.log('DEBUG AVATAR:', {
              id: usuario.id,
              nombre: usuario.nombre,
              rect,
              scrollY,
              scrollX,
              top: rect.top + scrollY + (rect.height / 2) - 90,
              left: rect.right + scrollX + 12
            });
          }
        }, 0);
      }
    }
  };

  useEffect(() => {
    if (pendingAvatarId !== null) {
      const avatarElem = avatarRefs.current[pendingAvatarId];
      if (avatarElem) {
        const rect = avatarElem.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        const AMPLIACION_WIDTH = 200;
        const AMPLIACION_HEIGHT = 180;
        const AVATAR_MARGIN = 12;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        let top = rect.top + scrollY + (rect.height / 2) - (AMPLIACION_HEIGHT / 2);
        if (top < 8) top = 8;
        if (top + AMPLIACION_HEIGHT > scrollY + windowHeight - 8) top = scrollY + windowHeight - AMPLIACION_HEIGHT - 8;
        let left = rect.right + scrollX + AVATAR_MARGIN;
        let direction = 'right';
        if (left + AMPLIACION_WIDTH > scrollX + windowWidth - 8) {
          left = rect.left + scrollX - AMPLIACION_WIDTH - AVATAR_MARGIN;
          direction = 'left';
        }
        setExpandDirection(direction);
        setExpandCoords({ top, left });
        setActiveAvatarId(pendingAvatarId);
        setPendingAvatarId(null);
      }
    }
  }, [pendingAvatarId]);

  // Al cargar visualConfig.logoUrl, mostrar preview desde backend si existe
  useEffect(() => {
    if (visualConfig.logoUrl && !logoFile) {
      setLogoPreview(`/api/files/${visualConfig.logoUrl}`);
    }
  }, [visualConfig.logoUrl, logoFile]);

  useEffect(() => {
    if (visualMsg) setShowVisualModal(true);
  }, [visualMsg]);

  // 1. Agregar función para guardar la configuración de empresa
  const handleGuardarEmpresa = async (e) => {
    e.preventDefault && e.preventDefault();
    setVisualMsg("");
    setVisualMsgType("");
    try {
      const token = localStorage.getItem('jwt');
      const empresaData = {
        nombreEmpresa: visualConfig.nombreEmpresa,
        direccionEmpresa: visualConfig.direccionEmpresa,
        telefonoEmpresa: visualConfig.telefonoEmpresa,
        emailEmpresa: visualConfig.emailEmpresa,
        sitioWeb: visualConfig.sitioWeb,
        horarioLaboral: visualConfig.horarioLaboral,
        zonaHoraria: visualConfig.zonaHoraria,
        logoUrl: visualConfig.logoUrl || ''
      };
      const res = await fetch('http://localhost:8081/api/empresa-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(empresaData)
      });
      if (res.ok) {
        setVisualMsg('Configuración de empresa guardada correctamente.');
        setVisualMsgType('success');
        // Limpiar formulario de empresa
        setVisualConfig(prev => ({
          ...prev,
          nombreEmpresa: '',
          direccionEmpresa: '',
          telefonoEmpresa: '',
          emailEmpresa: '',
          sitioWeb: '',
          horarioLaboral: '',
          zonaHoraria: '',
          logoUrl: ''
        }));
        setLogoPreview(null);
        setLogoFile(null);
      } else {
        setVisualMsg('Error al guardar la configuración de empresa.');
        setVisualMsgType('error');
      }
    } catch (err) {
      setVisualMsg('Error de red al guardar la configuración de empresa.');
      setVisualMsgType('error');
    }
  };

  // 2. Al cargar la configuración de empresa, mostrar el logo si existe
  // Agregar función para cargar la configuración de empresa
  const fetchEmpresaConfig = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/empresa-config', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (res.ok) {
        const config = await res.json();
        setEmpresaActual(config);
        setVisualConfig(prev => ({
          ...prev,
          nombreEmpresa: config.nombreEmpresa || '',
          direccionEmpresa: config.direccionEmpresa || '',
          telefonoEmpresa: config.telefonoEmpresa || '',
          emailEmpresa: config.emailEmpresa || '',
          sitioWeb: config.sitioWeb || '',
          horarioLaboral: config.horarioLaboral || '',
          zonaHoraria: config.zonaHoraria || '',
          logoUrl: config.logoUrl || '',
        }));
        if (config.logoUrl) {
          setLogoPreview(`/api/files/${config.logoUrl}`);
        }
      } else {
        setEmpresaActual(null);
      }
    } catch (err) {
      setEmpresaActual(null);
    }
  };

  // 3. Botones modernos para ver, editar y eliminar empresa
  {/* Botones de acción para empresa */}
  {empresaActual && empresaActual.nombreEmpresa && (
    <div style={{display:'flex',gap:16,margin:'18px 0 0 0',justifyContent:'flex-end'}}>
      <button
        onClick={() => setShowVerModal(true)}
        disabled={!empresaActual}
        style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual)?0.5:1}}>
        <i className="fas fa-eye"></i> Ver
      </button>
      <button
        onClick={() => setShowEditarModal(true)}
        disabled={!empresaActual}
        style={{background:'#f59e42',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(245,158,66,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual)?0.5:1}}>
        <i className="fas fa-edit"></i> Editar
      </button>
      <button
        onClick={async () => {
          if(empresaActual && empresaActual.nombreEmpresa && window.confirm('¿Estás seguro de eliminar la configuración de empresa?')){
            try {
              const token = localStorage.getItem('jwt');
              const res = await fetch('http://localhost:8081/api/empresa-config', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : ''
                }
              });
              if(res.ok){
                setVisualMsg('Configuración de empresa eliminada correctamente.');
                setVisualMsgType('success');
                setEmpresaActual(null);
                setVisualConfig(prev => ({...prev,
                  nombreEmpresa: '',direccionEmpresa: '',telefonoEmpresa: '',emailEmpresa: '',sitioWeb: '',horarioLaboral: '',zonaHoraria: '',logoUrl: ''
                }));
                setLogoPreview(null);
                setLogoFile(null);
              }else{
                setVisualMsg('Error al eliminar la configuración de empresa.');
                setVisualMsgType('error');
              }
            }catch{
              setVisualMsg('Error de red al eliminar la configuración de empresa.');
              setVisualMsgType('error');
            }
          }
        }}
        disabled={!empresaActual || !empresaActual.nombreEmpresa}
        style={{background:'#e11d48',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual || !empresaActual.nombreEmpresa)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(225,29,72,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual?.nombreEmpresa)?0.5:1}}>
        <i className="fas fa-trash"></i> Eliminar
      </button>
    </div>
  )}

  // 4. Modal para ver datos de empresa
  {showEmpresaViewModal && empresaActual && (
    ReactDOM.createPortal(
      <div style={{
        position: 'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',zIndex:3100,display:'flex',alignItems:'center',justifyContent:'center',animation:'modalBackdropFadeIn 0.2s ease-out'} }>
        <div style={{background:'#fff',borderRadius:18,boxShadow:'0 8px 32px rgba(37,99,235,0.13)',padding:'38px 36px 30px 36px',minWidth:340,maxWidth:480,display:'flex',flexDirection:'column',alignItems:'center',gap:18,position:'relative',animation:'modalFadeIn 0.3s cubic-bezier(.4,2,.6,1)'}}>
          <div style={{fontWeight:700,fontSize:22,color:'#2563eb',marginBottom:8,display:'flex',alignItems:'center',gap:10}}><i className="fas fa-building"></i>Datos de la Empresa</div>
          {empresaActual.logoUrl && (
            <img src={`/api/files/${empresaActual.logoUrl}`} alt="Logo" style={{maxWidth:120,maxHeight:120,borderRadius:10,objectFit:'contain',marginBottom:10}} />
          )}
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Nombre:</b> {empresaActual.nombreEmpresa}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Dirección:</b> {empresaActual.direccionEmpresa}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Teléfono:</b> {empresaActual.telefonoEmpresa}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Email:</b> {empresaActual.emailEmpresa}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Sitio Web:</b> {empresaActual.sitioWeb}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Horario:</b> {empresaActual.horarioLaboral}</div>
          <div style={{width:'100%',fontSize:16,color:'#222',marginBottom:6}}><b>Zona Horaria:</b> {empresaActual.zonaHoraria}</div>
          <button onClick={()=>setShowEmpresaViewModal(false)} style={{marginTop:8,background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 28px',fontWeight:600,fontSize:16,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)'}}>Cerrar</button>
        </div>
      </div>,
      document.body
    )
  )}

  // 5. Llamar fetchEmpresaConfig al montar y tras guardar/eliminar
  useEffect(() => { fetchEmpresaConfig(); }, []);
  useEffect(() => { if(visualMsgType==='success'){ fetchEmpresaConfig(); } }, [visualMsgType]);

  // Corrige los handlers de ver y editar para que siempre funcionen
  const handleVerEmpresa = () => {
    if (empresaActual) setShowEmpresaViewModal(true);
  };
  const handleEditarEmpresa = () => {
    if (empresaActual) {
      setVisualConfig(prev => ({
        ...prev,
        nombreEmpresa: empresaActual.nombreEmpresa || '',
        direccionEmpresa: empresaActual.direccionEmpresa || '',
        telefonoEmpresa: empresaActual.telefonoEmpresa || '',
        emailEmpresa: empresaActual.emailEmpresa || '',
        sitioWeb: empresaActual.sitioWeb || '',
        horarioLaboral: empresaActual.horarioLaboral || '',
        zonaHoraria: empresaActual.zonaHoraria || '',
        logoUrl: empresaActual.logoUrl || ''
      }));
      setLogoPreview(empresaActual.logoUrl ? `/api/files/${empresaActual.logoUrl}` : null);
      setEditMsg('¡Ahora puedes editar la información de la empresa!');
      setShowEditMsg(true);
    }
  };

  // Handler para limpiar los campos del formulario de empresa
  const handleLimpiarEmpresa = () => {
    setVisualConfig(prev => ({
      ...prev,
      nombreEmpresa: '',
      direccionEmpresa: '',
      telefonoEmpresa: '',
      emailEmpresa: '',
      sitioWeb: '',
      horarioLaboral: '',
      zonaHoraria: '',
      logoUrl: ''
    }));
    setLogoPreview(null);
    setLogoFile(null);
  };

  // Handler para guardar edición de empresa
  const handleGuardarEdicionEmpresa = async (form) => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch('http://localhost:8081/api/empresa-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setVisualMsg('Datos de empresa actualizados correctamente.');
        setVisualMsgType('success');
        setShowEditarModal(false);
        fetchEmpresaConfig();
      } else {
        setVisualMsg('Error al actualizar los datos de empresa.');
        setVisualMsgType('error');
      }
    } catch {
      setVisualMsg('Error de red al actualizar los datos de empresa.');
      setVisualMsgType('error');
    }
  };

  return (
    <div className="configuracion-container">
      {/* Parámetros del sistema */}
      <div className="configuracion-section">
        <div className="configuracion-section-title">
          <i className="fas fa-cogs"></i>
          Parámetros del Sistema
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="configuracion-reticula-container">
            <div className="configuracion-reticula">
              {/* Sección Inventario */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo inventario">
                  <i className="fas fa-boxes"></i>
                  Inventario
            </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Stock Bajo</label>
                    <input type="number" name="stockBajo" value={params.stockBajo} onChange={handleChange} />
                    <p>Mínimo para alertas</p>
            </div>
                  <div className="configuracion-reticula-campo">
                    <label>Stock Máximo</label>
                    <input type="number" name="maxStock" value={params.maxStock} onChange={handleChange} />
                    <p>Máximo para alertas</p>
            </div>
                  <div className="configuracion-reticula-campo">
                    <label>Días Retención</label>
                    <input type="number" name="diasRetencion" value={params.diasRetencion} onChange={handleChange} />
                    <p>Movimientos guardados</p>
            </div>
                  <div className="configuracion-reticula-campo">
                    <label>Días Anticipación</label>
                    <input type="number" name="diasAnticipacion" value={params.diasAnticipacion} onChange={handleChange} />
                    <p>Para reabastecimiento</p>
          </div>
                  <div className="configuracion-reticula-campo">
                    <label>Unidad Medida</label>
                    <select name="unidadMedida" value={params.unidadMedida} onChange={handleChange}>
                      <option value="unidades">Unidades</option>
                      <option value="kg">Kilogramos</option>
                      <option value="litros">Litros</option>
                      <option value="metros">Metros</option>
                      <option value="piezas">Piezas</option>
                      <option value="cajas">Cajas</option>
                    </select>
                    <p>Predeterminada</p>
                  </div>
                </div>
              </div>

              {/* Sección Moneda */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo moneda">
                  <i className="fas fa-coins"></i>
                  Moneda
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Moneda Principal</label>
                    <input type="text" name="moneda" value={params.moneda} onChange={handleChange} />
                    <p>Para precios</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Moneda Secundaria</label>
                    <input type="text" name="monedaSecundaria" value={params.monedaSecundaria} onChange={handleChange} />
                    <p>Para reportes</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Tasa IVA (%)</label>
                    <input type="number" name="iva" value={params.iva} onChange={handleChange} />
                    <p>Para pedidos</p>
                  </div>
                </div>
              </div>

              {/* Sección Formato */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo formato">
                  <i className="fas fa-calendar-alt"></i>
                  Formato
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Formato Fecha</label>
                    <select name="formatoFecha" value={params.formatoFecha} onChange={handleChange}>
                      <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                      <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                      <option value="yyyy-MM-dd">yyyy-MM-dd</option>
                      <option value="dd-MM-yyyy">dd-MM-yyyy</option>
                    </select>
                    <p>Para mostrar</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Formato Hora</label>
                    <select name="formatoHora" value={params.formatoHora} onChange={handleChange}>
                      <option value="24h">24 horas</option>
                      <option value="12h">12 horas</option>
                    </select>
                    <p>Para mostrar</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Idioma Sistema</label>
                    <select name="idioma" value={params.idioma} onChange={handleChange}>
                      <option value="español">Español</option>
                      <option value="inglés">Inglés</option>
                      <option value="portugués">Portugués</option>
                    </select>
                    <p>Interfaz</p>
                  </div>
                </div>
              </div>

              {/* Sección Facturación */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo facturacion">
                  <i className="fas fa-file-invoice"></i>
                  Facturación
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Número Inicial</label>
                    <input type="number" name="numeroFacturaInicial" value={params.numeroFacturaInicial} onChange={handleChange} />
                    <p>Secuencia facturas</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Prefijo Facturas</label>
                    <input type="text" name="prefijoFacturas" value={params.prefijoFacturas} onChange={handleChange} />
                    <p>Para numeración</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Términos Pago (días)</label>
                    <input type="number" name="terminosPago" value={params.terminosPago} onChange={handleChange} />
                    <p>Plazo facturas</p>
                  </div>
                </div>
              </div>

              {/* Sección Empresa */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo empresa">
                  <i className="fas fa-building"></i>
                  Empresa
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Horario Laboral</label>
                    <input type="text" name="horarioLaboral" value={params.horarioLaboral} onChange={handleChange} />
                    <p>Ej: 8:00-18:00</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Zona Horaria</label>
                    <select name="zonaHoraria" value={params.zonaHoraria} onChange={handleChange}>
                      <option value="America/Bogota">Colombia (Bogotá)</option>
                      <option value="America/Mexico_City">México (Ciudad de México)</option>
                      <option value="America/New_York">Estados Unidos (Nueva York)</option>
                      <option value="America/Los_Angeles">Estados Unidos (Oeste)</option>
                      <option value="Europe/Madrid">España</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <p>De la empresa</p>
                  </div>
                </div>
              </div>

              {/* Sección Ventas */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo ventas">
                  <i className="fas fa-chart-line"></i>
                  Ventas
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Comisión Vendedores (%)</label>
                    <input type="number" name="comisionVendedores" value={params.comisionVendedores} onChange={handleChange} />
                    <p>Porcentaje por venta</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Descuento Automático (%)</label>
                    <input type="number" name="descuentoAutomatico" value={params.descuentoAutomatico} onChange={handleChange} />
                    <p>Descuento por defecto</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Política Devolución (días)</label>
                    <input type="number" name="politicaDevolucion" value={params.politicaDevolucion} onChange={handleChange} />
                    <p>Plazo para devoluciones</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Mínimo de Compra</label>
                    <input type="number" name="minimoCompra" value={params.minimoCompra} onChange={handleChange} />
                    <p>Monto mínimo requerido</p>
                  </div>
                </div>
              </div>

              {/* Sección Clientes */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo clientes">
                  <i className="fas fa-users"></i>
                  Clientes
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Categoría Cliente</label>
                    <select name="categoriaCliente" value={params.categoriaCliente} onChange={handleChange}>
                      <option value="estandar">Estándar</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
                      <option value="corporativo">Corporativo</option>
                    </select>
                    <p>Predeterminada</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Nivel de Servicio</label>
                    <select name="nivelServicio" value={params.nivelServicio} onChange={handleChange}>
                      <option value="basico">Básico</option>
                      <option value="estandar">Estándar</option>
                      <option value="premium">Premium</option>
                      <option value="express">Express</option>
                    </select>
                    <p>Calidad de atención</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Política Crédito (días)</label>
                    <input type="number" name="politicaCredito" value={params.politicaCredito} onChange={handleChange} />
                    <p>Plazo de pago</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Programa Fidelización</label>
                    <select name="programaFidelizacion" value={params.programaFidelizacion} onChange={handleChange}>
                      <option value="puntos">Puntos</option>
                      <option value="descuentos">Descuentos</option>
                      <option value="niveles">Niveles</option>
                      <option value="ninguno">Ninguno</option>
                    </select>
                    <p>Tipo de programa</p>
                  </div>
                </div>
              </div>

              {/* Sección Logística */}
              <div className="configuracion-reticula-seccion">
                <div className="configuracion-reticula-titulo logistica">
                  <i className="fas fa-truck"></i>
                  Logística
                </div>
                <div className="configuracion-reticula-campos">
                  <div className="configuracion-reticula-campo">
                    <label>Proveedor Predeterminado</label>
                    <input type="text" name="proveedorPredeterminado" value={params.proveedorPredeterminado} onChange={handleChange} />
                    <p>Proveedor por defecto</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Tiempo Entrega (días)</label>
                    <input type="number" name="tiempoEntrega" value={params.tiempoEntrega} onChange={handleChange} />
                    <p>Plazo estándar</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Costo Envío</label>
                    <input type="number" name="costoEnvio" value={params.costoEnvio} onChange={handleChange} />
                    <p>Costo por defecto</p>
                  </div>
                  <div className="configuracion-reticula-campo">
                    <label>Almacén Principal</label>
                    <select name="almacenPrincipal" value={params.almacenPrincipal} onChange={handleChange}>
                      <option value="central">Central</option>
                      <option value="norte">Norte</option>
                      <option value="sur">Sur</option>
                      <option value="este">Este</option>
                      <option value="oeste">Oeste</option>
                    </select>
                    <p>Almacén por defecto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button type="submit" className="configuracion-btn">
              <i className="fas fa-save"></i>Guardar
            </button>
          </div>
          {success && <div className="alert-success"><i className="fas fa-check-circle"></i>{success}</div>}
          {error && <div className="alert-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}
        </form>
      </div>

      {/* Historial de cambios y Roles y Permisos en 2 columnas */}
      <div className="configuracion-two-columns">
      {/* Historial de cambios */}
        <div className="configuracion-compact-section">
          <div className="configuracion-section-title" style={{background:'#374151'}}>
            <i className="fas fa-history"></i>
          Historial de Cambios
        </div>
          <div style={{ padding: '16px' }}>
            <table className="configuracion-table">
            <thead>
                <tr>
                  <th>Clave</th>
                  <th>Valor Anterior</th>
                  <th>Valor Nuevo</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>No hay cambios registrados.</td></tr>
              ) : (
                historial.map((item, idx) => (
                  <tr key={idx}>
                      <td>{item.clave}</td>
                      <td>{item.valorAnterior}</td>
                      <td>{item.valorNuevo}</td>
                      <td>{item.usuario}</td>
                      <td>{item.fecha}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Tabla editable de roles y permisos */}
        <div className="configuracion-compact-section">
          <div className="configuracion-section-title">
            <i className="fas fa-user-shield"></i>
            Roles y Permisos
          </div>
          <div style={{ padding: '16px' }}>
            <table className="configuracion-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Ver</th>
                  <th>Crear</th>
                  <th>Editar</th>
                  <th>Eliminar</th>
                  <th>Aprobar</th>
                </tr>
              </thead>
              <tbody>
                {rolesPermisos.map((rolPerm, idx) => (
                  <tr key={rolPerm.rol}>
                    <td style={{ fontWeight: '600' }}>{rolPerm.rol}</td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={rolPerm.ver} onChange={() => handlePermisoChange(idx, 'ver')} /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={rolPerm.crear} onChange={() => handlePermisoChange(idx, 'crear')} /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={rolPerm.editar} onChange={() => handlePermisoChange(idx, 'editar')} /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={rolPerm.eliminar} onChange={() => handlePermisoChange(idx, 'eliminar')} /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={rolPerm.aprobar} onChange={() => handlePermisoChange(idx, 'aprobar')} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleGuardarRoles} className="configuracion-btn">
              <i className="fas fa-save"></i>Guardar cambios
            </button>
          </div>
          {rolesMsg && (
            <div className={rolesMsgType === 'success' ? 'alert-success' : 'alert-error'} style={{ marginLeft: '16px', marginTop: '0px' }}>
              <i className={`fas ${rolesMsgType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {rolesMsg}
            </div>
          )}
        </div>
      </div>

      {/* Gestión de usuarios y roles */}
      <div className="configuracion-section">
        <div className="configuracion-section-title">
          <i className="fas fa-users-cog"></i>
          Gestión de Usuarios y Roles
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} encontrado{usuarios.length !== 1 ? 's' : ''}
            </div>
            <button 
              onClick={fetchUsuarios}
              disabled={loadingUsers}
              className="configuracion-btn"
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '8px 16px',
                fontSize: '12px'
              }}
            >
              <i className={`fas ${loadingUsers ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`} style={{ marginRight: '6px' }}></i>
              {loadingUsers ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
          
          {userError && <div className="alert-error"><i className="fas fa-exclamation-circle"></i>{userError}</div>}
          {userSuccess && !userError && <div className="alert-success"><i className="fas fa-check-circle"></i>{userSuccess}</div>}
          
          {loadingUsers ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#6b7280',
              fontSize: '16px'
            }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '16px', display: 'block' }}></i>
              Cargando usuarios...
            </div>
          ) : (
            <table className="configuracion-table">
            <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '60px' }}>ID</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Foto</th>
                  <th style={{ textAlign: 'center', width: '200px' }}>Nombre</th>
                  <th style={{ textAlign: 'center', width: '250px' }}>Email</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>Rol</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Activo</th>
                  <th style={{ textAlign: 'center', width: '180px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No hay usuarios para mostrar.</td></tr>
              ) : (
                usuarios.map(usuario => (
                  <tr key={usuario.id}>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#374151' }}>{usuario.id}</td>
                      <td style={{ textAlign: 'center', padding: '8px', position: 'relative' }}>
                        <div 
                          className="user-avatar"
                          ref={el => avatarRefs.current[usuario.id] = el}
                          onClick={() => handleImageClick(usuario)}
                          style={{
                            cursor: usuario.avatar && !imageErrors.has(usuario.id) ? 'pointer' : 'default',
                            border: activeAvatarId === usuario.id ? '3px solid #667eea' : '2px solid #e2e8f0',
                            boxShadow: activeAvatarId === usuario.id ? '0 0 0 4px rgba(102, 126, 234, 0.2)' : 'none',
                            transform: activeAvatarId === usuario.id ? 'scale(1.1)' : 'scale(1)',
                            zIndex: activeAvatarId === usuario.id ? 10000 : 'auto',
                            position: activeAvatarId === usuario.id ? 'relative' : 'static'
                          }}
                        >
                          {usuario.avatar && !imageErrors.has(usuario.id) ? (
                            <img 
                              src={`http://localhost:8081/api/files/usuarios/${usuario.avatar}`}
                              alt={`${usuario.nombre || 'Usuario'}`}
                              onError={() => handleImageError(usuario.id)}
                              onLoad={() => handleImageLoad(usuario.id)}
                            />
                          ) : null}
                          <div className="user-avatar-fallback" style={{
                            display: usuario.avatar && !imageErrors.has(usuario.id) ? 'none' : 'flex'
                          }}>
                            {loadingUsers ? (
                              <i className="fas fa-spinner fa-spin" style={{ fontSize: '16px' }}></i>
                            ) : (
                              usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', padding: '12px 8px' }}>
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{usuario.nombre ?? 'Sin nombre'}</div>
                      </td>
                      <td style={{ textAlign: 'left', padding: '12px 8px' }}>
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>{usuario.correo ?? 'Sin email'}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <select 
                          value={usuario.rol ?? ''} 
                          onChange={e => handleRoleChange(usuario.id, e.target.value)} 
                          className="configuracion-select"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            fontSize: '13px',
                            minWidth: '100px'
                          }}
                        >
                        <option value="Admin">Admin</option>
                        <option value="Usuario">Usuario</option>
                        <option value="Supervisor">Supervisor</option>
                      </select>
                    </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}>
                          <input 
                            type="checkbox" 
                            checked={!!usuario.activo} 
                            onChange={() => handleToggleActivo(usuario.id, usuario.activo)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                        </div>
                    </td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                      <button
                          className="configuracion-btn"
                          style={{ 
                            background: usuario.activo ? 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)' : '#e0e0e0', 
                            color: usuario.activo ? 'white' : '#888'
                          }}
                        onClick={() => handleForcePassword(usuario.id, usuario.activo, usuario.nombre)}
                        disabled={!usuario.activo}
                        title={!usuario.activo ? 'Activa el usuario para cambiar la contraseña' : 'Forzar cambio de contraseña'}
                      >
                          <i className="fa fa-key"></i>
                          Contraseña
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Políticas de contraseña */}
      <div className="configuracion-section" style={{padding:'0 0 18px 0', marginBottom: 0}}>
        <div className="configuracion-section-title" style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb',
          color: '#fff', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 16, padding: '10px 16px', minHeight: 0
        }}>
          <i className="fas fa-key"></i>
          Políticas de Contraseña
        </div>
        <form onSubmit={handleGuardarPolicy} style={{
          background: '#fff', borderRadius: '0 0 10px 10px', boxShadow: '0 1px 4px rgba(37,99,235,0.06)',
          padding: '18px 18px 10px 18px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0
        }}>
          <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-end',marginBottom:4}}>
            <div style={{display:'flex',flexDirection:'column',minWidth:120}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginBottom:2}}>Longitud mínima</label>
              <input type="number" name="minLength" min="4" max="32" value={passwordPolicy.minLength} onChange={handlePolicyChange}
                style={{width: 70, padding: '6px 8px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 13}} />
            </div>
            <div style={{display:'flex',flexDirection:'column',minWidth:120}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginBottom:2}}>Caducidad (días)</label>
              <input type="number" name="expireDays" min="0" max="365" value={passwordPolicy.expireDays} onChange={handlePolicyChange}
                style={{width: 70, padding: '6px 8px', border: '1.5px solid #d1d5db', borderRadius: 6, fontSize: 13}} />
              <span style={{color:'#6b7280', fontSize:11, marginTop:2}}>0 = nunca caduca</span>
            </div>
            </div>
          <div style={{display:'flex',gap:18,alignItems:'center',flexWrap:'wrap',marginBottom:4}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginRight:2}}>Mayúsculas (A-Z)</label>
              <label className="switch" title="Mayúsculas">
                <input type="checkbox" name="requireUpper" checked={passwordPolicy.requireUpper} onChange={handlePolicyChange} />
                <span className="slider"></span>
              </label>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginRight:2}}>Minúsculas (a-z)</label>
              <label className="switch" title="Minúsculas">
                <input type="checkbox" name="requireLower" checked={passwordPolicy.requireLower} onChange={handlePolicyChange} />
                <span className="slider"></span>
              </label>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginRight:2}}>Números (0-9)</label>
              <label className="switch" title="Números">
                <input type="checkbox" name="requireNumber" checked={passwordPolicy.requireNumber} onChange={handlePolicyChange} />
                <span className="slider"></span>
              </label>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <label style={{fontWeight:600,color:'#374151',fontSize:13,marginRight:2}}>Símbolos (#@!)</label>
              <label className="switch" title="Símbolos">
                <input type="checkbox" name="requireSymbol" checked={passwordPolicy.requireSymbol} onChange={handlePolicyChange} />
                <span className="slider"></span>
              </label>
          </div>
            <button type="submit" className="configuracion-btn" style={{
              background:'#2563eb', color:'#fff', fontWeight:700, padding:'8px 18px', fontSize:'13px', borderRadius:'7px',
              boxShadow:'0 1px 4px rgba(37,99,235,0.08)', display:'flex', alignItems:'center', gap:'6px', marginLeft:'auto'
            }}>
              <i className="fas fa-save"></i>Guardar
            </button>
          </div>
          {policyMsg && (
            <div style={{
              background: policyMsgType === 'success' ? '#e7fbe7' : '#ffeaea',
              color: policyMsgType === 'success' ? '#388e3c' : '#d32f2f',
              border: `1.5px solid ${policyMsgType === 'success' ? '#4caf50' : '#f44336'}`,
              borderRadius: '7px', padding: '7px 14px', fontWeight: 500, fontSize: '13px', marginTop: 6, maxWidth: 320
            }}>
              {policyMsg}
            </div>
          )}
        </form>
      </div>

      {/* Personalización Visual */}
      <section className="visual-panel" style={{margin: '24px 0 0 0', maxWidth: '100%', borderRadius: '12px', boxShadow: '0 4px 18px rgba(37,99,235,0.08)', padding: 0, background: 'rgba(255,255,255,0.75)', width: '100%', backdropFilter: 'blur(8px)'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '12px 12px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-paint-brush"></i>
          Personalización Visual del Sistema
        </div>
        <div className="visual-panel__container" style={{display: 'flex', gap: 24, padding: '24px 0 24px 0', alignItems: 'flex-start', width: '100%'}}>
          {/* Controles en retícula */}
          <div className="visual-grid-config" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, flex: 1, width: '100%', maxWidth: 700}}>
            {/* Colores */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:600,fontSize:13,color:'#2563eb',marginBottom:2,letterSpacing:'0.2px'}}><i className="fas fa-palette" style={{marginRight:6}}></i>Colores</div>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-fill-drip" style={{marginRight:5}}></i>Color primario</label>
              <input type="color" name="colorPrimario" value={visualConfig.colorPrimario} onChange={handleVisualChange} style={{width:36,height:36,border:'none',borderRadius:8,boxShadow:'0 1px 2px rgba(0,0,0,0.04)',background:'#fff'}} />
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-fill-drip" style={{marginRight:5}}></i>Color secundario</label>
              <input type="color" name="colorSecundario" value={visualConfig.colorSecundario} onChange={handleVisualChange} style={{width:36,height:36,border:'none',borderRadius:8,boxShadow:'0 1px 2px rgba(0,0,0,0.04)',background:'#fff'}} />
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-grip-lines-vertical" style={{marginRight:5}}></i>Tipo degradado</label>
              <select name="tipoDegradado" value={visualConfig.tipoDegradado || 'linear'} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="linear">Lineal</option>
                <option value="radial">Radial</option>
                <option value="solid">Sin degradado</option>
              </select>
              {visualConfig.tipoDegradado !== 'solid' && <><label style={{color:'#222',fontSize:12}}><i className="fas fa-angle-double-right" style={{marginRight:5}}></i>Ángulo</label>
              <input type="number" name="anguloDegradado" min="0" max="360" value={visualConfig.anguloDegradado || 135} onChange={handleVisualChange} style={{width:60,color:'#222',background:'#fff',fontSize:12,borderRadius:6}} /></>}
            </div>
            {/* Tipografía */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:600,fontSize:13,color:'#2563eb',marginBottom:2,letterSpacing:'0.2px'}}><i className="fas fa-font" style={{marginRight:6}}></i>Tipografía</div>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-font" style={{marginRight:5}}></i>Fuente</label>
              <select name="fuente" value={visualConfig.fuente} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="Inter">Inter</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Roboto">Roboto</option>
              </select>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-text-height" style={{marginRight:5}}></i>Tamaño</label>
              <select name="tamanoFuente" value={visualConfig.tamanoFuente} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="12px">Pequeño</option>
                <option value="14px">Normal</option>
                <option value="16px">Grande</option>
                <option value="18px">Extra grande</option>
              </select>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-eye" style={{marginRight:5}}></i>Vista previa</label>
              <input type="text" name="textoPreview" value={visualConfig.textoPreview || ''} onChange={e => setVisualConfig(prev => ({...prev, textoPreview: e.target.value}))} placeholder="Escribe aquí para ver el ejemplo" className="visual-font-preview" style={{fontFamily: visualConfig.fuente, fontSize: visualConfig.tamanoFuente, background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', color: '#222'}} />
            </div>
            {/* Efectos */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:600,fontSize:13,color:'#2563eb',marginBottom:2,letterSpacing:'0.2px'}}><i className="fas fa-magic" style={{marginRight:6}}></i>Efectos</div>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-border-style" style={{marginRight:5}}></i>Bordes</label>
              <select name="bordesRedondeados" value={visualConfig.bordesRedondeados} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="0px">Sin bordes</option>
                <option value="4px">Suave</option>
                <option value="8px">Normal</option>
                <option value="12px">Redondeado</option>
                <option value="20px">Muy redondeado</option>
              </select>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-compress-arrows-alt" style={{marginRight:5}}></i>Densidad</label>
              <select name="densidad" value={visualConfig.densidad} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="compact">Compacta</option>
                <option value="normal">Normal</option>
                <option value="spacious">Espaciosa</option>
              </select>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-cloud-moon" style={{marginRight:5}}></i>Sombras</label>
              <input type="checkbox" name="sombras" checked={visualConfig.sombras} onChange={handleVisualChange} style={{width:18,height:18}} />
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-bolt" style={{marginRight:5}}></i>Animaciones</label>
              <input type="checkbox" name="animaciones" checked={visualConfig.animaciones} onChange={handleVisualChange} style={{width:18,height:18}} />
            </div>
            {/* Selector de idioma */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:600,fontSize:13,color:'#2563eb',marginBottom:2,letterSpacing:'0.2px'}}><i className="fas fa-globe" style={{marginRight:6}}></i>Idioma</div>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-language" style={{marginRight:5}}></i>Selecciona el idioma</label>
              <select name="idioma" value={visualConfig.idioma || 'español'} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="español">Español</option>
                <option value="inglés">Inglés</option>
                <option value="portugués">Portugués</option>
              </select>
            </div>
            {/* Selector de formato de número */}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontWeight:600,fontSize:13,color:'#2563eb',marginBottom:2,letterSpacing:'0.2px'}}><i className="fas fa-hashtag" style={{marginRight:6}}></i>Formato de número</div>
              <label style={{color:'#222',fontSize:12}}><i className="fas fa-sort-numeric-up" style={{marginRight:5}}></i>Selecciona el formato</label>
              <select name="formatoNumero" value={visualConfig.formatoNumero || 'us'} onChange={handleVisualChange} style={{color:'#222',background:'#fff',fontSize:12,borderRadius:6,padding:'4px 10px'}}>
                <option value="us">1,234.56 (US)</option>
                <option value="eu">1.234,56 (EU)</option>
                <option value="fr">1 234,56 (FR)</option>
              </select>
            </div>
          </div>
          {/* Vista previa (derecha) */}
          <div className="visual-panel__preview" style={{flex: '0 0 260px', minWidth: 180, maxWidth: 260, marginLeft: 24}}>
            <div className="visual-preview-mockup" style={{
              fontFamily: visualConfig.fuente,
              fontSize: visualConfig.tamanoFuente,
              borderRadius: visualConfig.bordesRedondeados,
              boxShadow: visualConfig.sombras ? '0 8px 32px rgba(37,99,235,0.15)' : 'none',
              background: visualConfig.tipoDegradado === 'radial'
                ? `radial-gradient(circle, ${visualConfig.colorPrimario} 60%, ${visualConfig.colorSecundario} 100%)`
                : visualConfig.tipoDegradado === 'solid'
                  ? visualConfig.colorPrimario
                  : `linear-gradient(${visualConfig.anguloDegradado || 135}deg, ${visualConfig.colorPrimario} 60%, ${visualConfig.colorSecundario} 100%)`,
              color: visualConfig.tema === 'oscuro' ? '#fff' : '#222',
              border: visualConfig.tema === 'oscuro' ? '2.5px solid #222' : '2.5px solid #e0e7ef',
              transition: visualConfig.animaciones ? 'all 0.3s cubic-bezier(.4,2,.6,1)' : 'none',
              width: '100%',
              minHeight: '140px',
              margin: '0 auto',
              padding: '8px 4px 8px 4px',
              maxWidth: 260,
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(8px)'
            }}>
              <div className="visual-preview-header" style={{background: visualConfig.tema === 'oscuro' ? 'rgba(30,41,59,0.7)' : 'rgba(55,65,81,0.18)', color: visualConfig.tema === 'oscuro' ? '#fff' : '#fff', fontSize: '1rem', padding: '6px 12px', marginBottom: '8px', borderRadius: '6px'}}>
                <i className="fas fa-cogs"></i> ERP SENA
            </div>
              <div className="visual-preview-content" style={{gap: '8px'}}>
                <button className="visual-preview-btn visual-preview-btn--primary">Botón Primario</button>
                <button className="visual-preview-btn visual-preview-btn--secondary">Botón Secundario</button>
                <button className="visual-preview-btn visual-preview-btn--outline">Botón Outline</button>
                <div className="visual-font-preview" style={{fontFamily: visualConfig.fuente, fontSize: visualConfig.tamanoFuente, background: visualConfig.tema === 'oscuro' ? '#222' : '#f3f4f6', color: '#222', padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4}}>
                  Ejemplo de texto en la vista previa
      </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuración de Empresa */}
      <section className="empresa-panel" style={{margin: '32px 0 0 0', maxWidth: '100%', borderRadius: '14px', boxShadow: '0 4px 18px rgba(37,99,235,0.10)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '0 0 24px 0', width: '100%'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '14px 14px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-building"></i>
          Configuración de Empresa
        </div>
        <form style={{ padding: '24px 24px 0 24px' }}>
          <div style={{display:'flex',gap:32,alignItems:'flex-start',flexWrap:'wrap'}}>
            {/* Área de drag & drop para logo */}
            <div style={{minWidth:220,maxWidth:260,flex:'0 0 220px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start'}}>
              <label style={{fontWeight:600,color:'#2563eb',fontSize:14,marginBottom:8,display:'flex',alignItems:'center',gap:8}}><i className="fas fa-image"></i>Logo de la empresa</label>
              <div
                onDragOver={e => {e.preventDefault();e.stopPropagation();}}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0];
                    setLogoFile(file);
                    const reader = new FileReader();
                    reader.onload = ev => setLogoPreview(ev.target.result);
                    reader.readAsDataURL(file);
                    // Subir el archivo inmediatamente y actualizar visualConfig.logoUrl
                    const formData = new window.FormData();
                    formData.append('file', file);
                    fetch('http://localhost:8081/api/files/upload', {
                      method: 'POST',
                      body: formData
                    })
                      .then(res => res.ok ? res.json() : null)
                      .then(data => {
                        if (data && data.filename) {
                          setVisualConfig(prev => ({ ...prev, logoUrl: data.filename }));
                        }
                      });
                  }
                }}
                style={{
                  border: '2px dashed #2563eb',
                  borderRadius: 12,
                  background: '#f8fafc',
                  width: 180,
                  height: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  marginBottom: 10,
                  position: 'relative',
                  transition: 'border 0.2s'
                }}
                onClick={() => document.getElementById('logo-upload-input').click()}
                title="Arrastra y suelta una imagen o haz clic para seleccionar"
              >
                {logoPreview || (visualConfig.logoUrl && !logoFile) ? (
                  <img src={logoPreview || `/api/files/${visualConfig.logoUrl}`} alt="Logo" style={{maxWidth: '90%', maxHeight: '90%', borderRadius: 8, objectFit: 'contain'}} />
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt" style={{fontSize: 38, color: '#2563eb', marginBottom: 8}}></i>
                    <span style={{color:'#2563eb',fontSize:13,textAlign:'center'}}>Arrastra y suelta aquí<br/>o haz clic para seleccionar</span>
                  </>
                )}
              <input 
                  id="logo-upload-input"
                  type="file"
                  accept="image/*"
                  style={{display:'none'}}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setLogoFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setLogoPreview(ev.target.result);
                      reader.readAsDataURL(file);
                      // Subir el archivo inmediatamente y actualizar visualConfig.logoUrl
                      const formData = new window.FormData();
                      formData.append('file', file);
                      fetch('http://localhost:8081/api/files/upload', {
                        method: 'POST',
                        body: formData
                      })
                        .then(res => res.ok ? res.json() : null)
                        .then(data => {
                          if (data && data.filename) {
                            setVisualConfig(prev => ({ ...prev, logoUrl: data.filename }));
                          }
                        });
                    }
                  }}
              />
            </div>
              <span style={{color:'#6b7280',fontSize:12,textAlign:'center'}}>Formatos permitidos: PNG, JPG, SVG. Tamaño recomendado: 180x180px</span>
            </div>
            {/* Grid de campos de empresa */}
            <div style={{flex:1}}>
              <div className="empresa-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:20}}>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-briefcase"></i>Nombre de la empresa</label>
                  <input type="text" name="nombreEmpresa" value={visualConfig.nombreEmpresa} onChange={handleVisualChange} placeholder="Ingrese el nombre de la empresa" className="empresa-input" />
            </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-map-marker-alt"></i>Dirección</label>
                  <input type="text" name="direccionEmpresa" value={visualConfig.direccionEmpresa} onChange={handleVisualChange} placeholder="Ingrese la dirección" className="empresa-input" />
            </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-phone"></i>Teléfono</label>
                  <input type="tel" name="telefonoEmpresa" value={visualConfig.telefonoEmpresa} onChange={handleVisualChange} placeholder="Ingrese el teléfono" className="empresa-input" />
            </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-envelope"></i>Email corporativo</label>
                  <input type="email" name="emailEmpresa" value={visualConfig.emailEmpresa} onChange={handleVisualChange} placeholder="Ingrese el email corporativo" className="empresa-input" />
            </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-globe"></i>Sitio web</label>
                  <input type="url" name="sitioWeb" value={visualConfig.sitioWeb} onChange={handleVisualChange} placeholder="https://www.empresa.com" className="empresa-input" />
                </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-clock"></i>Horario laboral</label>
                  <input type="text" name="horarioLaboral" value={visualConfig.horarioLaboral} onChange={handleVisualChange} placeholder="8:00-18:00" className="empresa-input" />
                </div>
                <div className="empresa-field">
                  <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-globe-americas"></i>Zona horaria</label>
                  <select name="zonaHoraria" value={visualConfig.zonaHoraria} onChange={handleVisualChange} className="empresa-input">
                <option value="America/Bogota">Colombia (Bogotá)</option>
                <option value="America/Mexico_City">México (Ciudad de México)</option>
                <option value="America/New_York">Estados Unidos (Nueva York)</option>
                <option value="America/Los_Angeles">Estados Unidos (Oeste)</option>
                <option value="Europe/Madrid">España</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button type="button" className="empresa-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#2563eb 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}} onClick={handleGuardarEmpresa}>
              <i className="fas fa-save"></i>Guardar configuración
            </button>
          </div>
        </form>
        <div style={{display:'flex',gap:16,margin:'18px 0 0 0',justifyContent:'flex-end'}}>
          <button
            onClick={() => setShowVerModal(true)}
            disabled={!empresaActual}
            style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual)?0.5:1}}>
            <i className="fas fa-eye"></i> Ver
          </button>
          <button
            onClick={() => setShowEditarModal(true)}
            disabled={!empresaActual}
            style={{background:'#f59e42',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(245,158,66,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual)?0.5:1}}>
            <i className="fas fa-edit"></i> Editar
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!empresaActual?.nombreEmpresa}
            style={{background:'#e11d48',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:(!empresaActual?.nombreEmpresa)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(225,29,72,0.10)',display:'flex',alignItems:'center',gap:8,opacity:(!empresaActual?.nombreEmpresa)?0.5:1}}>
            <i className="fas fa-trash"></i> Eliminar
          </button>
          <button
            onClick={handleLimpiarEmpresa}
            style={{background:'#64748b',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontWeight:600,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(100,116,139,0.10)',display:'flex',alignItems:'center',gap:8}}>
            <i className="fas fa-eraser"></i> Limpiar
          </button>
        </div>
      </section>

      {/* Configuración de Seguridad */}
      <section className="seguridad-panel" style={{margin: '32px 0 0 0', maxWidth: '100%', borderRadius: '14px', boxShadow: '0 4px 18px rgba(37,99,235,0.10)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '0 0 24px 0', width: '100%'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '14px 14px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-shield-alt"></i>
          Configuración de Seguridad
        </div>
        <form style={{ padding: '24px 24px 0 24px' }}>
          <div className="seguridad-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:20}}>
            <div className="seguridad-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-hourglass-half"></i>Tiempo de sesión (minutos)</label>
              <input type="number" name="tiempoSesion" value={visualConfig.tiempoSesion} onChange={handleVisualChange} min="5" max="480" placeholder="30" className="seguridad-input" />
              <span className="seguridad-help">Tiempo antes de que expire la sesión por inactividad</span>
            </div>
            <div className="seguridad-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-user-lock"></i>Máximo intentos de login</label>
              <input type="number" name="maxIntentosLogin" value={visualConfig.maxIntentosLogin} onChange={handleVisualChange} min="3" max="10" placeholder="5" className="seguridad-input" />
              <span className="seguridad-help">Número de intentos antes del bloqueo temporal</span>
            </div>
            <div className="seguridad-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-lock"></i>Tiempo de bloqueo (minutos)</label>
              <input type="number" name="bloqueoTemporal" value={visualConfig.bloqueoTemporal} onChange={handleVisualChange} min="5" max="60" placeholder="15" className="seguridad-input" />
              <span className="seguridad-help">Tiempo de bloqueo después de exceder intentos</span>
            </div>
            <div className="seguridad-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-robot"></i>Requerir reCAPTCHA en login</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="requiereCaptcha" checked={visualConfig.requiereCaptcha} onChange={handleVisualChange} className="seguridad-checkbox" />
                <span className="seguridad-help">Activar verificación reCAPTCHA para mayor seguridad</span>
            </div>
          </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button type="button" className="seguridad-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#0891b2 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}}>
              <i className="fas fa-save"></i>Guardar configuración
            </button>
          </div>
        </form>
      </section>

      {/* Configuración de Notificaciones */}
      <section className="notificaciones-panel" style={{margin: '32px 0 0 0', maxWidth: '100%', borderRadius: '14px', boxShadow: '0 4px 18px rgba(37,99,235,0.10)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '0 0 24px 0', width: '100%'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '14px 14px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-bell"></i>
          Configuración de Notificaciones
        </div>
        <form style={{ padding: '24px 24px 0 24px' }}>
          <div className="notificaciones-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:18}}>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-map-marker-alt"></i>Posición de notificaciones</label>
              <select name="notificacionesPosicion" value={visualConfig.notificacionesPosicion} onChange={handleVisualChange} className="notificaciones-input">
                <option value="top-right">Superior derecha</option>
                <option value="top-left">Superior izquierda</option>
                <option value="bottom-right">Inferior derecha</option>
                <option value="bottom-left">Inferior izquierda</option>
                <option value="top-center">Superior centro</option>
                <option value="bottom-center">Inferior centro</option>
              </select>
            </div>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-clock"></i>Duración (ms)</label>
              <input type="number" name="notificacionesDuracion" value={visualConfig.notificacionesDuracion} onChange={handleVisualChange} min="2000" max="10000" step="500" placeholder="5000" className="notificaciones-input" />
              <span className="notificaciones-help">Tiempo visible de la notificación</span>
            </div>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-volume-up"></i>Sonido</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="notificacionesSonido" checked={visualConfig.notificacionesSonido} onChange={handleVisualChange} className="notificaciones-checkbox" />
                <span className="notificaciones-help">Activar sonido en notificaciones</span>
              </label>
            </div>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-envelope"></i>Email</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="notificacionesEmail" checked={visualConfig.notificacionesEmail} onChange={handleVisualChange} className="notificaciones-checkbox" />
                <span className="notificaciones-help">Notificaciones por email</span>
              </label>
            </div>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-bolt"></i>Push</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="notificacionesPush" checked={visualConfig.notificacionesPush} onChange={handleVisualChange} className="notificaciones-checkbox" />
                <span className="notificaciones-help">Notificaciones push</span>
              </label>
            </div>
            <div className="notificaciones-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-sms"></i>SMS</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="notificacionesSMS" checked={visualConfig.notificacionesSMS} onChange={handleVisualChange} className="notificaciones-checkbox" />
                <span className="notificaciones-help">Notificaciones por SMS</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button type="button" className="notificaciones-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#2563eb 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}}>
              <i className="fas fa-save"></i>Guardar configuración
            </button>
          </div>
        </form>
      </section>

      {/* Configuración de Reportes */}
      <section className="reportes-panel" style={{margin: '32px 0 0 0', maxWidth: '100%', borderRadius: '14px', boxShadow: '0 4px 18px rgba(37,99,235,0.10)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '0 0 24px 0', width: '100%'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '14px 14px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-chart-bar"></i>
          Configuración de Reportes
        </div>
        <form style={{ padding: '24px 24px 0 24px' }}>
          <div className="reportes-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:18}}>
            <div className="reportes-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-file-alt"></i>Formato de reporte predeterminado</label>
              <select name="formatoReporte" value={visualConfig.formatoReporte} onChange={handleVisualChange} className="reportes-input">
                <option value="PDF">PDF</option>
                <option value="Excel">Excel (XLSX)</option>
                <option value="CSV">CSV</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div className="reportes-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-calendar-alt"></i>Frecuencia de reportes automáticos</label>
              <select name="frecuenciaReportes" value={visualConfig.frecuenciaReportes} onChange={handleVisualChange} className="reportes-input">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="reportes-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-chart-pie"></i>Incluir gráficos</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="incluirGraficos" checked={visualConfig.incluirGraficos} onChange={handleVisualChange} className="reportes-checkbox" />
                <span className="reportes-help">Incluir gráficos en reportes</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button type="button" className="reportes-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#2563eb 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}}>
              <i className="fas fa-save"></i>Guardar configuración
            </button>
          </div>
        </form>
      </section>

      {/* Configuración de Backup */}
      <section className="backup-panel" style={{margin: '32px 0 0 0', maxWidth: '100%', borderRadius: '14px', boxShadow: '0 4px 18px rgba(37,99,235,0.10)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '0 0 24px 0', width: '100%'}}>
        <div className="configuracion-section-title" style={{marginBottom: 0, borderRadius: '14px 14px 0 0', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 18, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
          <i className="fas fa-database"></i>
          Configuración de Backup
        </div>
        <form style={{ padding: '24px 24px 0 24px' }}>
          <div className="backup-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:18}}>
            <div className="backup-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-sync-alt"></i>Backup automático</label>
              <label style={{display:'flex',alignItems:'center',gap:10}}>
                <input type="checkbox" name="backupAutomatico" checked={visualConfig.backupAutomatico} onChange={handleVisualChange} className="backup-checkbox" />
                <span className="backup-help">Habilitar backup automático</span>
              </label>
            </div>
            <div className="backup-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-calendar-check"></i>Frecuencia de backup</label>
              <select name="frecuenciaBackup" value={visualConfig.frecuenciaBackup} onChange={handleVisualChange} className="backup-input">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div className="backup-field">
              <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,color:'#2563eb',fontSize:14}}><i className="fas fa-hourglass-end"></i>Retener backups por (días)</label>
              <input type="number" name="retenerBackups" value={visualConfig.retenerBackups} onChange={handleVisualChange} min="7" max="365" placeholder="30" className="backup-input" />
              <span className="backup-help">Número de días antes de eliminar backups antiguos</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', gap: '12px' }}>
            <button type="button" className="backup-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#2563eb 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}}>
              <i className="fas fa-download"></i>Crear backup manual
            </button>
            <button type="button" className="backup-btn-guardar" style={{background:'linear-gradient(90deg,#2563eb 0%,#2563eb 100%)',color:'#fff',fontWeight:700,padding:'12px 32px',fontSize:15,borderRadius:10,boxShadow:'0 2px 8px rgba(37,99,235,0.10)',display:'flex',alignItems:'center',gap:10,border:'none',cursor:'pointer'}}>
              <i className="fas fa-save"></i>Guardar configuración
            </button>
          </div>
        </form>
      </section>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                <i className="fas fa-key" style={{ marginRight: '8px', color: '#2563eb' }}></i>
                Cambiar Contraseña
              </h3>
              <button
                onClick={closePasswordModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Cambiando contraseña para: <strong>{passwordForm.userName}</strong>
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmitPassword(); }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Nueva contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={passwordForm.password}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Ingresa la nueva contraseña"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Confirmar contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      paddingRight: '50px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Confirma la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                    onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                    title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Validación de contraseña */}
              <div style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  margin: '0 0 12px 0'
                }}>
                  Requisitos de la contraseña:
                </h4>
                <div style={{ fontSize: '13px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '6px',
                    color: passwordValidation.length ? '#059669' : '#6b7280'
                  }}>
                    <i className={`fas ${passwordValidation.length ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                    Mínimo {passwordPolicy.minLength} caracteres
                  </div>
                  {passwordPolicy.requireUpper && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      color: passwordValidation.upper ? '#059669' : '#6b7280'
                    }}>
                      <i className={`fas ${passwordValidation.upper ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                      Al menos una mayúscula
                    </div>
                  )}
                  {passwordPolicy.requireLower && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      color: passwordValidation.lower ? '#059669' : '#6b7280'
                    }}>
                      <i className={`fas ${passwordValidation.lower ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                      Al menos una minúscula
                    </div>
                  )}
                  {passwordPolicy.requireNumber && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      color: passwordValidation.number ? '#059669' : '#6b7280'
                    }}>
                      <i className={`fas ${passwordValidation.number ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                      Al menos un número
                    </div>
                  )}
                  {passwordPolicy.requireSymbol && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '6px',
                      color: passwordValidation.symbol ? '#059669' : '#6b7280'
                    }}>
                      <i className={`fas ${passwordValidation.symbol ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                      Al menos un símbolo
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: passwordValidation.match ? '#059669' : '#6b7280'
                  }}>
                    <i className={`fas ${passwordValidation.match ? 'fa-check' : 'fa-times'}`} style={{ marginRight: '8px', width: '12px' }}></i>
                    Las contraseñas coinciden
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!Object.values(passwordValidation).every(v => v)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: Object.values(passwordValidation).every(v => v) ? '#2563eb' : '#9ca3af',
                    color: 'white',
                    cursor: Object.values(passwordValidation).every(v => v) ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                  Cambiar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ampliación global, fuera de la tabla */}
      {activeAvatarId && expandCoords && ReactDOM.createPortal(
        <div 
          className="expanded-image-container"
          style={{
            position: 'fixed',
            top: expandCoords.top,
            left: expandCoords.left,
            background: 'white',
            borderRadius: '8px',
            padding: '12px',
            width: '200px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
            border: '2px solid #e2e8f0',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {/* Flecha que apunta al avatar */}
          <div style={{
            position: 'absolute',
            left: expandDirection === 'left' ? 'auto' : '-8px',
            right: expandDirection === 'left' ? '-8px' : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: expandDirection === 'left' ? 'none' : '8px solid white',
            borderLeft: expandDirection === 'left' ? '8px solid white' : 'none',
          }}></div>
          {/* Imagen ampliada y datos */}
          {(() => {
            const usuario = usuarios.find(u => u.id === activeAvatarId);
            if (!usuario) return null;
            return <>
              <div style={{
                width: '100%',
                height: '150px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <img
                  src={`http://localhost:8081/api/files/usuarios/${usuario.avatar}`}
                  alt={usuario.nombre || 'Usuario'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#1f2937',
                  marginBottom: '2px'
                }}>
                  {usuario.nombre || 'Sin nombre'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {usuario.correo || 'Sin email'}
                </div>
              </div>
            </>;
          })()}
        </div>,
        document.body
      )}

      {showVisualModal && visualMsg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'modalBackdropFadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(37,99,235,0.13)',
            padding: '36px 32px 28px 32px',
            minWidth: 320,
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            position: 'relative',
            animation: 'modalFadeIn 0.3s ease-out'
          }}>
            <div style={{fontSize: 38, color: visualMsgType === 'success' ? '#059669' : '#d32f2f', marginBottom: 8}}>
              <i className={`fas ${visualMsgType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            </div>
            <div style={{fontWeight: 700, fontSize: 18, color: '#222', textAlign: 'center', marginBottom: 6}}>
              {visualMsgType === 'success' ? '¡Éxito!' : 'Error'}
            </div>
            <div style={{fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 8}}>
              {visualMsg}
            </div>
            <button onClick={() => setShowVisualModal(false)} style={{marginTop: 8, background:'#2563eb',color:'#fff',border:'none',borderRadius:8,padding:'8px 24px',fontWeight:600,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.10)'}}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de notificación para empresa */}
      <EmpresaModal
        show={!!visualMsg}
        type={visualMsgType}
        message={visualMsg}
        onClose={() => { setShowEmpresaModal(false); setVisualMsg(''); setVisualMsgType(''); }}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        show={showConfirmModal}
        message="¿Estás seguro de que deseas eliminar la configuración de empresa? Esta acción no se puede deshacer."
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          setShowConfirmModal(false);
          try {
            const token = localStorage.getItem('jwt');
            const res = await fetch('http://localhost:8081/api/empresa-config', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              }
            });
            if(res.ok){
              setVisualMsg('Configuración de empresa eliminada correctamente.');
              setVisualMsgType('success');
              setEmpresaActual(null);
              setVisualConfig(prev => ({...prev,
                nombreEmpresa: '',direccionEmpresa: '',telefonoEmpresa: '',emailEmpresa: '',sitioWeb: '',horarioLaboral: '',zonaHoraria: '',logoUrl: ''
              }));
              setLogoPreview(null);
              setLogoFile(null);
            }else{
              setVisualMsg('Error al eliminar la configuración de empresa.');
              setVisualMsgType('error');
            }
          }catch{
            setVisualMsg('Error de red al eliminar la configuración de empresa.');
            setVisualMsgType('error');
          }
        }}
      />

      {/* Modal de aviso de edición */}
      {showEditMsg && (
        <EmpresaModal
          show={showEditMsg}
          type="success"
          message={editMsg}
          onClose={() => setShowEditMsg(false)}
        />
      )}

      {/* Renderiza los modales */}
      <VerEmpresaModal show={showVerModal} empresa={empresaActual} onClose={() => setShowVerModal(false)} onEdit={() => { setShowVerModal(false); setShowEditarModal(true); }} />
      <EditarEmpresaModal show={showEditarModal} empresa={empresaActual} onClose={() => setShowEditarModal(false)} onSave={handleGuardarEdicionEmpresa} />
    </div>
  );
}

export default ConfiguracionPage; 