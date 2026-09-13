import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const ItemPersonaPagos = ({ 
    apellido, 
    nombre, 
    id_persona, 
    id_alumno, 
    tipo_documento, 
    numero, 
    tipo_usuario, 
    activo, 
    motivo_desercion, 
    regular, 
    id_nivel, 
    nombre_nivel, 
    nombre_grado,
    setProds 
}) => {
    const [saldoTotal, setSaldoTotal] = useState(null);
    const [cargandoSaldo, setCargandoSaldo] = useState(true);

    const esInicial = String(id_nivel) === '1' || nombre_nivel?.toLowerCase().includes('inicial');
    const esPrimario = String(id_nivel) === '2' || nombre_nivel?.toLowerCase().includes('primario');
    const textoNivelGrado = [nombre_nivel, nombre_grado].filter(Boolean).join(' - ');

    // 🟢 Fetch al endpoint de estado de deuda
    useEffect(() => {
        if (!id_alumno) {
            setCargandoSaldo(false);
            return;
        }

        const token = localStorage.getItem('token');
      
        fetch(`${process.env.REACT_APP_API_URL}/api/pagos/estado-deuda/${id_alumno}`, {
      
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setSaldoTotal(parseFloat(data[0]?.saldototal));
                setCargandoSaldo(false);
            })
            .catch(err => {
                console.error("Error al obtener estado de deuda:", err);
                setSaldoTotal(0);
                setCargandoSaldo(false);
            });
    }, [id_alumno]);

    // Formateo del importe
    const saldoNumerico = Number(saldoTotal);
    const esMayorACero = saldoNumerico > 0;
    const saldoFormateado = `$ ${saldoNumerico.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <tr className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">

            {/* 1. Apellido */}
            <td className="px-4 py-2 text-sm text-gray-900 bg-white whitespace-nowrap">
                {apellido}
            </td>

            {/* 2. Nombre */}
            <td className="px-4 py-2 text-sm text-gray-700 bg-white whitespace-nowrap">
                {nombre}
            </td>

            {/* 3. Tipo de Documento */}
            <td className="px-4 py-2 text-sm text-gray-700 bg-white whitespace-nowrap text-center">
                {tipo_documento}
            </td>

            {/* 4. Número de Documento */}
            <td className="px-4 py-2 text-sm text-gray-700 bg-white whitespace-nowrap text-center">
                {numero}
            </td>

            {/* 5. Alumno/Tutor */}
            <td className="px-4 py-2 text-sm bg-white whitespace-nowrap text-center">  
                <div className="flex justify-center w-full">
                    {tipo_usuario === "S" && activo === "S" && regular === "S" ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Alumno
                        </span>
                    ) : tipo_usuario === "S" && (activo === "N" || regular === "N") ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                           {motivo_desercion || "Inactivo"}
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                           Tutor
                        </span>
                    )}
                </div>
            </td>

            {/* 6. Nivel - Grado */}
            <td className="px-4 py-2 text-sm bg-white whitespace-nowrap text-center">
                <div className="flex justify-center w-full">
                    {esInicial ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 whitespace-nowrap">
                            {textoNivelGrado || "Nivel Inicial"}
                        </span>
                    ) : esPrimario ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 whitespace-nowrap">
                            {textoNivelGrado || "Nivel Primario"}
                        </span>
                    ) : textoNivelGrado ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 whitespace-nowrap">
                            {textoNivelGrado}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </div>
            </td>

            {/* 7. 🟢 Saldo Total (Rojo si es > 0, Celeste si es <= 0) */}
            <td className="px-4 py-2 text-sm bg-white whitespace-nowrap text-center">
                <div className="flex justify-center w-full">
                    {cargandoSaldo ? (
                        <span className="text-gray-400 text-xs animate-pulse">Cargando...</span>
                    ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            esMayorACero 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-sky-100 text-sky-800'
                        }`}>
                            {saldoFormateado}
                        </span>
                    )}
                </div>
            </td>

            {/* 8. Acciones */}
            <td className="px-4 py-2 text-sm text-center bg-white whitespace-nowrap">
                <div className="flex items-center justify-center gap-2">
                    <Link to={'/gestion/SaldoAlumno/' + id_alumno}>
                        <button className="inline-flex items-center justify-center p-1.5 bg-transparent hover:bg-blue-500 text-blue-700 hover:text-white border border-blue-500 hover:border-transparent rounded transition-all">
                            <Search size={18} />
                        </button>
                    </Link>
                </div>
            </td>
        </tr>
    );
}

export default ItemPersonaPagos;