import { Search, Trash2, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { avisar } from "../utils/notificaciones.js";

const ItemPersonaAlumnoDetailAlta = ({ docs, setDocs, isEditMode, onEliminarBackend }) => {
    const [isEditing, setIsEditing] = useState(false);
 //   const [editingDocId, setEditingDocId] = useState(null);

    const [desercion, setDesercion] = useState([]);

    const cargarDeserciones = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/desercion`)
            .then(res => res.json())
            .then(data => {
                const listaDesercion = Array.isArray(data) ? data : data.desercion || data.data || [];
                setDesercion(listaDesercion);
            })
            .catch(err => console.error("Error cargando documentos", err));
    }, []);

    useEffect(() => {
        cargarDeserciones();
    }, [cargarDeserciones]); 

   const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const [formData, setFormData] = useState({
        legajo: '',
        extranjero: '',
        regular: '',
        id_motivo_desercion: '',
        es_celiaco: '',
        direccion_calle: '',
        direccion_numero: '',
        direccion_piso: '',
        direccion_depto: ''
    });

    return (      
                   <div className="flex flex-col gap-6">

                  <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Legajo:</label>
                        <input 
                            type="text"
                            name="legajo"
                            value={formData.legajo} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Extranjero:</label>
                        <select
                            name="extranjero"
                            value={formData.extranjero || ''}
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            <option value="N">Si</option>
                            <option value="S">No</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Alumno Regular:</label>
                        <select
                            name="regular"
                            value={formData.regular || ''}
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            <option value="N">Si</option>
                            <option value="S">No</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Motivo Deserción:</label>
                        <select 
                            name="id_motivo_desercion" 
                            value={formData.id_motivo_desercion || ''} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                            disabled={isEditing} 
                        >
                            <option value="" disabled>Seleccione</option>
                            {desercion.map((des) => (
                                <option key={des.id_motivo_desercion || des.id} value={des.id_motivo_desercion || des.id}>
                                    {des.nombre}
                                </option>
                            ))}
                               
                        </select>
                    </div>

                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Es celíaco:</label>
                        <select
                            name="es_celiaco"
                            value={formData.es_celiaco || ''}
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3 bg-white"
                        >
                            <option value="" disabled>Seleccione una opción</option>
                            <option value="N">Si</option>
                            <option value="S">No</option>
                        </select>
                    </div>

                  <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Calle:</label>
                        <input 
                            type="text"
                            name="direccion_calle"
                            value={formData.direccion_calle} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                  <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Número:</label>
                        <input 
                            type="text"
                            name="direccion_numero"
                            value={formData.direccion_numero} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                  <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Piso:</label>
                        <input 
                            type="text"
                            name="direccion_piso"
                            value={formData.direccion_piso} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                    <div className="flex flex-col gap-2 max-w-md">
                        <label className="font-bold text-gray-700 text-left">Depto:</label>
                        <input 
                            type="text"
                            name="direccion_depto"
                            value={formData.direccion_depto} 
                            onChange={handleChange}
                            className="w-full h-12 border border-gray-300 rounded-md px-3"
                        />
                    </div>

                </div>

                
 
    )
      
 };


export default ItemPersonaAlumnoDetailAlta;