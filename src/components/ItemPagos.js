import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, FileText, Check, FileX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { NumerosALetras } from 'numero-a-letras';
import { saveAs } from 'file-saver';
import { avisar } from '../utils/notificaciones';


// Función helper para consultar AFIP/ARCA y construir la URL oficial del QR
const obtenerDatosAfipYQr = async (row) => {
    
  const token = localStorage.getItem("token");
  const ptoVta = row.punto_venta || row.puntoVenta || 3;
  const tipoCmp = row.comprobante_tipo || row.tipoComprobanteCode;
  const nroCmp = row.comprobante_numero || row.numeroComprobante || 1;

  let datosArca = {};

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/consultar-factura-directa?ptoVta=${ptoVta}&tipoCmp=${tipoCmp}&nroCmp=${nroCmp}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    if (response.ok) {
      datosArca = await response.json();
    }
  } catch (err) {
    console.warn("Fallo al conectar con la API de AFIP, se usarán datos locales.", err);
  }

  let fechaFinal = new Date().toISOString().split('T')[0];
  if (datosArca.fechaEmision) {
    const f = String(datosArca.fechaEmision);
    fechaFinal = `${f.substring(0, 4)}-${f.substring(4, 6)}-${f.substring(6, 8)}`;
  } else if (row.fecha_pago || row.fecha_transaccion) {
    fechaFinal = String(row.fecha_pago || row.fecha_transaccion).split('T')[0];
  }

  const cuitEmisor = Number(String(row.cuit_institucion).replace(/\D/g, ''));
  const caeFinal = datosArca.cae || row.cae || "75428641460732";

  const jsonPayload = {
    ver: 1,
    fecha: fechaFinal,
    cuit: cuitEmisor,
    ptoVta: Number(ptoVta),
    tipoCmp: Number(tipoCmp),
    nroCmp: Number(nroCmp),
    importe: Math.abs(Number(parseFloat(datosArca.importeTotal || row.importe).toFixed(2))),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: Number(datosArca.docTipo || 99),
    nroDocRec: Number(datosArca.docNro || 0),
    tipoCodAut: "E",
    codAut: Number(caeFinal)
  };

  const jsonString = JSON.stringify(jsonPayload);
  const base64Json = btoa(unescape(encodeURIComponent(jsonString)));
  const urlQr = `https://www.afip.gob.ar/fe/qr/?p=${base64Json}`;

  const fechaRaw = datosArca.fchVto || datosArca.vencimientoCae;
  const fechaVencimientoCae = fechaRaw 
    ? `${fechaRaw.slice(6, 8)}/${fechaRaw.slice(4, 6)}/${fechaRaw.slice(0, 4)}`
    : '';

  return {
    urlQr,
    cae: caeFinal,
    fechaVencimientoCae: fechaVencimientoCae,
    datosArca
  };
};





const ItemPagos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para listas dinámicas desde backend
  const [mediosPago, setMediosPago] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);

  // Visibilidad del formulario de pago
  const [mostrarFormulario, setMostrarFormulario] = useState(false);


  const [valorPuntoVenta, setValorPuntoVenta] = useState(null);

