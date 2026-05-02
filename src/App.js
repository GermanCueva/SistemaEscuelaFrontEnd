import logo from './logoEscuelaTransparente.png';
import "./App.css";
import Login from "./Login"; // archivo login.js ✔
import Home from "./Home";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import ItemListContainerPersona from './components/ItemListContainerPersonas';
import ItemPersonaDetail from './components/ItemPersonaDetail';
import './App.css';

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
          <Route exact path="/item/:id" element={<ItemPersonaDetail/>}/>  
        </Routes>
      </div>

 );
}

export default App;
