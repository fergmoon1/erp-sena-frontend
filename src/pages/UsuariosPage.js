import React, { useEffect, useRef, useState } from 'react';
import FileUpload from '../components/FileUpload';
import { useNotifications } from '../components/NotificationProvider';
import CustomModal from '../components/CustomModal';
import { FaEdit, FaTrash, FaPlus, FaEye, FaKey, FaUserPlus, FaSearch, FaArrowRight, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import '../styles/usuarios.css';

const API_URL = 'http://localhost:8081/api/usuarios';

const rolOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Usuario', label: 'Usuario' },
  { value: 'Supervisor', label: 'Supervisor' }
];

function UsuariosPage() {
  const { addNotification } = useNotifications();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'Usuario',
    avatar: '',
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSymbol: true
  });
  const [showForm, setShowForm] = useState(false); // Nuevo estado para controlar la visibilidad del formulario
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  // Definir variable para usuarios contratados (puede venir de props, contexto, backend, etc.)
  const usuariosContratados = 10; // Cambia este valor según tu lógica
  // Agregar estado local para controlar visibilidad de la contraseña por usuario
  const [showPasswords, setShowPasswords] = useState({});
  // Estado para paginación
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(20);
  const [paginaActual, setPaginaActual] = useState(1);
  // Estado para el valor temporal del input de búsqueda
  const [searchInput, setSearchInput] = useState(search);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  // Estado para imagen temporal antes de crear o editar usuario
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null);
  // 1. Estados para los modales de confirmación y resultado
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [resultModal, setResultModal] = useState({ show: false, success: true, message: '' });
  // 1. Estado para la posición de anclaje
  const [anchorPosition, setAnchorPosition] = useState(null);
  const [anchorY, setAnchorY] = useState(null);
  const formRef = useRef(null);
  const [formTop, setFormTop] = useState(null);

  useEffect(() => {
    fetchUsuarios();
    // Obtener usuario actual del localStorage (ajusta según tu auth)
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (showForm && anchorY !== null && formRef.current) {
      const formHeight = formRef.current.offsetHeight;
      let top = anchorY;
      // Centra el punto de invocación en el centro del formulario
      top = top - formHeight / 2;
      // Ajusta para que no se desborde
      if (top < 16) top = 16;
      if (top + formHeight > window.innerHeight - 16) top = window.innerHeight - formHeight - 16;
      setFormTop(top);
    } else {
      setFormTop(null);
    }
  }, [showForm, anchorY]);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      if (!res.ok) {
        setError('Error al obtener los usuarios: ' + res.status);
        setUsuarios([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setError('La respuesta del servidor está vacía.');
        setUsuarios([]);
        return;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        setError('La respuesta del servidor no es un JSON válido.');
        setUsuarios([]);
        return;
      }
      setUsuarios(data);
    } catch (err) {
      setError('Error de red al obtener los usuarios.');
      setUsuarios([]);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handleAvatarUpload para edición: solo guarda preview y archivo, no sube
  const handleAvatarUpload = (avatarUrl, url, file) => {
    setPendingAvatarFile(file);
    setPendingAvatarPreview(url);
  };

  // Función para validar contraseña según la política
  const validatePassword = (password) => {
    const errors = [];
    const validations = [];
    
    if (password.length < passwordPolicy.minLength) {
      errors.push(`Mínimo ${passwordPolicy.minLength} caracteres`);
      validations.push({ rule: 'length', valid: false });
    } else {
      validations.push({ rule: 'length', valid: true });
    }
    
    if (passwordPolicy.requireUpper && !password.match(/[A-Z]/)) {
      errors.push('Al menos una mayúscula');
      validations.push({ rule: 'upper', valid: false });
    } else if (passwordPolicy.requireUpper) {
      validations.push({ rule: 'upper', valid: true });
    }
    
    if (passwordPolicy.requireLower && !password.match(/[a-z]/)) {
      errors.push('Al menos una minúscula');
      validations.push({ rule: 'lower', valid: false });
    } else if (passwordPolicy.requireLower) {
      validations.push({ rule: 'lower', valid: true });
    }
    
    if (passwordPolicy.requireNumber && !password.match(/[0-9]/)) {
      errors.push('Al menos un número');
      validations.push({ rule: 'number', valid: false });
    } else if (passwordPolicy.requireNumber) {
      validations.push({ rule: 'number', valid: true });
    }
    
    if (passwordPolicy.requireSymbol && !password.match(/[^a-zA-Z0-9]/)) {
      errors.push('Al menos un símbolo especial');
      validations.push({ rule: 'symbol', valid: false });
    } else if (passwordPolicy.requireSymbol) {
      validations.push({ rule: 'symbol', valid: true });
    }
    
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  // Función para manejar cambios en el campo de contraseña
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setForm({ ...form, password });
    
    if (password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  };

  // Función para obtener la clase CSS del campo de contraseña
  const getPasswordFieldClass = () => {
    if (!form.password) return '';
    const isValid = passwordErrors.length === 0;
    return isValid ? 'valid' : 'error';
  };

  // Función para verificar si un requisito específico se cumple
  const isRequirementMet = (requirement) => {
    if (!form.password) return false;
    
    switch (requirement) {
      case 'length':
        return form.password.length >= passwordPolicy.minLength;
      case 'upper':
        return passwordPolicy.requireUpper && form.password.match(/[A-Z]/);
      case 'lower':
        return passwordPolicy.requireLower && form.password.match(/[a-z]/);
      case 'number':
        return passwordPolicy.requireNumber && form.password.match(/[0-9]/);
      case 'symbol':
        return passwordPolicy.requireSymbol && form.password.match(/[^a-zA-Z0-9]/);
      default:
        return false;
    }
  };

  // handleSubmit: en edición, si hay nueva imagen, primero la sube y luego actualiza usuario
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password && !validatePassword(form.password)) {
      setError('La contraseña no cumple con los requisitos de seguridad.');
      return;
    }
    try {
      const token = localStorage.getItem('jwt');
      let avatarFilename = form.avatar;
      // Subir la imagen solo si hay nueva
      if (pendingAvatarFile) {
        const formData = new FormData();
        formData.append('file', pendingAvatarFile);
        const uploadRes = await fetch(`http://localhost:8081/api/files/upload/usuario${editId ? `?id=${editId}` : ''}`, {
          method: 'POST',
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          avatarFilename = uploadData.filename;
        }
      }
      // Crear o actualizar usuario
      const res = await fetch(editId ? `${API_URL}/${editId}` : API_URL, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ ...form, avatar: avatarFilename })
      });
      if (res.ok) {
        setForm({ nombre: '', correo: '', password: '', rol: 'Usuario', avatar: '' });
        setEditId(null);
        setPendingAvatarFile(null);
        setPendingAvatarPreview(null);
        setShowForm(false);
        fetchUsuarios();
        setSuccessMessage(editId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        setShowSuccessModal(true);
      } else {
        const errorText = await res.text();
        setError(errorText || 'Error al guardar el usuario.');
      }
    } catch (err) {
      setError('Error de red al guardar el usuario.');
    }
  };

  // Función para editar usuario
  const handleEdit = (usuario, event) => {
    setAnchorY(event?.clientY || null);
    setEditId(usuario.id);
    setForm({
      nombre: usuario.nombre || '',
      correo: usuario.correo || '',
      password: '',
      rol: usuario.rol || 'Usuario',
      avatar: usuario.avatar || '',
    });
    setPendingAvatarFile(null);
    setPendingAvatarPreview(null);
    setShowForm(true);
    setError('');
    setShowPassword(false);
  };

  // 2. Nueva función para abrir el modal de confirmación
  const openDeleteModal = (userId, event) => {
    setAnchorY(event?.clientY || null);
    const rect = event.target.getBoundingClientRect();
    setAnchorPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height + window.scrollY });
    setDeleteModal({ show: true, userId });
  };

  // 3. Nueva función para eliminar usuario con feedback visual
  const confirmDelete = async () => {
    const id = deleteModal.userId;
    setDeleteModal({ show: false, userId: null });
    try {
    const token = localStorage.getItem('jwt');
      const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
      if (res.ok) {
        setResultModal({ show: true, success: true, message: 'Usuario eliminado correctamente.' });
    fetchUsuarios();
      } else {
        const errorText = await res.text();
        setResultModal({ show: true, success: false, message: errorText || 'Error al eliminar el usuario.' });
      }
    } catch (err) {
      setResultModal({ show: true, success: false, message: 'Error de red al eliminar el usuario.' });
    }
  };

  const handleView = (usuario) => {
    // Función para ver detalles del usuario
    alert(`Viendo detalles de: ${usuario.nombre}\nCorreo: ${usuario.correo}\nRol: ${usuario.rol}\nEstado: ${usuario.activo ? 'Activo' : 'Inactivo'}`);
  };

  const handleResetPassword = async (usuario) => {
    if (window.confirm(`¿Estás seguro de que quieres resetear la contraseña de ${usuario.nombre}?`)) {
      try {
        const response = await fetch(`${API_URL}/${usuario.id}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nuevaContraseña: 'NuevaContraseña123!' // Contraseña temporal segura
          })
        });

        if (response.ok) {
          alert(`Contraseña reseteada exitosamente para ${usuario.nombre}`);
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Error al resetear contraseña');
        }
      } catch (error) {
        alert('Error de conexión al resetear contraseña');
      }
    }
  };

  const handleCancel = () => {
    setForm({ nombre: '', correo: '', password: '', rol: 'Usuario', avatar: '' });
    setEditId(null);
    setError('');
    setShowPassword(false);
  };

  const handleLimpiar = () => {
    setForm({ nombre: '', correo: '', password: '', rol: 'Usuario', avatar: '' });
    setEditId(null);
    setError('');
    setShowPassword(false);
  };

  // Determinar modo edición o creación
  const isEditMode = editId !== null;

  // Determinar si mostrar mensaje de bienvenida
  const showWelcome = usuarios.length <= 3;

  // Filtrar usuarios según búsqueda y filtros
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
      usuario.correo.toLowerCase().includes(search.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(search.toLowerCase());
    const matchesRol = filterRol ? usuario.rol === filterRol : true;
    const matchesActivo = filterActivo ? (filterActivo === 'activo' ? usuario.activo : !usuario.activo) : true;
    return matchesSearch && matchesRol && matchesActivo;
  });

  // Calcular usuarios a mostrar según paginación
  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = filteredUsuarios.slice(indicePrimerUsuario, indiceUltimoUsuario);
  const totalPaginas = Math.ceil(filteredUsuarios.length / usuariosPorPagina);

  // Panel resumen
  const totalUsuarios = usuarios.length;
  const activos = usuarios.filter(u => u.activo).length;
  const inactivos = usuarios.filter(u => !u.activo).length;
  const roles = {};
  usuarios.forEach(u => {
    roles[u.rol] = (roles[u.rol] || 0) + 1;
  });

  const toggleShowPassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVerDetalle = (usuario) => {
    setUsuarioDetalle(usuario);
    setShowDetalleModal(true);
  };

  // Función para ejecutar la búsqueda
  const ejecutarBusqueda = () => {
    setSearch(searchInput);
    setPaginaActual(1);
  };

  // Determinar el título del recuadro amarillo según los filtros
  let tituloUsuarios = 'Usuarios encontrados';
  if (search && filterRol) {
    tituloUsuarios = `Usuarios encontrados por búsqueda y rol ${filterRol.charAt(0) + filterRol.slice(1).toLowerCase()}`;
  } else if (search) {
    tituloUsuarios = 'Usuarios encontrados por búsqueda';
  } else if (filterRol) {
    tituloUsuarios = `Usuarios encontrados por rol ${filterRol.charAt(0) + filterRol.slice(1).toLowerCase()}`;
  }

  // Panel superior y tabla adaptados al HTML de referencia
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm]);

  return (
    <div className="usuarios-html-bg" style={{ minHeight: '100vh', background: '#f3f4f6', padding: '32px 0' }}>
      <div className="usuarios-html-main" style={{ maxWidth: 1450, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px 0 32px 0', border: '1.5px solid #d1d5db' }}>
        {/* Breadcrumb */}
        <div className="text-sm bg-gray-200 px-3 py-1" style={{ borderRadius: 6, marginBottom: 12, marginLeft: 0, marginRight: 0 }}>
          Estás en: <span className="font-semibold">Administración</span> &gt; <span className="font-semibold">Usuarios</span>
        </div>
        {/* Panel superior */}
        <div className="usuarios-html-panel" style={{ display: 'flex', alignItems: 'stretch', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 18, borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', padding: 0, minHeight: 96 }}>
          {/* Botón vertical 'crear usuario' */}
          <button
            type="button"
            className="usuarios-html-nuevo"
            aria-label="crear usuario"
            onClick={() => { setShowForm(true); setEditId(null); setForm({ nombre: '', correo: '', password: '', rol: 'Usuario', avatar: '', activo: true }); }}
            style={{ minWidth: 120, width: 120, height: 96, background: '#005fa3', color: '#fff', border: 'none', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderRight: '2px solid #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '1.1em', fontWeight: 700, boxShadow: 'none', margin: 0, letterSpacing: '0.5px', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#003f6b'}
            onMouseOut={e => e.currentTarget.style.background = '#005fa3'}
          >
            <FaUserPlus className="text-2xl mb-1" style={{ fontSize: '1.6em' }} />
            <span style={{ color: '#fff', fontSize: '0.95em', fontWeight: 700 }}>Crear usuario</span>
          </button>
          {/* Contenido a la derecha del botón */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 18px', minHeight: 96 }}>
            {/* Lupa, campo de búsqueda y filtros en una sola fila */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 10 }}>
              <FaSearch style={{ color: '#374151', fontSize: 16, marginRight: 8 }} />
              <input
                type="text"
                className="usuarios-search"
                placeholder="Buscar por nombre, correo o rol..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') ejecutarBusqueda(); }}
                style={{ minWidth: 220, width: 220, background: '#fff', border: '1.5px solid #009ec7', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#222', fontWeight: 500, outline: 'none', boxShadow: 'none', fontFamily: 'Segoe UI, Arial, sans-serif' }}
              />
              <button
                type="button"
                onClick={ejecutarBusqueda}
                style={{ background: '#009ec7', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 13, fontFamily: 'Segoe UI, Arial, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#036b87'}
                onMouseOut={e => e.currentTarget.style.background = '#009ec7'}
              >
                <FaSearch /> Buscar
              </button>
              <select
                className="usuarios-filter"
                value={filterRol}
                onChange={e => setFilterRol(e.target.value)}
                style={{ background: '#fff', border: '1.5px solid #009ec7', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#222', minWidth: 140, fontFamily: 'Segoe UI, Arial, sans-serif' }}
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="USER">USER</option>
                <option value="VENDEDOR">VENDEDOR</option>
                <option value="INVENTARIO">INVENTARIO</option>
              </select>
              <select
                className="usuarios-filter"
                value={filterActivo}
                onChange={e => setFilterActivo(e.target.value)}
                style={{ background: '#fff', border: '1.5px solid #009ec7', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#222', minWidth: 100, fontFamily: 'Segoe UI, Arial, sans-serif' }}
              >
                <option value="">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
              <span style={{ marginLeft: 16, fontSize: 13, color: '#222', fontWeight: 500 }}>
                Mostrar
                <select
                  style={{ borderRadius: 4, border: '1.5px solid #009ec7', padding: '4px 8px', fontSize: 13, margin: '0 6px', fontFamily: 'Segoe UI, Arial, sans-serif' }}
                  value={usuariosPorPagina}
                  onChange={e => { setUsuariosPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                por página
              </span>
            </div>
            {/* Cuadro amarillo con usuarios encontrados */}
            <div style={{ background: '#fff3b0', color: '#7c5e00', fontWeight: 500, fontSize: 13, borderRadius: 8, padding: '7px 12px', border: '1.5px solid #ffe066', display: 'inline-block', minWidth: 320, width: 320, fontFamily: 'Segoe UI, Arial, sans-serif', marginTop: 0 }}>
              <div style={{ fontWeight: 700, color: '#222', fontSize: 13, fontFamily: 'Segoe UI, Arial, sans-serif', marginBottom: 2 }}>{tituloUsuarios}</div>
              <div>Cantidad: {filteredUsuarios.length}</div>
            </div>
          </div>
        </div>
        {/* Barra azul */}
        <div style={{ background: '#00a6c7', color: '#fff', borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: '12px 18px 10px 18px', fontWeight: 700, fontSize: '1.18em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, marginLeft: 0, marginRight: 0 }}>
          <span>Usuarios</span>
          <span style={{ fontSize: '0.85em', fontWeight: 500 }}>
            Resultados {indicePrimerUsuario + 1}-{Math.min(indiceUltimoUsuario, filteredUsuarios.length)} de {filteredUsuarios.length}
          </span>
        </div>
        {/* Tabla de usuarios */}
        <div style={{ border: '1.5px solid #d1d5db', borderTop: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflowX: 'auto', marginBottom: 18, marginLeft: 0, marginRight: 0 }}>
          <table className="w-full border-collapse text-xs" style={{ background: '#fff', width: '100%' }}>
            <thead style={{ background: '#e5e7eb' }}>
              <tr>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '6%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Id</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '8%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Avatar</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '16%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'left' }}>Nombre</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '12%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Rol</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '18%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Correo</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '12%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Contraseña</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '12%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Último acceso</th>
                <th style={{ border: '1px solid #d1d5db', padding: '7px 8px', width: '16%', color: '#374151', fontWeight: 700, fontSize: '1em', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody style={{ background: '#fff', color: '#222' }}>
              {usuariosPaginados.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#888' }}>No hay usuarios para mostrar.</td></tr>
              ) : (
                usuariosPaginados.map((usuario, idx) => (
                  <tr key={usuario.id || idx} style={{ border: '1px solid #d1d5db', background: idx % 2 === 0 ? '#fff' : '#f9fafb', height: 60, minHeight: 60 }}>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', verticalAlign: 'middle' }}>{usuario.id || '-'}</td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', verticalAlign: 'middle', padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        {usuario.avatar ? (
                          <img 
                            src={usuario.avatar.startsWith('http') ? usuario.avatar : `http://localhost:8081/api/files/usuarios/${usuario.avatar}`}
                            alt="avatar" 
                            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d1d5db', background: '#fff', display: 'block', margin: '0 auto' }} 
                          />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 10, fontWeight: 600 }}>
                            sube tu foto
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'left', fontWeight: 500, verticalAlign: 'middle' }}>{usuario.nombre}</td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ 
                        background: usuario.rol === 'ADMIN' ? '#dc2626' : 
                                  usuario.rol === 'SUPERVISOR' ? '#f59e0b' : 
                                  usuario.rol === 'USER' ? '#059669' : '#6b7280',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {usuario.rol || 'USER'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#374151', verticalAlign: 'middle' }}>{usuario.correo || '••••••••'}</td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <input
                          type={showPasswords[usuario.id] ? 'text' : 'password'}
                          value={usuario.password ? usuario.password : '••••'}
                          readOnly
                          style={{ border: '1.5px solid #00b6e3', borderRadius: 6, padding: '2px 6px', fontSize: '0.98em', width: 90, textAlign: 'center', background: '#fff', letterSpacing: '2px' }}
                        />
                        <button
                          type="button"
                          aria-label={showPasswords[usuario.id] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          style={{ color: '#00b6e3', background: 'none', border: 'none', fontSize: '1.1em', marginLeft: 2, cursor: 'pointer' }}
                          onClick={() => toggleShowPassword(usuario.id)}
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', color: '#00b6e3', fontWeight: 500, verticalAlign: 'middle' }}>
                      {usuario.ultimoAcceso || '-'}
                      <button
                        type="button"
                        aria-label="Detalles último acceso"
                        style={{ color: '#00b6e3', background: 'none', border: 'none', marginLeft: 6, fontSize: '1.1em', cursor: 'pointer' }}
                        onClick={() => handleView(usuario)}
                      >
                        <FaInfoCircle />
                      </button>
                    </td>
                    <td style={{ border: '1px solid #d1d5db', textAlign: 'center', padding: '4px', width: '16%', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button
                          type="button"
                          onClick={e => handleEdit(usuario, e)}
                          style={{ 
                            background: '#009ec7', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '4px 8px', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#036b87'}
                          onMouseOut={e => e.currentTarget.style.background = '#009ec7'}
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={e => openDeleteModal(usuario.id, e)}
                          style={{ 
                            background: '#dc2626', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '4px 8px', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            transition: 'background 0.2s',
                            marginTop: 4
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
                          onMouseOut={e => e.currentTarget.style.background = '#dc2626'}
                        >
                          <FaTrash /> Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(usuario)}
                          style={{ 
                            background: '#059669', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 4, 
                            padding: '4px 8px', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#047857'}
                          onMouseOut={e => e.currentTarget.style.background = '#059669'}
                        >
                          <FaEye /> Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 18px', 
            background: '#f9fafb', 
            border: '1.5px solid #d1d5db', 
            borderTop: 0, 
            borderBottomLeftRadius: 10, 
            borderBottomRightRadius: 10,
            marginLeft: 0,
            marginRight: 0
          }}>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
              Mostrando {indicePrimerUsuario + 1}-{Math.min(indiceUltimoUsuario, filteredUsuarios.length)} de {filteredUsuarios.length} usuarios
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                style={{ 
                  background: paginaActual === 1 ? '#d1d5db' : '#009ec7', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '6px 12px', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                  opacity: paginaActual === 1 ? 0.5 : 1
                }}
              >
                Anterior
              </button>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '6px 12px', 
                fontSize: 12, 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                style={{ 
                  background: paginaActual === totalPaginas ? '#d1d5db' : '#009ec7', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '6px 12px', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                  opacity: paginaActual === totalPaginas ? 0.5 : 1
                }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Formulario Agregar/Editar */}
      {showForm && (
        <div className="form-overlay" style={{
          position: 'fixed',
          top: formTop !== null ? formTop : '50%',
          left: '50%',
          transform: formTop !== null ? 'translateX(-50%)' : 'translate(-50%, -50%)',
          width: 520,
          minWidth: 320,
          maxWidth: '95vw',
          background: 'transparent',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 0,
          margin: 0
        }}>
          <div ref={formRef} className="form-container" style={{ position: 'relative', width: '100%', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', background: '#fff', padding: 28 }}>
            <button onClick={() => { setShowForm(false); setAnchorY(null); setAnchorPosition(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer', zIndex: 2 }} aria-label="Cerrar formulario">×</button>
            <h2 style={{ fontSize: '1.25em', fontWeight: 700, color: '#009ec7', textAlign: 'center', marginBottom: 16 }}>
              {isEditMode ? 'Editar Usuario' : 'Crear Usuario'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              {/* Columna izquierda: Foto */}
              <div style={{ flex: '0 0 110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: 'none', borderRadius: 10, padding: 0 }}>
                <div style={{ width: 110, height: 110, marginBottom: 6, position: 'relative' }}>
                  {pendingAvatarPreview ? (
                    <>
                      <img src={pendingAvatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: '2px solid #e2e8f0' }} />
                      <button type="button" onClick={() => { setPendingAvatarFile(null); setPendingAvatarPreview(null); }} style={{ position: 'absolute', top: 2, right: 2, background: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 15, lineHeight: '20px', padding: 0 }}>×</button>
                    </>
                  ) : (
                    <FileUpload onFileUpload={handleAvatarUpload} currentAvatar={form.avatar} userId={editId} />
                  )}
                </div>
                <span style={{ fontWeight: 500, color: '#555', fontSize: 13, marginTop: 2 }}>Foto</span>
              </div>
              {/* Columna derecha: Datos */}
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label>Nombre:</label>
                  <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Correo:</label>
                  <input type="email" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Contraseña:</label>
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={handlePasswordChange} placeholder={isEditMode ? "(Opcional) Cambiar contraseña" : "Ingrese una contraseña"} className={getPasswordFieldClass()} style={{ paddingRight: '50px' }} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '👁️' : '👁️‍🗨️'}</button>
                </div>
                {form.password && (
                  <div className="password-errors">
                    <small>Requisitos de Seguridad</small>
                    <ul>
                      <li className={`error-item ${isRequirementMet('length') ? 'valid' : ''}`}>Mínimo {passwordPolicy.minLength} caracteres de longitud</li>
                      <li className={`error-item ${isRequirementMet('upper') ? 'valid' : ''}`}>Al menos una letra mayúscula (A-Z)</li>
                      <li className={`error-item ${isRequirementMet('lower') ? 'valid' : ''}`}>Al menos una letra minúscula (a-z)</li>
                      <li className={`error-item ${isRequirementMet('number') ? 'valid' : ''}`}>Al menos un número (0-9)</li>
                      <li className={`error-item ${isRequirementMet('symbol') ? 'valid' : ''}`}>Al menos un símbolo especial</li>
                    </ul>
                  </div>
                )}
                <div className="form-group">
                  <label>Rol:</label>
                  <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="Usuario">Usuario</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button type="submit" className="btn-primary">{isEditMode ? 'Actualizar' : 'Crear'}</button>
                  <button type="button" className="btn-secondary" onClick={() => { handleCancel(); setShowForm(false); setAnchorY(null); setAnchorPosition(null); }}>Cancelar</button>
                </div>
                {error && <div className="error-message" style={{ marginTop: 10, marginBottom: 0, color: '#dc2626', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', textAlign: 'center', maxWidth: 340, marginLeft: 'auto', marginRight: 'auto', fontSize: 14, fontWeight: 500, boxSizing: 'border-box', overflowWrap: 'break-word' }}>{error}</div>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <CustomModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Éxito!"
      >
        <div style={{textAlign: 'center', fontSize: '1.15em', color: '#2563eb', fontWeight: 600, padding: '10px 0'}}>
          {successMessage}
        </div>
      </CustomModal>
      {/* Modal de detalles del usuario */}
      {showDetalleModal && usuarioDetalle && (
        <CustomModal show={showDetalleModal} onClose={() => setShowDetalleModal(false)} title="Detalles del usuario">
          <div style={{ 
            background: '#eaf1fb',
            border: '2.5px solid #2563eb55',
            borderRadius: '18px',
            boxShadow: '0 8px 32px 0 rgba(37,99,235,0.18), 0 1.5px 6px rgba(37,99,235,0.10)',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '24px',
            padding: '32px 24px',
            margin: '0 auto',
            maxWidth: 420,
            width: '100%'
          }}>
            {/* Avatar grande */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb'
            }}>
              {usuarioDetalle.avatar ? (
                <img 
                  src={usuarioDetalle.avatar.startsWith('http') ? usuarioDetalle.avatar : `http://localhost:8081/api/files/usuarios/${usuarioDetalle.avatar}`}
                  alt={`Avatar de ${usuarioDetalle.nombre}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2.5rem',
                  fontWeight: 'bold'
                }}>
                  {usuarioDetalle.nombre ? usuarioDetalle.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>

            {/* Información del usuario */}
            <div style={{
              width: '100%',
              maxWidth: '400px'
            }}>
              {/* Nombre */}
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0 0 4px 0',
                  fontFamily: 'Segoe UI, Arial, sans-serif'
                }}>
                  {usuarioDetalle.nombre}
                </h3>
                <div style={{
                  display: 'inline-block',
                  background: usuarioDetalle.rol === 'ADMIN' ? '#dc2626' : 
                              usuarioDetalle.rol === 'SUPERVISOR' ? '#f59e0b' : 
                              usuarioDetalle.rol === 'USER' ? '#059669' : '#6b7280',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {usuarioDetalle.rol || 'USER'}
                </div>
              </div>

              {/* Detalles */}
              <div style={{
                display: 'grid',
                gap: '16px',
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                {/* Correo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '2px'
                    }}>
                      Correo electrónico
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {usuarioDetalle.correo}
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: usuarioDetalle.activo ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    <i className={`fas fa-${usuarioDetalle.activo ? 'check-circle' : 'times-circle'}`}></i>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '2px'
                    }}>
                      Estado
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {usuarioDetalle.activo ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                </div>

                {/* Último acceso */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '2px'
                    }}>
                      Último acceso
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {usuarioDetalle.ultimoAcceso || 'No registrado'}
                    </div>
                  </div>
                </div>

                {/* Sesión actual */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem'
                  }}>
                    <i className="fas fa-user-clock"></i>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '2px'
                    }}>
                      Sesión actual
                    </div>
                    <div style={{
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {usuarioDetalle.horaSesion || 'No disponible'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CustomModal>
      )}
      {/* Modal de confirmación de eliminación */}
      <CustomModal
        show={deleteModal.show}
        onClose={() => { setDeleteModal({ show: false, userId: null }); setAnchorY(null); setAnchorPosition(null); }}
        title="Confirmar eliminación"
        icon={<FaExclamationTriangle style={{ color: '#f59e0b' }} />}
        actions={[
          <button key="cancel" className="button" onClick={() => { setDeleteModal({ show: false, userId: null }); setAnchorY(null); setAnchorPosition(null); }}>Cancelar</button>,
          <button key="delete" className="button positive" style={{ background: '#dc2626', color: '#fff', border: 'none' }} onClick={confirmDelete}>Eliminar</button>
        ]}
      >
        ¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.
      </CustomModal>
      {/* Modal de resultado de la eliminación */}
      <CustomModal
        show={resultModal.show}
        onClose={() => { setResultModal({ show: false, success: true, message: '' }); setAnchorY(null); setAnchorPosition(null); }}
        title={resultModal.success ? '¡Éxito!' : 'Error'}
        icon={resultModal.success ? <FaCheckCircle style={{ color: '#22c55e' }} /> : <FaTimesCircle style={{ color: '#dc2626' }} />}
        actions={[
          <button key="ok" className="button positive" onClick={() => { setResultModal({ show: false, success: true, message: '' }); setAnchorY(null); setAnchorPosition(null); }}>OK</button>
        ]}
      >
        {resultModal.message}
      </CustomModal>
    </div>
  );
}

export default UsuariosPage; 