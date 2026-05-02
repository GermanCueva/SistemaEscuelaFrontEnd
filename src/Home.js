import React, { useState } from "react";
import ItemPersona from "./components/ItemPersona";

// Componentes de ejemplo
const GestionAlumnos = () => <div>Gestión Académica</div>;

const Home = () => {
  const [activeTab, setActiveTab] = useState("inicio");
  const [activeSubTab, setActiveSubTab] = useState("abm");

  // 🔹 Tabs principales
  const tabs = {
    inicio: "Inicio",
    personas: "Personas",
    tutor: "Tutor",
    gestion: "Gestión",
    reportes: "Reportes",
    admin: "Administración",
  };

  // 🔹 Subtabs SOLO para Personas
  const subTabsPersonas = {
    abm: <ItemPersona />,
    gestion: <GestionAlumnos />,
  };

  return (
    <div style={styles.container}>
      {/* 🔹 Tabs principales */}
      <div style={styles.tabHeader}>
        {Object.keys(tabs).map((key) => (
          <button
            key={key}
            style={activeTab === key ? styles.activeTab : styles.tab}
            onClick={() => {
              setActiveTab(key);
              setActiveSubTab(null); // reset subtabs
            }}
          >
            {tabs[key]}
          </button>
        ))}
      </div>

      {/* 🔹 Subtabs (solo si es Personas) */}
      {activeTab === "personas" && (
        <div style={styles.subTabHeader}>
  

          <button
            style={activeSubTab === "abm" ? styles.activeSubTab : styles.subTab}
            onClick={() => setActiveSubTab("abm")}
          >
            ABM Personas
          </button>

          <button
            style={
              activeSubTab === "gestion" ? styles.activeSubTab : styles.subTab
            }
            onClick={() => setActiveSubTab("gestion")}
          >
            Gestión académica de alumnos
          </button>
        </div>
      )}


      {/* 🔥 Contenido */}
      <div style={styles.content}>
        {activeTab === "personas" && subTabsPersonas[activeSubTab]}
        {activeTab === "inicio" && <div>Sistema de Gestión de Escuelas</div>}
        {activeTab === "tutor" && <div>Contenido Tutor</div>}
        {activeTab === "gestion" && <div>Contenido Gestión</div>}
        {activeTab === "reportes" && <div>Contenido Reportes</div>}
        {activeTab === "admin" && <div>Contenido Admin</div>}
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

  // 🔹 Subtabs
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