useEffect(() => {
  const obtenerParametros = async () => {
    try {
      // Recuperas el token guardado al iniciar sesión (ej. localStorage)
      const token = localStorage.getItem('token'); 

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/parametros`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Revisa cómo espera el token tu backend
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const listaParametros = Array.isArray(data) ? data : (data.data || []);
      const puntoVentaObj = listaParametros.find((item) => item.parametro === 'punto_venta');
      
      setValorPuntoVenta(puntoVentaObj?.valor);
    } catch (error) {
      console.error('Error al obtener parametros:', error);
    }
  };

  obtenerParametros();
}, []);


  // Estado inicial del formulario de pago
  const initialPagoForm = {
    id_alumno_cc: null,
    concepto: '',
    medioPago: '',
    id_medio_pago: '',
    tarjeta: '',
    fechaPago: new Date().toISOString().split('T')[0],
    nroComprobante: '',
    nroLote: '',
    nroAutorizacion: '',
    importe: '',
    punto_venta: '',
    comprobante_tipo: '',
    comprobante_numero: '',
    cae: '',
    fecha_transaccion: '',
    fecha_ultima_modificacion: '',
    id_estado_cuota: '',
    id_marca_tarjeta: ''
  };

  const [pagoForm, setPagoForm] = useState(initialPagoForm);
  const { id_alumno } = useParams();

  // Carga de movimientos del alumno
  const fetchMovimientos = useCallback(async () => {
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

      if (!response.ok) throw new Error(`Error HTTP status: ${response.status}`);

      const data = await response.json();
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [id_alumno]);

  // Carga de Medios de Pago y Tarjetas desde endpoints
  useEffect(() => {
    const fetchCatalogos = async () => {
      const token = localStorage.getItem("token");
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [resMedios, resTarjetas] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/pagos/medios`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/pagos/marcas`, { headers })
        ]);

        if (resMedios.ok) {
          const dataMedios = await resMedios.json();
          setMediosPago(Array.isArray(dataMedios) ? dataMedios : []);
        }

        if (resTarjetas.ok) {
          const dataTarjetas = await resTarjetas.json();
          setTarjetas(Array.isArray(dataTarjetas) ? dataTarjetas : []);
        }
      } catch (error) {
        console.error('Error al cargar medios de pago / tarjetas:', error);
      }
    };

    fetchCatalogos();
  }, []);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  // Mapa para calcular el saldo neto
  const saldoPorCuotaMap = useMemo(() => {
    return movimientos.reduce((acc, curr) => {
      const claveCuota = curr.anio_cuota || curr.concepto || curr.cuota;
      if (!claveCuota) return acc;

      const importeNum = Number(curr.importe) || 0;
      acc[claveCuota] = (acc[claveCuota] || 0) + importeNum;
      return acc;
    }, {});
  }, [movimientos]);


  // Acción al presionar la lupa: Carga los datos y muestra el formulario
  const handlePagarOEditar = (row) => {
    setPagoForm({
      id_alumno_cc: row.id_alumno_cc,
      concepto: row.anio_cuota || row.concepto || '',
      medioPago: '',
      tarjeta: '',
      fechaPago: new Date().toISOString().split('T')[0],
      nroComprobante: '',
      nroLote: '',
      nroAutorizacion: '',
      importe: Math.abs(Number(row.importe)) || ''
    });

    setMostrarFormulario(true);

    setTimeout(() => {
      document.getElementById("seccion-datos-pago")?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Ocultar formulario al cancelar
  const handleCancelar = () => {
    setMostrarFormulario(false);
    setPagoForm(initialPagoForm);
  };

  // Evaluar si el medio de pago seleccionado es Posnet
  const esPosnet = pagoForm.medioPago.toLowerCase().includes('posnet') || 
                   pagoForm.medioPago.toLowerCase().includes('postnet');

 // 🔹 Guardar/Registrar el pago con validaciones completas
const handleSubmitPago = async (e) => {
  e.preventDefault();

  // 1. Validar que se haya seleccionado una cuota desde la lupa
  if (!pagoForm.id_alumno_cc) {
    avisar.advertencia("Por favor, seleccione una cuota pendiente haciendo clic en el icono de búsqueda (lupa).");
    return;
  }

  // 2. Validaciones de campos generales
  if (!pagoForm.concepto || !pagoForm.concepto.trim()) {
    avisar.advertencia("El campo Concepto no puede estar vacío.");
    return;
  }

  if (!pagoForm.medioPago || !pagoForm.medioPago.trim()) {
    avisar.advertencia("Debe seleccionar un Medio de Pago.");
    return;
  }

  if (!pagoForm.fechaPago) {
    avisar.advertencia("Debe ingresar la Fecha del pago.");
    return;
  }

  if (!pagoForm.nroComprobante || !pagoForm.nroComprobante.trim()) {
    avisar.advertencia("Debe ingresar el Número de comprobante.");
    return;
  }

  if (!pagoForm.importe || Number(pagoForm.importe) <= 0) {
    avisar.advertencia("Debe ingresar un Importe válido mayor a 0.");
    return;
  }

  // 3. Validaciones específicas cuando el medio de pago es Posnet
  if (esPosnet) {
    if (!pagoForm.tarjeta || !pagoForm.tarjeta.trim()) {
      avisar.advertencia("Debe seleccionar una Tarjeta para pagos con Posnet.");
      return;
    }

    if (!pagoForm.nroLote || !pagoForm.nroLote.trim()) {
      avisar.advertencia("Debe ingresar el Número de lote.");
      return;
    }

    if (!pagoForm.nroAutorizacion || !pagoForm.nroAutorizacion.trim()) {
      avisar.advertencia("Debe ingresar el Número de autorización.");
      return;
    }
  }


  // Si todas las validaciones pasan, se procesa el pago
  const token = localStorage.getItem("token");

  const id_estado_cuota = 3
  const now = new Date();
  const fecha_transaccion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const fecha_ultima_modificacion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Diccionario de equivalencias
const MAP_DOC_AFIP = {
  1: 90, // LC
  2: 89, // LE
  3: 94, // Pasaporte
  4: 0,  // CI
  6: 80, // CUIT
  7: 86, // CUIL
  8: 96, // DNI
  9: 91, // NIF
  10: 96 // DNI Temporario
};


// Función para obtener el código antes de enviar a AFIP
const obtenerDocTipoAfip = (idTipoDocumentoLocal) => {
  // Retorna el código asignado o 99 (Doc. Sin Identificar/Varios) por defecto
  return MAP_DOC_AFIP[idTipoDocumentoLocal] ?? 99; 
};


// 1. Obtener la fila seleccionada de la lista de movimientos
const filaSeleccionada = movimientos.find(m => m.id_alumno_cc === pagoForm.id_alumno_cc) || movimientos[0];

// 2. Extraer número de documento numérico (limpiando guiones o puntos)
const rawDoc = filaSeleccionada?.cuil_tutor || '';
const nroDocLimpio = Number(String(rawDoc).replace(/\D/g, '')) || 0;

// 3. Obtener el id_tipo_documento local devuelto por la SQL (ej: 7 para CUIL, 8 para DNI, 6 para CUIT)
const idTipoDocBD = filaSeleccionada?.id_tipo_documento_tutor;

// 4. Mapear directamente al código AFIP
const docTipoAfip = obtenerDocTipoAfip(idTipoDocBD); // Si idTipoDocBD es 7 -> devuelve 86; si es 8 -> 96; etc.

// 5. Armar el payload
const payloadCompleto = {
  ...pagoForm,
  importe: -Math.abs(Number(pagoForm.importe)),
  fecha_transaccion: fecha_transaccion,
  fecha_ultima_modificacion: fecha_ultima_modificacion,
  id_estado_cuota: id_estado_cuota,
  punto_venta: valorPuntoVenta,
  comprobante_tipo: null,
  comprobante_numero: null,
  cae: null,
  docTipo: docTipoAfip, // Código AFIP (86, 96, 80, etc.)
  nroDoc: nroDocLimpio,   // Número entero sin caracteres
  id_motivo_rechazo1: null,
  id_motivo_rechazo2: null,
  codigo_error_debito: null,
  descripcion_error_debito: null,
  fecha_respuesta_prisma: null
};



  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/guardarpago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_alumno: Number(id_alumno),
        ...payloadCompleto
      })
    });

    if (!response.ok) throw new Error(`Error al registrar el pago: ${response.status}`);

    avisar.exito("Pago registrado correctamente");

    handleCancelar();
    fetchMovimientos();

  } catch (error) {
    console.error('Error guardando pago:', error);
    avisar.advertencia('Error al registrar el pago en el servidor.');
  }
};


  const handleDescargarPDF = async (row) => {
    const token = localStorage.getItem("token");
    const afipResult = await obtenerDatosAfipYQr(row);
//console.log(afipResult)
// Aseguramos conversión a número entero
const codigoCbte = Number(afipResult.datosArca.CbteTipo);

// Mapeo tolerante a tipos
const MAPEO_LETRAS_AFIP = {
  1: 'A', 2: 'A', 3: 'A', 4: 'A', 201: 'A', 202: 'A', 203: 'A',
  6: 'B', 7: 'B', 8: 'B', 9: 'B', 206: 'B', 207: 'B', 208: 'B',
  11: 'C', 12: 'C', 13: 'C', 15: 'C', 211: 'C', 212: 'C', 213: 'C',
  51: 'M', 52: 'M', 53: 'M', 54: 'M',
  19: 'E', 20: 'E', 21: 'E',
  195: 'T', 196: 'T', 197: 'T'
};

// Asignación garantizada
afipResult.letraComprobante = MAPEO_LETRAS_AFIP[codigoCbte] || 'N/A';

    const payloadFactura = {
      emisor: {
        logoUrl: row.logo,
        razonSocial: row.entidad_educativa,
        domicilio: (row.direccion || '') + ' ' + (row.numero || ''), 
        localidad_provincia: (row.localidad_nombre || '') + ' - ' + (row.provincia_nombre || ''), 
        condicionIva: row.condicion_iva,
        tipoComprobante: afipResult.letraComprobante,  //'C',
        codigoComprobante: afipResult.CbteTipo,   //11
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
              d.setUTCDate(1);
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : '',
        hasta: row.fecha_transaccion 
          ? (() => {
              const d = new Date(row.fecha_transaccion);
              d.setUTCDate(30);
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : '',
        vencimientoPago: row.fecha_transaccion 
          ? new Date(row.fecha_transaccion).toLocaleDateString('es-AR', { timeZone: 'UTC' }) 
          : '',
        concepto: (() => {
          const anioCuota = row.anio_cuota || '';
          if (anioCuota.includes('Inscripci')) return anioCuota.substring(0, 30);
          if (anioCuota.includes('Material')) return anioCuota.substring(0, 23);
          return `${row.cuota}/${row.anio}`;
        })()
      },
      receptor: {
        cuil: afipResult.datosArca.docNroReceptor || row.cuil_tutor || row.dni_tutor || '', 
        tipoDoc: afipResult.datosArca.docTipoReceptor || (row.cuil_tutor ? 'CUIL' : 'DNI'),
        razonSocial: row.persona_allegada,
        condicionIva: row.condicion_iva || 'Consumidor Final',
        domicilio: row.direccion_alumno || '',
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
        }).replace(' M.N.', ' centavos')
      },
      afip: {
        qrUrl: afipResult.urlQr,
        cae: afipResult.cae,
        vencimientoCae: afipResult.fechaVencimientoCae || (row.fecha_transaccion 
          ? (() => {
              const d = new Date(row.fecha_transaccion);
              d.setUTCDate(d.getUTCDate() + 10);
              return d.toLocaleDateString('es-AR', { timeZone: 'UTC' });
            })()
          : '')
      }
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/factura-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadFactura)
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const blob = await response.blob();
      const nombreArchivo = `Factura_${payloadFactura.emisor.puntoVenta}-${payloadFactura.emisor.numeroComprobante}.pdf`;
      saveAs(blob, nombreArchivo);

    } catch (error) {
      console.error('Error al generar la factura:', error);
      avisar.advertencia('Ocurrió un error al intentar generar la factura.');
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
      <div className="w-full max-w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm my-4">
        <table className="w-full min-w-[750px] text-left text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-2 border-r border-gray-300 w-24">Fecha</th>
              <th className="p-2 border-r border-gray-300 w-80">Concepto</th>
              <th className="p-2 border-r border-gray-300 w-32">Importe</th>
              <th className="p-2 border-r border-gray-300 w-40">Medio de Pago</th>
              <th className="p-2 border-r border-gray-300 w-20">Tarjeta</th>
              <th className="p-2 border-r border-gray-300 w-20">Estado</th>
              <th className="p-2 border-r border-gray-300 w-40">Motivo Rechazo</th>
              <th className="p-2 w-24 text-center">Acciones / Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {movimientos.length > 0 ? (
              movimientos.map((row, index) => {
                const esCuotaGenerada = Number(row.importe) > 0;
                const claveCuota = row.anio_cuota || row.concepto || row.cuota;

                const saldoNetoCuota = saldoPorCuotaMap[claveCuota] ?? Number(row.saldocuota || row.importe);

                const estaPagada = 
                  saldoNetoCuota <= 0 || 
                  row.id_estado_cuota === 2 || 
                  row.estado_cuota === "Saldada" || 
                  row.estado_cuota === "Pagada";

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
                    <td className="p-2 border-r border-gray-200 font-medium whitespace-nowrap">{row.anio_cuota || row.concepto}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">$ {row.importe}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">{row.medio_pago}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">{row.nombre_tarjeta}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">{row.estado_cuota}</td>
                    <td className="p-2 border-r border-gray-200 font-mono">
                      {row.motivo_rechazo && !/NUL/i.test(row.motivo_rechazo) ? row.motivo_rechazo : ''}
                    </td>
                    
                    {/* Columna de Acciones */}
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

          {/* Formulario inferior: Datos del pago */}
          {mostrarFormulario && (
            <div id="seccion-datos-pago" className="border-t-2 border-indigo-950 bg-indigo-900 text-white mt-4">
              <div className="p-2 px-3 font-bold text-xs uppercase bg-indigo-950">
                Datos del pago
              </div>

          <form onSubmit={handleSubmitPago} className="p-4 bg-gray-100 text-gray-800 flex flex-col gap-3">
            {/* Concepto (No editable) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-44 font-semibold text-xs text-gray-700">Concepto:</label>
              <input
                type="text"
                value={pagoForm.concepto}
                readOnly
                required
                className="flex-1 sm:max-w-md border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-gray-200 text-gray-700 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Medio de Pago */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-44 font-semibold text-xs text-gray-700">Medio de pago:</label>
                <select
                  value={pagoForm.id_medio_pago || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    
                    // Busca el objeto completo del medio de pago seleccionado
                    const seleccionado = mediosPago.find(
                      (m, index) => String(m.id_medio_pago || m.id || index) === String(selectedId)
                    );

                    const texto = seleccionado 
                      ? (seleccionado.nombre || seleccionado.medio_pago || seleccionado.descripcion) 
                      : '';

                    setPagoForm({
                      ...pagoForm,
                      id_medio_pago: selectedId,
                      medioPago: texto,
                      tarjeta: ''
                    });
                  }}
                  className="flex-1 sm:max-w-xs border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                  required
                >
                  <option value="">-- SELECCIONE --</option>
                  {mediosPago.map((medio, index) => {
                    const id = medio.id_medio_pago || medio.id || index;
                    const texto = medio.nombre || medio.medio_pago || medio.descripcion;

                    return (
                      <option key={id} value={id}>
                        {texto}
                      </option>
                    );
                  })}
                </select>
            </div>

            {/* Tarjeta (Solo Posnet) */}
            {esPosnet && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="w-44 font-semibold text-xs text-gray-700">Tarjeta:</label>
                <select
                  value={pagoForm.id_marca_tarjeta || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;

                    // Busca la tarjeta seleccionada por id_marca_tarjeta
                    const seleccionada = tarjetas.find(
                      (t) => String(t.id_marca_tarjeta) === String(selectedId)
                    );

                    setPagoForm({
                      ...pagoForm,
                      id_marca_tarjeta: selectedId,
                      tarjeta: seleccionada ? seleccionada.nombre : ''
                    });
                  }}
                  className="flex-1 sm:max-w-xs border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                  required
                >
                  <option value="">-- SELECCIONE TARJETA --</option>
                  {tarjetas.map((t) => (
                    <option key={t.id_marca_tarjeta} value={t.id_marca_tarjeta}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha del Pago */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-44 font-semibold text-xs text-gray-700">Fecha del pago:</label>
              <input
                type="date"
                value={pagoForm.fechaPago}
                onChange={(e) => setPagoForm({ ...pagoForm, fechaPago: e.target.value })}
                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Número de Comprobante */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-44 font-semibold text-xs text-gray-700">Número de comprobante:</label>
              <input
                type="text"
                value={pagoForm.nroComprobante}
                onChange={(e) => setPagoForm({ ...pagoForm, nroComprobante: e.target.value })}
                placeholder="Ej: 0001-00001234"
                className="flex-1 sm:max-w-xs border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Campos adicionales de Posnet */}
            {esPosnet && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-44 font-semibold text-xs text-gray-700">Número de lote:</label>
                  <input
                    type="text"
                    value={pagoForm.nroLote}
                    onChange={(e) => setPagoForm({ ...pagoForm, nroLote: e.target.value })}
                    className="flex-1 sm:max-w-xs border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required={esPosnet}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="w-44 font-semibold text-xs text-gray-700">Número de autorización:</label>
                  <input
                    type="text"
                    value={pagoForm.nroAutorizacion}
                    onChange={(e) => setPagoForm({ ...pagoForm, nroAutorizacion: e.target.value })}
                    className="flex-1 sm:max-w-xs border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required={esPosnet}
                  />
                </div>
              </>
            )}

            {/* Importe con signo $ y decimales automáticos */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="w-44 font-semibold text-xs text-gray-700">Importe:</label>
              <div className="relative flex items-center w-full sm:w-44">
                <span className="absolute left-2.5 text-xs text-gray-500 font-mono pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={pagoForm.importe}
                  onChange={(e) => setPagoForm({ ...pagoForm, importe: e.target.value })}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      setPagoForm((prev) => ({ ...prev, importe: val.toFixed(2) }));
                    }
                  }}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded pl-6 pr-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Botones Cancelar / Guardar */}
            <div className="mt-4 flex justify-between items-center pt-2 border-t border-gray-300">
              <button
                type="button"
                onClick={handleCancelar}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs rounded border border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white font-semibold text-xs rounded transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ItemPagos;