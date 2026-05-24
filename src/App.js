// App.js

import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import Home from "./Home";
import Login from "./Login";

import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";

import logo from "./logoEscuelaTransparente.png";

import "./App.css";

const GestionAlumnos = () => (
  <div>Gestión Académica</div>
);

function App() {

  const [isAuth, setIsAuth] = useState(false);

  // VERIFICA TOKEN AL CARGAR APP
  // VERIFICA TOKEN AL CARGAR APP
useEffect(() => {

  const token =
    localStorage.getItem("token");

  if (!token) {

    setIsAuth(false);

    return;
  }

  try {

    // DECODIFICA JWT
    const decoded =
      jwtDecode(token);

      console.log(decoded)

    // TIEMPO ACTUAL
    const now =
      Date.now() / 1000;

    // TOKEN EXPIRADO
    if (decoded.exp < now) {

      localStorage.removeItem("token");

      localStorage.removeItem("usuario");

      localStorage.removeItem("loginTime");

      setIsAuth(false);

      alert("La sesión expiró");

      return;
    }

    // TOKEN VALIDO
    setIsAuth(true);

  } catch (error) {

    // TOKEN INVALIDO
    localStorage.clear();

    setIsAuth(false);
  }

}, []);

  // LOGIN
  const login = () => {
    setIsAuth(true);
  };

  // LOGOUT
  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("loginTime");

    setIsAuth(false);
  };

  return (

    <div className="App">

      <header className="App-header">

        <img
          src={logo}
          className="App-logo"
          alt="logo"
        />

        <p>
          Bienvenidos al Sistema de Gestión
          de Escuela Sagrada Familia
        </p>

      </header>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            isAuth
              ? <Navigate to="/" />
              : <Login onLogin={login} />
          }
        />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            isAuth
              ? <Home onLogout={logout} />
              : <Navigate to="/login" />
          }
        >

          <Route
            index
            element={
              <div>
                Sistema de Gestión de Escuelas
              </div>
            }
          />

          {/* PERSONAS */}
          <Route path="personas">

            <Route
              path="abm"
              element={<ItemListContainerPersona />}
            />

            <Route
              path="gestion"
              element={<GestionAlumnos />}
            />

            <Route
              path=":id"
              element={<ItemPersonaDetail />}
            />

          </Route>

          {/* OTRAS SECCIONES */}
          <Route
            path="tutor"
            element={<div>Contenido Tutor</div>}
          />

          <Route
            path="gestion"
            element={<div>Contenido Gestión</div>}
          />

          <Route
            path="reportes"
            element={<div>Contenido Reportes</div>}
          />

          <Route
            path="admin"
            element={<div>Contenido Admin</div>}
          />

        </Route>

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

    </div>
  );
}

export default App;