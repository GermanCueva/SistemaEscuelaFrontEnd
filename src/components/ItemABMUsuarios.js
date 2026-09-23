import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  showWarning, showConfirm,
  showSuccess, showError
} from '../utils/alerts';
import Swal from 'sweetalert2';
import { avisar } from '../utils/notificaciones';
import { Eye, EyeOff } from 'lucide-react';

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

  // Helper para construir la URL de la imagen guardada
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  // Caso 1: Si la BD guarda solo el nombre de la foto (ej: "1790080...jpg")
  if (!path.includes('/')) {
    return `${baseUrl}/img/usuarios/${path}`;
  }

  // Caso 2: Si la BD guarda "img/usuarios/...jpg" sin la palabra 'public'
  if (path.startsWith('img/') || path.startsWith('/img/')) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}/${cleanPath}`;
  }

  // Caso 3: Si la BD ya guarda "public/img/usuarios/...jpg"
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/sexo`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener los tipos de sexo');
      const data = await res.json();
      setTiposSexo(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTiposUsuario = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/tipo_usuarios`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener tipos de usuario');
      const data = await res.json();
      setTiposUsuario(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTiposDocumento = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener tipos de documento');
      const data = await res.json();
      setTiposDocumento(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLocalidades = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/localidades`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener las localidades');
      const data = await res.json();
      setLocalidades(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchNacionalidades = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/nacionalidades`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener las nacionalidades');
      const data = await res.json();
      setNacionalidades(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    }
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
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/tutores-sin-usuario`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Error al obtener tutores/allegados');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setTutoresSinUsuario(list);

      const ids = list
        .map((t) => getTutorId(t))
        .filter((id) => id !== undefined && id !== null);

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
      //console.log("Objeto usuario de la API:", u); // <-- Mira esto en la consola F12
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

      return (
        apellido.includes(termino) ||
        nombre.includes(termino) ||
        doc.includes(termino)
      );
    });
  }, [tutoresSinUsuario, busqueda]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
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
    setIdUsuarioEditar(usuario.id);
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
      idTipoDocumento: docEncontrado ? String(docEncontrado.id_tipo_documento) : (usuario.idTipoDocumento || ''),
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
      idNacionalidad: usuario.id_nacionalidad || usuario.idNacionalidad || ''
    });

    setPreviewLocalUrl(null);
    setVerPassword(false);
    setError(null);
    setMostrarModal(true);
  };

