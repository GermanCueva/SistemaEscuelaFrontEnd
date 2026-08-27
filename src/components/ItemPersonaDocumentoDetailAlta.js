import { Search, Trash2, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { avisar } from "../utils/notificaciones.js";

const ItemDetailPersonaDocumentoAlta = ({ docs, setDocs, isEditMode, onEliminarBackend }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingDocId, setEditingDocId] = useState(null);

    const [formData, setFormData] = useState({
        id_tipo_documento: '',
        id_persona_tipo_documento: '',
        numero: '',
        activo: ''
    });

    const [documentos, setDocumentos] = useState([]);
  
    // Cargar sólo los tipos de documentos de catálogo (combobox)
    const cargarTiposDocumentos = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos`)
            .then(res => res.json())
            .then(data => {
                const listaDocs = Array.isArray(data) ? data : data.documentos || data.data || [];
                setDocumentos(listaDocs);
            })
            .catch(err => console.error("Error cargando documentos", err));
    }, []);

    useEffect(() => {
        cargarTiposDocumentos();
    }, [cargarTiposDocumentos]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectEditar = (documentoAlumno) => {
        setIsEditing(true);
        const idRegistroActual = documentoAlumno.id_persona_tipo_documento || documentoAlumno.id || documentoAlumno.id_tipo_documento;
        setEditingDocId(idRegistroActual);
        
        let estadoNormalizado = 'N'; 
        if (documentoAlumno.activo) {
            const act = String(documentoAlumno.activo).toUpperCase().trim();
            if (act === 'S' || act === 'A' || act === 'ACTIVO') {
                estadoNormalizado = 'S';
            }
        }

        setFormData({
            id_tipo_documento: documentoAlumno.id_tipo_documento || '',
            id_persona_tipo_documento: idRegistroActual,
            numero: documentoAlumno.numero || '',
            activo: estadoNormalizado
        });
    };

    const cancelarEdicion = () => {
        setIsEditing(false);
        setEditingDocId(null);
        setFormData({ id_tipo_documento: '', id_persona_tipo_documento: '', numero: '', activo: '' });
    };

    // 🌟 AGREGAR / EDITAR EN MEMORIA (No hace fetch)
    const agregarDocumentoLista = (e) => {
        e.preventDefault();

        if (!formData.id_tipo_documento || !formData.numero || !formData.activo) {
            avisar.advertencia("¡Error! Por favor complete todos los campos obligatorios.");
            return;
        }

        if (isEditing) {
            // Validar que no se repita el mismo tipo antes de guardarlo en memoria local
            const yaExiste = docs.some(d => String(d.id_tipo_documento) === String(formData.id_tipo_documento));
            if (yaExiste) {
                avisar.advertencia("Este tipo de documento ya está listado en la grilla temporal.");
                return;
            }
            // Modificar elemento en el array del estado del Padre
            const listaModificada = docs.map(d => {
                const idActual = d.id || d.id_persona_tipo_documento || d.id_tipo_documento;
                if (idActual === editingDocId) {
                    return { ...d, ...formData };
                }
                return d;
            });
            setDocs(listaModificada);
        } else {
            // Validar que no se repita el mismo tipo antes de guardarlo en memoria local
            const yaExiste = docs.some(d => String(d.id_tipo_documento) === String(formData.id_tipo_documento));
            if (yaExiste) {
                avisar.advertencia("Este tipo de documento ya está listado en la grilla temporal.");
                return;
            }

            // Crear nuevo objeto temporal en memoria
            const nuevoDoc = {
                id_persona_tipo_documento: Date.now(), // ID temporal para el renderizado en memoria
                id_tipo_documento: formData.id_tipo_documento,
                numero: formData.numero,
                activo: formData.activo
            };
            setDocs([...docs, nuevoDoc]);
        }

        cancelarEdicion();
    };

    // 🌟 ELIMINAR EN MEMORIA / BACKEND (Sincronizado)
    const handleEliminar = async (docId, documentoCompleto) => {
        // Un documento es persistido si tiene id de relacion y no es un timestamp de Date.now() largo.
        const esDocumentoPersistido = documentoCompleto.id_persona_tipo_documento && String(documentoCompleto.id_persona_tipo_documento).length < 10;

        if (isEditMode && esDocumentoPersistido) {
            const confirmar = window.confirm("¿Estás seguro de que deseas eliminar permanentemente este documento?");
            if (!confirmar) return;

            // Invoca al endpoint pasándole el id del registro intermedio/documento
            const exito = await onEliminarBackend(documentoCompleto.id_persona_tipo_documento);
            if (!exito) return; // Si la petición falló, frena la remoción visual
        }

        const listaFiltrada = docs.filter(d => {
            const idActual = d.id || d.id_persona_tipo_documento || d.id_tipo_documento;
            return idActual !== docId;
        });
        
        setDocs(listaFiltrada);
        if (editingDocId === docId) cancelarEdicion(); 
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            
            {/* TABLA DE DOCUMENTOS TEMPORALES */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100 mb-10 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 px-2 text-left">Documentos Asignados (Pendientes de guardar)</h3>
                <table className="table-responsive w-full table-auto text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Tipo de Documento</th>
                          <div className="flex justify-center w-full">
                            <th scope="col" className="px-6 py-3">Número de Documento</th>
                          </div>       
                            <th scope="col" className="px-6 py-3">Activo</th>
                            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {docs && docs.length > 0 ? (
                            docs.map(d => {
                                const currentId = d.id || d.id_persona_tipo_documento || d.id_tipo_documento;
                                const tipoEncontrado = documentos.find(doc => 
                                    String(doc.id_tipo_documento || doc.id) === String(d.id_tipo_documento)
                                );

                                return (
                                    <tr key={currentId} className="odd:bg-white even:bg-gray-50 border-b hover:bg-gray-100 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                          <div className="flex justify-left w-full">
                                            {tipoEncontrado ? tipoEncontrado.nombre : `ID: ${d.id_tipo_documento}`}     
                                          </div>       
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                          <div className="flex justify-center w-full">
                                            {d.numero}
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                           <div className="flex justify-left w-full">
                                            {d.activo === 'S' || d.activo === 'A' ? 'Activo' : 'Inactivo'}
                                           </div>
                                        </td>
                                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleSelectEditar(d)}
                                                className="inline-flex items-center justify-center p-2 text-blue-700 border border-blue-500 rounded hover:bg-blue-500 hover:text-white transition-all"
                                            >
                                                <Search size={16} />
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => handleEliminar(currentId, d)}
                                                className="inline-flex items-center justify-center p-2 text-red-700 border border-red-500 rounded hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-10 text-gray-400">
                                    <h1 className="text-lg font-semibold">No se agregaron documentos a esta persona todavía.</h1>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
    
            {/* FORMULARIO DE ACCIÓN EN MEMORIA */}
            <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="mb-6 border-b pb-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 text-left">
                        {isEditing ? 'Modificar en Lista' : 'Añadir Documento'}
                    </h2>
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={cancelarEdicion}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 bg-gray-100 px-2 py-1 rounded transition-colors"
                        >
                            <X size={12} /> Cancelar
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-gray-700 text-left">Tipo de Documento:</label>
                        <select 
                            name="id_tipo_documento" 
                            value={formData.id_tipo_documento || ''} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                          //disabled={isEditing}
                        >
                            <option value="" disabled>Seleccione</option>
                            {documentos.map((doc) => (
                                <option key={doc.id_tipo_documento || doc.id} value={doc.id_tipo_documento || doc.id}>
                                    {doc.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-gray-700 text-left">Número de Documento:</label>
                        <input 
                            type="text"
                            name="numero"
                            value={formData.numero} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-gray-700 text-left">Estado:</label>
                        <select
                            name="activo"
                            value={formData.activo || ''}
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            <option value="S">Activo</option>
                            <option value="N">Inactivo</option>
                        </select>
                    </div>

                    <div className="flex justify-end mt-2">
                        <button 
                            type="button"
                            onClick={agregarDocumentoLista}
                            className="w-full px-6 py-3 font-semibold text-white rounded shadow transition-all"
                            style={{ backgroundColor: isEditing ? '#fd7e14' : '#007bff' }}
                        >
                            {isEditing ? 'Confirmar Cambios en Grilla' : 'Cargar en Grilla Temporal'}
                        </button>
                    </div>
                </div>
            </div> 
        </div>  
    );
};

export default ItemDetailPersonaDocumentoAlta;