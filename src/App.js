// App.js

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import { jwtDecode } from "jwt-decode";

import Home from "./Home";
import Login from "./Login";

import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";

import logo from "./logoEscuelaTransparente.png";

import "./App.css";

import { LogOut } from "lucide-react";

const GestionAlumnos = () => <div>Gestión Académica</div>;

function App() {
  const [isAuth, setIsAuth] = useState(false);

  const navigate = useNavigate();

  // ==========================================
  // VERIFICAR TOKEN
  // ==========================================
  useEffect(() => {
    const verificarToken = () => {
      const token = localStorage.getItem("token");

      // SIN TOKEN
      if (!token) {
        setIsAuth(false);

        navigate("/login");

        return;
      }

      try {
        // DECODIFICAR JWT
        const decoded = jwtDecode(token);

        console.log(decoded);

        // FECHA ACTUAL
        const now = Date.now() / 1000;

        // TOKEN EXPIRADO
        if (decoded.exp < now) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          localStorage.removeItem("loginTime");

          setIsAuth(false);

          alert("La sesión expiró");

          navigate("/login");

          return;
        }

        // TOKEN VALIDO
        setIsAuth(true);
      } catch (error) {
        console.error(error);

        // TOKEN INVALIDO
        localStorage.clear();

        setIsAuth(false);

        navigate("/login");
      }
    };

    // VERIFICA AL CARGAR
    verificarToken();

    // VERIFICA CADA 5 SEGUNDOS
    const interval = setInterval(verificarToken, 5000);

    // LIMPIEZA
    return () => clearInterval(interval);
  }, [navigate]);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = () => {
    setIsAuth(true);

    navigate("/");
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("loginTime");

    setIsAuth(false);

    navigate("/login");
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <img src={logo} className="App-logo" alt="logo" />

          {isAuth && (
            <button className="logout-button" onClick={logout}>
              <LogOut size={22} />
            </button>
          )}
        </div>

        <p>Bienvenidos al Sistema de Gestión de Escuela Sagrada Familia</p>
      </header>

      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={isAuth ? <Navigate to="/" /> : <Login onLogin={login} />}
        />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            isAuth ? <Home onLogout={logout} /> : <Navigate to="/login" />
          }
        >
          {/* INICIO */}
          <Route index element={<div>Sistema de Gestión de Escuelas</div>} />

          {/* PERSONAS */}
          <Route path="personas">
            <Route path="abm" element={<ItemListContainerPersona />} />

            <Route path="gestion" element={<GestionAlumnos />} />

            <Route path=":id" element={<ItemPersonaDetail />} />
          </Route>

          {/* OTRAS SECCIONES */}
          <Route path="tutor" element={<div>Contenido Tutor</div>} />

          <Route path="gestion" element={<div>Contenido Gestión</div>} />

          <Route path="reportes" element={<div>Contenido Reportes</div>} />

          <Route path="admin" element={<div>Contenido Admin</div>} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
