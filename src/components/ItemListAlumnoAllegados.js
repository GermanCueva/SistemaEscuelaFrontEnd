import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Pencil, Trash2, Check, X, Plus } from 'lucide-react';


const ItemListAlumnoAllegados = () => {
    const { id } = useParams();
    const [pers, setpers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Catálogo para el buscador dinámico de personas
    const [listaPersonas, setListaPersonas] = useState([]);

    // --- OPCIONES PARA LOS COMBOS (ESTUDIO Y OCUPACIÓN) ---
    const listaEstudios = [
        "Primario Incompleto", 
        "Primario Completo", 
        "Secundario Incompleto",
        "Secundario", 
        "Terciario", 
        "Universitario", 
        "Especialización",
        "Postgrado"
    ];

    const listaOcupaciones = [
        "Profesionales científicos e intelectuales",
        "Operadores de instalaciones y máquinas y ensambladores",
        "Comerciante", 
        "Docente", 
        "Empleado Público", 
        "Quehaceres del hogar",
        "Desocupado/a",
        "Otro"
    ];

    const token = localStorage.getItem('token');

    const obtenerDatos = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutoresId/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => setpers(Array.isArray(data) ? data : []));
    }, [id, token]);

    // Busca dinámicamente en el backend (admite Apellido o DNI según tu nueva lógica)
    const obtenerDatosTodos = useCallback((textoABuscar) => {
        // SEGURIDAD: Si no hay texto, es muy corto, o contiene "DNI:" (porque se seleccionó de la lista), NO busca.
        if (!textoABuscar || textoABuscar.trim().length < 2 || textoABuscar.includes("DNI:")) {
            setListaPersonas([]); 
            return;
        }

        fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/apellidodocumento/${textoABuscar}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            // SEGURIDAD: Validamos que la API devuelva un Array para evitar que falle el .map()
            if (Array.isArray(data)) {
                setListaPersonas(data);
            } else {
                setListaPersonas([]);
            }
        })
        .catch(err => {
            console.error("Error buscando personas:", err);
            setListaPersonas([]);
        });
    }, [token]);


    useEffect(() => {
        obtenerDatos();
    }, [obtenerDatos]);



    // --- ACCIONES LOCALES ---
    const handleEditClick = (p) => {
        setEditingId(p.id_persona);
        setEditForm({ ...p });
        // Al editar no disparamos la búsqueda porque ya viene con el nombre resuelto
    };

    const handleInputChange = (e, field) => {
        const valor = e.target.value;
        
        setEditForm({
            ...editForm,
            [field]: valor
        });

        // Dispara la búsqueda en tiempo real si se modifica el campo de la persona
        if (field === 'Tutor') {
            obtenerDatosTodos(valor);
        }
    };

