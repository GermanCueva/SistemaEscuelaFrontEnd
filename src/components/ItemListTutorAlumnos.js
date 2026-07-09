import { useCallback, useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom";
import { Search } from 'lucide-react';



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
    }, [id, token]); // <--- Agregas 'token' como dependencia
    
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
                         <div className="flex justify-center w-full">
                            Legajo
                         </div>
                        </th>
                        <th scope="col" className="px-12 py-3">
                            Nombre
                        </th>
                        <th scope="col" className="px-4 py-3">
                          <div className="flex justify-center w-full">
                            Tipo de Documento
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3">
                          <div className="flex justify-center w-full">
                            Número de Documento
                          </div>
                        </th>
                        <th scope="col" className="px-12 py-3">
                          <div className="flex justify-center w-full">
                            Tipo de Allegado
                         </div>
                        </th>
                        <th scope="col" className="px-3 py-3">
                          <div className="flex justify-center w-full">
                            ¿Tutor?
                          </div>
                        </th>
                        <th scope="col" className="px-3 py-3">
                          <div className="flex justify-center w-full">
                            ¿Activo?
                          </div>
                        </th>
                        {/* Agrega una columna extra si el ItemPersona tiene el botón de lupa */}
                        <th scope="col" className="px-3 py-30 text-center">
                            Acciones
                        </th>

                    </tr>
                </thead>

                {/* Los datos siempre deben ir en <tbody> */}
                <tbody>
                    {pers && pers.length > 0 ? (
                    pers.map((p, index) => (
                        <tr key={p.id_persona || index} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        
                        {/* Legajo */}
                        <td className="px-6 py-2 text-sm text-gray-900 bg-white">
                            <div className="flex justify-center w-full">
                                {p.legajo}
                            </div>
                        </td>

                        {/* Nombre */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            {p.nombrealumno}
                        </td>

                        {/* Tipo de Documento */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                            {p.nombre_corto}
                            </div>
                        </td>

                        {/* Número de Documento */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                            {p.numero}
                            </div>
                        </td>
                        {/* Tipo de Allegado */}
                        <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                            {p.nombre}
                            </div>
                        </td>
                        {/* ¿Tutor? */}
                        <td className="px-3 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                                <span>{p.tutor === 'S' ? 'Sí' : 'No'}</span>
                            </div>
                        </td>
                        {/* ¿Activo? */}
                        <td className="px-3 py-2 text-sm text-gray-700 bg-white">
                            <div className="flex justify-center w-full">
                                <span>{p.activo === 'S' ? 'Sí' : 'No'}</span>
                            </div>
                        </td>
                        <Link to={'/personas/' + p.id_persona_alumno}>
                        <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                           <div className="marginLeft: '10px' inline-flex items-center justify-center p-1 ml-2 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors">
                            <Search size={20} className="mr-2" />
                           </div>
                        </button>
                        </Link>
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