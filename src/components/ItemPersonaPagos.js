import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';


const ItemPersonaPagos = ({ apellido, nombre, id_persona, id_alumno, tipo_documento, numero, tipo_usuario, activo, motivo_desercion, regular, setProds }) => {




return (
        <tr className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">

            {/* Apellido */}
            <td className="px-6 py-2 text-sm text-gray-900 bg-white">
                {apellido}
            </td>

            {/* Nombre */}
            <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                {nombre}
            </td>

            {/* Tipo de Documento */}
            <td className="px-6 py-2 text-sm text-gray-700 bg-white">
                <div className="flex justify-center w-full">
                {tipo_documento}
                </div>
            </td>

            {/* Número de Documento */}
            <td className="px-6 py-2 text-sm text-gray-700 bg-white">
             <div className="flex justify-center w-full">
                {numero}
            </div>
            </td>

            {/* Tipo de Usuario */}
            <td className="px-6 py-2 text-sm bg-white">  
                <div className="flex justify-center w-full">
                    {tipo_usuario === "S" && activo === "S" && regular === "S"  ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Alumno
                        </span>
                    ): tipo_usuario === "S" && activo === "N" && regular === "N" && motivo_desercion ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           {motivo_desercion}
                        </span>
                    ): tipo_usuario === "S" && activo === "S" && regular === "N" && motivo_desercion ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           {motivo_desercion}
                        </span>
                    ): tipo_usuario === "S" && activo === "N" && regular === "N" && !motivo_desercion ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           No Regular Sin Motivo
                        </span>
                    ): tipo_usuario === "S" && activo === "S" && regular === "N" && !motivo_desercion ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           No Regular Sin Motivo
                        </span>
                    ): tipo_usuario === "S" && activo === "N" && regular === "S" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           Inactivo
                        </span>
                    ): tipo_usuario === "N" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                           Tutor
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            Otro Motivo
                        </span>
                    )}
                </div>
            </td>

            {/* Botones de Acciones */}
            <td className="px-6 py-2 text-sm text-center bg-white">
                <div className="flex items-center justify-center gap-2">
                    <Link to={'/gestion/SaldoAlumno/' + id_alumno}>
                        <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                            <Search size={20} className="mr-2" />
                        </button>
                    </Link>
                </div>
            </td>
        </tr>
    );
}

export default ItemPersonaPagos;