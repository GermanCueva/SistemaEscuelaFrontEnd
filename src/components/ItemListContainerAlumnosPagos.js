import { useEffect, useState, useMemo, useCallback } from "react"
import ItemListAlumnosPagos from './ItemListAlumnosPagos'
import CustomToggle from "../utils/CustomToggle"
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';

const ItemListContainerAlumnosPagos = () => {
  const [todasLasPersonas, setTodasLasPersonas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)
  const [tipoDescarga, setTipoDescarga] = useState('')

  // eslint-disable-next-line no-unused-vars
  const [saldos, setSaldos] = useState({})

  const [niveles, setNiveles] = useState([])
  const [grados, setGrados] = useState([])
  const [divisiones, setDivisiones] = useState([])
  const [idEntidad, setIdEntidad] = useState(null)

  const [textoBusqueda, setTextoBusqueda] = useState('')

  const [filtros, setFiltros] = useState({
    esActivo: true,
    idNivel: '',
    idGrado: '',
    idDivision: ''
  })

  const token = localStorage.getItem('token')

  useEffect(() => {
    setCargando(true)

    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        setIdEntidad(decodedPayload.user?.identidadeducativa);
      } catch (error) {
        console.error("Error al decodificar el token", error);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL}/api/persons?incluirSaldo=true`, { headers }).then(res => res.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/academica/nivel`, { headers }).then(res => res.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/academica/grado`, { headers }).then(res => res.json()),
      fetch(`${process.env.REACT_APP_API_URL}/api/academica/division`, { headers }).then(res => res.json()).catch(() => [])
    ])
      .then(([dataPersonas, dataNiveles, dataGrados, dataDivisiones]) => {
        setTodasLasPersonas(Array.isArray(dataPersonas) ? dataPersonas : [])
        setNiveles(Array.isArray(dataNiveles) ? dataNiveles : [])
        setGrados(Array.isArray(dataGrados) ? dataGrados : [])
        setDivisiones(Array.isArray(dataDivisiones) ? dataDivisiones : [])
        setCargando(false)
      })
      .catch(error => {
        console.error("Error al cargar datos iniciales:", error)
        setTodasLasPersonas([])
        setNiveles([])
        setGrados([])
        setDivisiones([])
        setCargando(false)
      })
  }, [token])

  const handleSaldoCargado = useCallback((id_alumno, saldo) => {
    setSaldos(prev => {
      if (prev[id_alumno] === saldo) return prev;
      return { ...prev, [id_alumno]: saldo };
    });
  }, []);

  const nivelesFiltrados = useMemo(() => {
    return niveles.filter(n => {
      const idNivel = n.id_nivel ?? n.idNivel ?? n.id;
      if (String(idEntidad) === '1' && String(idNivel) === '3') return false;
      return true;
    });
  }, [niveles, idEntidad]);

  const gradosFiltrados = useMemo(() => {
    return grados.filter(g => {
      const idNivelDelGrado = g.id_nivel ?? g.idNivel ?? g.nivel_id ?? g.nivel?.id_nivel ?? g.nivel?.id;

      if (String(idEntidad) === '1' && String(idNivelDelGrado) === '3') return false;
      if (filtros.idNivel && String(idNivelDelGrado) !== String(filtros.idNivel)) return false;

      return true;
    });
  }, [grados, filtros.idNivel, idEntidad]);



  const personasFiltradas = useMemo(() => {
  const divObjetoSeleccionado = divisiones.find(
    d => String(d.id_division || d.id) === String(filtros.idDivision)
  );

  return todasLasPersonas.filter(persona => {
    if (persona.es_alumno !== 'S') return false;

    if (textoBusqueda.trim() !== '') {
      const query = textoBusqueda.toLowerCase().trim()
      const coincideApellido = persona.apellidos?.toLowerCase().includes(query)
      const coincideNombre = persona.nombres?.toLowerCase().includes(query)
      const coincideDni = persona.numero?.toString().toLowerCase().includes(query)

      if (!coincideApellido && !coincideNombre && !coincideDni) return false
    }

    if (filtros.esActivo && persona.regular !== 'S') return false
    if (!filtros.esActivo && persona.regular !== 'N') return false

    if (filtros.idNivel && String(persona.id_nivel) !== String(filtros.idNivel)) return false
    if (filtros.idGrado && String(persona.id_grado) !== String(filtros.idGrado)) return false

    if (filtros.idDivision) {
      const idBuscado = String(filtros.idDivision);
      const nombreBuscado = divObjetoSeleccionado 
        ? String(divObjetoSeleccionado.division || divObjetoSeleccionado.nombre).toLowerCase().trim() 
        : '';

      const idAlumno = persona.id_division ? String(persona.id_division) : '';
      const nombreAlumno = persona.division ? String(persona.division).toLowerCase().trim() : '';

      const coincidePorId = idAlumno === idBuscado;
      const coincidePorNombre = nombreBuscado !== '' && nombreAlumno === nombreBuscado;

      if (!coincidePorId && !coincidePorNombre) return false;
    }

    return true
  })
}, [todasLasPersonas, textoBusqueda, filtros, divisiones])


  const handleTextChange = (e) => setTextoBusqueda(e.target.value)
  const handleClearSearch = () => setTextoBusqueda('')

  const handleToggleChange = (e) => {
    const { name, checked } = e.target
    setFiltros(prev => ({ ...prev, [name]: checked }))
  }

  const datosParaEnviar = personasFiltradas.map(p => ({
    apellidos: p.apellidos,
    nombres: p.nombres,
    nombre_corto: p.nombre_corto,
    numero: p.numero,
    es_alumno: p.es_alumno === 'S' ? 'Alumno' : 'Tutor',
    nivel: p.nombre_nivel && p.nombre_grado && p.division ? `${p.nombre_nivel} - ${p.nombre_grado} - ${p.division}` : (p.nombre_nivel || ''),
    saldo_total: p.saldo_total,
    tieneSaldoTotal: true,
    titulo: 'Reporte de Alumnos - Estado de Cuenta'
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

      if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Alumnos_Pagos.xlsx';
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

      if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Reporte_Alumnos_Pagos.pdf';
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
      <h2 className="text-xl font-bold mb-4 text-center">Listado de Alumnos - Pagos</h2>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-6 bg-gray-100 p-4 rounded-xl shadow-sm">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Buscar:</label>
            <input 
              type="text" 
              value={textoBusqueda} 
              onChange={handleTextChange}
              placeholder="Buscar por Apellido, Nombre o DNI..." 
              className="input input-bordered input-sm w-60 bg-white"
              style={{ width: '280px' }} /* Forzado directo */
            />
          </div>
          
          {textoBusqueda && (
            <button 
              type="button" 
              onClick={handleClearSearch} 
              className="btn btn-ghost btn-sm text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="h-8 border-r border-gray-300 hidden sm:block"></div>

        <CustomToggle 
          label={filtros.esActivo ? "Alumno Activo" : "Alumno Pasivo"}
          name="esActivo"
          checked={filtros.esActivo}
          onChange={handleToggleChange}
        />

        <div className="h-8 border-r border-gray-300 hidden sm:block"></div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Nivel:</label>
          <select 
            value={filtros.idNivel}
            onChange={(e) => setFiltros(prev => ({ ...prev, idNivel: e.target.value, idGrado: '', idDivision: '' }))}
            className="select select-bordered select-sm bg-white"
          >
            <option value="">Todos</option>
            {nivelesFiltrados.map(n => (
              <option key={n.id_nivel} value={n.id_nivel}>
                {n.nombre || n.nombre_nivel}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Grado/Curso:</label>
          <select 
            value={filtros.idGrado}
            onChange={(e) => setFiltros(prev => ({ ...prev, idGrado: e.target.value, idDivision: '' }))}
            className="select select-bordered select-sm bg-white"
          >
            <option value="">Todos</option>
            {gradosFiltrados.map(g => (
              <option key={g.id_grado} value={g.id_grado}>
                {g.nombre || g.nombre_grado}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">División:</label>
          <select 
            value={filtros.idDivision}
            onChange={(e) => setFiltros(prev => ({ ...prev, idDivision: e.target.value }))}
            className="select select-bordered select-sm bg-white"
          >
            <option value="">Todas</option>
            {divisiones.map(d => (
              <option key={d.id_division || d.id} value={d.id_division || d.id}>
                {d.nombre || d.division}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto mt-2 sm:mt-0">
          <button 
            onClick={handleExportExcel} 
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-2 px-3 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <FaFileExcel size={18} />
          </button>

          <button 
            onClick={handleExportPDF} 
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white p-2 px-3 rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            <FaFilePdf size={18}/>
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-center font-semibold my-4">Cargando datos iniciales...</p>
      ) : (
        <ItemListAlumnosPagos 
          prods={personasFiltradas} 
          setProds={setTodasLasPersonas} 
          onSaldoCargado={handleSaldoCargado}
        />
      )}

      {descargando && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900/90 text-white px-5 py-3 rounded-full shadow-2xl backdrop-blur-sm border border-gray-700 animate-fade-in">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Generando {tipoDescarga}...</span>
        </div>
      )}
    </div>
  )
}

export default ItemListContainerAlumnosPagos