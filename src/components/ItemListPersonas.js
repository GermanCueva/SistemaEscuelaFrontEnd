import ItemPersona from './ItemPersona'

const ItemListPersona = ({ prods }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                {/* El encabezado siempre debe ir en <thead> */}
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-12 py-3">
                            Apellido
                        </th>
                        <th scope="col" className="px-12 py-3">
                            Nombre
                        </th>
                        {/* Agrega una columna extra si el ItemPersona tiene el botón de lupa */}
                        <th scope="col" className="px-12 py-3 text-center">
                            Acciones
                        </th>
                    </tr>
                </thead>

                {/* Los datos siempre deben ir en <tbody> */}
                <tbody>
                    {prods.length ? (
                        prods.map(p => (
                            <ItemPersona 
                                key={p.id} // Siempre usa una key única en React
                                apellido={p.apellidos} 
                                nombre={p.nombres} 
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="text-center py-10">
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