import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Check, FileX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { NumerosALetras } from 'numero-a-letras';
import { saveAs } from 'file-saver';


// Función helper para construir el QR oficial en Base64 de AFIP / ARCA
const generarUrlQrAfip = (row) => {
  //console.log(row)
  try {
    const jsonPayload = {
      ver: 1,
      fecha: row.fechaEmision || new Date().toISOString().split('T')[0], // YYYY-MM-DD
      cuit: Number(String(row.cuit_emisor || '30123456789').replace(/\D/g, '')),
      ptoVta: Number(row.puntoVenta || 3),
      tipoCmp: Number(row.tipoComprobanteCode || 11), // 11 = Factura C
      nroCmp: Number(row.numeroComprobante || 1),
      importe: Math.abs(parseFloat(row.saldocuota)),
      moneda: "PES",
      ctz: 1,
      tipoDocRec: row.cuil_tutor ? 80 : 99, // 80 = CUIT/CUIL, 99 = Consumidor Final
      nroDocRec: Number(String(row.cuil_tutor || 0).replace(/\D/g, '')),
      tipoCodAut: "E", // E = CAE
      codAut: Number(row.cae || '75428641460732')
    };

    // Convertir a JSON -> UTF-8 -> Base64 compatible con AFIP y JavaScript
    const jsonString = JSON.stringify(jsonPayload);
    const base64Json = btoa(unescape(encodeURIComponent(jsonString)));

    return `https://www.afip.gob.ar/fe/qr/?p=${base64Json}`;
  } catch (error) {
    console.error('Error al armar la URL del QR:', error);
    return '';
  }
};

