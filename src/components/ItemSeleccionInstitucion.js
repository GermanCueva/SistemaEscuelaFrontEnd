import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, ChevronRight, LogOut, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ItemSeleccionInstitucion = () => {
  const { user, seleccionarInstitucion, logout } = useAuth();
  const navigate = useNavigate();
  const [seleccionando, setSeleccionando] = useState(null);
  const [error, setError] = useState(null);

  const entidades = user?.entidades || [];

  const handleSeleccionar = async (entidad) => {
    setError(null);
    setSeleccionando(entidad.identidadeducativa);
    try {
      await seleccionarInstitucion(entidad);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error al seleccionar institución:", err);
      setError(err.message);
    } finally {
      setSeleccionando(null);
    }
  };

  const nombreUsuario = (() => {
    const ap = user?.apellidos || "";
    const nom = user?.nombres || "";
    const completo = [ap, nom].filter(Boolean).join(", ");
    return completo || user?.nombre || user?.usuario || "";
  })();

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Seleccioná una institución
        </h1>
        <p className="text-gray-500 mt-2">
          Hola <span className="font-semibold text-gray-700">{nombreUsuario}</span>, tu
          usuario está asociado a más de una institución. Elegí con cuál querés trabajar.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {entidades.map((entidad) => {
          const cargando = seleccionando === entidad.identidadeducativa;
          return (
            <button
              key={entidad.identidadeducativa}
              type="button"
              disabled={seleccionando !== null}
              onClick={() => handleSeleccionar(entidad)}
              className="group flex flex-col items-center text-center bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <div className="w-24 h-24 mb-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {entidad.logo ? (
                  <img
                    src={entidad.logo}
                    alt={entidad.entidadeducativa}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <School className="w-12 h-12 text-blue-500" />
                )}
              </div>

              <h2 className="text-base font-bold text-gray-800 group-hover:text-blue-700 min-h-[3rem] flex items-center">
                {entidad.entidadeducativa}
              </h2>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                {cargando ? (
                  <>
                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ItemSeleccionInstitucion;
