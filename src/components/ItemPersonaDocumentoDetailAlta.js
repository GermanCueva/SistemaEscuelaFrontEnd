import { Search } from "lucide-react";
import { useState, useEffect } from "react";
//import Spinner from './Spinner';
import { useParams } from "react-router-dom"; //useNavigate
import { Link } from "react-router-dom";


const ItemDetailPersonaDocumentoAlta = () => {

    const [docs, setDocs] = useState([])
    const { id } = useParams();
  
    // 1. Creamos un estado único para controlar todos los campos del formulario
    const [formData, setFormData] = useState({
        tipo_documento: '',
        numero: '',
        activo: ''
    });

    const [documentos, setDocumentos] = useState([]);
  
    // 1. Cargar tipos de documentos para el SELECT
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos`)
            .then(res => res.json())
            .then(data => {
                // Si la API devuelve un objeto tipo { data: [...] }, usa data.data
                // Si devuelve el array directo, se deja "data"
                setDocumentos(Array.isArray(data) ? data : data.documentos || []);
            })
            .catch(err => console.error("Error cargando documentos", err));
    }, []);

    // 2. Cargar los documentos de la persona usando el ID de la URL
    useEffect(() => {
        if (!id) return; // Si no hay ID en la URL, no hace el fetch innecesario
        
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${id}`) // <--- Barra agregada
            .then(res => res.json())
            .then(data2 => {
                setDocs(Array.isArray(data2) ? data2 : data2.docs || []);
            })
            .catch(err => console.error("Error cargando documentos de la persona", err));
    }, [id]); // <--- Agregamos 'id' como dependencia por seguridad

  
    // 2. Manejador para actualizar el estado cada vez que el usuario escribe
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value // Actualiza dinámicamente el campo correcto
        });
    };


    // 3. Manejador para enviar los datos al backend en Node.js
    const grabar = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            let mensaje = "¡Error! No podés dejar vacío: "
            let error = false

            // Verificamos si el valor no existe, es null, undefined o un texto vacío
            if (!formData.tipo_documento || formData.tipo_documento === '') {
                mensaje = mensaje + " el Tipo de Documento, "
                error = true
            }

            // Verificamos si el valor no existe, es null, undefined o un texto vacío
            if (!formData.numero || formData.numero === '') {
                mensaje = mensaje + " el Número de Documento, "
                error = true
            }

            // Verificamos si el valor no existe, es null, undefined o un texto vacío
            if (!formData.activo || formData.activo === '') {
                mensaje = mensaje + " si es Activo o No, "
                error = true
            }

            if(error){
                alert(mensaje);
                return; // <--- IMPORTANTE: Detiene la función
            }

            // Ajusta la URL según el puerto donde corra tu Node.js (ej. 5000)
            const respuesta = await fetch(`${process.env.REACT_APP_API_URL}/api/persons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData), // Convertimos el estado de React a JSON
            });

            const datos = await respuesta.json();
            
            if (respuesta.ok) {
                // Reseteamos el estado a su forma inicial
                setFormData({
                    tipo_documento: '',
                    numero: '',
                    activo: ''
                });
            
                alert('¡Datos guardados en Node.js con éxito!');
                console.log('Respuesta del servidor:', datos);
            } else {
                alert('Error en el servidor: ' + datos.error);
            }
        } catch (error) {
            console.error('Error al conectar con el servidor:', error);
        }
    };


    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    {/* El encabezado siempre debe ir en <thead> */}
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-12 py-3">
                                Tipo de Documento
                            </th>
                            <th scope="col" className="px-12 py-3">
                                Número de Documento
                            </th>
                            <th scope="col" className="px-12 py-3 text-center">
                                Activo
                            </th>
                            <th scope="col" className="px-6 py-3">
                                {/* Celda vacía reservada para el espacio del botón de lupa en las filas */}
                            </th>
                        </tr>
                    </thead>

                    {/* Los datos siempre deben ir en <tbody> */}
                    <tbody>
                        {docs.length ? (
                            docs.map(d => (
                                <tr key={d.id} className="odd:bg-yellow odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    
                                    {/* Tipo de documento resuelto mediante búsqueda */}
                                    <td className="px-6 py-2 text-sm text-gray-900 dark:text-white">
                                        {
                                            documentos.find(doc => doc.id_tipo_documento === d.id_tipo_documento)?.nombre || "Cargando..."
                                        }            
                                    </td>

                                    {/* Número */}
                                    <td className="px-6 py-2 text-sm text-gray-700 dark:text-gray-300">
                                        {d.numero}
                                    </td>

                                    {/* Estado transformado textualmente */}
                                    <td className="px-6 py-2 text-sm text-gray-700 dark:text-gray-300 text-center">
                                        {d.activo === 'A' ? 'Activo' : d.activo === 'S' ? 'Inactivo' : d.activo}
                                    </td>

                                    {/* Botón de lupa (Solo aparece si la fila de datos existe) */}
                                    <td className="px-6 py-2 text-right">
                                        <Link to={'/personas/alta'}>
                                            <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                                                <Search size={20} className="mr-2" />
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-10">
                                    <h1 className="text-xl font-bold">No hay datos</h1>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
    
            <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="mb-8 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Alta de Documentos</h2>
                </div>
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="form-control w-full">
                                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Tipo de Documento:</span>
                                    <select 
                                        name="id_tipo_documento" 
                                        value={formData.id_tipo_documento || ''} 
                                        onChange={handleChange}
                                        className="select select-bordered w-full max-w-xs h-12"
                                    >
                                        <option value="" disabled>Seleccione</option>
                                        {documentos.map((doc) => (
                                            <option key={doc.id_tipo_documento} value={doc.id_tipo_documento}>
                                                {doc.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label className="form-control w-full">
                                <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Número de Documento:</span>
                                <input 
                                    type="text"
                                    name="numero"
                                    value={formData.numero} 
                                    onChange={handleChange}
                                    className="input input-bordered w-full"
                                    style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                                />
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="form-control w-full">
                                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Estado:</span>
                                    <select
                                        name="activo"
                                        value={formData.activo || ''}
                                        onChange={handleChange}
                                        className="select select-bordered w-full"
                                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                                    >
                                        <option value="" disabled>Seleccione una opción</option>
                                        <option value="N">Inactivo</option>
                                        <option value="S">Activo</option>
                                    </select>
                                </label>
                            </div>

                            <div className="flex justify-end mt-8">
                                <button 
                                    onClick={(e) => grabar(e)}  
                                    className="btn btn-primary mt-6"
                                    style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div> 
        </div>  
    );
};

export default ItemDetailPersonaDocumentoAlta;