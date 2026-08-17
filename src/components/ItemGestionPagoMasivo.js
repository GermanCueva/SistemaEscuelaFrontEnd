import { useState } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";

const ItemAfectacionDebito = () => {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // ==========================================
  // Seleccionar archivo
  // ==========================================
  const seleccionarArchivo = (event) => {
  const archivoSeleccionado = event.target.files[0];

  if (!archivoSeleccionado) {
    return;
  }

  const nombre = archivoSeleccionado.name.toUpperCase();

  // Obtener solamente la parte anterior al "_"
  const nombreBase = nombre.split("_")[0];

  // Archivos permitidos
  const archivosPermitidos = [
    "LDEBLIQD",
    "RDEBLIQD",
    "DEBLIQC",
    "DEBLIMC",
  ];

  if (!archivosPermitidos.includes(nombreBase)) {
    alert(
      "Archivo no válido.\n\n" +
        "El nombre del archivo debe comenzar con uno de estos códigos:\n" +
        "LDEBLIQD\n" +
        "RDEBLIQD\n" +
        "DEBLIQC\n" +
        "DEBLIMC"
    );

    event.target.value = "";
    return;
  }

  setArchivo(archivoSeleccionado);
  setResultado(null);
};

  // ==========================================
  // Determinar endpoint según archivo
  // ==========================================
 const obtenerEndpoint = (nombreArchivo) => {
  const nombre = nombreArchivo.toUpperCase();

  // Obtener solamente la parte anterior al "_"
  const nombreBase = nombre.split("_")[0];

  switch (nombreBase) {
    case "LDEBLIQD":
    case "RDEBLIQD":
      return "http://localhost:8080/api/pagos/afectar/visaDebito";

    case "DEBLIQC":
      return "http://localhost:8080/api/pagos/afectar/visaCredito";

    case "DEBLIMC":
      return "http://localhost:8080/api/pagos/afectar/mastercardCredito";
      

    default:
      return null;
  }
};

  // ==========================================
  // Afectar pagos
  // ==========================================
  const afectarPagos = async () => {
    if (!archivo) {
      alert("Primero seleccioná un archivo.");
      return;
    }

    try {
      setProcesando(true);
      setResultado(null);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("La sesión no es válida. Volvé a iniciar sesión.");
        return;
      }

      const endpoint = obtenerEndpoint(archivo.name);

      if (!endpoint) {
        alert("El archivo no es válido.");
        return;
      }

      console.log("=================================");
      console.log("AFECTANDO PAGOS");
      console.log("Archivo:", archivo.name);
      console.log("Endpoint:", endpoint);
      console.log("=================================");

      const formData = new FormData();

      formData.append("archivo", archivo);

      const response = await axios.post(
        endpoint,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Respuesta del backend:");
      console.log(response.data);

      const mensaje =
        response.data?.mensaje ||
        "Los pagos fueron afectados correctamente.";

      setResultado({
        ok: true,
        mensaje,
      });

      alert(mensaje);

      // Limpiar archivo para poder cargar otro
      setArchivo(null);

      const input = document.getElementById("archivoBanco");

      if (input) {
        input.value = "";
      }
    } catch (error) {
      console.error("=================================");
      console.error("ERROR AL AFECTAR PAGOS");
      console.error("=================================");
      console.error(error);

      let mensaje = "Ocurrió un error al afectar los pagos.";

      if (error.response) {
        console.error("Código HTTP:", error.response.status);
        console.error("Respuesta:", error.response.data);

        mensaje =
          error.response.data?.mensaje ||
          error.response.data?.message ||
          mensaje;
      }

      setResultado({
        ok: false,
        mensaje,
      });

      alert(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="border rounded-lg p-5 bg-white shadow-sm">

      <h3 className="font-semibold text-gray-800 text-lg mb-1">
        Afectación de pagos
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Seleccioná el archivo del banco que deseas procesar.
      </p>

      {/* ==========================================
          BOTONES
      ========================================== */}

      <div className="flex items-center gap-3">

        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer">
          <Upload size={18} />

          Seleccionar archivo

          <input
            id="archivoBanco"
            type="file"
            className="hidden"
            accept=".txt"
            onChange={seleccionarArchivo}
          />
        </label>

        <button
          onClick={afectarPagos}
          disabled={!archivo || procesando}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {procesando ? "Procesando..." : "Afectar pagos"}
        </button>

      </div>

      {/* ==========================================
          ARCHIVO SELECCIONADO
      ========================================== */}

      {archivo && (
        <div className="mt-4 p-3 bg-gray-50 rounded">

          <div className="text-sm">
            <span className="font-medium">
              Archivo seleccionado:
            </span>{" "}
            {archivo.name}
          </div>

        </div>
      )}

      {/* ==========================================
          RESULTADO
      ========================================== */}

      {resultado && (
        <div
          className={`mt-4 p-3 rounded text-sm flex items-center gap-2 ${
            resultado.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {resultado.ok ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}

          {resultado.mensaje}
        </div>
      )}

    </div>
  );
};

export default ItemAfectacionDebito;