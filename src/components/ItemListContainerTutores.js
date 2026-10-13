import { useEffect, useState, useMemo } from "react";
import ItemListPersonas from './ItemListPersonas';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { useAuth } from "../context/AuthContext";

// Helper para verificar si la persona es un Tutor (incluye 'N' y valores null/undefined)
//const esTutor = (persona) => persona.es_alumno === 'N' || persona.es_alumno == null;
// Helper mejorado para verificar si la persona es Tutor
const esTutor = (persona) => {
  // Si la API devuelve un flag explícito de allegado/tutor, priorizarlo
  if (persona.es_allegado === 'S' || persona.tipo_persona === 'Tutor') {
    return true;
  }
  // De lo contrario, incluir todo lo que no sea estrictamente alumno activo
  return persona.es_alumno !== 'S';
};

const ItemListContainerTutores = () => {
  const { user } = useAuth();
  
  // 1. Estados
  const [todasLasPersonas, setTodasLasPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [tipoDescarga, setTipoDescarga] = useState(''); // 'Excel' o 'PDF'
  const [textoBusqueda, setTextoBusqueda] = useState('');

  // --- CARGA INICIAL ---
  useEffect(() => {
    setCargando(true);
    const token = localStorage.getItem('token');
    const url = `${process.env.REACT_APP_API_URL}/api/persons`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log("Total personas devueltas por API:", data.length);
    console.log("Valores de es_alumno en la API:", [...new Set(data.map(p => p.es_alumno))]);
        setTodasLasPersonas(Array.isArray(data) ? data : []);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error al cargar personas:", error);
        setTodasLasPersonas([]);
        setCargando(false);
      });
  }, [user?.identidadeducativa]);

  // --- FILTRADO DINÁMICO EN MEMORIA (useMemo) ---
  const personasFiltradas = useMemo(() => {
    return todasLasPersonas.filter(persona => {
      
      // A. Solo incluir tutores
      if (!esTutor(persona)) {
        return false;
      }

      // B. Filtro por Texto Libre (Buscador)
      if (textoBusqueda.trim() !== '') {
        const query = textoBusqueda.toLowerCase().trim();
        
        const coincideApellido = persona.apellidos?.toLowerCase().includes(query);
        const coincideNombre = persona.nombres?.toLowerCase().includes(query);
        const coincideDni = persona.numero?.toString().toLowerCase().includes(query);

        if (!coincideApellido && !coincideNombre && !coincideDni) {
          return false;
        }
      }

      return true;
    });
  }, [todasLasPersonas, textoBusqueda]);

  // Total real de tutores en la lista completa
  const totalTutores = todasLasPersonas.filter(esTutor).length;

  // Manejadores de entrada
  const handleTextChange = (e) => setTextoBusqueda(e.target.value);
  const handleClearSearch = () => setTextoBusqueda('');

  // --- EXPORTACIÓN ---
  const datosParaEnviar = todasLasPersonas
    .filter(esTutor)
    .map(p => ({
      apellidos: p.apellidos,
      nombres: p.nombres,
      nombre_corto: p.nombre_corto,
      numero: p.numero,
      es_alumno: 'Tutor',
      tieneSaldoTotal: false,
      titulo: 'Reporte de Tutores'
    }));

  const handleExportExcel = async () => {
    setDescargando(true);
    setTipoDescarga('Excel');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Reporte_Tutores.xlsx';
      document.body.appendChild(a);
      
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Error al exportar a Excel:", err);
    } finally {
      setDescargando(false);
    }
  };

  const handleExportPDF = async () => {
    setDescargando(true);
    setTipoDescarga('PDF');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Reporte_Tutores.pdf';
      document.body.appendChild(a);
      
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Listado de Tutores</h2>

      {/* Control de Filtros */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-6 bg-gray-100 p-4 rounded-xl shadow-sm">
        
        {/* Entrada de texto instantánea */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Buscar:</label>
            <input 
              type="text" 
              value={textoBusqueda} 
              onChange={handleTextChange}
              placeholder="Buscar por Apellido, Nombre o DNI..." 
              className="input input-bordered input-sm w-64 bg-white"
            />
          </div>
          
          {textoBusqueda && (
            <button 
              type="button" 
              onClick={handleClearSearch} 
              className="btn btn-ghost btn-sm text-xs"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        <div className="h-8 border-r border-gray-300 hidden sm:block"></div>

        {/* Contenedor de Botones de Exportación */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '15px', marginLeft: 'auto' }}>
          
          {/* Botón Excel */}
          <button
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
          >
            <FaFileExcel size={18} />
          </button>

          {/* Botón PDF */}
          <button 
            onClick={handleExportPDF} 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
          >
            <FaFilePdf size={18}/>
          </button>

        </div>

      </div>

      {/* Contador de Tutores */}
      <div className="flex justify-between items-center mb-2 px-1 text-xs font-medium text-gray-500">
        <span>
          Mostrando <strong className="text-gray-800 font-bold">{personasFiltradas.length}</strong>
          {personasFiltradas.length === 1 ? ' tutor' : ' tutores'}
          {personasFiltradas.length !== totalTutores && ` (filtrados de ${totalTutores} en total)`}
        </span>
      </div>

      {/* Tabla con resultados */}
      {cargando ? (
        <p className="text-center font-semibold my-4">Cargando datos iniciales...</p>
      ) : (
        <ItemListPersonas prods={personasFiltradas} setProds={setTodasLasPersonas} />
      )}

      {/* Indicador flotante de descarga */}
      {descargando && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900/90 text-white px-5 py-3 rounded-full shadow-2xl backdrop-blur-sm border border-gray-700 animate-fade-in">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Generando {tipoDescarga}...</span>
        </div>
      )}

    </div>
  );
};

export default ItemListContainerTutores;