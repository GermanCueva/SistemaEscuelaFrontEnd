import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = {
    "/": "Inicio",
    "/personas": "Personas",
    "/gestion": "Gestión de Pagos",
    "/tutor": "Tutor",
    "/reportes": "Reportes",
    "/admin": "Administración",
  };

  const isTabActive = (path) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
<div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 my-4">
        {/* 🔹 Tabs principales */}
      <div className="flex overflow-x-auto whitespace-nowrap rounded-t-lg border border-gray-300 bg-gray-100 divide-x divide-gray-300">
        {Object.keys(tabs).map((path) => {
          const active = isTabActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 min-w-max px-4 py-3 text-xs sm:text-sm font-semibold transition-colors text-center ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tabs[path]}
            </button>
          );
        })}
      </div>

      {/* 🔹 Subtabs Personas */}
      {location.pathname.startsWith("/personas") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300">
          {[
            { path: "/personas/abm", label: "ABM Personas" },
            { path: "/personas/alumnos", label: "Alumnos" },
            { path: "/personas/tutores", label: "Tutores" },
          ].map((sub) => (
            <button
              key={sub.path}
              onClick={() => navigate(sub.path)}
              className={`flex-1 min-w-max px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                location.pathname === sub.path
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 hover:bg-gray-300"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* 🔹 Subtabs Gestión */}
      {location.pathname.startsWith("/gestion") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300">
          {[
            { path: "/gestion/cargos", label: "Generar Cargos a Alumnos" },
            { path: "/gestion/pagosmanual", label: "Alta manual de Pagos" },
            { path: "/gestion/pagosmasiva", label: "Alta masiva de Pagos" },
            { path: "/gestion/actualizarimporte", label: "Actualizar importe cuotas" },
            { path: "/gestion/generacionarchivosdebito", label: "Generación Archivos de Débito" },
          ].map((sub) => (
            <button
              key={sub.path}
              onClick={() => navigate(sub.path)}
              className={`flex-1 min-w-max px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                location.pathname === sub.path
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 hover:bg-gray-300"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* 🔹 Subtabs Administración */}
      {location.pathname.startsWith("/admin") && (
        <div className="flex overflow-x-auto whitespace-nowrap border-x border-b border-gray-300 bg-gray-200 divide-x divide-gray-300">
          {[
            { path: "/admin/instituciones", label: "ABM de Instituciones" },
            { path: "/admin/usuarios", label: "Gestión de Usuarios" },
            { path: "/admin/parametros", label: "Parámetros" },
          ].map((sub) => (
            <button
              key={sub.path}
              onClick={() => navigate(sub.path)}
              className={`flex-1 min-w-max px-4 py-2 text-xs sm:text-sm font-medium transition-colors text-center ${
                location.pathname === sub.path
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 hover:bg-gray-300"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* 🔥 Contenido dinámico */}
      <div className="p-4 sm:p-6 border-x border-b border-gray-300 rounded-b-lg bg-white shadow-sm">
        <Outlet />
      </div>
    </div>
  );
};

export default Home;