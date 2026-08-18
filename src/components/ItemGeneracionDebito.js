import { useState } from "react";
import { FolderDown } from "lucide-react";
import axios from "axios";

const ItemGeneracionDebito = () => {
  const [generando, setGenerando] = useState(false);

  // ==========================================
  // Descargar archivo
  // ==========================================
  const descargarArchivo = (contenido, nombreArchivo) => {
    console.log(`Procesando archivo: ${nombreArchivo}`);
    console.log("Tipo de contenido:", typeof contenido);
    console.log("Contenido:", contenido);

    if (contenido === undefined || contenido === null || contenido === "") {
      console.error(`El archivo ${nombreArchivo} no tiene contenido.`);
      return false;
    }

    try {
      const blob = new Blob([contenido], {
        type: "text/plain;charset=utf-8",
      });

      console.log(`${nombreArchivo} - tamaño del Blob:`, blob.size, "bytes");

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = nombreArchivo;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      console.log(`${nombreArchivo} descargado correctamente.`);

      return true;
    } catch (error) {
      console.error(`Error descargando ${nombreArchivo}:`, error);

      return false;
    }
  };

  // ==========================================
  // Generar archivos
  // ==========================================
  const generarArchivoDebito = async () => {
    try {
      setGenerando(true);

      console.log("=================================");
      console.log("GENERANDO ARCHIVOS DE DÉBITO");
      console.log("=================================");

      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No existe token de autenticación.");
        alert("La sesión no es válida. Volvé a iniciar sesión.");
        return;
      }

      // ==========================================
      // Llamada al backend
      // ==========================================
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/pagos/archivoDebito`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("Respuesta completa del backend:");
      console.log(response);

      console.log("Datos recibidos:");
      console.log(response.data);

      // ==========================================
      // Obtener archivos
      // ==========================================
      const archivos = response.data;

      console.log("VISA DÉBITO:");
      console.log(archivos.archivo_visa_debito);

      console.log("VISA CRÉDITO:");
      console.log(archivos.archivo_visa_credito);

      console.log("MASTERCARD CRÉDITO:");
      console.log(archivos.archivo_mastercard_credito);

      // ==========================================
      // Descargar VISA DÉBITO
      // ==========================================
      const visaDebito = descargarArchivo(
        archivos.archivo_visa_debito,
        "DEBLIQD.TXT",
      );

      // ==========================================
      // Descargar VISA CRÉDITO
      // ==========================================
      const visaCredito = descargarArchivo(
        archivos.archivo_visa_credito,
        "DEBLIQC.TXT",
      );

      // ==========================================
      // Descargar MASTERCARD CRÉDITO
      // ==========================================
      const mastercardCredito = descargarArchivo(
        archivos.archivo_mastercard_credito,
        "DEBLIMC.TXT",
      );

      // ==========================================
      // Resultado
      // ==========================================
      if (visaDebito && visaCredito && mastercardCredito) {
        alert("Los tres archivos fueron generados correctamente.");
      } else {
        alert(
          "Uno o más archivos no pudieron ser generados. Revisá la consola.",
        );
      }
    } catch (error) {
      console.error("=================================");
      console.error("ERROR AL GENERAR LOS ARCHIVOS");
      console.error("=================================");
      console.error(error);

      if (error.response) {
        console.error("Código HTTP:", error.response.status);

        console.error("Respuesta del servidor:", error.response.data);
      }

      if (error.request) {
        console.error("El servidor no respondió:", error.request);
      }

      alert(
        "Ocurrió un error al generar los archivos. Revisá la consola del navegador.",
      );
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={generarArchivoDebito}
          disabled={generando}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FolderDown size={18} />

          {generando ? "Generando archivos..." : "Generar Archivo Débito"}
        </button>
      </div>
    </div>
  );
};

export default ItemGeneracionDebito;
