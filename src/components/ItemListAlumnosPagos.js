import ItemPersonaPagos from './ItemPersonaPagos'

const ItemListAlumnosPagos = ({ prods, setProds, onSaldoCargado }) => {

    return (
        <div className="w-full max-w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm my-4">
            <table className="w-full text-left text-sm text-gray-700 border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th scope="col" className="px-2 py-2.5 whitespace-nowrap">Apellido</th>
                        <th scope="col" className="px-2 py-2.5 whitespace-nowrap">Nombre</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Tipo Doc.</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Nº Doc.</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Alumno/Tutor</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Nivel - Grado/Curso - División</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap">Saldo Total</th>
                        <th scope="col" className="px-2 py-2.5 text-center whitespace-nowrap min-w-[80px]">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                    {prods.length ? (
                        prods.map(p => (
                            <ItemPersonaPagos 
                                key={p.id_persona}
                                id_persona={p.id_persona}
                                id_alumno={p.id_alumno}
                                apellido={p.apellidos} 
                                nombre={p.nombres} 
                                tipo_documento={p.nombre_corto} 
                                numero={p.numero} 
                                tipo_usuario={p.es_alumno} 
                                motivo_desercion={p.motivo_desercion} 
                                activo={p.activo}
                                regular={p.regular}
                                id_nivel={p.id_nivel}
                                nombre_nivel={p.nombre_nivel}
                                nombre_grado={p.nombre_grado}
                                division={p.division}
                                saldo_total={p.saldo_total}
                                setProds={setProds}
                                onSaldoCargado={onSaldoCargado} 
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="py-10 text-center text-gray-500 bg-white font-medium">                                 
                                <h1 className="text-xl font-bold">No hay datos</h1>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default ItemListAlumnosPagos