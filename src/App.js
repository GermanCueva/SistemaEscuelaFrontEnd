import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from "./Home";
import Login from "./Login";

import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";
import ItemListContainerAlumnos from "./components/ItemListContainerAlumnos";
import ItemListContainerTutores from "./components/ItemListContainerTutores";


import { useAuth } from "./context/AuthContext";

import logo from "./logoEscuelaTransparente.png";
import "./App.css";

import { LogOut } from "lucide-react";

//import ProtectedRoute from "./routes/ProtectedRoute";
//import RoleRoute from "./routes/RoleRoute";

const GestionPagos = () => <div>Gestión de Pagos</div>;

function App() {
  const navigate = useNavigate();

  const { user, isAuth, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const cerrarMenu = () => setMenuOpen(false);

    window.addEventListener("click", cerrarMenu);

    return () => {
      window.removeEventListener("click", cerrarMenu);
    };
  }, []);

  //=====================================
  // VERIFICAR TOKEN
  //=====================================

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

  const menuStyle = {
    width: "100%",
    padding: "10px",
    border: "none",
    background: "white",
    color: "black",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "left",
  };
  
    return (
      
    <div className="App">
      <header
        className="App-header"
        style={{
          overflow: "visible",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="header-top">
          <img src={logo} className="App-logo" alt="logo" />

          {isAuth && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              <button
                className="logout-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
              >
                {user?.usuario || "Usuario"} ▼
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50px",
                    backgroundColor: "white",
                    color: "black",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    width: "180px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    zIndex: 99999,
                    overflow: "hidden",
                  }}
                >
                  <button
                    style={menuStyle}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/perfil");
                    }}
                  >
                    Editar perfil
                  </button>

                  <button
                    style={menuStyle}
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogOut size={18} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p>Bienvenidos al Sistema de Gestión de Escuela Sagrada Familia</p>
      </header>

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
          {/* Inicio */}
          <Route index element={<div>Sistema de Gestión de Escuelas</div>} />

          {/* Personas */}
          <Route path="personas">
            <Route path="abm" element={<ItemListContainerPersona />} />
            <Route path="alumnos" element={<ItemListContainerAlumnos />} />
            <Route path="tutores" element={<ItemListContainerTutores />} /> 
            <Route path="alta" element={<ItemPersonaDetail />} />
            <Route path=":id" element={<ItemPersonaDetail />} />
          </Route>

          {/* Gestión de Pagos */}
          <Route path="gestion">
           <Route path="cargos" element={<GestionPagos />} /> 
            <Route path="pagosmanual" element={<ItemListContainerAlumnos />} />
           <Route path="pagosmasiva" element={<GestionPagos />} /> 
           <Route path="actualizarimporte" element={<GestionPagos />} /> 
          </Route>

          {/* Perfil */}
          <Route path="perfil" element={<div>Editar perfil</div>} />

          {/* Otros módulos */}
          <Route path="gestion" element={<div>Contenido Gestión de Pagos</div>} />
          <Route path="tutor" element={<div>Contenido Tutor</div>} />
          <Route path="reportes" element={<div>Contenido Reportes</div>} />
          <Route path="admin" element={<div>Contenido Admin</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </div>
    
  );
}

export default App;