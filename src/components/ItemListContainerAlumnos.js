import { useEffect, useState, useMemo } from "react"
import ItemListAlumnos from './ItemListAlumnos'
import CustomToggle from "../utils/CustomToggle"
import { FaFileExcel, FaFilePdf } from 'react-icons/fa'; // Importamos los íconos


const ItemListContainerAlumnos = () => {
  // 1. Guardamos la lista completa original cargada de la API
  const [todasLasPersonas, setTodasLasPersonas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [tipoDescarga, setTipoDescarga] = useState('') // 'Excel' o 'PDF'

  // 2. Estado para la caja de texto
  const [textoBusqueda, setTextoBusqueda] = useState('')

  // 3. Estado para los switches/toggles
  const [filtros, setFiltros] = useState({
    esAlumno: false,
    esTutor: false,
    esActivo: true
  })

  const token = localStorage.getItem('token')

  // --- CARGA INICIAL (Solo se ejecuta 1 vez al montar el componente) ---
  useEffect(() => {
    setCargando(true)
    const url = `${process.env.REACT_APP_API_URL}/api/persons`

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        setTodasLasPersonas(Array.isArray(data) ? data : [])
        setCargando(false)
      })
      .catch(error => {
        console.error("Error al cargar personas:", error)
        setTodasLasPersonas([])
        setCargando(false)
      })
  }, [token])


  // --- FILTRADO DINÁMICO EN MEMORIA (useMemo) ---
  // Se recalcula instantáneamente cuando cambia 'textoBusqueda', 'filtros' o 'todasLasPersonas'
// --- FILTRADO DINÁMICO EN MEMORIA (useMemo) ---
  const personasFiltradas = useMemo(() => {
    return todasLasPersonas.filter(persona => {
      
      if (persona.es_alumno !== 'S') {
      return false;
    }

      // A. Filtro por Texto Libre (Buscador)
      if (textoBusqueda.trim() !== '') {
        const query = textoBusqueda.toLowerCase().trim()
        
        const coincideApellido = persona.apellidos?.toLowerCase().includes(query)
        const coincideNombre = persona.nombres?.toLowerCase().includes(query)
        const coincideDni = persona.numero?.toString().toLowerCase().includes(query)

        if (!coincideApellido && !coincideNombre && !coincideDni) {
          return false
        }
      }

      // Determinar qué rol tiene la persona
      const esAlumnoReg = Boolean(persona.id_alumno) || persona.es_alumno === 'S' 
      const esTutorReg = !persona.id_alumno && persona.es_alumno === 'N'

      // B. Filtro si se activó el switch "Alumno"
      if (filtros.esAlumno && !esAlumnoReg) {
        return false
      }

      // C. Filtro si se activó el switch "Tutor"
      if (filtros.esTutor && !esTutorReg) {
        return false
      }

      // D. Filtro "Alumno Activo / Pasivo" (Solo le aplica a las personas que SON ALUMNOS)
      if (esAlumnoReg) {
        if (filtros.esActivo && persona.regular !== 'S' ) {  //|| persona.activo !== 'S')
          return false // Oculta alumnos pasivos cuando el switch está en ON
        }
        if (!filtros.esActivo && persona.regular !== 'N') {
          return false // Oculta alumnos activos cuando el switch está en OFF
        }

      }

      return true
    })
  }, [todasLasPersonas, textoBusqueda, filtros])


  // Manejadores de entrada
  const handleTextChange = (e) => setTextoBusqueda(e.target.value)
  const handleClearSearch = () => setTextoBusqueda('')

  const handleToggleChange = (e) => {
    const { name, checked } = e.target
    setFiltros(prev => ({ ...prev, [name]: checked }))
  }



  // 1. Mapeamos los 711 registros en el instante exacto del click
  const datosParaEnviar = todasLasPersonas.filter(p => p.es_alumno === 'S') // 👈 Tu condición de filtrado aquí
   .map(p => ({
    apellidos: p.apellidos,
    nombres: p.nombres,
    nombre_corto: p.nombre_corto,
    numero: p.numero,
    es_alumno: p.es_alumno === 'S' ? 'Alumno' : 'Tutor'
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
      // Enviamos el array directo
      body: JSON.stringify(datosParaEnviar)
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    // 🟢 2. PROCESAR Y FORZAR LA DESCARGA EN EL NAVEGADOR
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'Reporte_Personas.xlsx'; // Nombre con el que se descarga
    document.body.appendChild(a);
    
    a.click(); // 👈 Esto dispara la descarga en Windows/Firefox
    
    // Limpieza
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (err) {
    console.error("Error al exportar a Excel:", err);
  } finally {
setDescargando(false);
  }
};

  // Función para generar y descargar PDF bajo demanda
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
      // Enviamos el array directo
      body: JSON.stringify(datosParaEnviar)
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    // 🟢 2. PROCESAR Y FORZAR LA DESCARGA EN EL NAVEGADOR
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'Reporte_Personas.pdf'; // Nombre con el que se descarga
    document.body.appendChild(a);
    
    a.click(); // 👈 Esto dispara la descarga en Windows/Firefox
    
    // Limpieza
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
      <h2 className="text-xl font-bold mb-4 text-center">Listado de Alumnos</h2>

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

        {/* Interruptores */}
    {/*    <CustomToggle 
          label="Alumno"
          name="esAlumno"
          checked={filtros.esAlumno}
          onChange={handleToggleChange}
        />

        <CustomToggle 
          label="Tutor"
          name="esTutor"
          checked={filtros.esTutor}
          onChange={handleToggleChange}
        />*/}

        <CustomToggle 
          label={filtros.esActivo ? "Alumno Activo" : "Alumno Pasivo"}
          name="esActivo"
          checked={filtros.esActivo}
          onChange={handleToggleChange}
        />

{/* Contenedor de Botones */}
      <div style={{ display: 'flex', gap: '8px', 
                    marginTop: '15px',    /* Mueve los botones hacia abajo */
                    marginLeft: 'auto'    /* Empuja los botones completamente hacia la derecha */ }}>
        
        {/* Botón Excel con Ícono */}
        <button
          onClick={handleExportExcel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#16a34a', // Verde Excel
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
         {/* Exportar a Excel*/}
        </button>


          {/* Botón PDF (en lugar de PDFDownloadLink) */}
          <button onClick={handleExportPDF} 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#dc2626', // Rojo PDF (Tailwind Red 600)
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

      {/* Resultados filtrados al vuelo */}
      {cargando ? (
        <p className="text-center font-semibold my-4">Cargando datos iniciales...</p>
      ) : (
        <ItemListAlumnos prods={personasFiltradas} setProds={setTodasLasPersonas} />
      )}

{/* 🟢 FLOATING DOWNLOAD LOADER (Opción 1) */}
      {descargando && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900/90 text-white px-5 py-3 rounded-full shadow-2xl backdrop-blur-sm border border-gray-700 animate-fade-in">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Generando {tipoDescarga}...</span>
        </div>
      )}

    </div>

    
  )
}

export default ItemListContainerAlumnos