import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Trash2 } from 'lucide-react';


const ItemPersonaPagos = ({ apellido, nombre, id_persona, tipo_documento, numero, tipo_usuario, activo, motivo_desercion, regular, setProds }) => {


  const cambiar_estado = async (e) => {
    e.preventDefault();

        const confirmar = window.confirm("¿Estás seguro de que deseas eliminar permanentemente esta persona?");
            if (!confirmar) return;
   
  const token = localStorage.getItem('token');

  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/${id_persona}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Le pasamos el token de la línea 13
        }
      });

     // const data = await response.json();

      if (response.ok) {
           setProds(prevProds => prevProds.filter(persona => persona.id_persona !== id_persona));      
        } else {
       // setMensaje(`Error: ${data.message || 'No se pudo actualizar'}`);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
     // setMensaje('Error de red al intentar actualizar.');
    }

  };


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
                    <Link to={'/personas/' + id_persona}>
                        <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                            <Search size={20} className="mr-2" />
                        </button>
                    </Link>
  
                    <button onClick={(e) => cambiar_estado(e)} className="flex items-center bg-red-500 text-white p-2 rounded hover:bg-red-600">
                        <Trash2 size={17} className="mr-2" />
                    </button>
               </div>
            </td>
        </tr>
    );
}

export default ItemPersonaPagos;