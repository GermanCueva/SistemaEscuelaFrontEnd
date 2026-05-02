import { Link } from 'react-router-dom';
import milogo from '../lupa.png';

const ItemPersona = ({ apellido, nombre, id_persona }) => {
    return (
        /* Eliminamos los estilos inline como "padding: 2px" que no funcionan en class */
        <tr className="odd:bg-yellow odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">

            {/* Apellido: Usamos w-1/4 para darle un ancho fijo del 25% si quieres orden */}
            <td className="px-6 py-2 text-sm text-gray-900 dark:text-white">
                {apellido}
            </td>

            {/* Nombre */}
            <td className="px-6 py-2 text-sm text-gray-700 dark:text-gray-300">
                {nombre}
            </td>

            {/* Botón: Centrado y sin clases CSS puras */}
            <td className="px-6 py-2 text-right">
                <Link to={'/personas/' + id_persona}>
                    <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                        <img 
                            src={milogo}
                            alt="Icono" 
                            className="w-5 h-5 object-contain" 
                        />
                    </button>
                </Link>
            </td>
        </tr>
    );
}

export default ItemPersona;