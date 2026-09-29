import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  ArrowLeft, 
  Shield, 
  Building2, 
  Mail, 
  IdCard, 
  CheckCircle2, 
  AlertCircle,
  Trash2
} from "lucide-react";
import { showSuccess, showError, showWarning } from "../utils/alerts";

const ItemPerfilUsuario = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estados de perfil
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Foto de perfil
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewLocalUrl, setPreviewLocalUrl] = useState(null);
  const [eliminarFoto, setEliminarFoto] = useState(false);

  // Contraseña
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  // Mensajes de error en formulario
  const [errorPassword, setErrorPassword] = useState("");

  const token = localStorage.getItem("token");

  // Helper para construir la URL de imagen del servidor
  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Cargar datos de perfil del usuario logueado
  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/perfil`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener la información del perfil");
      }

      const data = await res.json();
      setPerfil(data);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      // Fallback a los datos en AuthContext si falla el endpoint
      if (user) {
        setPerfil(user);
      }
    } finally {
      setCargando(false);
    }
  }, [token, user]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Manejo de selección de archivo de imagen
  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        showWarning("Archivo no válido", "Por favor seleccione un archivo de imagen (PNG, JPG, WEBP, etc.)");
        return;
      }
      setArchivoImagen(file);
      setPreviewLocalUrl(URL.createObjectURL(file));
      setEliminarFoto(false);
    }
  };

  // Quitar foto seleccionada o marcar para eliminar
  const handleQuitarFoto = () => {
    setArchivoImagen(null);
    if (previewLocalUrl) {
      URL.revokeObjectURL(previewLocalUrl);
      setPreviewLocalUrl(null);
    }
    setEliminarFoto(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validación de contraseña en tiempo real o submit
  const validarPassword = () => {
    if (!password) {
      setErrorPassword("");
      return true;
    }
    if (password.length < 4) {
      setErrorPassword("La contraseña debe tener al menos 4 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorPassword("Las contraseñas ingresadas no coinciden.");
      return false;
    }
    setErrorPassword("");
    return true;
  };

  // Guardar cambios
  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!validarPassword()) {
      showWarning("Contraseña no válida", errorPassword || "Verifique los campos de contraseña.");
      return;
    }

    setGuardando(true);

    try {
      let rutaFinalImagen = perfil?.imagen || "";

      // 1. Si marcó eliminar foto
      if (eliminarFoto) {
        rutaFinalImagen = "";
      }

      // 2. Si seleccionó un nuevo archivo de imagen, subirlo primero
      if (archivoImagen) {
        const formData = new FormData();
        formData.append("imagen", archivoImagen);

        const resUpload = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/upload-imagen`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const dataUpload = await resUpload.json();
        if (!resUpload.ok) {
          throw new Error(dataUpload.error || "Error al subir la imagen de perfil");
        }
        rutaFinalImagen = dataUpload.path;
      }

      // 3. Payload para actualizar perfil (SOLO foto y contraseña)
      const payload = {
        imagenUrl: rutaFinalImagen,
      };

      if (password.trim() !== "") {
        payload.password = password.trim();
      }

      const resUpdate = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/perfil`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const dataUpdate = await resUpdate.json();

      if (!resUpdate.ok) {
        throw new Error(dataUpdate.error || "Error al actualizar el perfil");
      }

      // Actualizar estado local y contexto global
      const usuarioActualizado = dataUpdate.usuario || {
        ...perfil,
        imagen: rutaFinalImagen,
      };

      setPerfil(usuarioActualizado);
      updateUser(usuarioActualizado);

      // Limpiar campos de contraseña y estados temporales de archivo
      setPassword("");
      setConfirmPassword("");
      setArchivoImagen(null);
      setPreviewLocalUrl(null);
      setEliminarFoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await showSuccess("¡Perfil Actualizado!", "Los cambios se guardaron correctamente.");
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      showError("Error al guardar", err.message || "No se pudo actualizar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // Formato del nombre de usuario: usuario (Apellido, Nombre)
  const formatNombreCompleto = () => {
    if (!perfil) return user?.usuario || "Usuario";
    const ap = perfil.apellidos || "";
    const nom = perfil.nombres || perfil.nombre || "";
    const nombreCompleto = [ap, nom].filter(Boolean).join(", ");
    const username = perfil.usuario || user?.usuario || "";
    return nombreCompleto ? `${username} (${nombreCompleto})` : username;
  };

  // Imagen actual a mostrar
  const imagenActual = previewLocalUrl 
    ? previewLocalUrl 
    : (!eliminarFoto && perfil?.imagen ? getImageUrl(perfil.imagen) : null);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium text-sm">Cargando datos del perfil...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-1 sm:px-2 py-4">
      {/* 🔹 ENCABEZADO */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 w-full">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <User className="w-7 h-7 text-blue-400" />
            Edición de Perfil
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Usuario: <span className="font-semibold text-white">{formatNombreCompleto()}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border border-white/15"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <form onSubmit={handleGuardar} className="w-full !max-w-none space-y-6" style={{ maxWidth: '100%' }}>
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start" style={{ width: '100%' }}>
          
          {/* 🔹 COLUMNA IZQUIERDA: FOTO DE PERFIL */}
          <div className="w-full lg:w-80 lg:shrink-0 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 whitespace-nowrap">
              <Camera className="w-4 h-4 text-blue-600" />
              Foto de Perfil
            </h2>

            {/* Contenedor del Avatar */}
            <div className="relative group mb-4">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-100 flex items-center justify-center">
                {imagenActual ? (
                  <img
                    src={imagenActual}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>

              {/* Botón flotante para cambiar foto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
                title="Subir nueva foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Input de archivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSeleccionarArchivo}
              accept="image/*"
              className="hidden"
            />

            <p className="text-xs text-gray-500 mb-4">
              Formatos soportados: JPG, PNG, WEBP.
            </p>

            {/* Botones de acción para la foto */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                {imagenActual ? "Cambiar foto" : "Subir foto"}
              </button>

              {imagenActual && (
                <button
                  type="button"
                  onClick={handleQuitarFoto}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar foto
                </button>
              )}
            </div>

            {previewLocalUrl && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Nueva foto lista para guardar
              </span>
            )}

            {eliminarFoto && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> La foto se eliminará al guardar
              </span>
            )}
          </div>

          {/* 🔹 COLUMNA DERECHA: DATOS Y CAMBIO DE CONTRASEÑA */}
          <div className="flex-1 w-full space-y-6">
            
            {/* 🔒 SECCIÓN DE CONTRASEÑA (EDITABLE) */}
            <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden w-full">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
              
              <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Cambiar Contraseña
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Si no deseas modificar tu contraseña, deja ambos campos vacíos. (Mínimo 4 caracteres)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Nueva Contraseña */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative w-full">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorPassword("");
                      }}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Repetir Contraseña */}
                <div className="w-full">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Repetir Contraseña
                  </label>
                  <div className="relative w-full">
                    <input
                      type={mostrarConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorPassword("");
                      }}
                      placeholder="Repita la nueva contraseña"
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                      title={mostrarConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {mostrarConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensaje de error de contraseñas */}
              {errorPassword && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorPassword}</span>
                </div>
              )}

              {/* Indicador de coincidencia */}
              {password && confirmPassword && password === confirmPassword && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Las contraseñas coinciden correctamente.</span>
                </div>
              )}
            </div>

            {/* 📋 SECCIÓN DE DATOS PERSONALES E INSTITUCIONALES (SOLO LECTURA) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 w-full">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-slate-600" />
                Información de Cuenta (Solo Lectura)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm w-full">
                {/* Nombre de Usuario */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.usuario || ""}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-800 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Apellidos y Nombres */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Apellido y Nombre
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      perfil?.apellidos && perfil?.nombres 
                        ? `${perfil.apellidos}, ${perfil.nombres}` 
                        : (perfil?.nombre || perfil?.apellidos || perfil?.nombres || "-")
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-800 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Documento */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Documento
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.numero_documento ? `${perfil.tipo_documento || 'DNI'}: ${perfil.numero_documento}` : "No registrado"}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Correo Electrónico
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.email || "Sin correo"}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-slate-700 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Tipo de Usuario / Rol */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-gray-400" /> Rol / Tipo de Usuario
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.tipousuario || perfil?.tipoUsuario || "Usuario"}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-purple-800 font-semibold border border-purple-200 rounded-xl cursor-not-allowed"
                  />
                </div>

                {/* Institución Educativa */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> Institución Educativa
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.entidadeducativa || "Institución Educativa"}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 text-blue-800 font-medium border border-blue-200 rounded-xl cursor-not-allowed truncate"
                  />
                </div>
              </div>

              <div className="pt-2 text-xs text-gray-500 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                ℹ️ Por motivos de seguridad institucional, los datos personales, de contacto y de rol son gestionados únicamente por la administración del establecimiento.
              </div>
            </div>

          </div>
        </div>

        {/* 🔹 BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-gray-200 w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={guardando}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemPerfilUsuario;