const ItemPagos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { id_alumno } = useParams();

  // Carga de datos desde el endpoint
  useEffect(() => {
    const fetchMovimientos = async () => {
      if (!id_alumno) return;
      
      const token = localStorage.getItem("token");

      try {
        setLoading(true);
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/SaldoAlumno/${id_alumno}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id_alumno: Number(id_alumno) })     
        });

        if (!response.ok) {
          throw new Error(`Error HTTP status: ${response.status}`);
        }

        const data = await response.json();
        setMovimientos(Array.isArray(data) ? data : []);

       } catch (error) {
        console.error('Error cargando movimientos:', error);
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [id_alumno]);

  // Mapa para calcular el saldo neto (Suma de cuota generada + pagos)
  const saldoPorCuotaMap = useMemo(() => {
    return movimientos.reduce((acc, curr) => {
      const claveCuota = curr.anio_cuota || curr.concepto || curr.cuota;
      if (!claveCuota) return acc;

      const importeNum = Number(curr.importe) || 0;
      acc[claveCuota] = (acc[claveCuota] || 0) + importeNum;
      return acc;
    }, {});
  }, [movimientos]);

  // Manejadores de acciones
  const handlePagarOEditar = (item) => {
    console.log('Abrir modal de pago/edición para:', item.id_transaccion_cc);
  };

  const handleDescargarPDF = async (row) => {
    const token = localStorage.getItem("token");

    // 1. Mapear los datos de la fila de la tabla a la estructura del objeto 'data'
    const payloadFactura = {
      emisor: {
        logoUrl: row.logo,
        razonSocial: row.entidad_educativa,
        domicilio: (row.direccion) + ' ' + (row.numero), 
        localidad_provincia: (row.localidad_nombre) + ' - ' + (row.provincia_nombre), 
        condicionIva: row.condicion_iva,
        tipoComprobante: 'C',
        codigoComprobante: '11',
        puntoVenta: String(row.punto_venta || 1).padStart(5, '0'),
        numeroComprobante: String(row.comprobante_numero).padStart(8, '0'),
        fechaEmision: row.fecha_transaccion 
          ? new Date(row.fecha_transaccion).toLocaleDateString('es-AR', { timeZone: 'UTC' }) 
          : '',
        cuit: row.cuit_institucion,
        ingresosBrutos: row.ingresos_brutos,
        inicioActividades: row.inicio_actividades
      },
      periodo: {
        desde: row.fecha_transaccion 
          ? (() => {
              const d = new Date(row.fecha_transaccion);
              d.setUTCDate(1); // Cambia el día al 1 (en UTC)
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : '',
        hasta: row.fecha_transaccion 
          ? (() => {
              const d = new Date(row.fecha_transaccion);
              d.setUTCDate(30); // Cambia el día al 30 (en UTC)
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : '',
        vencimientoPago: row.fecha_transaccion 
          ? new Date(row.fecha_transaccion).toLocaleDateString('es-AR', { timeZone: 'UTC' }) 
          : '',
        concepto: (() => {
          const anioCuota = row.anio_cuota || '';

          if (anioCuota.includes('Inscripci')) {
            return anioCuota.substring(0, 30);
          }
          
          if (anioCuota.includes('Material')) {
            return anioCuota.substring(0, 23);
          }

          return `${row.cuota}/${row.anio}`;
        })()
    },
      receptor: {
        cuil: row.cuil_tutor, 
        razonSocial: row.persona_allegada,
        condicionIva: row.condicion_iva,
        domicilio: row.direccion_alumno,
        condicionVenta: 'Contado'
      },
      items: [
        {
          cantidad: 1,
          descripcion: (row.anio_cuota || '') + ' - Alumno: ' + (row.nombrealumno || ''),
          precioUnitario: Math.abs(Number(row.importe)) || 0,
          importe: Math.abs(Number(row.importe)) || 0
        }
      ],
      totales: {
        subtotal: Math.abs(Number(row.importe)) || 0,
        otrosTributos: 0,
        total: Math.abs(Number(row.importe)) || 0,
        textoImporte: NumerosALetras(Math.abs(Number(row.importe)), {
          plural: 'pesos',
          singular: 'peso',
          centPlural: 'centavos',
          centSingular: 'centavo'
        }).replace(' M.N.', ' centavos') // Remueve la sigla M.N.
      },
      afip: {
        qrUrl: generarUrlQrAfip(row), // Genera la URL codificada en Base64 para ARCA
        cae: row.cae || '75428641460732',  
        vencimientoCae: row.fecha_transaccion 
          ? (() => {
              const d = new Date(row.fecha_transaccion);
              d.setUTCDate(d.getUTCDate() + 10);
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : ''
      }
    };

    //console.log(payloadFactura)

    try {
      // 2. Enviar petición POST con el payload
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/factura-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadFactura)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // 3. Recibir el stream/buffer y convertir a Blob
      const blob = await response.blob();

      const nombreArchivo = `Factura_${payloadFactura.emisor.puntoVenta}-${payloadFactura.emisor.numeroComprobante}.pdf`

          //5
      saveAs(blob, nombreArchivo);

      // 4. Crear URL de objeto y abrir en pestaña nueva
    //  const fileURL = URL.createObjectURL(blob);
    //  window.open(fileURL, '_blank');



    } catch (error) {
      console.error('Error al generar la factura:', error);
      alert('Ocurrió un error al intentar generar la factura.');
    }
  };

  if (loading) return <div className="p-4 text-center">Cargando estado de cuenta...</div>;

  return (
    <div className="w-full border border-gray-300 rounded shadow-sm bg-white text-xs">

      {/* Título con el nombre del alumno */}
      <div className="p-3 bg-gray-50 border-b border-gray-300">
        <h2 className="text-sm font-bold text-gray-800">
          Alumno: {movimientos[0]?.nombrealumno || ''}
        </h2>
      </div>

      {/* Tabla principal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-2 border-r border-gray-300 w-24">Fecha</th>
              <th className="p-2 border-r border-gray-300 w-60">Concepto</th>
              <th className="p-2 border-r border-gray-300 w-32">Importe</th>
              <th className="p-2 border-r border-gray-300 w-40">Medio de Pago</th>
              <th className="p-2 border-r border-gray-300 w-20">Tarjeta</th>
              <th className="p-2 border-r border-gray-300 w-20">Estado</th>
              <th className="p-2 border-r border-gray-300 w-40">Motivo Rechazo</th>
              <th className="p-2 w-24 text-center">Acciones / Estado</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length > 0 ? (
            movimientos.map((row, index) => {
              const esCuotaGenerada = Number(row.importe) > 0;
              const claveCuota = row.anio_cuota || row.concepto || row.cuota;

              // Saldo neto calculado de la suma de importes de esa cuota
              const saldoNetoCuota = saldoPorCuotaMap[claveCuota] ?? Number(row.saldocuota || row.importe);

              // La cuota se considera pagada si la suma acumulada es <= 0 o su estado es pagada/saldada
              const estaPagada = 
                saldoNetoCuota <= 0 || 
                row.id_estado_cuota === 2 || 
                row.estado_cuota === "Saldada" || 
                row.estado_cuota === "Pagada";

              // Verificación de existencia de comprobante/factura
              const tieneComprobante = 
                row.comprobante_numero !== null && 
                row.comprobante_numero !== undefined && 
                String(row.comprobante_numero).trim() !== '' &&
                row.comprobante_numero !== 'null';

              return (
                <tr 
                  key={row.id_transaccion_cc || index} 
                  className={`border-b border-gray-200 hover:bg-blue-50/50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="p-2 border-r border-gray-200 font-mono">
                    {row.fecha_transaccion 
                      ? new Date(row.fecha_transaccion).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          timeZone: 'UTC'
                        })
                      : ''}
                  </td>                  
                  <td className="p-2 border-r border-gray-200 font-medium">{row.anio_cuota || row.concepto}</td>
                  <td className="p-2 border-r border-gray-200 font-mono">$ {row.importe}</td>
                  <td className="p-2 border-r border-gray-200 font-mono">{row.medio_pago}</td>
                  <td className="p-2 border-r border-gray-200 font-mono">{row.nombre_tarjeta}</td>
                  <td className="p-2 border-r border-gray-200 font-mono">{row.estado_cuota}</td>
                  <td className="p-2 border-r border-gray-200 font-mono">
                    {row.motivo_rechazo && !/NUL/i.test(row.motivo_rechazo) ? row.motivo_rechazo : ''}
                  </td>
                  
                  {/* Columna de Acciones y Validación Visual */}
                  <td className="p-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      
                      {esCuotaGenerada ? (
                        estaPagada ? (
                          <span title="Cuota Saldada" className="text-green-600 flex items-center justify-center p-1">
                            <Check className="w-5 h-5 font-bold" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePagarOEditar(row)}
                            title="Falta pagar - Clic para abonar"
                            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        tieneComprobante ? (
                          <button
                            onClick={() => handleDescargarPDF(row)}
                            title="Descargar Comprobante PDF"
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <span 
                            title="Sin factura / comprobante generado" 
                            className="p-1 text-red-500 flex items-center justify-center cursor-not-allowed opacity-75"
                          >
                            <FileX className="w-4 h-4" />
                          </span>
                        )
                      )}

                    </div>
                  </td>
                </tr>
              );
            })
          
          ) : (
    <tr>
      <td colSpan={8} className="p-4 text-center text-gray-500 font-medium italic bg-white">
        El alumno no tiene cargos generados
      </td>
    </tr>
  )}
          </tbody>
        </table>
      </div>
{movimientos.length > 0 && (
  <>
      {/* Fila del Total */}
      <div className="flex justify-end items-center p-2 bg-gray-200 font-bold border-t border-gray-300">
        <span className="mr-4">Saldo Total:</span>
        <span className="font-mono text-sm">
          $ {parseFloat(movimientos[0]?.saldototal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}          
        </span>
      </div>

      {/* Formulario inferior: Datos del Pago */}
      <div className="border-t border-gray-400 bg-indigo-900 text-white p-2">
        <h3 className="font-bold text-xs uppercase mb-2">Datos del pago</h3>
        <div className="flex items-center gap-2 bg-white text-black p-2 rounded">
          <label htmlFor="concepto" className="font-medium text-xs">Concepto:</label>
          <input
            id="concepto"
            type="text"
            className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Ingrese el concepto del pago..."
          />
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default ItemPagos;