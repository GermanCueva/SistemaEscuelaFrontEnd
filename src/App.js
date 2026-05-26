// App.js

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import { jwtDecode } from "jwt-decode";

import Home from "./Home";
import Login from "./Login";

import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";
import ItemPersonaDetailAlta from "./components/ItemPersonaDetailAlta";


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
  // ==========================================
// VERIFICAR TOKEN + INACTIVIDAD
// ==========================================
useEffect(() => {

  let inactivityTimeout;

  // ==========================================
  // CERRAR SESION
  // ==========================================
  const cerrarSesion = (
    mensaje = "La sesión expiró"
  ) => {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("loginTime");

    setIsAuth(false);

    alert(mensaje);

    navigate("/login");
  };

  // ==========================================
  // VERIFICAR TOKEN
  // ==========================================
  const verificarToken = () => {

    const token =
      localStorage.getItem("token");

    // SIN TOKEN
    if (!token) {

      setIsAuth(false);

      navigate("/login");

      return;
    }

    try {

      // DECODIFICAR JWT
      const decoded =
        jwtDecode(token);

      console.log(decoded);

      // FECHA ACTUAL
      const now =
        Date.now() / 1000;

      // TOKEN EXPIRADO
      if (decoded.exp < now) {

        cerrarSesion(
          "La sesión expiró"
        );

        return;
      }

      // TOKEN VALIDO
      setIsAuth(true);

    } catch (error) {

      console.error(error);

      cerrarSesion(
        "Token inválido"
      );
    }
  };

  // ==========================================
  // REINICIAR TEMPORIZADOR
  // ==========================================
  const reiniciarTemporizador = () => {

    clearTimeout(
      inactivityTimeout
    );

    inactivityTimeout =
      setTimeout(() => {

        cerrarSesion(
          "La sesión expiró por inactividad"
        );

      }, 1 * 60 * 1000); // 15 MINUTOS
  };

  // ==========================================
  // VERIFICA TOKEN AL CARGAR
  // ==========================================
  verificarToken();

  // ==========================================
  // VERIFICA TOKEN CADA 5 SEGUNDOS
  // ==========================================
  const interval =
    setInterval(
      verificarToken,
      5000
    );

  // ==========================================
  // EVENTOS DE ACTIVIDAD
  // ==========================================
  window.addEventListener(
    "mousemove",
    reiniciarTemporizador
  );

  window.addEventListener(
    "click",
    reiniciarTemporizador
  );

  window.addEventListener(
    "keydown",
    reiniciarTemporizador
  );

  window.addEventListener(
    "scroll",
    reiniciarTemporizador
  );

  // INICIAR TEMPORIZADOR
  reiniciarTemporizador();

  // ==========================================
  // LIMPIEZA
  // ==========================================
  return () => {

    clearInterval(interval);

    clearTimeout(
      inactivityTimeout
    );

    window.removeEventListener(
      "mousemove",
      reiniciarTemporizador
    );

    window.removeEventListener(
      "click",
      reiniciarTemporizador
    );

    window.removeEventListener(
      "keydown",
      reiniciarTemporizador
    );

    window.removeEventListener(
      "scroll",
      reiniciarTemporizador
    );
  };

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

            <Route path="alta" element={<ItemPersonaDetailAlta />} />
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
