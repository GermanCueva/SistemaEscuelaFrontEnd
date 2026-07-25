import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { avisar } from "../utils/notificaciones";


// Helper global totalmente seguro para convertir a minúsculas
const aTextoLower = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
};

const ItemListAlumnoAllegados = ({
  allegados = [],
  setAllegados,
  onEliminarAllegado,
  onRecargar,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [listaEstudios, setEstudios] = useState([]);
  const [listaOcupaciones, setOcupaciones] = useState([]);
  const [listaTiposAllegados, setTiposAllegados] = useState([]);
  const [listaPersonas, setListaPersonas] = useState([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  const token = localStorage.getItem("token");

// Prevenir errores si allegados no es un array válido (Memorizado para evitar advertencias de React)
const listaAllegados = useMemo(() => {
  return Array.isArray(allegados) ? allegados : [];
}, [allegados]);


  // --- CARGA DE CATÁLOGOS ---
  const obtenerOcupaciones = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/ocupacion`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setOcupaciones(Array.isArray(data) ? data : []))
      .catch(() => setOcupaciones([]));
  }, [token]);

  const obtenerEstudios = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/estudio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setEstudios(Array.isArray(data) ? data : []))
      .catch(() => setEstudios([]));
  }, [token]);

  const obtenerTiposAllegado = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/tipoallegado`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTiposAllegados(Array.isArray(data) ? data : []))
      .catch(() => setTiposAllegados([]));
  }, [token]);

  useEffect(() => {
    obtenerOcupaciones();
    obtenerEstudios();
    obtenerTiposAllegado();
  }, [obtenerOcupaciones, obtenerEstudios, obtenerTiposAllegado]);

  // --- BÚSQUEDA DINÁMICA DE PERSONAS ---
  const obtenerDatosTodos = useCallback(
    (textoABuscar) => {
      if (!textoABuscar || textoABuscar.trim().length < 2 || textoABuscar.includes("DNI:")) {
        return;
      }

      fetch(
        `${process.env.REACT_APP_API_URL}/api/personsconfiltro/apellidodocumento/${encodeURIComponent(textoABuscar)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => res.json())
        .then((data) => setListaPersonas(Array.isArray(data) ? data : []))
        .catch(() => setListaPersonas([]));
    },
    [token]
  );

  // --- BUSCADORES AUXILIARES DE CATALOGO ---
const resolverTipoAllegado = useCallback((p) => {
  const rawId = p.id_tipo_allegado || p.id_parentesco;
  const rawText = p.nombre_tipo_allegado || p.parentesco || p.nombre;

  return listaTiposAllegados.find(
    (t) =>
      (rawId && String(t.id_tipo_allegado || t.id) === String(rawId)) ||
      (rawText && aTextoLower(t.nombre || t.descripcion) === aTextoLower(rawText))
  );
}, [listaTiposAllegados]);

const resolverEstudio = useCallback((p) => {
  const rawId = p.id_nivel_estudio || p.id_estudio_alcanzado || p.id_estudio;
  const rawText = p.nivel_estudio_tutor || p.estudio_alcanzado || p.estudio;

  return listaEstudios.find(
    (e) =>
      (rawId && String(e.id_nivel_estudio || e.id_estudio || e.id_estudio_alcanzado || e.id) === String(rawId)) ||
      (rawText && aTextoLower(e.nombre || e.descripcion) === aTextoLower(rawText))
  );
}, [listaEstudios]);

const resolverOcupacion = useCallback((p) => {
  const rawId = p.id_ocupacion;
  const rawText = p.ocupacion_tutor || p.ocupacion;

  return listaOcupaciones.find(
    (o) =>
      (rawId && String(o.id_ocupacion || o.id) === String(rawId)) ||
      (rawText && aTextoLower(o.nombre || o.descripcion) === aTextoLower(rawText))
  );
}, [listaOcupaciones]);

  // --- HANDLER EDICIÓN ---
  const handleEditClick = (p) => {
    const targetId = p.id_persona || p.id_persona_allegado || p.id;
    setEditingId(targetId);

    const tipo = resolverTipoAllegado(p);
    const estudio = resolverEstudio(p);
    const ocupacion = resolverOcupacion(p);

    setEditForm({
      ...p,
      Tutor: p.Tutor || (p.apellidos ? `${p.apellidos} ${p.nombres} - DNI: ${p.numero || ""}` : ""),
      id_tipo_allegado: tipo ? String(tipo.id_tipo_allegado || tipo.id) : String(p.id_tipo_allegado || p.id_parentesco || ""),
      id_nivel_estudio: estudio ? String(estudio.id_nivel_estudio || estudio.id_estudio || estudio.id_estudio_alcanzado || estudio.id) : String(p.id_nivel_estudio || p.id_estudio_alcanzado || p.id_estudio || ""),
      id_ocupacion: ocupacion ? String(ocupacion.id_ocupacion || ocupacion.id) : String(p.id_ocupacion || ""),
      tutor: p.tutor ?? "",
      activo: p.activo ?? "",
    });
  };

 const handleInputChange = async (field, valor) => {

  if (field === "Tutor") {
    // 1. Obtenemos los resultados actualizados de la búsqueda
    const personasFrenscas = await obtenerDatosTodos(valor); 

    setEditForm((prev) => {
      const updated = { ...prev, Tutor: valor };

      // 2. Buscamos en la lista recién obtenida o en la existente
      const listaABuscar = personasFrenscas || listaPersonas;
      const match = listaABuscar.find((item) => {
        const fmt = item.descripcion || `${item.apellidos || item.apellido} ${item.nombres || item.nombre} - DNI: ${item.numero || item.numero_dni || item.dni}`;
        return fmt === valor;
      });

      if (match) {
        setPersonaSeleccionada(match);
        
        // 3. Guardamos el ID detectando cuál propiedad existe en la respuesta
        const idEncontrado = match.id_persona || match.id || match.idPersona;
        
        updated.id_persona = idEncontrado;
        updated.id_allegado_persona = idEncontrado; // Por si tu backend usa este campo
      }

      return updated;
    });
  } else {
    setEditForm((prev) => ({ ...prev, [field]: valor }));
  }
};

 // REEMPLAZAR handleSaveRow EN ItemListAlumnoAllegados.js
const handleSaveRow = (id_persona_original) => {
  const idTipo = Number(editForm.id_tipo_allegado);
  const idEstudio = Number(editForm.id_nivel_estudio);
  const idOcupacion = Number(editForm.id_ocupacion);

  if (!idTipo || !idEstudio || !idOcupacion || !editForm.Tutor || !editForm.activo || !editForm.tutor) {
    avisar.advertencia("Por favor, complete todos los campos requeridos.");
    return;
  }

  // 1. Buscamos el ID de la persona elegida en el buscador (o dejamos el que ya tenía)
  const idPersonaElegida = personaSeleccionada
    ? (personaSeleccionada.id_persona || personaSeleccionada.id)
    : (editForm.id_persona || editForm.id_persona_real);

  if (!idPersonaElegida || String(idPersonaElegida).startsWith("temp-")) {
    avisar.advertencia("Debe seleccionar una persona válida desde la lista desplegable del buscador.");
    return;
  }

  // 2. Determinamos si es un alta nueva o si estamos modificando una fila que YA existía en el backend
  const esAltaNueva = String(id_persona_original).startsWith("temp-") || editForm.esNuevo;

  // Obtener objetos descriptivos para la vista
  const tipoObj = listaTiposAllegados.find((t) => Number(t.id_tipo_allegado || t.id) === idTipo);
  const estudioObj = listaEstudios.find((e) => Number(e.id_nivel_estudio || e.id_estudio || e.id_estudio_alcanzado || e.id) === idEstudio);
  const ocupacionObj = listaOcupaciones.find((o) => Number(o.id_ocupacion || o.id) === idOcupacion);

  const nuevaFilaActualizada = {
    ...editForm,
    id_persona: Number(idPersonaElegida),
    id_persona_real: Number(idPersonaElegida),
    id_tipo_allegado: idTipo,
    id_nivel_estudio: idEstudio,
    id_estudio_alcanzado: idEstudio,
    id_ocupacion: idOcupacion,
    
    // 🎯 CLAVE DE LA SOLUCIÓN:
    // Mantener explícitamente el ID de la relación con la base de datos si existía previamente
    id_alumno_tutor: editForm.id_alumno_tutor || editForm.id_persona_allegado || null,
    esNuevo: esAltaNueva, // Solo será TRUE si la fila se creó desde el botón "Agregar Allegado"

    // Textos para la tabla
    nombre_tipo_allegado: tipoObj ? (tipoObj.nombre || tipoObj.descripcion) : editForm.nombre_tipo_allegado,
    nivel_estudio_tutor: estudioObj ? (estudioObj.nombre || estudioObj.descripcion) : editForm.nivel_estudio_tutor,
    estudio_alcanzado: estudioObj ? (estudioObj.nombre || estudioObj.descripcion) : editForm.estudio_alcanzado,
    ocupacion_tutor: ocupacionObj ? (ocupacionObj.nombre || ocupacionObj.descripcion) : editForm.ocupacion_tutor,
  };

  // 3. Reemplazamos la fila editada en el estado comparando contra el ID que tenía al abrir el lápiz
  const nuevaLista = allegados.map((p) => {
    const pId = p.id_persona || p.id_persona_allegado || p.id;
    return pId === id_persona_original ? nuevaFilaActualizada : p;
  });

  setAllegados(nuevaLista);
  setEditingId(null);
  setListaPersonas([]);
  setPersonaSeleccionada(null);
};

  const handleCancelRow = (id_persona) => {
    if (String(id_persona).startsWith("temp-")) {
      setAllegados(allegados.filter((p) => (p.id_persona || p.id) !== id_persona));
    }
    setEditingId(null);
    setListaPersonas([]);
    setPersonaSeleccionada(null);
  };

  const handleDeleteRow = (item) => {
    const itemId = item.id_persona || item.id_persona_allegado || item.id;
    const esNuevoSinGrabar = !item.id_persona_allegado || String(itemId).startsWith("temp-") || item.esNuevo;

    if (esNuevoSinGrabar) {
      if (typeof setAllegados === "function") {
        setAllegados((prev) => {
          const actual = Array.isArray(prev) ? prev : [];
          return actual.filter((a) => (a.id_persona || a.id_persona_allegado || a.id) !== itemId);
        });
      }
      return;
    }

    if (onEliminarAllegado) {
      onEliminarAllegado(item.id_persona_allegado || itemId);
    }
  };

// REEMPLAZAR handleAddRow EN ItemListAlumnoAllegados.js
const handleAddRow = () => {
  const tempId = `temp-${Date.now()}`;
  const nuevaFila = {
    id_persona: tempId,
    Tutor: "",
    id_tipo_allegado: "",
    id_nivel_estudio: "",
    id_ocupacion: "",
    tutor: "",
    activo: "",
    esNuevo: true // Indica que es un registro recién añadido en la UI
  };

  setAllegados([...allegados, nuevaFila]);
  setEditingId(tempId);
  setEditForm(nuevaFila);
};

  // --- OBTENCIÓN SEGURA DE NOMBRES PARA MODO LECTURA ---
  const obtenerNombreTipoAllegado = (p) => {
    const obj = resolverTipoAllegado(p);
    if (obj) return obj.nombre || obj.descripcion;
    return p.nombre_tipo_allegado || p.parentesco || p.nombre || p.id_tipo_allegado || "";
  };

  const obtenerNombreEstudio = (p) => {
    const obj = resolverEstudio(p);
    if (obj) return obj.nombre || obj.descripcion;
    return p.nivel_estudio_tutor || p.estudio_alcanzado || p.estudio || "";
  };

  const obtenerNombreOcupacion = (p) => {
    const obj = resolverOcupacion(p);
    if (obj) return obj.nombre || obj.descripcion;
    return p.ocupacion_tutor || p.ocupacion || "";
  };

  
// --- AUTO-RESOLVER IDs FALTANTES AL CARGAR CATÁLOGOS O ALLEGADOS ---
useEffect(() => {
  if (
    listaAllegados.length === 0 || 
    listaTiposAllegados.length === 0 || 
    listaEstudios.length === 0 || 
    listaOcupaciones.length === 0
  ) {
    return;
  }

  // Solo auto-completamos filas EXISTENTES (no las que se están creando o editando)
  const hayFilasSinId = listaAllegados.some(p => {
    const isTemp = String(p.id_persona || p.id || '').startsWith('temp-');
    return !isTemp && (!p.id_tipo_allegado || !p.id_nivel_estudio || !p.id_ocupacion);
  });

  if (hayFilasSinId) {
    const listaAutoCompletada = listaAllegados.map((p) => {
      const isTemp = String(p.id_persona || p.id || '').startsWith('temp-');
      if (isTemp) return p; // Dejar la fila nueva en blanco sin alterar

      const tipo = resolverTipoAllegado(p);
      const estudio = resolverEstudio(p);
      const ocupacion = resolverOcupacion(p);

      return {
        ...p,
        id_persona_real: p.id_persona_real || p.id_persona_allegado || p.id_persona || p.id,
        id_tipo_allegado: p.id_tipo_allegado || (tipo ? Number(tipo.id_tipo_allegado || tipo.id) : null),
        id_nivel_estudio: p.id_nivel_estudio || (estudio ? Number(estudio.id_nivel_estudio || estudio.id_estudio || estudio.id_estudio_alcanzado || estudio.id) : null),
        id_estudio_alcanzado: p.id_estudio_alcanzado || (estudio ? Number(estudio.id_nivel_estudio || estudio.id_estudio || estudio.id_estudio_alcanzado || estudio.id) : null),
        id_ocupacion: p.id_ocupacion || (ocupacion ? Number(ocupacion.id_ocupacion || ocupacion.id) : null),
      };
    });

    setAllegados(listaAutoCompletada);
  }
}, [listaAllegados, listaTiposAllegados, listaEstudios, listaOcupaciones, resolverTipoAllegado, resolverEstudio, resolverOcupacion, setAllegados]);

  return (
    <div className="flex flex-col gap-4">
      {/* DATALIST DE BÚSQUEDA DINÁMICA */}
      <datalist id="personas-list">
        {listaPersonas.map((item, idx) => {
          const keyVal = item.id_persona || item.id || `opt-${idx}`;
          const opcionFormateada =
            item.descripcion || `${item.apellidos} ${item.nombres} - DNI: ${item.numero}`;
          return <option key={keyVal} value={opcionFormateada} />;
        })}
      </datalist>

      <div className="flex justify-end px-2">
        <button
          type="button"
          onClick={handleAddRow}
          disabled={editingId !== null}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
        >
          <Plus size={16} /> Agregar Allegado
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full text-sm text-left text-gray-500 bg-white">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-3">Persona (Buscador)</th>
              <th scope="col" className="px-4 py-3"><div className="flex justify-center w-full">Tipo de Allegado</div></th>
              <th scope="col" className="px-4 py-3"><div className="flex justify-center w-full">Estudio Alcanzado</div></th>
              <th scope="col" className="px-4 py-3"><div className="flex justify-center w-full">Ocupación</div></th>
              <th scope="col" className="px-2 py-3 w-24"><div className="flex justify-center w-full">¿Tutor?</div></th>
              <th scope="col" className="px-2 py-3 w-24"><div className="flex justify-center w-full">¿Activo?</div></th>
              <th scope="col" className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {listaAllegados.length > 0 ? (
              listaAllegados.map((p, index) => {
                const itemUniqueId = p.id_persona || p.id_persona_allegado || p.id || `allegado-${index}`;
                const isEditing = editingId === itemUniqueId;

                return (
                  <tr key={itemUniqueId} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    

                  <td className="px-4 py-2 text-sm text-gray-700 min-w-[200px]">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          list="personas-list"
                          value={editForm.Tutor || ""}
                  onChange={(e) => {
                    const valorIngresado = e.target.value;

                    // Buscamos la persona en listaPersonas
                    const match = listaPersonas.find((item) => {
                      const fmt = item.descripcion || `${item.apellidos || item.apellido} ${item.nombres || item.nombre} - DNI: ${item.numero || item.numero_dni || item.dni}`;
                      return fmt === valorIngresado;
                    });

                    if (match) {
                    const apellidoStr = match.apellidos || match.apellido || "";
                    const nombreStr = match.nombres || match.nombre || "";
                    const dniStr = match.numero || match.numero_dni || match.dni || "";
                    const textoCompleto = `${apellidoStr} ${nombreStr} - DNI: ${dniStr}`.trim();
                      // Si hay coincidencia, actualizamos Tutor Y id_persona a la vez

                      // Obtenemos el ID de la persona seleccionada del buscador
                    const idPersonaElegida = match.id_persona || match.id || match.idPersona;

                      setEditForm((prev) => ({
                        ...prev,
                        Tutor: textoCompleto,
                      id_persona: idPersonaElegida,
                      idPersona: idPersonaElegida,
                        }));
                    } else {
                      handleInputChange("Tutor", valorIngresado);
                    }
                  }}
        onFocus={() => {
          setEditForm((prev) => ({ ...prev, Tutor: "" }));
          setListaPersonas([]);
        }}
        placeholder="Buscar por Apellido o DNI..."
        className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-blue-500 bg-blue-50"
      />

                <datalist id="personas-list">
                  {listaPersonas.map((persona) => (
                    <option
                      key={persona.id_persona}
                      value={persona.id_persona}
                    >
                      {`${persona.apellido} ${persona.nombre} - ${persona.tipo_dni || 'DNI'}: ${persona.numero_dni}`}
                    </option>
                  ))}
                </datalist>
              </>
            ) : (
              p.Tutor || (p.apellidos ? `${p.apellidos} ${p.nombres}` : "")
            )}
          </td>

                    {/* TIPO DE ALLEGADO */}
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="flex justify-center w-full">
                        {isEditing ? (
                          <select
                            value={String(editForm.id_tipo_allegado || "")}
                            onChange={(e) => handleInputChange("id_tipo_allegado", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-blue-500 w-full"
                          >
                            <option value="" disabled>-- Seleccionar --</option>
                            {listaTiposAllegados.map((item, idx) => {
                              const idVal = String(item.id_tipo_allegado || item.id || idx);
                              return (
                                <option key={idVal} value={idVal}>
                                  {item.nombre || item.descripcion}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          obtenerNombreTipoAllegado(p)
                        )}
                      </div>
                    </td>

                    {/* ESTUDIO ALCANZADO */}
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="flex justify-center w-full">
                        {isEditing ? (
                          <select
                            value={String(editForm.id_nivel_estudio || "")}
                            onChange={(e) => handleInputChange("id_nivel_estudio", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                          >
                            <option value="" disabled>-- Seleccionar --</option>
                            {listaEstudios.map((estudio, idx) => {
                              const idEstudio = String(
                                estudio.id_nivel_estudio || estudio.id_estudio || estudio.id_estudio_alcanzado || estudio.id || idx
                              );
                              return (
                                <option key={idEstudio} value={idEstudio}>
                                  {estudio.nombre || estudio.descripcion}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          obtenerNombreEstudio(p)
                        )}
                      </div>
                    </td>

                    {/* OCUPACIÓN */}
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="flex justify-center w-full">
                        {isEditing ? (
                          <select
                            value={String(editForm.id_ocupacion || "")}
                            onChange={(e) => handleInputChange("id_ocupacion", e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                          >
                            <option value="" disabled>-- Seleccionar --</option>
                            {listaOcupaciones.map((ocupacion, idx) => {
                              const idOcup = String(ocupacion.id_ocupacion || ocupacion.id || idx);
                              return (
                                <option key={idOcup} value={idOcup}>
                                  {ocupacion.nombre || ocupacion.descripcion}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          obtenerNombreOcupacion(p)
                        )}
                      </div>
                    </td>

                    {/* ¿TUTOR? */}
                    <td className="px-2 py-2 text-sm text-gray-700 w-24">
                      <div className="flex justify-center w-full">
                        {isEditing ? (
                          <select
                            value={editForm.tutor || ""}
                            onChange={(e) => handleInputChange("tutor", e.target.value)}
                            className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500 w-full text-center"
                          >
                            <option value="" enabled>--</option>
                            <option value="S">Sí</option>
                            <option value="N">No</option>
                          </select>
                        ) : (
                          p.tutor === "S" ? "Sí" : p.tutor === "N" ? "No" : ""
                        )}
                      </div>
                    </td>

                    {/* ¿ACTIVO? */}
                    <td className="px-2 py-2 text-sm text-gray-700 w-24">
                      <div className="flex justify-center w-full">
                        {isEditing ? (
                          <select
                            value={editForm.activo || ""}
                            onChange={(e) => handleInputChange("activo", e.target.value)}
                            className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500 w-full text-center"
                          >
                            <option value="" enabled>--</option>
                            <option value="S">Sí</option>
                            <option value="N">No</option>
                          </select>
                        ) : (
                          p.activo === "S" ? "Sí" : p.activo === "N" ? "No" : ""
                        )}
                      </div>
                    </td>

                    {/* ACCIONES */}
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveRow(itemUniqueId)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Aceptar fila"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelRow(itemUniqueId)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link to={`/personas/${itemUniqueId}`}>
                              <button
                                type="button"
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Ver detalle"
                              >
                                <Search size={18} />
                              </button>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEditClick(p)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Editar fila"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(p)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500 bg-white font-medium">
                  <h1 className="text-xl font-bold">No hay allegados registrados</h1>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3 mt-4 px-2">
        <button
          type="button"
          onClick={onRecargar}
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded transition-colors text-sm"
        >
          Recargar Lista
        </button>
      </div>
    </div>
  );
};

export default ItemListAlumnoAllegados;