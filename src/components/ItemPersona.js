import { Link } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';

const ItemPersona = ({ 
    apellido, 
    nombre, 
    id_persona, 
    tipo_documento, 
    numero, 
    tipo_usuario, 
    activo, 
    motivo_desercion, 
    regular, 
    nombre_nivel, 
    nombre_grado, 
    esAlumno, 
    setProds 
}) => {

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
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProds(prevProds => prevProds.filter(persona => persona.id_persona !== id_persona));      
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    }
  };

  const nivelCompleto = [nombre_nivel, nombre_grado].filter(Boolean).join(" - ");

  const getNivelBadgeStyles = (nivel) => {
    if (!nivel) return "bg-gray-100 text-gray-800 border-gray-200";
    const str = nivel.toLowerCase();
    
    if (str.includes("inicial")) {
      return "bg-pink-100 text-pink-800 border-pink-200";
    }
    if (str.includes("primario")) {
      return "bg-sky-100 text-sky-800 border-sky-200";
    }
    if (str.includes("secundario")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <tr className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">

        {/* Apellido */}
        <td className="px-4 py-2 text-sm text-gray-900 bg-white whitespace-nowrap">
            {apellido}
        </td>

        {/* Nombre */}
        <td className="px-4 py-2 text-sm text-gray-700 bg-white whitespace-nowrap">
            {nombre}
        </td>

        {/* Tipo de Documento */}
        <td className="px-3 py-2 text-sm text-gray-700 bg-white whitespace-nowrap text-center">
            {tipo_documento}
        </td>

        {/* Número de Documento */}
        <td className="px-3 py-2 text-sm text-gray-700 bg-white whitespace-nowrap text-center">
            {numero}
        </td>

        {/* Tipo de Usuario */}
        <td className="px-4 py-2 text-sm bg-white whitespace-nowrap text-center">  
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
        </td>

        {/* Columna Nivel */}
        {esAlumno && (
            <td className="px-4 py-2 text-sm text-gray-700 bg-white whitespace-nowrap text-center">
                {nivelCompleto ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block whitespace-nowrap ${getNivelBadgeStyles(nombre_nivel)}`}>
                        {nivelCompleto}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
        )}

        {/* Botones de Acciones */}
        <td className="px-4 py-2 text-center whitespace-nowrap">
            <div className="flex items-center justify-center gap-2">
                <Link to={'/personas/' + id_persona}>
                    <button className="inline-flex items-center justify-center p-1 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                        <Search size={18} />
                    </button>
                </Link>

                <button onClick={(e) => cambiar_estado(e)} className="flex items-center bg-red-500 text-white p-1.5 rounded hover:bg-red-600">
                    <Trash2 size={18} />
                </button>
            </div>
        </td>
    </tr>
  );
}

export default ItemPersona;