import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Home from "./Home";
import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail";
import Login from "./Login";
import logo from "./logoEscuelaTransparente.png";
import "./App.css";

const GestionAlumnos = () => <div>Gestión Académica</div>;

function App() {
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("auth") === "true"
  );

  const login = () => {
    localStorage.setItem("auth", "true");
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("auth");
    setIsAuth(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Bienvenidos al Sistema de Gestión de Escuela Sagrada Familia</p>
      </header>

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onLogin={login} />}
        />

        {/* PROTEGIDO */}
        <Route
          path="/"
          element={
            isAuth ? <Home onLogout={logout} /> : <Navigate to="/login" />
          }
        >
          <Route index element={<div>Sistema de Gestión de Escuelas</div>} />

          <Route path="personas">
            <Route path="abm" element={<ItemListContainerPersona />} />
            <Route path="gestion" element={<GestionAlumnos />} />
            <Route path=":id" element={<ItemPersonaDetail />} />
          </Route>

          <Route path="tutor" element={<div>Contenido Tutor</div>} />
          <Route path="gestion" element={<div>Contenido Gestión</div>} />
          <Route path="reportes" element={<div>Contenido Reportes</div>} />
          <Route path="admin" element={<div>Contenido Admin</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </div>
  );
}

export default App;