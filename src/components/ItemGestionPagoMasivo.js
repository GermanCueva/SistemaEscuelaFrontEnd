
import { useState } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import axios from "axios";

const ItemAfectacionDebito = () => {
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // ==========================================
  // SELECCIONAR ARCHIVO
  // ==========================================
  const seleccionarArchivo = (event) => {
    const archivoSeleccionado = event.target.files[0];

    if (!archivoSeleccionado) {
      return;
    }

    const nombre = archivoSeleccionado.name.toUpperCase();

    const nombreBase = nombre.split("_")[0];

    // Archivos permitidos
    const archivosPermitidos = [
      "LDEBLIQD",
      "RDEBLIQC",
      "RDEBLIMC",
    ];

    if (!archivosPermitidos.includes(nombreBase)) {
      alert(
        "Archivo no válido.\n\n" +
        "El nombre del archivo debe comenzar con:\n\n" +
        "LDEBLIQD\n" +
        "RDEBLIQC\n" +
        "RDEBLIMC"
      );

      event.target.value = "";
      setArchivo(null);

      return;
    }

    setArchivo(archivoSeleccionado);
    setResultado(null);
  };

  // ==========================================
  // AFECTAR PAGOS
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
        alert(
          "La sesión no es válida. Volvé a iniciar sesión."
        );

        return;
      }

      // ==========================================
      // ENDPOINT
      // ==========================================
      const endpoint =
        "http://localhost:8080/api/archivos-debito/procesar";

      // ==========================================
      // FORM DATA
      // ==========================================
      const formData = new FormData();

      formData.append("archivo", archivo);

      // ==========================================
      // ENVIAR ARCHIVO
      // ==========================================
      const response = await axios.post(
        endpoint,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ==========================================
      // RESPUESTA DEL BACKEND
      // ==========================================
      const mensaje =
        response.data?.mensaje ||
        "Procesamiento finalizado.";

      const resumen =
        response.data?.resumen || null;

      // ==========================================
      // GUARDAR RESULTADO
      // ==========================================
      setResultado({
        ok: response.data?.ok !== false,
        mensaje,
        resumen,
        archivo: archivo.name,
      });

      // ==========================================
      // LIMPIAR ARCHIVO SELECCIONADO
      // ==========================================
      setArchivo(null);

      const input =
        document.getElementById("archivoBanco");

      if (input) {
        input.value = "";
      }

    } catch (error) {

      let mensaje =
        "Ocurrió un error al afectar los pagos.";

      if (error.response) {

        mensaje =
          error.response.data?.mensaje ||
          error.response.data?.message ||
          mensaje;

      } else if (error.request) {

        mensaje =
          "No se pudo conectar con el servidor.";

      } else {

        mensaje =
          error.message || mensaje;

      }

      // ==========================================
      // MOSTRAR ERROR EN PANTALLA
      // ==========================================
      setResultado({
        ok: false,
        mensaje,
        resumen: null,
        archivo: archivo?.name,
      });

    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="border rounded-lg p-5 bg-white shadow-sm">

      {/* ==========================================
          TÍTULO
      ========================================== */}

      <h3 className="font-semibold text-gray-800 text-lg mb-1">
        Afectación de pagos
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Seleccioná el archivo del banco que deseas
        procesar.
      </p>

      {/* ==========================================
          BOTONES
      ========================================== */}

      <div className="flex items-center gap-3">

        {/* SELECCIONAR */}

        <label
          className="
            flex
            items-center
            gap-2
            px-4
            py-2
            bg-gray-100
            hover:bg-gray-200
            rounded
            cursor-pointer
          "
        >

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

        {/* AFECTAR */}

        <button
          onClick={afectarPagos}
          disabled={!archivo || procesando}
          className="
            px-4
            py-2
            bg-blue-600
            text-white
            rounded
            hover:bg-blue-700
            disabled:bg-gray-400
            disabled:cursor-not-allowed
          "
        >

          {procesando
            ? "Procesando..."
            : "Afectar pagos"}

        </button>

      </div>

      {/* ==========================================
          ARCHIVO SELECCIONADO
      ========================================== */}

      {archivo && (

        <div
          className="
            mt-4
            p-3
            bg-gray-50
            border
            rounded
            flex
            items-center
            gap-2
          "
        >

          <FileText
            size={20}
            className="text-gray-500"
          />

          <div className="text-sm">

            <div className="font-medium text-gray-800">
              Archivo seleccionado
            </div>

            <div className="text-gray-500">
              {archivo.name}
            </div>

          </div>

        </div>

      )}

      {/* ==========================================
          RESULTADO
      ========================================== */}

      {resultado && (

        <div
          className={`
            mt-5
            border
            rounded-lg
            overflow-hidden
            ${
              resultado.ok
                ? "border-green-200"
                : "border-red-200"
            }
          `}
        >

          {/* ==========================================
              CABECERA
          ========================================== */}

          <div
            className={`
              p-4
              flex
              items-center
              gap-2
              ${
                resultado.ok
                  ? "bg-green-50"
                  : "bg-red-50"
              }
            `}
          >

            {resultado.ok ? (
              <CheckCircle
                size={22}
                className="text-green-600"
              />
            ) : (
              <AlertCircle
                size={22}
                className="text-red-600"
              />
            )}

            <div>

              <div
                className={`
                  font-semibold
                  ${
                    resultado.ok
                      ? "text-green-700"
                      : "text-red-700"
                  }
                `}
              >
                {resultado.ok
                  ? "Afectación finalizada"
                  : "Error en la afectación"}
              </div>

              <div className="text-sm text-gray-600">
                {resultado.mensaje}
              </div>

            </div>

          </div>

          {/* ==========================================
              CONTENIDO DEL RESULTADO
          ========================================== */}

          {resultado.resumen && (

            <div className="p-4">

              {/* ARCHIVO */}

              {resultado.archivo && (

                <div className="mb-4">

                  <div className="text-xs text-gray-500">
                    Archivo procesado
                  </div>

                  <div className="font-medium text-gray-800">
                    {resultado.archivo}
                  </div>

                </div>

              )}

              {/* ==========================================
                  ESTADÍSTICAS
              ========================================== */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* TOTAL */}

                <div
                  className="
                    border
                    rounded-lg
                    p-4
                    bg-gray-50
                  "
                >

                  <div className="text-sm text-gray-500">
                    Total de registros
                  </div>

                  <div className="text-3xl font-bold text-gray-800">
                    {resultado.resumen.totalRegistros ?? 0}
                  </div>

                </div>

                {/* EXITOSOS */}

                <div
                  className="
                    border
                    border-green-200
                    rounded-lg
                    p-4
                    bg-green-50
                  "
                >

                  <div className="text-sm text-green-700">
                    Afectados correctamente
                  </div>

                  <div className="text-3xl font-bold text-green-600">
                    {
                      resultado.resumen
                        .afectadosExitosamente ?? 0
                    }
                  </div>

                </div>

                {/* RECHAZADOS */}

                <div
                  className="
                    border
                    border-red-200
                    rounded-lg
                    p-4
                    bg-red-50
                  "
                >

                  <div className="text-sm text-red-700">
                    No pudieron afectarse
                  </div>

                  <div className="text-3xl font-bold text-red-600">
                    {
                      resultado.resumen
                        .noAfectados ?? 0
                    }
                  </div>

                </div>

              </div>

              {/* ==========================================
                  MOTIVOS DE RECHAZO
              ========================================== */}

              {resultado.resumen.rechazos &&
               resultado.resumen.rechazos.length > 0 && (

                <div className="mt-6">

                  <h4
                    className="
                      font-semibold
                      text-gray-800
                      mb-3
                    "
                  >
                    Motivos de rechazo
                  </h4>

                  <div
                    className="
                      border
                      rounded-lg
                      overflow-hidden
                    "
                  >

                    <table className="w-full text-sm">

                      <thead className="bg-gray-100">

                        <tr>

                          <th
                            className="
                              text-left
                              px-4
                              py-3
                            "
                          >
                            Código
                          </th>

                          <th
                            className="
                              text-left
                              px-4
                              py-3
                            "
                          >
                            Descripción
                          </th>

                          <th
                            className="
                              text-center
                              px-4
                              py-3
                            "
                          >
                            Cantidad
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {resultado.resumen.rechazos.map(
                          (rechazo, index) => (

                            <tr
                              key={
                                `${rechazo.codigo}-${index}`
                              }
                              className="border-t"
                            >

                              <td
                                className="
                                  px-4
                                  py-3
                                  font-medium
                                "
                              >
                                {rechazo.codigo}
                              </td>

                              <td
                                className="
                                  px-4
                                  py-3
                                "
                              >
                                {rechazo.descripcion}
                              </td>

                              <td
                                className="
                                  px-4
                                  py-3
                                  text-center
                                  font-semibold
                                  text-red-600
                                "
                              >
                                {rechazo.cantidad}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>

      )}

    </div>
  );
};

export default ItemAfectacionDebito;
 
