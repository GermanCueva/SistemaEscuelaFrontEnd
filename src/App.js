import logo from "./logo.svg";
import "./App.css";
import Login from "./login"; // archivo login.js ✔
import Home from "./home";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";

function App() {
  return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Bienvenidos al Sistema de Gestión de Escuela Sagrada Familia</p>
        </header>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/Home" element={<Home />} />
        </Routes>
      </div>
  );
}

export default App;
