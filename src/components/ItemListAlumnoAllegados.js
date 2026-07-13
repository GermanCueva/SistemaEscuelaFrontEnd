import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Pencil, Trash2, Check, X, Plus } from 'lucide-react';
//import { avisar } from "../utils/notificaciones.js";


const ItemListAlumnoAllegados = ({ allegados = [], setAllegados, onEliminarAllegado, onRecargar }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [listaEstudios, setEstudios] = useState([]);
    const [listaOcupaciones, setOcupaciones] = useState([]);
    const [listaTiposAllegados, setTiposAllegados] = useState([]);
    const [listaPersonas, setListaPersonas] = useState([]);
    const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

    const token = localStorage.getItem('token');

    // 🛡️ 1. ESTO EVITA QUE ROMPA LA PANTALLA:
  // Si allegados no es un array (ej. es null, undefined u objeto), lo convierte a []
  const listaAllegados = Array.isArray(allegados) ? allegados : [];


    // --- CARGA DE CATÁLOGOS ---
    const obtenerOcupaciones = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/ocupacion`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setOcupaciones(Array.isArray(data) ? data : []));
    }, [token]);

    const obtenerEstudios = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/estudio`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setEstudios(Array.isArray(data) ? data : []));
    }, [token]);

    const obtenerTiposAllegado = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/tipoallegado`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setTiposAllegados(Array.isArray(data) ? data : []));
    }, [token]);

    useEffect(() => {
        obtenerOcupaciones();
        obtenerEstudios();
        obtenerTiposAllegado();
    }, [obtenerOcupaciones, obtenerEstudios, obtenerTiposAllegado]);

    // --- BÚSQUEDA DINÁMICA ---
    const obtenerDatosTodos = useCallback((textoABuscar) => {
        if (!textoABuscar || textoABuscar.trim().length < 2 || textoABuscar.includes("DNI:")) {
            setListaPersonas([]);
            return;
        }

        fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/apellidodocumento/${textoABuscar}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setListaPersonas(Array.isArray(data) ? data : []))
        .catch(() => setListaPersonas([]));
    }, [token]);

    // --- HANDLERS Y LÓGICA DE EDICIÓN LOCAL ---
    const handleEditClick = (p) => {
        setEditingId(p.id_persona);
        setEditForm({ ...p });
    };

    const handleInputChange = (e, field) => {
        const valor = e.target.value;

        setEditForm(prev => {
            const updated = { ...prev, [field]: valor };

            if (field === 'Tutor') {
                obtenerDatosTodos(valor);
                const match = listaPersonas.find(item => {
                    const fmt = item.descripcion || `${item.apellidos} ${item.nombres} - DNI: ${item.numero}`;
                    return fmt === valor;
                });
                if (match) {
                    setPersonaSeleccionada(match);
                }
            }
            return updated;
        });
    };

    const handleSaveRow = (id_persona) => {
        if (!editForm.Tutor || editForm.Tutor.trim() === "") {
            alert("Por favor, seleccione una persona utilizando el buscador.");
            return;
        }

        const resolverId = (val, lista) => {
            if (!val) return null;
            if (!isNaN(val) && Number(val) > 0) return Number(val);
            const item = lista.find(i => 
                i.nombre?.toString().trim().toLowerCase() === val.toString().trim().toLowerCase() ||
                i.descripcion?.toString().trim().toLowerCase() === val.toString().trim().toLowerCase()
            );
            return item ? Number(item.id_estudio_alcanzado || item.id_nivel_estudio || item.id_tipo_allegado || item.id_ocupacion || item.id_estudio || item.id) : null;
        };

        const idTipo = resolverId(editForm.id_tipo_allegado || editForm.nombre, listaTiposAllegados);
        const idEstudio = resolverId(editForm.id_estudio_alcanzado || editForm.id_nivel_estudio || editForm.nivel_estudio_tutor, listaEstudios);
        const idOcupacion = resolverId(editForm.id_ocupacion || editForm.ocupacion_tutor, listaOcupaciones);

        if (!idTipo || !idEstudio || !idOcupacion || !editForm.tutor || !editForm.activo) {
            alert("Por favor, complete todos los campos requeridos.");
            return;
        }

        const idReal = personaSeleccionada 
            ? (personaSeleccionada.id_persona || personaSeleccionada.id) 
            : editForm.id_persona_real || editForm.id_persona;

        const nuevaFilaActualizada = {
            ...editForm,
            id_persona_real: idReal,
            id_tipo_allegado: idTipo,
            id_estudio_alcanzado: idEstudio,
            id_ocupacion: idOcupacion,
            nombre: idTipo,
            nivel_estudio_tutor: idEstudio,
            ocupacion_tutor: idOcupacion
        };

        const nuevaLista = allegados.map(p => p.id_persona === id_persona ? nuevaFilaActualizada : p);
        setAllegados(nuevaLista);

        setEditingId(null);
        setListaPersonas([]);
        setPersonaSeleccionada(null);
    };

    const handleCancelRow = (id_persona) => {
        if (String(id_persona).startsWith('temp-')) {
            setAllegados(allegados.filter(p => p.id_persona !== id_persona));
        }
        setEditingId(null);
        setListaPersonas([]);
        setPersonaSeleccionada(null);
    };

// 🎯 2. FUNCIÓN DE ELIMINACIÓN CORREGIDA:
  const handleDeleteRow = (item) => {
    // Verificamos si es un registro no guardado todavía en la BD
    const esNuevoSinGrabar = !item.id_persona_allegado || String(item.id_persona).startsWith('temp-') || item.esNuevo;

    if (esNuevoSinGrabar) {
      // ⚠️ IMPORTANTE: Si setAllegados modifica pers.allegados en el padre:
      if (typeof setAllegados === 'function') {
        setAllegados(prev => {
          const actual = Array.isArray(prev) ? prev : [];
          // Retornamos SIEMPRE un ARRAY filtrado
          return actual.filter(a => a.id_persona !== item.id_persona);
        });
      }
      return;
    }

    // Si ya existe en la Base de Datos, llamamos al backend
    if (onEliminarAllegado) {
      onEliminarAllegado(item.id_persona_allegado || item.id_persona);
    }
  };

    const handleAddRow = () => {
        const tempId = `temp-${Date.now()}`;
        const nuevaFila = {
            id_persona: tempId,
            Tutor: "",
            id_tipo_allegado: "",
            id_nivel_estudio: "",
            id_ocupacion: "",
            tutor: "",
            activo: ""
        };

        setAllegados([...allegados, nuevaFila]);
        setEditingId(tempId);
        setEditForm(nuevaFila);
    };

    const obtenerNombreTipoAllegado = (val) => {
        if (!val) return "";
        const encontrado = listaTiposAllegados.find(a => 
            String(a.id_tipo_allegado) === String(val) || String(a.id) === String(val)
        );
        return encontrado ? encontrado.nombre : val;
    };

    const obtenerNombreEstudio = (val) => {
        if (!val) return "";
        const encontrado = listaEstudios.find(e => 
            String(e.id_nivel_estudio) === String(val) ||
            String(e.id_estudio) === String(val) || 
            String(e.id) === String(val)
        );
        return encontrado ? encontrado.nombre : val;
    };

    const obtenerNombreOcupacion = (val) => {
        if (!val) return "";
        const encontrado = listaOcupaciones.find(o => 
            String(o.id_ocupacion) === String(val) || String(o.id) === String(val)
        );
        return encontrado ? encontrado.nombre : val;
    };

    return (
        <div className="flex flex-col gap-4">
            <datalist id="personas-list">
                {listaPersonas.map((item) => {
                    const opcionFormateada = item.descripcion || `${item.apellidos} ${item.nombres} - DNI: ${item.numero}`;
                    return (
                        <option 
                            key={item.id_persona || item.id} 
                            value={opcionFormateada} 
                        />
                    );
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

                            <th scope="col" className="px-4 py-3">
                                <div className="flex justify-center w-full">
                                Tipo de Allegado
                                </div>
                            </th>

                            <th scope="col" className="px-4 py-3">
                                <div className="flex justify-center w-full">
                                Estudio Alcanzado
                                </div>
                            </th>

                            <th scope="col" className="px-4 py-3">
                                <div className="flex justify-center w-full">
                                Ocupación
                                </div>
                            </th>

                            <th scope="col" className="px-2 py-3 w-24">
                                ¿Tutor?
                            </th>

                            <th scope="col" className="px-2 py-3 w-24">
                                <div className="flex justify-center w-full">
                                ¿Activo?
                                </div>
                            </th>
  
                            <th scope="col" className="px-4 py-3 text-center">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {listaAllegados.length > 0 ? (
                            listaAllegados.map((p) => {
                                const isEditing = editingId === p.id_persona;

                                return (
                                    <tr key={p.id_persona} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2 text-sm text-gray-700 min-w-[200px]">
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    list="personas-list" 
                                                    value={editForm.Tutor || ""} 
                                                    onChange={(e) => handleInputChange(e, 'Tutor')}
                                                    onFocus={() => {
                                                        setEditForm({ ...editForm, Tutor: "" });
                                                        setListaPersonas([]);
                                                    }}
                                                    placeholder="Buscar por Apellido o DNI..."
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-blue-500 bg-blue-50"
                                                />
                                            ) : p.Tutor}
                                        </td>

                                        {/* TIPO DE ALLEGADO */}
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                            <div className="flex justify-center w-full"> 
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.id_tipo_allegado || editForm.nombre || ""} 
                                                    onChange={(e) => handleInputChange(e, 'id_tipo_allegado')}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-blue-500 w-full"
                                                >
                                                    <option value="" disabled>-- Seleccionar --</option>
                                                    {listaTiposAllegados.map((allegado) => (
                                                        <option key={allegado.id_tipo_allegado || allegado.id} value={allegado.id_tipo_allegado || allegado.id}>
                                                            {allegado.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                obtenerNombreTipoAllegado(p.id_tipo_allegado || p.nombre)
                                            )}
                                            </div>
                                        </td>

                                        {/* ESTUDIO ALCANZADO */}
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                          <div className="flex justify-center w-full"> 
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.id_nivel_estudio || editForm.nivel_estudio_tutor || ""} 
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditForm(prev => ({
                                                            ...prev,
                                                            id_nivel_estudio: val,
                                                            nivel_estudio_tutor: val
                                                        }));
                                                    }}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                                                >
                                                    <option value="" disabled>-- Seleccionar --</option>
                                                    {listaEstudios.map((estudio) => {
                                                        const idEstudio = estudio.id_nivel_estudio || estudio.id_estudio || estudio.id_nivel_estudios || estudio.id;
                                                        return (
                                                            <option key={idEstudio} value={idEstudio}>
                                                                {estudio.nombre || estudio.descripcion}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            ) : (
                                                obtenerNombreEstudio(p.id_nivel_estudio || p.nivel_estudio_tutor)
                                            )}
                                            </div>
                                        </td>

                                        {/* OCUPACIÓN */}
                                        <td className="px-4 py-2 text-sm text-gray-700">
                                            <div className="flex justify-center w-full">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.id_ocupacion || editForm.ocupacion_tutor || ""} 
                                                    onChange={(e) => handleInputChange(e, 'id_ocupacion')}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                                                >
                                                    <option value="" disabled>-- Seleccionar --</option>
                                                    {listaOcupaciones.map((ocupacion) => (
                                                        <option key={ocupacion.id_ocupacion || ocupacion.id} value={ocupacion.id_ocupacion || ocupacion.id}>
                                                            {ocupacion.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                obtenerNombreOcupacion(p.id_ocupacion || p.ocupacion_tutor)
                                            )}
                                            </div>
                                        </td>

                                        {/* ¿TUTOR? */}
                                        <td className="px-2 py-2 text-sm text-gray-700 w-24">
                                             <div className="flex justify-center w-full">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.tutor || ""} 
                                                    onChange={(e) => handleInputChange(e, 'tutor')}
                                                    className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500 w-full text-center"
                                                >
                                                    <option value="" disabled>--</option>
                                                    <option value="S">Sí</option>
                                                    <option value="N">No</option>
                                                </select>
                                            ) : (p.tutor === 'S' ? 'Sí' : 'No')}
                                            </div>
                                        </td>

                                        {/* ¿ACTIVO? */}
                                        <td className="px-2 py-2 text-sm text-gray-700 w-24">
                                            <div className="flex justify-center w-full">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.activo || ""} 
                                                    onChange={(e) => handleInputChange(e, 'activo')}
                                                    className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500 w-full text-center"
                                                >
                                                    <option value="" disabled>--</option>
                                                    <option value="S">Sí</option>
                                                    <option value="N">No</option>
                                                </select>
                                            ) : (p.activo === 'S' ? 'Sí' : 'No')}
                                            </div>
                                        </td>

                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleSaveRow(p.id_persona)}
                                                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                            title="Aceptar fila"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleCancelRow(p.id_persona)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                            title="Cancelar"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={'/personas/' + p.id_persona}>
                                                            <button type="button" className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Ver detalle">
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