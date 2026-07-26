import { useEffect, useState, useMemo } from "react"
import ItemListPersonas from './ItemListPersonas'
import CustomToggle from "../utils/CustomToggle"

const ItemListContainerPersona = () => {
  // 1. Guardamos la lista completa original cargada de la API
  const [todasLasPersonas, setTodasLasPersonas] = useState([])
  const [cargando, setCargando] = useState(true)

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
        if (filtros.esActivo && persona.regular !== 'S') {
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

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Listado de Personas</h2>

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
        <CustomToggle 
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
        />

        <CustomToggle 
          label={filtros.esActivo ? "Alumno Activo" : "Alumno Pasivo"}
          name="esActivo"
          checked={filtros.esActivo}
          onChange={handleToggleChange}
        />
      </div>

      {/* Resultados filtrados al vuelo */}
      {cargando ? (
        <p className="text-center font-semibold my-4">Cargando datos iniciales...</p>
      ) : (
        <ItemListPersonas prods={personasFiltradas} setProds={setTodasLasPersonas} />
      )}
    </div>
  )
}

export default ItemListContainerPersona