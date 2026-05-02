import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Home from "./Home";
//import ItemPersona from "./components/ItemPersona";
import ItemListContainerPersona from "./components/ItemListContainerPersonas";
import ItemPersonaDetail from "./components/ItemPersonaDetail"
import Login from "./Login";

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

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onLogin={login} />}
        />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/"
          element={
            isAuth ? <Home onLogout={logout} /> : <Navigate to="/login" />
          }
        >
          <Route index element={<div>Sistema de Gestión de Escuelas</div>} />

          {/* Personas */}
          <Route path="personas">
            <Route path="abm" element={<ItemListContainerPersona />} />
            <Route path="gestion" element={<GestionAlumnos />} />
            <Route exact path="/personas/:id" element={<ItemPersonaDetail/>}/>
          </Route>

          {/* Otras tabs */}
          <Route path="tutor" element={<div>Contenido Tutor</div>} />
          <Route path="gestion" element={<div>Contenido Gestión</div>} />
          <Route path="reportes" element={<div>Contenido Reportes</div>} />
          <Route path="admin" element={<div>Contenido Admin</div>} />
        </Route>

        {/* Cualquier otra ruta */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

  );
}

export default App;