import ItemPersona from './ItemPersona'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react';

const ItemListPersona = ({ prods, setProds }) => {
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
                    {prods.length ? (
                        prods.map(p => (
                            <ItemPersona 
                                key={p.id_persona} // Corregido: Key única para React
                                id_persona={p.id_persona} // Siempre usa una key única en React
                                apellido={p.apellidos} 
                                nombre={p.nombres} 
                                setProds={setProds}
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