import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { avisar } from "../utils/notificaciones";

const ItemListAlumnoAcademica = ({ idAlumno, idPersona, onCambioDatos, onEliminarBackend }) => {
  const [listado, setListado] = useState([]);
  const [cargando, setCargando] = useState(false);
  const token = localStorage.getItem("token");
  const idFinal = idAlumno;

  // Estados para catálogos
  const [listaGrados, setGrados] = useState([]);
  const [listaAniosCursado, setAniosCursado] = useState([]);
  const [listaDivisiones, setDivisiones] = useState([]);

  // Estados para el manejo del CRUD local
  const [editingId, setEditingId] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({
      id_grado: "", id_division: "", id_anio_cursado: "", genero_cargo: "", pago_cargo: ""  
  });

  // --- 1. OBTENER CATÁLOGOS ---
  const obtenerCatalogos = useCallback(async () => {
    try {
      const [resGrados, resAnios, resDivisiones] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/academica/grado`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/academica/aniocursado`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/academica/division`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const g = await resGrados.json().catch(() => []);
      const a = await resAnios.json().catch(() => []);
      const d = await resDivisiones.json().catch(() => []);

      setGrados(Array.isArray(g) ? g : (g.data && Array.isArray(g.data) ? g.data : []));
      setAniosCursado(Array.isArray(a) ? a : (a.data && Array.isArray(a.data) ? a.data : []));
      setDivisiones(Array.isArray(d) ? d : (d.data && Array.isArray(d.data) ? d.data : []));
      
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
    }
  }, [token]);

  // --- 2. OBTENER LISTADO INICIAL ---
  const obtenerListado = useCallback((idAlum) => {
    if (!idAlum) return;
    setCargando(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/academica/${idAlum}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setListado(Array.isArray(data) ? data : []);
      })
      .catch(() => setListado([]))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(() => {
    obtenerCatalogos();
    if (idFinal) obtenerListado(idFinal);
  }, [idFinal, obtenerListado, obtenerCatalogos]);

  const handleAddChange = (e) => setNewForm({ ...newForm, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

const guardarNuevo = () => {

  // 🛑 Control 2: Validamos que absolutamente TODOS los campos estén completos
    if (
      !newForm.id_grado || 
      !newForm.id_division || 
      !newForm.anio_cursada || // (o newForm.anio_cursada según lo hayas renombrado)
      !newForm.genero_cargo || 
      !newForm.pago_cargo
    ) {
      return avisar.advertencia("Por favor, complete todos los campos de la fila antes de continuar.");
    }

    // 🛑 CONTROL DE GRADO DUPLICADO
    const gradoYaExiste = listado.some(
      item => String(item.id_grado) === String(newForm.id_grado)
    );

    if (gradoYaExiste) {
      return avisar.advertencia("⚠️ Este grado ya se encuentra agregado en la lista académica del alumno.");
    }

  const gradoObj = listaGrados.find(g => String(g.id_grado || g.id) === String(newForm.id_grado));
  const divisionObj = listaDivisiones.find(d => String(d.id_division || d.id) === String(newForm.id_division));
  
  // 🌟 Buscamos en el catálogo usando el nuevo nombre
  const anioObj = listaAniosCursado.find(a => String(a.id_anio || a.anio_cursada || a.id) === String(newForm.anio_cursada));

  const valorGenero = newForm.genero_cargo || "N";
  const valorPago = newForm.pago_cargo || "N";

  const itemNuevo = {
      id_academica: `temp-${Date.now()}`,
      id_grado: newForm.id_grado,
      nombre: gradoObj ? (gradoObj.nombre || gradoObj.grado) : "",
      id_division: newForm.id_division,
      division: divisionObj ? (divisionObj.division || divisionObj.nombre) : "Única",
      
      // 🌟 Asignamos de forma segura el entero para Postgres sin riesgo de NaN
      anio_cursada: parseInt(newForm.anio_cursada, 10) || 0,
      anio: anioObj ? (anioObj.anio || anioObj.nombre) : "",
      
      genero_costo_inscripcion: valorGenero,
      genero_cargo: valorGenero,
      pago_inscripcion: valorPago,
      pago_cargo: valorPago,
      id_alumno: idAlumno,
      esNuevo: true
  };

  const nuevoListado = [...listado, itemNuevo];
  setListado(nuevoListado);
  if (onCambioDatos) onCambioDatos(nuevoListado); 

  setIsAdding(false);
  // 🌟 Limpiamos el formulario con la propiedad correcta
  setNewForm({ id_grado: "", id_division: "", anio_cursada: "", genero_cargo: "", pago_cargo: "" });
  avisar.exito("Fila agregada a la lista.");
};

  // 🌟 CORRECCIÓN 1: Recibimos y usamos el INDEX de la fila para activar la edición de manera infalible
  const iniciarEdicion = (item, indexFila) => {
    setEditingId(indexFila);
    
    setEditForm({
      id_grado: item.id_grado || '',
      id_division: item.id_division || '',
      // Mapeamos 'anio_cursada' que es la propiedad real con el ID del año de tu base de datos
      id_anio: item.anio_cursada || '', 
      genero_cargo: item.genero_costo_inscripcion || 'N', 
      pago_cargo: item.pago_inscripcion || 'N'
    });
  };

  // 🌟 CORRECCIÓN 2: Guardado adaptado al index y tipado seguro con String
  const guardarEdicion = (indexFila) => {
    const gradoObj = listaGrados.find(g => String(g.id_grado || g.id) === String(editForm.id_grado));
    const divisionObj = listaDivisiones.find(d => String(d.id_division || d.id) === String(editForm.id_division));
    const anioObj = listaAniosCursado.find(a => String(a.id_anio) === String(editForm.id_anio));

    const nuevoListado = listado.map((item, idx) => {
      if (idx === indexFila) {
        const idAnioNuevo = anioObj ? parseInt(anioObj.id_anio) : (parseInt(editForm.id_anio) || item.anio_cursada);
        const textoAnioNuevo = anioObj ? anioObj.anio : item.anio;

        // 🌟 Forzamos los valores del formulario pase lo que pase
      const valorGenero = editForm.genero_cargo;
      const valorPago = editForm.pago_cargo;

        return {
          ...item,
          id_grado: editForm.id_grado,
          nombre: gradoObj?.nombre || item.nombre,
          id_division: editForm.id_division,
          division: divisionObj?.division || item.division,
          anio_cursada: idAnioNuevo, 
          anio: textoAnioNuevo, 
// 🔄 Sincronización Total: Asignamos el nuevo valor a AMBOS campos de forma explícita
        genero_costo_inscripcion: valorGenero,
        genero_cargo: valorGenero,
        
        pago_inscripcion: valorPago,
        pago_cargo: valorPago
        };
      }
      return item;
    });

    setListado(nuevoListado);
    if (onCambioDatos) onCambioDatos(nuevoListado); 
    setEditingId(null);
    avisar.exito("Fila modificada.");
  };

  const eliminarRegistro = async (idRegistro) => {
    if (String(idRegistro).startsWith("temp-")) {
      const nuevoListado = listado.filter(item => (item.id_academica || item.id) !== idRegistro);
      setListado(nuevoListado);
      if (onCambioDatos) onCambioDatos(nuevoListado);
      return;
    }

    if (onEliminarBackend) {
      const eliminadoExitosamente = await onEliminarBackend(idRegistro);
      if (eliminadoExitosamente) {
        const nuevoListado = listado.filter(item => (item.id_academica || item.id) !== idRegistro);
        setListado(nuevoListado);
        if (onCambioDatos) onCambioDatos(nuevoListado);
      }
    }
  };

  const formatBoolean = (val) => String(val).toUpperCase() === 'S' ? 'Sí' : 'No';

  if (cargando && listado.length === 0) {
    return <div className="text-center py-4 text-gray-500">Cargando datos académicos...</div>;
  }

  const formularioIncompleto = !newForm.id_grado || !newForm.id_division || !newForm.anio_cursada || !newForm.pago_cargo || !newForm.pago_cargo;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancelar" : "Nuevo Registro"}
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-sm text-left text-gray-500 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3">Grado</th>
              <th className="px-4 py-3"><div className="flex justify-center w-full">División</div></th>
              <th className="px-4 py-3"><div className="flex justify-center w-full">Año Cursada</div></th>
              <th className="px-2 py-3"><div className="flex justify-center w-full">¿Generó Cargo?</div></th>
              <th className="px-2 py-3"><div className="flex justify-center w-full">¿Pagó Cargo?</div></th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* --- FILA DE ALTA --- */}
            {isAdding && (
              <tr className="bg-blue-50 border-b">
                <td className="px-2 py-2">
                  <select name="id_grado" value={newForm.id_grado} onChange={handleAddChange} className="select select-bordered select-sm w-full">
                    <option value="">Seleccione...</option>
                    {listaGrados.map(g => (
                      <option key={g.id_grado || g.id || 1} value={g.id_grado || g.id}>{g.grado || g.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <select name="id_division" value={newForm.id_division} onChange={handleAddChange} className="select select-bordered select-sm w-full">
                    <option value="">Seleccione...</option>
                    {listaDivisiones.map(d => (
                      <option key={d.id_division || d.id || 1} value={d.id_division || d.id}>{d.division || d.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                <select 
                  name="anio_cursada" // 🌟 Cambiado a anio_cursada
                  value={newForm.anio_cursada} // 🌟 Cambiado a anio_cursada
                  onChange={handleAddChange} 
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Seleccione Año...</option>
                  {listaAniosCursado.map((a) => (
                    <option key={String(a.id_anio || a.anio_cursada || a.id)} value={String(a.id_anio || a.anio_cursada || a.id)}>
                      {a.anio}
                    </option>
                  ))}
                </select>
                </td>
                <td className="px-2 py-2"><select name="genero_cargo" value={newForm.genero_cargo} onChange={handleAddChange} className="select select-bordered select-sm w-full"><option value="" disabled>Seleccione...</option><option value="S">Sí</option><option value="N">No</option></select></td>
                <td className="px-2 py-2"><select name="pago_cargo" value={newForm.pago_cargo} onChange={handleAddChange} className="select select-bordered select-sm w-full"><option value="" disabled>Seleccione...</option><option value="S">Sí</option><option value="N">No</option></select></td>
                <td className="px-2 py-2 text-center"><button onClick={guardarNuevo} disabled={formularioIncompleto} className={formularioIncompleto ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:scale-110 transition-transform"}><Check size={20} /></button></td>
              </tr>
            )}

            {listado.map((item, index) => {
              const isEditing = editingId === index;
              const idRegistro = item.id_alumno_dato_cursada || item.id_academica || item.id || `fila-${index}`;

              return (
                <tr key={idRegistro} className="border-b hover:bg-gray-50">
                  {isEditing ? (
                    <>
                      {/* --- MODO EDICIÓN --- */}
                      <td className="px-2 py-2">
                        <select name="id_grado" value={editForm.id_grado} onChange={handleEditChange} className="select select-bordered select-sm w-full">
                          <option value="">Seleccione...</option>
                          {listaGrados.map(g => (
                            <option key={g.id_grado || g.id || 1} value={g.id_grado || g.id}>{g.grado || g.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select name="id_division" value={editForm.id_division} onChange={handleEditChange} className="select select-bordered select-sm w-full">
                          <option value="">Seleccione...</option>
                          {listaDivisiones.map(d => (
                            <option key={d.id_division || d.id || 1} value={d.id_division || d.id}>{d.division || d.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        {/* 🌟 CORRECCIÓN 3: Mapeo y tipado estricto en String para el select de edición */}
                        <select
                          className="select select-bordered select-sm w-full"
                          name="id_anio"
                          value={editForm.id_anio !== undefined && editForm.id_anio !== null ? String(editForm.id_anio) : ''} 
                          onChange={(e) => setEditForm({ ...editForm, id_anio: e.target.value })}
                        >
                          <option value="">Seleccione Año...</option>
                          {listaAniosCursado.map((a) => (
                            <option key={String(a.id_anio)} value={String(a.id_anio)}>
                              {a.anio}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2"><select name="genero_cargo" value={editForm.genero_cargo} onChange={handleEditChange} className="select select-bordered select-sm w-full"><option value="S">Sí</option><option value="N">No</option></select></td>
                      <td className="px-2 py-2"><select name="pago_cargo" value={editForm.pago_cargo} onChange={handleEditChange} className="select select-bordered select-sm w-full"><option value="S">Sí</option><option value="N">No</option></select></td>
                      <td className="px-4 py-2 text-center flex justify-center gap-2">
                        <button onClick={() => guardarEdicion(index)} className="text-green-600"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500"><X size={18} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* --- MODO LECTURA --- */}
                      <td className="px-4 py-3">{item.nombre || item.nombre_grado || item.id_grado}</td>
                      <td className="px-4 py-3"><div className="flex justify-center w-full">{item.division || item.nombre_division || "Única"}</div></td>
                      <td className="px-4 py-3"><div className="flex justify-center w-full">{item.anio || item.id_anio}</div></td>
                      <td className="px-2 py-3"><div className="flex justify-center w-full">
                        <span className={`px-2 py-1 rounded font-semibold ${item.genero_cargo === 'S' ? 'text-green-700 bg-green-50' : 'text-gray-500'}`}>{formatBoolean(item.genero_costo_inscripcion || 'N')}</span>
                      </div></td>
                      <td className="px-2 py-3"><div className="flex justify-center w-full">
                        <span className={`px-2 py-1 rounded font-semibold ${item.pago_cargo === 'S' ? 'text-green-700 bg-green-50' : 'text-gray-500'}`}>{formatBoolean(item.pago_inscripcion || 'N')}</span>
                     </div></td>
                      <td className="px-4 py-3 text-center flex justify-center gap-3">
                        <button onClick={() => iniciarEdicion(item, index)} className="text-blue-600"><Pencil size={18} /></button>
                        <button onClick={() => eliminarRegistro(idRegistro)} className="text-red-600"><Trash2 size={18} /></button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemListAlumnoAcademica;