import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  showWarning, showConfirm,
  showSuccess, showError
} from '../utils/alerts';
import Swal from 'sweetalert2';
import { avisar } from '../utils/notificaciones';
import { Eye, EyeOff, User, MapPin, Key, Camera, X, Info, AlertCircle } from 'lucide-react';

const ABMUsuarios = () => {
  // Estados para datos
  const [usuarios, setUsuarios] = useState([]);
  const [tiposUsuario, setTiposUsuario] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposSexo, setTiposSexo] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [tutoresSinUsuario, setTutoresSinUsuario] = useState([]);
  const [selectedTutores, setSelectedTutores] = useState([]);

  // Referencia para el selector de archivos local
  const fileInputRef = useRef(null);
  const [previewLocalUrl, setPreviewLocalUrl] = useState(null);

  // Estados de filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState('todos');

  // Estados de interfaz y control
  const [modoTutores, setModoTutores] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idUsuarioEditar, setIdUsuarioEditar] = useState(null);

  // Visibilidad de contraseñas
  const [verPassword, setVerPassword] = useState(false);
  const [archivoImagen, setArchivoImagen] = useState(null);

  // Estado del formulario
  const estadoInicialForm = {
    id_persona: '',
    id_usuario: '',
    apellido: '',
    nombre: '',
    nombreAMostrar: '',
    sexo: '',
    idTipoDocumento: '',
    tipoDocumento: '',
    numeroDocumento: '',
    fechaNacimiento: '',
    telefono: '',
    usuario: '',
    email: '',
    imagenUrl: '',
    idTipoUsuario: '',
    activo: true,
    password: '',
    confirmPassword: '',
    idLocalidadNacimiento: '',
    idLocalidadResidencia: '',
    idNacionalidad: ''
  };
  const [formData, setFormData] = useState(estadoInicialForm);

  // ID 3 corresponde a Tutor / Allegado
  const esTutorEnEdicion = modoEdicion && Number(formData.idTipoUsuario) === 3;

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const getTutorId = (tutor) => tutor?.id_persona ?? tutor?.idPersona ?? tutor?.id;

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getColorTipoUsuario = (tipo) => {
    const nombre = (tipo || '').toString().toLowerCase();
    if (nombre.includes('admin')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (nombre.includes('tutor') || nombre.includes('padre') || nombre.includes('allegado')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (nombre.includes('docente') || nombre.includes('profesor')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (nombre.includes('alumno') || nombre.includes('estudiante')) {
      return 'bg-sky-100 text-sky-800 border-sky-200';
    }
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  };

  const fetchTiposSexo = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/sexo`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener los tipos de sexo');
      const data = await res.json();
      setTiposSexo(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTiposUsuario = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/tipo_usuarios`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener tipos de usuario');
      const data = await res.json();
      setTiposUsuario(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchTiposDocumento = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener tipos de documento');
      const data = await res.json();
      setTiposDocumento(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchLocalidades = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/localidades`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener las localidades');
      const data = await res.json();
      setLocalidades(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchNacionalidades = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/nacionalidades`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener las nacionalidades');
      const data = await res.json();
      setNacionalidades(Array.isArray(data) ? data : data.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTutoresSinUsuario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/tutores-sin-usuario`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Error al obtener tutores/allegados');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setTutoresSinUsuario(list);
      const ids = list.map((t) => getTutorId(t)).filter((id) => id !== undefined && id !== null);
      setSelectedTutores(ids);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTiposSexo();
    fetchTiposUsuario();
    fetchTiposDocumento();
    fetchLocalidades();
    fetchNacionalidades();
  }, [fetchTiposSexo, fetchTiposUsuario, fetchTiposDocumento, fetchLocalidades, fetchNacionalidades]);

  useEffect(() => {
    if (modoTutores) {
      fetchTutoresSinUsuario();
    } else {
      fetchUsuarios();
    }
  }, [modoTutores, fetchTutoresSinUsuario, fetchUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const termino = busqueda.toLowerCase().trim();
      const apellido = (u.apellidos || u.apellido || '').toLowerCase();
      const nombre = (u.nombres || u.nombre || '').toLowerCase();
      const usuario = (u.usuario || u.username || '').toLowerCase();
      const doc = (u.numeroDocumento || u.numero_documento || '').toString();

      const coincideBusqueda = !termino || (
        apellido.includes(termino) ||
        nombre.includes(termino) ||
        usuario.includes(termino) ||
        doc.includes(termino)
      );

      const esActivo = u.activo !== false;
      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'activos' && esActivo) ||
        (filtroEstado === 'inactivos' && !esActivo);

      const idTipo = (u.idTipoUsuario || u.idtipousuario || '').toString();
      const nombreTipo = (u.tipousuario || u.tipoUsuario || '').toString();
      const coincideTipo =
        filtroTipoUsuario === 'todos' ||
        idTipo === filtroTipoUsuario.toString() ||
        nombreTipo === filtroTipoUsuario.toString();

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [usuarios, busqueda, filtroEstado, filtroTipoUsuario]);

  const tutoresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return tutoresSinUsuario;
    const termino = busqueda.toLowerCase().trim();
    return tutoresSinUsuario.filter((t) => {
      const apellido = (t.apellidos || '').toLowerCase();
      const nombre = (t.nombres || '').toLowerCase();
      const doc = (t.numeroDocumento || t.numero_documento || '').toString();
      return apellido.includes(termino) || nombre.includes(termino) || doc.includes(termino);
    });
  }, [tutoresSinUsuario, busqueda]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (error) setError(null);

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === 'activo' ? value === 'true' : value
      };
      if (!modoEdicion && (name === 'apellido' || name === 'nombre')) {
        const ap = name === 'apellido' ? value : prev.apellido;
        const nom = name === 'nombre' ? value : prev.nombre;
        updated.nombreAMostrar = `${ap}${ap && nom ? ', ' : ''}${nom}`;
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImagen(file);
      setPreviewLocalUrl(URL.createObjectURL(file));
    }
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setPreviewLocalUrl(null);
    setArchivoImagen(null);
    setFormData(estadoInicialForm);
    setVerPassword(false);
    setError(null);
  };

  const handleAbrirAlta = () => {
    setModoEdicion(false);
    setIdUsuarioEditar(null);
    setFormData(estadoInicialForm);
    setPreviewLocalUrl(null);
    setVerPassword(false);
    setError(null);
    setMostrarModal(true);
  };

  const handleSelectTipoDocumento = (e) => {
    const selectedId = e.target.value;
    const docSeleccionado = tiposDocumento.find(
      (doc) => String(doc.id_tipo_documento) === String(selectedId)
    );
    setFormData((prev) => ({
      ...prev,
      idTipoDocumento: selectedId,
      tipoDocumento: docSeleccionado ? (docSeleccionado.nombre_corto || docSeleccionado.nombre) : ''
    }));
  };

  const handleAbrirEdicion = (usuario) => {
    setModoEdicion(true);
    setIdUsuarioEditar(usuario.id || usuario.id_usuario);
    const ap = usuario.apellidos || usuario.apellido || '';
    const nom = usuario.nombres || usuario.nombre || '';

    const docEncontrado = tiposDocumento.find(
      (d) => d.nombre_corto === usuario.tipoDocumento || d.id_tipo_documento === usuario.idTipoDocumento
    );

    const rawFecha = usuario.fechaNacimiento || usuario.fecha_nacimiento || '';
    const fechaFormatted = rawFecha ? rawFecha.split('T')[0] : '';

    setFormData({
      apellido: ap,
      nombre: nom,
      nombreAMostrar: usuario.nombreAMostrar || usuario.nombre_mostrar || `${ap}, ${nom}`,
      sexo: usuario.id_sexo !== null && usuario.id_sexo !== undefined ? String(usuario.id_sexo) : '',
      idTipoDocumento: docEncontrado ? String(docEncontrado.id_tipo_documento) : (usuario.idTipoDocumento || usuario.id_tipo_documento || ''),
      tipoDocumento: usuario.tipoDocumento || (docEncontrado ? docEncontrado.nombre_corto : ''),
      numeroDocumento: usuario.numeroDocumento || usuario.numero_documento || '',
      fechaNacimiento: fechaFormatted,
      telefono: usuario.telefono || usuario.telefonos || '',
      usuario: usuario.usuario || usuario.username || '',
      email: usuario.email || '',
      imagenUrl: usuario.imagen || usuario.foto || usuario.imagen_path || '',
      idTipoUsuario: usuario.idTipoUsuario || usuario.idtipousuario || '',
      activo: usuario.activo !== undefined ? Boolean(usuario.activo) : true,
      password: '',
      confirmPassword: '',
      idLocalidadNacimiento: usuario.id_localidad_nacimiento || usuario.idLocalidadNacimiento || '',
      idLocalidadResidencia: usuario.id_localidad_residencia || usuario.idLocalidadResidencia || '',
      idNacionalidad: usuario.id_nacionalidad || usuario.idNacionalidad || '',
      id_persona: usuario.id_persona,
      id_usuario: usuario.id_usuario || usuario.id
    });

    setPreviewLocalUrl(null);
    setVerPassword(false);
    setError(null);
    setMostrarModal(true);
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setError(null);

    // 1. CONTROL PREVIO FRONTEND: Validar usuario duplicado
    const usernameIngresado = (formData.usuario || '').trim().toLowerCase();
    const existeUsuario = usuarios.some((u) => {
      const idExistente = u.id || u.id_usuario;
      const nombreUsuarioExistente = (u.usuario || u.username || '').toLowerCase();
      if (modoEdicion && String(idExistente) === String(idUsuarioEditar)) {
        return false;
      }
      return nombreUsuarioExistente === usernameIngresado;
    });

    if (existeUsuario) {
      const mensaje = `El nombre de usuario "${formData.usuario}" ya existe. Por favor elija otro.`;
      showError(mensaje);
      setError(mensaje);
      return;
    }

    // 2. CONTROL PREVIO FRONTEND: Validar DNI duplicado
    if (!esTutorEnEdicion && formData.numeroDocumento) {
      const docIngresado = (formData.numeroDocumento || '').toString().trim();
      const existeDoc = usuarios.some((u) => {
        const idExistente = u.id || u.id_usuario;
        const docExistente = (u.numeroDocumento || u.numero_documento || '').toString().trim();
        if (modoEdicion && String(idExistente) === String(idUsuarioEditar)) {
          return false;
        }
        return docExistente === docIngresado;
      });

      if (existeDoc) {
        const mensaje = `El número de documento "${formData.numeroDocumento}" ya pertenece a otro usuario registrado.`;
        showError(mensaje);
        setError(mensaje);
        return;
      }
    }

    // 3. Validar contraseñas
    if (!modoEdicion || formData.password.trim() !== '') {
      if (formData.password.length < 4) {
        const mensaje = 'La contraseña debe tener al menos 4 caracteres.';
        showWarning(mensaje);
        setError(mensaje);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        const mensaje = 'Las contraseñas no coinciden.';
        showWarning(mensaje);
        setError(mensaje);
        return;
      }
    }

    setLoading(true);

    try {
      let rutaFinalImagen = formData.imagenUrl;

      if (archivoImagen) {
        const dataForm = new FormData();
        dataForm.append('imagen', archivoImagen);

        const resUpload = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/upload-imagen`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` },
          body: dataForm
        });

        const dataUpload = await resUpload.json();
        if (!resUpload.ok) throw new Error(dataUpload.error || 'Error al subir la imagen');
        rutaFinalImagen = dataUpload.path; 
      }

      const payload = {
        id_persona: formData.id_persona,
        id_usuario: formData.id_usuario,
        apellido: formData.apellido,
        nombre: formData.nombre,
        nombreAMostrar: formData.nombreAMostrar,
        id_sexo: formData.sexo ? Number(formData.sexo) : null,
        idTipoDocumento: formData.idTipoDocumento,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        fechaNacimiento: formData.fechaNacimiento || null,
        telefono: formData.telefono,
        usuario: formData.usuario.trim(),
        email: formData.email,
        imagenUrl: rutaFinalImagen,
        idTipoUsuario: formData.idTipoUsuario,
        activo: Boolean(formData.activo),
        id_localidad_nacimiento: formData.idLocalidadNacimiento ? Number(formData.idLocalidadNacimiento) : null,
        id_localidad_residencia: formData.idLocalidadResidencia ? Number(formData.idLocalidadResidencia) : null,
        id_nacionalidad: formData.idNacionalidad ? Number(formData.idNacionalidad) : null
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      const url = modoEdicion
        ? `${process.env.REACT_APP_API_URL}/api/usuarios/${idUsuarioEditar}`
        : `${process.env.REACT_APP_API_URL}/api/usuarios`;
      
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = typeof data === 'string' ? data : JSON.stringify(data);
        if (errorText.includes('usuarios_usuario_key') || errorText.includes('already exists') || errorText.includes('23505')) {
          throw new Error(`El nombre de usuario "${formData.usuario}" ya está registrado en la base de datos.`);
        }
        throw new Error(data.message || data.error || `Error al ${modoEdicion ? 'editar' : 'guardar'} el usuario`);
      }

      if (!modoEdicion && data.personaExistia) {
        showSuccess('Usuario creado correctamente (asociado a una persona ya existente).');
      } else {
        showSuccess(`Usuario ${modoEdicion ? 'actualizado' : 'creado'} correctamente`);
      }

      handleCerrarModal();
      fetchUsuarios();

    } catch (error) {
      console.error("Error en frontend:", error);
      let mensajeReal = error.message || 'Ocurrió un error al procesar la solicitud.';

      if (mensajeReal.includes('usuarios_usuario_key') || mensajeReal.includes('already exists') || mensajeReal.includes('23505')) {
        mensajeReal = `El nombre de usuario "${formData.usuario}" ya está registrado. Por favor elija uno diferente.`;
      }

      showError(mensajeReal);
      setError(mensajeReal);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTutor = (idPersona) => {
    if (!idPersona) return;
    if (selectedTutores.includes(idPersona)) {
      setSelectedTutores(selectedTutores.filter((tutorId) => tutorId !== idPersona));
    } else {
      setSelectedTutores([...selectedTutores, idPersona]);
    }
  };

  const handleSelectAllTutores = (e) => {
    if (e.target.checked) {
      const ids = tutoresFiltrados
        .map((t) => getTutorId(t))
        .filter((id) => id !== undefined && id !== null);
      setSelectedTutores(ids);
    } else {
      setSelectedTutores([]);
    }
  };

  const handleProcesarTutores = async () => {
    const confirmado = await showConfirm({
      title: '⚠️ ¡Atención!',
      text: 'Va a generar usuarios para los tutores seleccionados. ¿Desea continuar?',
      confirmButtonText: 'Sí, procesar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmado?.isConfirmed) return;    

    Swal.fire({
      title: 'Procesando usuarios...',
      text: 'Por favor espera un momento...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); }
    });

    if (selectedTutores.length === 0) {
      showWarning('Por favor selecciona al menos un allegado/tutor para procesar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/tutores-sin-usuario/procesar`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ tutoresIds: selectedTutores.filter(Boolean) })
      });

      if (!res.ok) throw new Error('Error al procesar los usuarios');

      showSuccess('Usuarios generados exitosamente');
      avisar.exito('Usuarios generados exitosamente');
      setSelectedTutores([]);
      fetchTutoresSinUsuario();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudieron procesar los usuarios'
      });
      avisar.error('No se pudieron procesar los usuarios');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full box-border h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:bg-gray-100/80 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1 tracking-wide";

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {modoTutores ? 'Allegados/Tutores Pendientes' : 'Gestión de Usuarios (ABM)'}
        </h1>

        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer select-none">
            <span className="mr-3 text-sm font-medium text-gray-700">
              Ver tutores/allegados sin usuario
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={modoTutores}
                onChange={(e) => setModoTutores(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-14 h-8 rounded-full transition-colors ${modoTutores ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${modoTutores ? 'transform translate-x-6' : ''}`}></div>
            </div>
          </label>

          {!modoTutores && (
            <button
              onClick={handleAbrirAlta}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2 text-sm"
            >
              <span>+</span> Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {error && !mostrarModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PANEL DE BÚSQUEDA Y FILTROS */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                modoTutores
                  ? "Buscar por Apellido, Nombre o DNI..."
                  : "Buscar por Apellido, Nombre, DNI o Usuario..."
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          {!modoTutores && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    filtroEstado === 'todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroEstado('activos')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    filtroEstado === 'activos' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setFiltroEstado('inactivos')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    filtroEstado === 'inactivos' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inactivos
                </button>
              </div>

              <div>
                <select
                  value={filtroTipoUsuario}
                  onChange={(e) => setFiltroTipoUsuario(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="todos">Todos los Tipos</option>
                  {tiposUsuario.map((tipo) => (
                    <option key={tipo.idtipousuario || tipo.id} value={tipo.idtipousuario || tipo.id}>
                      {tipo.tipousuario || tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      {!modoTutores ? (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="w-[8%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="w-[14%] px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="w-[10%] px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="w-[18%] px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="w-[8%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Doc.</th>
                <th className="w-[10%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Nro. Doc.</th>
                <th className="w-[8%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Usr.</th>
                <th className="w-[6%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="w-[6%] px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-8 text-gray-500">Cargando usuarios...</td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-gray-500">
                    No se encontraron usuarios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const tipoNombre = u.tipousuario || u.tipoUsuario || 'N/A';
                  const fotoUrl = getImageUrl(u.imagen || u.foto || u.imagen_path);

                  return (
                    <tr key={u.id || u.id_usuario} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-2 py-2 text-center align-middle">
                        <div className="w-9 h-9 mx-auto rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shadow-xs">
                          {fotoUrl ? (
                            <img src={fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 font-medium truncate">{u.apellidos || u.apellido}</td>
                      <td className="px-2 py-3 text-xs text-gray-900 truncate">{u.nombres || u.nombre}</td>
                      <td className="px-2 py-3 text-xs text-indigo-600 font-medium truncate">{u.usuario || u.username}</td>
                      <td className="px-2 py-3 text-xs text-gray-500 truncate" title={u.email}>{u.email}</td>
                      <td className="px-2 py-3 text-xs text-center text-gray-700">{u.tipoDocumento}</td>            
                      <td className="px-2 py-3 text-xs text-center text-gray-700">{u.numeroDocumento || u.numero_documento}</td>
                      <td className="px-2 py-3 text-center text-xs align-middle">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold rounded-full border ${getColorTipoUsuario(tipoNombre)}`}>
                          {tipoNombre}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs text-center align-middle">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          u.activo !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs text-center align-middle">
                        <button
                          onClick={() => handleAbrirEdicion(u)}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold transition"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VISTA TUTORES SIN USUARIO */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              Seleccionados: <strong className="text-indigo-600">{selectedTutores.length}</strong> de {tutoresFiltrados.length}
            </span>
            <button
              onClick={handleProcesarTutores}
              disabled={selectedTutores.length === 0 || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              Procesar Usuarios Seleccionados
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50/70">
                <tr>
                  <th className="px-6 py-3 text-left w-[8%]">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllTutores}
                      checked={
                        tutoresFiltrados.length > 0 &&
                        selectedTutores.length === tutoresFiltrados.length
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Apellido</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Doc.</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nro. Doc.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-6">Cargando tutores...</td></tr>
                ) : tutoresFiltrados.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-6 text-gray-500">No hay allegados/tutores pendientes.</td></tr>
                ) : (
                  tutoresFiltrados.map((t, idx) => {
                    const tutorId = getTutorId(t) ?? `temp-key-${idx}`;
                    const isSelected = selectedTutores.includes(tutorId);

                    return (
                      <tr 
                        key={tutorId} 
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTutor(tutorId)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-900 font-medium">{t.apellidos}</td>
                        <td className="px-3 py-3 text-xs text-gray-900">{t.nombres}</td>
                        <td className="px-3 py-3 text-xs text-gray-700">
                          {t.tipoDocumento || t.tipo_documento || 'DNI'}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-700">
                          {t.numeroDocumento || t.numero_documento}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO ALTA / EDICIÓN CON ANCHO FIJO Y ESPACIOSO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl min-[680px]:min-w-[700px] max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
                <p className="text-xs text-gray-500">
                  {modoEdicion ? 'Modifique los datos del usuario.' : 'Complete los datos requeridos para dar de alta un usuario.'}
                </p>
              </div>
              <button
                onClick={handleCerrarModal}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Banner Tutor */}
              {esTutorEnEdicion && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5 shadow-xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-900">Edición en modo Tutor:</span>
                    <span>Los datos filiatorios están protegidos. Solo se permite actualizar la <strong>foto de perfil</strong>, cambiar la <strong>contraseña</strong> y modificar el <strong>estado (activo/inactivo)</strong>.</span>
                  </div>
                </div>
              )}

              {/* Banner de Error opcional en el modal */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="usuario-form" onSubmit={handleGuardarUsuario} className="space-y-6">
                
                {/* 1. DATOS PERSONALES */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Información Personal</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start pt-1">
                    {/* Foto de Perfil */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-2 border-indigo-100 flex items-center justify-center relative shadow-sm group">
                        {previewLocalUrl ? (
                          <img src={previewLocalUrl} alt="Vista previa" className="w-full h-full object-cover" />
                        ) : formData.imagenUrl ? (
                          <img src={getImageUrl(formData.imagenUrl)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                      >
                        <Camera size={14} /> Cambiar Foto
                      </button>
                    </div>

                    {/* Nombres */}
                    <div className="flex-1 w-full space-y-3 min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                        <div className="min-w-0">
                          <label className={labelClass}>Apellido *</label>
                          <input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleInputChange}
                            required
                            disabled={esTutorEnEdicion}
                            className={inputClass}
                          />
                        </div>
                        <div className="min-w-0">
                          <label className={labelClass}>Nombre *</label>
                          <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            required
                            disabled={esTutorEnEdicion}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <label className={labelClass}>Nombre a Mostrar</label>
                        <input
                          type="text"
                          name="nombreAMostrar"
                          value={formData.nombreAMostrar}
                          onChange={handleInputChange}
                          disabled={esTutorEnEdicion}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documento y Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="min-w-0">
                      <label className={labelClass}>Tipo Documento</label>
                      <select
                        name="idTipoDocumento"
                        value={formData.idTipoDocumento}
                        onChange={handleSelectTipoDocumento}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar...</option>
                        {tiposDocumento.map((doc) => (
                          <option key={doc.id_tipo_documento} value={doc.id_tipo_documento}>
                            {doc.nombre_corto || doc.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>Número Documento</label>
                      <input
                        type="text"
                        name="numeroDocumento"
                        value={formData.numeroDocumento}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label className={labelClass}>Fecha Nacimiento</label>
                      <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      />
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>Sexo</label>
                      <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar...</option>
                        {tiposSexo.map((s) => (
                          <option key={s.id_sexo || s.id} value={s.id_sexo || s.id}>
                            {s.descripcion || s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    <div className="min-w-0">
                      <label className={labelClass}>Teléfono</label>
                      <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      />
                    </div>
                    
                    
                    <div className="min-w-0">
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      />
                    </div>

                  </div>
           

                {/* 2. UBICACIÓN Y ORIGEN */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Origen y Residencia</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 min-w-0">
                      <label className={labelClass}>Nacionalidad</label>
                      <select
                        name="idNacionalidad"
                        value={formData.idNacionalidad}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar nacionalidad...</option>
                        {nacionalidades.map((nac) => (
                          <option key={nac.id_nacionalidad || nac.id} value={nac.id_nacionalidad || nac.id}>
                            {nac.descripcion || nac.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>Localidad Nacimiento</label>
                      <select
                        name="idLocalidadNacimiento"
                        value={formData.idLocalidadNacimiento}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar localidad...</option>
                        {localidades.map((loc) => (
                          <option key={loc.id_localidad || loc.id} value={loc.id_localidad || loc.id}>
                            {loc.nombre || loc.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>Localidad Residencia</label>
                      <select
                        name="idLocalidadResidencia"
                        value={formData.idLocalidadResidencia}
                        onChange={handleInputChange}
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar localidad...</option>
                        {localidades.map((loc) => (
                          <option key={loc.id_localidad || loc.id} value={loc.id_localidad || loc.id}>
                            {loc.nombre || loc.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. CREDENCIALES Y ROL */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Acceso y Cuenta</h3>
                  </div>

                    <div className="min-w-0">
                      <label className={labelClass}>Usuario *</label>
                      <input
                        type="text"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleInputChange}
                        required
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Contraseñas con contenedor relativo de ancho rígido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label className={labelClass}>
                        {modoEdicion ? 'Contraseña (vacío para mantener)' : 'Contraseña *'}
                      </label>
                      <div className="relative w-full">
                        <input
                          type={verPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!modoEdicion}
                          className={`${inputClass} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setVerPassword(!verPassword)}
                          className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                        >
                          {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <label className={labelClass}>
                        {modoEdicion ? 'Contraseña (vacío para mantener)' : 'Contraseña *'}
                      </label>
                      <input
                        type={verPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required={!modoEdicion && Boolean(formData.password)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <label className={labelClass}>Tipo de Usuario *</label>
                      <select
                        name="idTipoUsuario"
                        value={formData.idTipoUsuario}
                        onChange={handleInputChange}
                        required
                        disabled={esTutorEnEdicion}
                        className={inputClass}
                      >
                        <option value="">Seleccionar tipo...</option>
                        {tiposUsuario.map((tipo) => (
                          <option key={tipo.idtipousuario || tipo.id} value={tipo.idtipousuario || tipo.id}>
                            {tipo.tipousuario || tipo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado Activo / Inactivo */}
                    <div className="min-w-0">
                      <label className={labelClass}>Estado</label>
                      <select
                        name="activo"
                        value={formData.activo ? 'true' : 'false'}
                        onChange={handleInputChange}
                        className={inputClass}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer con botones */}
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCerrarModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="usuario-form"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Guardando...' : modoEdicion ? 'Actualizar Usuario' : 'Guardar Usuario'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ABMUsuarios;