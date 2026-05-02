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
import logo from './logoEscuelaTransparente.png';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ItemListContainerPersona from './components/ItemListContainerPersonas';
import './App.css';

function App() {
  return (
        <BrowserRouter> 

    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Bienvenidos al Sistema de la Escuela Sagrada Familia</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </header>
    </div>

      <main> 
        <Routes>
         <Route exact path="/" element={<ItemListContainerPersona/>}/>  
         <Route exact path="/personas" element={<ItemListContainerPersona/>}/>  
      </Routes>
     </main>
   </BrowserRouter>


  );
}

export default App;
