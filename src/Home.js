import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

// Función para obtener el tipo de usuario desde localStorage o Token
const obtenerTipoUsuario = () => {
  const usuarioStorage = localStorage.getItem("usuario");
  if (usuarioStorage) {
    try {
      const usuarioObj = JSON.parse(usuarioStorage);
      if (usuarioObj.idtipoUsuario !== undefined) {
        return Number(usuarioObj.idtipoUsuario);
      }
    } catch (error) {
      console.error("Error al leer usuario de localStorage:", error);
    }
  }

  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      const tipo = payload.idtipoUsuario ?? payload.id_tipo_usuario ?? payload.idtipousuario;
      return Number(tipo);
    } catch (error) {
      console.error("Error al decodificar token:", error);
    }
  }

  return null;
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tipoUsuario = obtenerTipoUsuario();

  // 1. Solapa principal usando /administracion
  const todosLosTabs = [
    { path: "/", label: "Inicio" },
    { path: "/personas", label: "Personas" },
    { path: "/gestion", label: "Gestión de Pagos" },
    { path: "/tutor", label: "Tutor" },
    { path: "/reportes", label: "Reportes" },
    { path: "/administracion", label: "Administración" },
  ];

  // 2. Filtrado de solapas según el tipo de usuario
  const tabsVisibles = todosLosTabs.filter((tab) => {
    if (tipoUsuario === 1) {
      return true; // Tipo 1 (Admin): Muestra TODAS
    }
    if (tipoUsuario === 2) {
      return tab.path !== "/administracion"; // Tipo 2 (Operador): Muestra todo MENOS Administración
    }
    if (tipoUsuario === 3) {
      return tab.path === "/tutor"; // Tipo 3 (Tutor): Muestra SOLO Tutor
    }
    return tab.path !== "/administracion";
  });

  const isTabActive = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 my-4 min-w-0">
      {/* 🔹 Tabs principales */}
      <div className="flex overflow-x-auto whitespace-nowrap rounded-t-lg border border-gray-300 bg-gray-100 divide-x divide-gray-300 scrollbar-thin">
        {Object.keys(tabs).map((path) => {
          const active = isTabActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 min-w-max px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors text-center ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 🔹 Subtabs Personas */}
      {location.pathname.startsWith("/personas") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300 scrollbar-thin">
          {[
            { path: "/personas/abm", label: "ABM Personas" },
            { path: "/personas/alumnos", label: "Alumnos" },
            { path: "/personas/tutores", label: "Tutores" },
          ].map((sub) => {
            const active = location.pathname === sub.path;
            return (
              <button
                key={sub.path}
                onClick={() => navigate(sub.path)}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                  active
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-300"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 🔹 Subtabs Gestión */}
      {location.pathname.startsWith("/gestion") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300 scrollbar-thin">
          {[
            { path: "/gestion/cargos", label: "Generar Cargos a Alumnos" },
            { path: "/gestion/pagosmanual", label: "Alta manual de Pagos" },
            { path: "/gestion/pagosmasiva", label: "Alta masiva de Pagos" },
            { path: "/gestion/actualizarimporte", label: "Actualizar importe cuotas" },
            { path: "/gestion/generacionarchivosdebito", label: "Generación Archivos de Débito" },
          ].map((sub) => {
            const active = location.pathname === sub.path;
            return (
              <button
                key={sub.path}
                onClick={() => navigate(sub.path)}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                  active
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-300"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 🔹 Subtabs Administración */}
      {location.pathname.startsWith("/admin") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300 scrollbar-thin">
          {[
            { path: "/administracion/instituciones", label: "ABM de Instituciones" },
            { path: "/administracion/usuarios", label: "Gestión de Usuarios" },
            { path: "/administracion/parametros", label: "Parámetros" },
          ].map((sub) => {
            const active = location.pathname === sub.path;
            return (
              <button
                key={sub.path}
                onClick={() => navigate(sub.path)}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                  active
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-300"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 🔥 Contenido dinámico */}
      <div className="p-4 sm:p-6 border-x border-b border-gray-300 rounded-b-lg bg-white shadow-sm min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default Home;