import ItemPersona from './ItemPersona'


const ItemListAlumnos = ({ prods, setProds }) => {
    return (
        <div className="overflow-x-auto">
{/* REEMPLAZÁ LA ETIQUETA <table> COMPLETA POR ESTA: */}
        <table className="table-responsive w-full text-sm text-left text-gray-500 bg-white">
                    {/* El encabezado siempre debe ir en <thead> */}
<thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                        <th scope="col" className="px-12 py-3">
                            Apellido
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
                    </tr>
                </thead>

                {/* Los datos siempre deben ir en <tbody> */}
                <tbody>
                    {prods.length ? (
                        prods.map(p => (
                            <ItemPersona 
                                key={p.id_persona} // Corregido: Key única para React
                                id_persona={p.id_persona} // Siempre usa una key única en React
                                apellido={p.apellidos} 
                                nombre={p.nombres} 
                                tipo_documento={p.nombre_corto} 
                                numero={p.numero} 
                                tipo_usuario={p.es_alumno} 
                                motivo_desercion={p.motivo_desercion} 
                                activo={p.activo}
                                regular={p.regular}
                                setProds={setProds}
                            />
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

export default ItemListAlumnos