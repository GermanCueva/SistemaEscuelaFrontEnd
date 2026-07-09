import { useCallback, useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom";
import { Plus } from 'lucide-react';



const ItemListTutorAlumnos = () => {
  
      const { id } = useParams();
    
      const [pers, setpers] = useState([])

      const token = localStorage.getItem('token');
    
    const obtenerDatos = useCallback(() => {
      fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnosTutorId/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      })
      .then(response => response.json())
      .then(data => setpers(data));
    }, [ token]); // <--- Agregas 'token' como dependencia
    
      useEffect(() => {     
         obtenerDatos()
        }, [obtenerDatos]);
    
    return (
        <div className="overflow-x-auto">
{/* REEMPLAZÁ LA ETIQUETA <table> COMPLETA POR ESTA: */}
        <table className="w-full text-sm text-left text-gray-500 bg-white">
                    {/* El encabezado siempre debe ir en <thead> */}
<thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                        <th scope="col" className="px-12 py-3">
                            Legajo
                        </th>
                        <th scope="col" className="px-12 py-3">
                            Nombre
                        </th>
                        <th scope="col" className="px-4 py-3">
                            Tipo de Documento
                        </th>
                        <th scope="col" className="px-4 py-3">
                            Número de Documento
                        </th>
                        <th scope="col" className="px-12 py-3">
                            Alumno/Tutor
                        </th>
                        {/* Agrega una columna extra si el ItemPersona tiene el botón de lupa */}
                        <th scope="col" className="px-12 py-30 text-center">
                            Acciones
                        </th>
            <td className="px-6 py-2 text-right">
                <Link to={'/personas/alta'}>
                    <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                        <Plus size={20} className="mr-2" />
                    </button>
                </Link>
            </td>
                    </tr>
                </thead>

                {/* Los datos siempre deben ir en <tbody> */}
                <tbody>
                    {pers && pers.length > 0 ? (
                    pers.map((p, index) => (
                        <tr key={p.id_persona || index} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        
                        {/* Apellido */}
                        <td className="px-6 py-2 text-sm text-gray-900 bg-white">
                            {p.legajo}
                        </td>

                        {/* Nombre */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            {p.nombrealumno}
                        </td>

                        {/* Tipo de Documento */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                            {p.tipo_documento}
                            </div>
                        </td>

                        {/* Número de Documento */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                            {p.numero}
                            </div>
                        </td>

                        </tr>
                    ))
                    ) : (
                        <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-500 bg-white font-medium">                                 
                                <h1 className="text-xl font-bold">No hay datos</h1>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default ItemListTutorAlumnos