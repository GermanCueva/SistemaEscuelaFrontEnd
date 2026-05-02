import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Tabs principales (ruta + label)
  const tabs = {
    "/": "Inicio",
    "/personas": "Personas",
    "/tutor": "Tutor",
    "/gestion": "Gestión",
    "/reportes": "Reportes",
    "/admin": "Administración",
  };

  return (
    <div style={styles.container}>
      {/* 🔹 Tabs principales (SIEMPRE visibles) */}
      <div style={styles.tabHeader}>
        {Object.keys(tabs).map((path) => (
          <button
            key={path}
            style={
              location.pathname === path ||
              (path !== "/" && location.pathname.startsWith(path))
                ? styles.activeTab
                : styles.tab
            }
            onClick={() => navigate(path)}
          >
            {tabs[path]}
          </button>
        ))}
      </div>

      {/* 🔹 Subtabs SOLO para Personas */}
      {location.pathname.startsWith("/personas") && (
        <div style={styles.subTabHeader}>
          <button
            style={
              location.pathname === "/personas/abm"
                ? styles.activeSubTab
                : styles.subTab
            }
            onClick={() => navigate("/personas/abm")}
          >
            ABM Personas
          </button>

          <button
            style={
              location.pathname === "/personas/gestion"
                ? styles.activeSubTab
                : styles.subTab
            }
            onClick={() => navigate("/personas/gestion")}
          >
            Gestión académica de alumnos
          </button>
        </div>
      )}

      {/* 🔥 Contenido dinámico */}
      <div style={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "1300px",
    margin: "10px auto",
  },
  tabHeader: {
    display: "flex",
  },
  tab: {
    flex: 1,
    padding: "15px",
    cursor: "pointer",
    backgroundColor: "#eee",
    border: "1px solid #ccc",
  },
  activeTab: {
    flex: 1,
    padding: "15px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "1px solid #ccc",
  },

  subTabHeader: {
    display: "flex",
    marginTop: "10px",
  },
  subTab: {
    flex: 1,
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "#ddd",
    border: "1px solid #bbb",
  },
  activeSubTab: {
    flex: 1,
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "1px solid #bbb",
  },

  content: {
    padding: "20px",
    border: "1px solid #ccc",
    marginTop: "10px",
  },
};

export default Home;