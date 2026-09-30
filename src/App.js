import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./Home";
import Login from "./Login";

import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";
import ItemListContainerAlumnos from "./components/ItemListContainerAlumnos";
import ItemListContainerTutores from "./components/ItemListContainerTutores";
import ItemListContainerAlumnosPagos from "./components/ItemListContainerAlumnosPagos";
import ItemPagos from "./components/ItemPagos";
import ItemGeneracionDebito from "./components/ItemGeneracionDebito";
import ItemGestionPagoMasivo from "./components/ItemGestionPagoMasivo";
import ItemGenerarCargosAlumnos from "./components/ItemGenerarCargosAlumnos";
import ItemActualizarImporteCuotas from "./components/ItemActualizarImporteCuotas";
import ABMUsuarios from  "./components/ItemABMUsuarios";
import ItemTutorMisAlumnos from "./components/ItemTutorMisAlumnos";
import ItemPerfilUsuario from "./components/ItemPerfilUsuario";

import { useAuth } from "./context/AuthContext";

import "./App.css";

import { LogOut } from "lucide-react";

const GestionPagos = () => <div>Gestión de Pagos</div>;
const Administracion = () => <div>Administracion</div>;

const logo = "logoEscuelaTransparente.ico";

function App() {
  const [escuelaInfo, setEscuelaInfo] = useState({
    nombre: "Escuela Sagrada Familia",
    logo: logo,
  });

  const navigate = useNavigate();
  const { user, isAuth, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let meta = document.querySelector("meta[name='viewport']");
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0';
  }, []);

  // Cerrar menú al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // VERIFICAR TOKEN E INACTIVIDAD
  useEffect(() => {
    let inactivityTimeout;

    const cerrarSesion = (mensaje) => {
      logout();
      alert(mensaje);
      navigate("/login");
    };

    const verificarToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          cerrarSesion("La sesión expiró");
          return;
        }
      } catch (error) {
        console.error(error);
        cerrarSesion("Token inválido");
      }
    };

    const reiniciarTemporizador = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        cerrarSesion("La sesión expiró por inactividad");
      }, 60 * 1000);
    };

    verificarToken();
    const interval = setInterval(verificarToken, 5000);

    window.addEventListener("mousemove", reiniciarTemporizador);
    window.addEventListener("click", reiniciarTemporizador);
    window.addEventListener("keydown", reiniciarTemporizador);
    window.addEventListener("scroll", reiniciarTemporizador);

    reiniciarTemporizador();

    return () => {
      clearInterval(interval);
      clearTimeout(inactivityTimeout);
      window.removeEventListener("mousemove", reiniciarTemporizador);
      window.removeEventListener("click", reiniciarTemporizador);
      window.removeEventListener("keydown", reiniciarTemporizador);
      window.removeEventListener("scroll", reiniciarTemporizador);
    };
  }, [logout, navigate]);

  // Petición a la BD cuando la App se monta
  useEffect(() => {
    if (isAuth) {
      const token = localStorage.getItem("token");

      fetch(`${process.env.REACT_APP_API_URL}/api/escuela`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setEscuelaInfo({
            nombre: data.entidadeducativa,
            logo: data.logo,
          });
        })
        .catch((err) => {
          console.error("Error al obtener datos de la escuela:", err);
          setEscuelaInfo({
            nombre: "Escuela Sagrada Familia",
            logo: logo,
          });
        });
    }
  }, [isAuth]);

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const formatNombreUsuario = () => {
    if (!user) return "Usuario";
    const ap = user.apellidos || "";
    const nom = user.nombres || user.nombre || "";
    const nombreCompleto = [ap, nom].filter(Boolean).join(", ");
    const username = user.usuario || "Usuario";
    return nombreCompleto ? `${username} (${nombreCompleto})` : username;
  };

  return (
    /* Se quitan paddings laterales exteriores para permitir ancho 100% real */
    <div className="w-full min-h-screen overflow-x-hidden bg-slate-50">
      <div className="min-h-screen flex flex-col text-gray-800 font-sans">
        
        {/* HEADER RESPONSIVE 100% ANCHO */}
        <header className="bg-[#8a909c] text-white shadow-md relative z-20 px-4 py-3 sm:px-6 w-full">
          <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center">
              <img
                src={escuelaInfo.logo}
                className="h-12 w-auto max-h-16 object-contain"
                alt="logo"
              />
            </div>

            {/* Título de bienvenida */}
            <p className="text-center font-medium text-sm sm:text-base md:text-lg flex-1 min-w-[200px] px-2">
              Bienvenidos al Sistema de Gestión de {escuelaInfo.nombre}
            </p>

            {/* Controles de Usuario y Logout */}
            {isAuth && (
              <div className="flex items-center gap-2">
                {/* Botón y Dropdown de Usuario */}
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer max-w-[320px]"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    title={formatNombreUsuario()}
                  >
                    {user?.imagen ? (
                      <img
                        src={getImageUrl(user.imagen)}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full object-cover border border-white/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {(user?.usuario || "U").substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate">{formatNombreUsuario()}</span>
                    <span className="text-xs">▼</span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                      <div className="px-4 py-2.5 border-b border-gray-100 text-xs text-gray-500">
                        Usuario: <span className="font-semibold text-gray-800 block truncate">{formatNombreUsuario()}</span>
                      </div>

                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/perfil");
                        }}
                      >
                        Editar perfil
                      </button>

                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100 cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                          navigate("/login");
                        }}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Botón directo de Logout visible */}
                <button
                  type="button"
                  title="Cerrar sesión"
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
{/* El fondo (w-full) ocupa el 100%, pero el contenido interno se reduce al 92% gracias al 4% de margen interno a cada lado */}
        <main className="flex-1 w-full px-[4%] py-4">            
          <Routes>
            {/* LOGIN */}
            <Route
              path="/login"
              element={isAuth ? <Navigate to="/" replace /> : <Login />}
            />

            {/* RUTAS PROTEGIDAS */}
            <Route
              path="/"
              element={isAuth ? <Home /> : <Navigate to="/login" replace />}
            >
              <Route index element={<div className="text-xl font-bold text-gray-700 text-center py-6">Sistema de Gestión de Escuelas</div>} />

              <Route path="personas">
                <Route path="abm" element={<ItemListContainerPersona />} />
                <Route path="alumnos" element={<ItemListContainerAlumnos />} />
                <Route path="tutores" element={<ItemListContainerTutores />} />
                <Route path="alta" element={<ItemPersonaDetail />} />
                <Route path=":id" element={<ItemPersonaDetail />} />
              </Route>

              <Route path="gestion">
                <Route path="cargos" element={<ItemGenerarCargosAlumnos />} />
                <Route path="pagosmanual" element={<ItemListContainerAlumnosPagos />} />
                <Route path="pagosmasiva" element={<ItemGestionPagoMasivo />} />
                <Route path="actualizarimporte" element={<ItemActualizarImporteCuotas />} />
                <Route path="generacionarchivosdebito" element={<ItemGeneracionDebito />} />
                <Route path="SaldoAlumno/:id_alumno" element={<ItemPagos />} />
              </Route>

              <Route path="administracion">
                <Route path="instituciones" element={<Administracion />} />
                <Route path="usuarios" element={<ABMUsuarios />} />
                <Route path="parametros" element={<Administracion />} />
                <Route path="cargos" element={<GestionPagos />} />
                <Route path="pagosmanual" element={<ItemListContainerAlumnosPagos />} />
                <Route path="pagosmasiva" element={<ItemGestionPagoMasivo />} />
                <Route path="actualizarimporte" element={<GestionPagos />} />
                <Route path="generacionarchivosdebito" element={<ItemGeneracionDebito />} />
              </Route>

              <Route path="perfil" element={<ItemPerfilUsuario />} />
              <Route path="tutor" element={<ItemTutorMisAlumnos />} />
              <Route path="reportes" element={<div>Contenido Reportes</div>} />
              <Route path="admin" element={<div>Contenido Admin</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <ToastContainer />
      </div>
    </div>
  );
}

export default App;