const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setError(null);

    if (!modoEdicion || formData.password.trim() !== '') {
      if (formData.password.length < 4) {
        setError('La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setLoading(true);

    try {
      let rutaFinalImagen = formData.imagenUrl;

      // 1. Subida de imagen
      if (archivoImagen) {
        const dataForm = new FormData();
        dataForm.append('imagen', archivoImagen);

        const resUpload = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/upload-imagen`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
          body: dataForm
        });

        const dataUpload = await resUpload.json();
        if (!resUpload.ok) {
          throw new Error(dataUpload.error || 'Error al subir la imagen');
        }
        rutaFinalImagen = dataUpload.path; 
      }

      // 2. Construcción del Payload
      const payload = {
        apellido: formData.apellido,
        nombre: formData.nombre,
        nombreAMostrar: formData.nombreAMostrar,
        id_sexo: formData.sexo ? Number(formData.sexo) : null,
        idTipoDocumento: formData.idTipoDocumento,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        fechaNacimiento: formData.fechaNacimiento || null,
        telefono: formData.telefono,
        usuario: formData.usuario,
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

  // 3. Petición HTTP
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      // ⚠️ PASO CRÍTICO: Primero parseamos el JSON (tanto para éxito como para error 400)
      const data = await res.json();

      // Si el servidor respondió con error (400, 500, etc.)
      if (!res.ok) {
        // Lanzamos el error con el mensaje EXACTO que devolvió la API
        throw new Error(data.error || `Error al ${modoEdicion ? 'editar' : 'guardar'} el usuario`);
      }

      // Si todo salió bien:
      if (!modoEdicion && data.personaExistia) {
        showSuccess('Usuario creado correctamente (asociado a una persona ya existente).');
      } else {
        showSuccess(`Usuario ${modoEdicion ? 'actualizado' : 'creado'} correctamente`);
      }

      handleCerrarModal();
      fetchUsuarios();

} catch (err) {

        Swal.fire({
        icon: 'error',
        title: 'Atención',
        text: err.message,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      });

      console.error("Error capturado en frontend:", err);
      setError(err.message);

      // 🟢 Si tienes una función showError (similar a showSuccess):
      if (typeof showError === 'function') {
        showError(err.message);
      } else {
        // O si usas alert / SweetAlert:
        showError(err.message); 
      }
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

  return (
    <div className="p-6 max-w-full mx-auto font-sans">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition"
            >
              + Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {error && !mostrarModal && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* PANEL DE BÚSQUEDA Y FILTROS */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow space-y-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        //<div className="space-y-4">
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[8%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Foto</th>
                  <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                  <th className="w-[14%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="w-[18%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="w-[8%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo Doc.</th>
                  <th className="w-[10%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nro. Doc.</th>
                  <th className="w-[8%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo Usr.</th>
                  <th className="w-[6%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="w-[6%] px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="10" className="text-center py-6 text-gray-500">Cargando usuarios...</td></tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No se encontraron usuarios con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const tipoNombre = u.tipousuario || u.tipoUsuario || 'N/A';
                    const fotoUrl = getImageUrl(u.imagen || u.foto || u.imagen_path);

                    return (
                      <tr key={u.id || u.id_usuario} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-center align-middle">
                          <div className="w-8 h-8 mx-auto rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center">
                            {fotoUrl ? (
                              <img src={fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-gray-400">Sin foto</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs text-gray-900 truncate">{u.apellidos || u.apellido}</td>
                        <td className="px-2 py-3 text-xs text-gray-900 truncate">{u.nombres || u.nombre}</td>
                        <td className="px-2 py-3 text-xs text-gray-900 font-medium truncate">{u.usuario || u.username}</td>
                        <td className="px-2 py-3 text-xs text-gray-600 truncate" title={u.email}>{u.email}</td>
                        <td className="px-2 py-3 text-xs text-center text-gray-900">{u.tipoDocumento}</td>            
                        <td className="px-2 py-3 text-xs text-center text-gray-900">{u.numeroDocumento || u.numero_documento}</td>
                        <td className="px-2 py-3 text-center text-xs align-middle">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold rounded-full border ${getColorTipoUsuario(tipoNombre)}`}>
                            {tipoNombre}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-center align-middle">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            u.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-center align-middle">
                          <button
                            onClick={() => handleAbrirEdicion(u)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
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
        </div>
      ) : (
        /* VISTA TUTORES SIN USUARIO */
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table style={{ padding: '6px 12px' }} className="table table-xs w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left w-[8%]">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllTutores}
                      checked={
                        tutoresFiltrados.length > 0 &&
                        selectedTutores.length === tutoresFiltrados.length
                      }
                    />
                  </th>
                  <th style={{ padding: '6px 12px' }} className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Apellido</th>
                  <th style={{ padding: '6px 12px' }} className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th style={{ padding: '6px 12px' }} className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Tipo Doc.</th>
                  <th style={{ padding: '6px 12px' }} className="px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase">Nro. Doc.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-4">Cargando tutores...</td></tr>
                ) : tutoresFiltrados.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4">No hay allegados/tutores pendientes.</td></tr>
                ) : (
                  tutoresFiltrados.map((t, idx) => {
                    const tutorId = getTutorId(t) ?? `temp-key-${idx}`;
                    const isSelected = selectedTutores.includes(tutorId);

                    return (
                      <tr 
                        key={tutorId} 
                        style={{ height: '35px', minHeight: '28px' }}
                        className={isSelected ? 'bg-indigo-50' : ''}
                      >
                        <td style={{ padding: '2px 8px', height: '35px', lineHeight: '1' }} className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectTutor(tutorId)}
                          />
                        </td>
                        <td style={{ padding: '2px 8px', height: '35px', lineHeight: '1' }} className="px-3 py-0.5 whitespace-nowrap">{t.apellidos}</td>
                        <td style={{ padding: '2px 8px', height: '35px', lineHeight: '1' }} className="px-3 py-0.5 whitespace-nowrap">{t.nombres}</td>
                        <td style={{ padding: '2px 8px', height: '35px', lineHeight: '1' }} className="px-3 py-0.5 whitespace-nowrap">{t.tipoDocumento}</td>
                        <td style={{ padding: '2px 8px', height: '35px', lineHeight: '1' }} className="px-3 py-0.5 whitespace-nowrap">{t.numeroDocumento || t.numero_documento}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleProcesarTutores}
              disabled={loading || selectedTutores.length === 0}
              className={`px-6 py-2 font-medium text-white rounded-md shadow ${
                selectedTutores.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Procesando...' : `Procesar (${selectedTutores.length})`}
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR USUARIO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-[9999]">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              {/* Foto de Perfil */}
              <div className="flex items-center space-x-4 pb-2 border-b">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center relative">
                  {previewLocalUrl ? (
                    <img src={previewLocalUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  ) : formData.imagenUrl ? (
                    <img src={getImageUrl(formData.imagenUrl)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">Sin foto</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Imagen de Perfil</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Apellido */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    required
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Nombre a Mostrar */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre a Mostrar</label>
                  <input
                    type="text"
                    name="nombreAMostrar"
                    value={formData.nombreAMostrar}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Tipo de Documento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Documento</label>
                  <select
                    name="idTipoDocumento"
                    value={formData.idTipoDocumento}
                    onChange={handleSelectTipoDocumento}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {tiposDocumento.map((doc) => (
                      <option key={doc.id_tipo_documento || doc.id} value={doc.id_tipo_documento || doc.id}>
                        {doc.nombre_corto || doc.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de Documento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número Documento *</label>
                  <input
                    type="text"
                    name="numeroDocumento"
                    required
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {tiposSexo.map((s) => (
                      <option key={s.id_sexo ?? s.id} value={s.id_sexo ?? s.id}>
                        {s.descripcion || s.nombre || s.sexo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Nacionalidad */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <select
                    name="idNacionalidad"
                    value={formData.idNacionalidad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {nacionalidades.map((nac) => (
                      <option key={nac.id_nacionalidad ?? nac.id} value={nac.id_nacionalidad ?? nac.id}>
                        {nac.descripcion || nac.nombre || nac.nacionalidad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Localidad Nacimiento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Localidad de Nacimiento</label>
                  <select
                    name="idLocalidadNacimiento"
                    value={formData.idLocalidadNacimiento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {localidades.map((loc) => (
                      <option key={loc.id_localidad ?? loc.id} value={loc.id_localidad ?? loc.id}>
                        {loc.nombre || loc.descripcion || loc.localidad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Localidad Residencia */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Localidad de Residencia</label>
                  <select
                    name="idLocalidadResidencia"
                    value={formData.idLocalidadResidencia}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {localidades.map((loc) => (
                      <option key={loc.id_localidad ?? loc.id} value={loc.id_localidad ?? loc.id}>
                        {loc.nombre || loc.descripcion || loc.localidad}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    name="usuario"
                    required
                    value={formData.usuario}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Tipo de Usuario */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Usuario *</label>
                  <select
                    name="idTipoUsuario"
                    required
                    value={formData.idTipoUsuario}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Seleccionar --</option>
                    {tiposUsuario.map((t) => (
                      <option key={t.idtipousuario || t.id} value={t.idtipousuario || t.id}>
                        {t.tipousuario || t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado Activo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    name="activo"
                    value={formData.activo ? 'true' : 'false'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>

                {/* CONTRASEÑA (UNA DEBAJO DE LA OTRA) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Contraseña {modoEdicion && '(Dejar en blanco para no cambiar)'}
                  </label>
                  <div className="relative">
                    <input
                      type={verPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setVerPassword(!verPassword);
                      }}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                    >
                      {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* CONFIRMAR CONTRASEÑA (DEBAJO DE LA ANTERIOR) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type={verPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition"
                >
                  {loading ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ABMUsuarios;