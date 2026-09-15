import ItemPersona from './ItemPersona'

const ItemListPersona = ({ prods, setProds, esAlumno }) => {
    return (
        <div className="w-full max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm my-4">
            <table className="w-full text-left border-collapse text-sm">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th scope="col" className="px-2 py-2.5 whitespace-nowrap">Apellido</th>
                        <th scope="col" className="px-2 py-2.5 whitespace-nowrap">Nombre</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Tipo Doc.</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Nº Doc.</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Alumno/Tutor</th>
                        {esAlumno && (
                            <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Nivel - Grado/Curso - División</th>
                        )}
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap min-w-[80px]">Acciones</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {prods.length ? (
                        prods.map(p => (
                            <ItemPersona 
                                key={p.id_persona}
                                id_persona={p.id_persona}
                                apellido={p.apellidos} 
                                nombre={p.nombres} 
                                tipo_documento={p.nombre_corto} 
                                numero={p.numero} 
                                tipo_usuario={p.es_alumno} 
                                motivo_desercion={p.motivo_desercion} 
                                activo={p.activo}
                                regular={p.regular}
                                nombre_nivel={p.nombre_nivel}
                                nombre_grado={p.nombre_grado}
                                division={p.division}
                                esAlumno={esAlumno}
                                setProds={setProds}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={esAlumno ? 7 : 6} className="py-10 text-center text-gray-500 bg-white font-medium">                                 
                                <h1 className="text-xl font-bold">No hay datos</h1>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default ItemListPersona