import { Search, Trash2, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

const ItemDetailPersonaDocumentoAlta = () => {
    const [docs, setDocs] = useState([]);
    const { id } = useParams(); // ID de la persona/alumno
    
    const [isEditing, setIsEditing] = useState(false);
    // Mantenemos una referencia alternativa por seguridad
    const [editingDocId, setEditingDocId] = useState(null);

    const [formData, setFormData] = useState({
        id_tipo_documento: '', // Para guardar el tipo seleccionado en el select (10, 8, etc.)
        id_persona_tipo_documento: '', // AQUÍ GUARDAMOS EL ID DEL REGISTRO A MODIFICAR
        numero: '',
        activo: ''
    });

    const [documentos, setDocumentos] = useState([]);
  
    // 1. Cargar tipos de documentos
    const cargarTiposDocumentos = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos`)
            .then(res => res.json())
            .then(data => {
                const listaDocs = Array.isArray(data) ? data : data.documentos || data.data || [];
                setDocumentos(listaDocs);
            })
            .catch(err => console.error("Error cargando documentos", err));
    }, []);

    // 2. Cargar los documentos de la persona
    const cargarDocumentosPersona = useCallback(() => {
        if (!id) return;
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${id}`) 
            .then(res => res.json())
            .then(data2 => {
                const misDocs = Array.isArray(data2) ? data2 : data2.docs || data2.data || [];
                setDocs(misDocs);
            })
            .catch(err => console.error("Error cargando documentos de la persona", err));
    }, [id]);

    // 3. Inicializar la carga de datos
    useEffect(() => {
        cargarTiposDocumentos();
        cargarDocumentosPersona();
    }, [cargarTiposDocumentos, cargarDocumentosPersona]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value 
        });
    };

    // Al hacer click en la lupa para EDITAR
    const handleSelectEditar = (documentoAlumno) => {
        setIsEditing(true);
        
        // Buscamos cuál es el ID real que identifica esta fila mapeando las opciones comunes
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
            id_persona_tipo_documento: idRegistroActual, // Nos aseguramos de inyectarlo en el estado
            numero: documentoAlumno.numero || '',
            activo: estadoNormalizado
        });
    };

    const cancelarEdicion = () => {
        setIsEditing(false);
        setEditingDocId(null);
        setFormData({
            id_tipo_documento: '',
            id_persona_tipo_documento: '',
            numero: '',
            activo: ''
        });
    };

    const grabar = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!formData.id_tipo_documento || !formData.numero || !formData.activo) {
            alert("¡Error! Por favor complete todos los campos obligatorios.");
            return;
        }

        try {
            // Usamos el ID seguro para armar la URL del PUT
            const idParaUrl = formData.id_persona_tipo_documento || editingDocId;

            const url = isEditing 
                ? `${process.env.REACT_APP_API_URL}/api/documentos/${idParaUrl}` 
                : `${process.env.REACT_APP_API_URL}/api/documentos`; 

            const metodo = isEditing ? 'PUT' : 'POST';

            // Armamos el objeto definitivo forzando a que id_persona_tipo_documento no sea undefined
            const datosAEnviar = { 
                ...formData, 
                id_persona: id,
                id_persona_tipo_documento: isEditing ? idParaUrl : formData.id_tipo_documento
            };

            const respuesta = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(datosAEnviar), 
            });

            const datos = await respuesta.json();
            
            if (respuesta.ok) {
                alert(isEditing ? '¡Documento actualizado con éxito!' : '¡Documento guardado con éxito!');
                cancelarEdicion();
                cargarDocumentosPersona(); 
            } else {
                alert('Error en el servidor: ' + (datos.error || datos.mensaje));
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
        }
    };

    const handleEliminar = async (docId) => {
        if (!window.confirm("¿De verdad querés eliminar este documento?")) return;

        const token = localStorage.getItem('token');
        try {
            const respuesta = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${docId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                alert('Documento eliminado correctamente.');
                if (editingDocId === docId || formData.id_persona_tipo_documento === docId) cancelarEdicion(); 
                cargarDocumentosPersona(); 
            } else {
                const datos = await respuesta.json();
                alert('Error al eliminar: ' + (datos.error || 'Error del servidor'));
            }
        } catch (error) {
            console.error('Error al eliminar documento:', error);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            
            {/* TABLA DE DOCUMENTOS */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100 mb-10 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 px-2 text-left">Documentos del Alumno</h3>
                <table className="w-full table-auto text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Tipo de Documento</th>
                            <th scope="col" className="px-6 py-3">Número de Documento</th>
                            <th scope="col" className="px-6 py-3 text-center">Activo</th>
                            <th scope="col" className="px-6 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {docs.length > 0 ? (
                            docs.map(d => {
                                const tipoEncontrado = documentos.find(doc => 
                                    String(doc.id_tipo_documento || doc.id) === String(d.id_tipo_documento || d.id)
                                );

                                return (
                                    <tr key={d.id || d.id_persona_tipo_documento} className="odd:bg-white even:bg-gray-50 border-b hover:bg-gray-100 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {tipoEncontrado ? tipoEncontrado.nombre : `ID: ${d.id_tipo_documento || 'Desconocido'}`}            
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {d.numero}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 text-center">
                                            {d.activo === 'S' || d.activo === 'A' ? 'Activo' : 'Inactivo'}
                                        </td>
                                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={() => handleSelectEditar(d)}
                                                title="Editar registro"
                                                className="inline-flex items-center justify-center p-2 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 rounded transition-all"
                                            >
                                                <Search size={16} />
                                            </button>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => handleEliminar(d.id || d.id_persona_tipo_documento)}
                                                title="Eliminar registro"
                                                className="inline-flex items-center justify-center p-2 bg-transparent hover:bg-red-500 text-red-700 hover:text-white border border-red-500 rounded transition-all"
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
                                    <h1 className="text-lg font-semibold">Este alumno no posee documentos cargados.</h1>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
    
            {/* FORMULARIO */}
            <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="mb-6 border-b pb-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 text-left">
                        {isEditing ? 'Modificar Documento' : 'Alta de Documentos'}
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
                
                <form onSubmit={grabar} className="flex flex-col gap-6">
                    
                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-gray-700 text-left">Tipo de Documento:</label>
                        <select 
                            name="id_tipo_documento" 
                            value={formData.id_tipo_documento || ''} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:border-blue-500 transition-colors"
                            style={{ border: '1px solid #ccc' }}
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
                            className="w-full h-12 border border-gray-300 rounded-md px-3 focus:outline-none focus:border-blue-500 transition-colors"
                            style={{ border: '1px solid #ccc' }}
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <label className="font-bold text-gray-700 text-left">Estado:</label>
                        <select
                            name="activo"
                            value={formData.activo || ''}
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white focus:outline-none focus:border-blue-500 transition-colors"
                            style={{ border: '1px solid #ccc' }}
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            <option value="N">Inactivo</option>
                            <option value="S">Activo</option>
                        </select>
                    </div>

                    <div className="flex justify-end mt-2">
                        <button 
                            type="submit"
                            className="w-full px-6 py-3 font-semibold text-white rounded shadow transition-all"
                            style={{ backgroundColor: isEditing ? '#fd7e14' : '#007bff' }}
                        >
                            {isEditing ? 'Actualizar Cambios' : 'Guardar Nuevo'}
                        </button>
                    </div>
                </form>
            </div> 
        </div>  
    );
};

export default ItemDetailPersonaDocumentoAlta;