const handleSaveRow = (id_persona) => {
        // 1. Buscamos si el texto ingresado coincide exactamente con alguna opción válida del datalist
        const esValido = listaPersonas.some(item => {
            const opcionFormateada = item.descripcion || `${item.apellidos} ${item.nombres} - DNI: ${item.numero}`;
            return editForm.Tutor === opcionFormateada;
        });

        // 2. Si el campo está vacío o no es una opción válida del buscador, bloqueamos el guardado
        if (!editForm.Tutor || editForm.Tutor.trim() === "") {
            alert("Por favor, seleccione una persona utilizando el buscador.");
            return;
        }

        if (!esValido) {
            alert("Persona no válida. Debe seleccionar una de las opciones sugeridas en el buscador.");
            return;
        }

        // 3. Si pasa las validaciones, guarda normalmente
        setpers(pers.map(p => p.id_persona === id_persona ? editForm : p));
        setEditingId(null);
        setListaPersonas([]); 
    };

    const handleCancelRow = () => {
        setEditingId(null);
        setListaPersonas([]); 
    };

    const handleDeleteRow = (id_persona) => {
        if (window.confirm("¿Seguro que deseas remover este allegado de la lista?")) {
            setpers(pers.filter(p => p.id_persona !== id_persona));
        }
    };

    const handleAddRow = () => {
        const nuevoIdTemporal = Date.now();
        const nuevaFila = {
            id_persona: nuevoIdTemporal,
            Tutor: "", 
            nombre: "Madre",
            nivel_estudio_tutor: listaEstudios[3],
            ocupacion_tutor: listaOcupaciones[0],  
            tutor: "N",
            activo: "S"
        };
        setpers([nuevaFila, ...pers]);
        setEditingId(nuevoIdTemporal);
        setEditForm(nuevaFila);
        setListaPersonas([]);
    };

    const handleGuardarCambiosTotales = () => {
        console.log("Datos finales listos para la API:", pers);
        alert("¡Cambios guardados correctamente!");
    };

    return (
        <div className="flex flex-col gap-4">
            
            {/* Buscador de personas asociado al datalist con formato Apellido Nombre - DNI */}
            <datalist id="personas-list">
                {listaPersonas && listaPersonas.map((item) => {
                    const opcionFormateada = item.descripcion || `${item.apellidos} ${item.nombres} - DNI: ${item.numero}`;
                    return (
                        <option 
                            key={item.id_persona || item.id} 
                            value={opcionFormateada} 
                        />
                    );
                })}
            </datalist>

            {/* Botón Agregar */}
            <div className="flex justify-end px-2">
                <button 
                    onClick={handleAddRow}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
                >
                    <Plus size={16} /> Agregar Allegado
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left text-gray-500 bg-white">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th scope="col" className="px-6 py-3">Persona (Buscador)</th>
                            <th scope="col" className="px-6 py-3 text-center">Tipo de Allegado</th>
                            <th scope="col" className="px-6 py-3 text-center">Estudio Alcanzado</th>
                            <th scope="col" className="px-6 py-3 text-center">Ocupación</th>
                            <th scope="col" className="px-3 py-3 text-center">¿Tutor?</th>
                            <th scope="col" className="px-3 py-3 text-center">¿Activo?</th>
                            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {pers && pers.length > 0 ? (
                            pers.map((p, index) => {
                                const isEditing = editingId === p.id_persona;

                                return (
                                    <tr key={p.id_persona || index} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        
                                        {/* Persona (Buscador Dinámico por Apellido o DNI) */}
                                        <td className="px-6 py-2 text-sm text-gray-700 min-w-[240px]">
                                            {isEditing ? (
                                            <input 
                                                type="text" 
                                                list="personas-list" 
                                                value={editForm.Tutor || ""} 
                                                onChange={(e) => handleInputChange(e, 'Tutor')}
                                                // 👇 AGREGA ESTA LÍNEA AQUÍ
                                                onFocus={(e) => {
                                                    // Al hacer foco, vaciamos el campo para buscar de cero
                                                    setEditForm({ ...editForm, Tutor: "" });
                                                    setListaPersonas([]);
                                                }}
                                                placeholder="Buscar por Apellido o DNI..."
                                                className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-blue-500 bg-blue-50"
                                            />
                                            ) : p.Tutor}
                                        </td>

                                        {/* Tipo de Allegado (Combo) */}
                                        <td className="px-6 py-2 text-sm text-gray-700 text-center">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.nombre} 
                                                    onChange={(e) => handleInputChange(e, 'nombre')}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-blue-500"
                                                >
                                                    <option value="Madre">Madre</option>
                                                    <option value="Padre">Padre</option>
                                                    <option value="Tutor/a Legal">Tutor/a Legal</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            ) : p.nombre}
                                        </td>

                                        {/* Estudio Alcanzado */}
                                        <td className="px-6 py-2 text-sm text-gray-700 text-center min-w-[180px]">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.nivel_estudio_tutor} 
                                                    onChange={(e) => handleInputChange(e, 'nivel_estudio_tutor')}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                                                >
                                                    {listaEstudios.map((estudio, i) => (
                                                        <option key={i} value={estudio}>{estudio}</option>
                                                    ))}
                                                </select>
                                            ) : p.nivel_estudio_tutor}
                                        </td>

                                        {/* Ocupación */}
                                        <td className="px-6 py-2 text-sm text-gray-700 text-center min-w-[220px]">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.ocupacion_tutor} 
                                                    onChange={(e) => handleInputChange(e, 'ocupacion_tutor')}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-blue-500"
                                                >
                                                    {listaOcupaciones.map((ocupacion, i) => (
                                                        <option key={i} value={ocupacion}>{ocupacion}</option>
                                                    ))}
                                                </select>
                                            ) : p.ocupacion_tutor}
                                        </td>

                                        {/* ¿Tutor? */}
                                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.tutor} 
                                                    onChange={(e) => handleInputChange(e, 'tutor')}
                                                    className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500"
                                                >
                                                    <option value="S">Sí</option>
                                                    <option value="N">No</option>
                                                </select>
                                            ) : (p.tutor === 'S' ? 'Sí' : 'No')}
                                        </td>

                                        {/* ¿Activo? */}
                                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                                            {isEditing ? (
                                                <select 
                                                    value={editForm.activo} 
                                                    onChange={(e) => handleInputChange(e, 'activo')}
                                                    className="border border-gray-300 rounded px-1 py-1 text-sm focus:outline-blue-500"
                                                >
                                                    <option value="S">Sí</option>
                                                    <option value="N">No</option>
                                                </select>
                                            ) : (p.activo === 'S' ? 'Sí' : 'No')}
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-6 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleSaveRow(p.id_persona)}
                                                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={handleCancelRow}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={'/personas/' + p.id_persona}>
                                                            <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                                                <div className="inline-flex items-center justify-center p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors">
                                                                    <Search size={20} className="mr-2" />
                                                                </div>
                                                            </button>
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleEditClick(p)}
                                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRow(p.id_persona)}
                                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
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
                                    <h1 className="text-xl font-bold">No hay datos</h1>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Botones de acción finales */}
            <div className="flex justify-end gap-3 mt-4 px-2">
                <button 
                    onClick={obtenerDatos} 
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded transition-colors text-sm"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleGuardarCambiosTotales}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors text-sm"
                >
                    Guardar Cambios Totales
                </button>
            </div>
        </div>
    );
};

export default ItemListAlumnoAllegados;