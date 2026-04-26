import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    // acá podrías limpiar token o estado
    navigate("/");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🏫 Sistema Escuela Sagrada Familia</h1>

      <p>Bienvenido al sistema</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => alert("Ir a alumnos")}>
          📚 Alumnos
        </button>

        <button onClick={() => alert("Ir a docentes")}>
          👩‍🏫 Docentes
        </button>

        <button onClick={() => alert("Ir a notas")}>
          📝 Notas
        </button>
      </div>

      <hr />

      <button onClick={cerrarSesion}>
        🔒 Cerrar sesión
      </button>
    </div>
  );
}

export default Home;