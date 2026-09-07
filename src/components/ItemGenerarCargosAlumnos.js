import React, { useState, useEffect, useMemo } from 'react';
import { avisar } from '../utils/notificaciones';


// Helper para verificar si un parámetro viene habilitado ('S' o 'SI')
const esSi = (val) => String(val).toUpperCase() === 'S' || String(val).toUpperCase() === 'SI';

// Helper para formatear fecha a YYYY-MM-DD HH:mm:ss
const formatFecha = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

// Helper para calcular 1 mes después asegurando día hábil (Lunes a Viernes)
const calcularFechaCuota2 = (fechaBase) => {
  const d = new Date(fechaBase);
  d.setMonth(d.getMonth() + 1);

  // 0 = Domingo, 6 = Sábado
  if (d.getDay() === 6) {
    d.setDate(d.getDate() + 2); // Sábado pasa a Lunes
  } else if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1); // Domingo pasa a Lunes
  }
  return formatFecha(d);
};

const initialFormData = {
  forma: '',
  id_alumno: '',
  id_cargo_cuenta_corriente: '',
  id_anio: '',
  mes: '',
  numero_cuota: '',
  id_grado: '',
  importe: '',
};

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MAPA_MESES = {
  Enero: '01', Febrero: '02', Marzo: '03', Abril: '04',
  Mayo: '05', Junio: '06', Julio: '07', Agosto: '08',
  Septiembre: '09', Octubre: '10', Noviembre: '11', Diciembre: '12',
};

const GenerarCargosAlumnos = () => {
  const [formData, setFormData] = useState(initialFormData);

  const [alumnos, setAlumnos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [anios, setAnios] = useState([]);
  const [loading, setLoading] = useState(true);


  // Estados para parámetros
  const [CantidadCuotasMateriales, setValorCantidadCuotasMateriales] = useState(null);
  const [cant_cuotas_cobro_inscripcion, setValor_cant_cuotas_cobro_inscripcion] = useState(null);
  const [importe_inscripcion_inicial, setValor_importe_inscripcion_inicial] = useState(null);
  const [importe_inscripcion_primario, setValor_importe_inscripcion_primario] = useState(null);
  const [importe_mensual_cuota, setValor_importe_mensual_cuota] = useState(null);
  const [importe_materiales, setValor_importe_materiales] = useState(null);
  const [importe_cuota_uno_nivel_inicial, setValor_importe_cuota_uno_nivel_inicial] = useState(null);
  const [importe_cuota_dos_nivel_inicial, setValor_importe_cuota_dos_nivel_inicial] = useState(null);
  const [importe_cuota_uno_nivel_primario, setValor_importe_cuota_uno_nivel_primario] = useState(null);
  const [importe_cuota_dos_nivel_primario, setValor_importe_cuota_dos_nivel_primario] = useState(null);
  const [cobra_inscripcion_en_cuotas_inicial, setValor_cobra_inscripcion_en_cuotas_inicial] = useState(null);
  const [cobra_inscripcion_en_cuotas_primario, setValor_cobra_inscripcion_en_cuotas_primario] = useState(null);
  const [ingresa_importe_en_generacion_cargos, setValor_ingresa_importe_en_generacion_cargos] = useState(null);
  //const [valida_cuotas_impagas_pago_inscripcion, setValor_valida_cuotas_impagas_pago_inscripcion] = useState(null);
  const [importe_mensual_cuota_x_grado, setValor_importe_mensual_cuota_x_grado] = useState(null);
  //const [envia_notif_al_generar_cargo, setValor_envia_notif_al_generar_cargo] = useState(null); EN BACKEND NOTIFICACIONES CORREO
  //const [importe_inscripcion_anual, setValor_importe_inscripcion_anual] = useState(null); EN DESUSO
  //const [criterio_generacion_cuota, setValor_criterio_generacion_cuota] = useState(null); VER QUE USO TIENE



  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        setLoading(true);
        const [resAlumnos, resCargos, resAnios] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/alumnos`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/pagos/cargos`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/academica/aniocursado`, { headers }),
        ]);

        setAlumnos(await resAlumnos.json());
        setCargos(await resCargos.json());
        setAnios(await resAnios.json());
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const obtenerParametros = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/parametros`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const listaParametros = Array.isArray(data) ? data : data.data || [];
        const getParam = (nombre) => listaParametros.find((item) => item.parametro === nombre)?.valor;

        setValorCantidadCuotasMateriales(getParam('cantidad_cuotas_materiales'));
        setValor_cant_cuotas_cobro_inscripcion(getParam('cant_cuotas_cobro_inscripcion'));
        setValor_importe_inscripcion_inicial(getParam('importe_inscripcion_inicial'));
        setValor_importe_inscripcion_primario(getParam('importe_inscripcion_primario'));
        setValor_importe_mensual_cuota(getParam('importe_mensual_cuota'));
        setValor_importe_materiales(getParam('importe_materiales'));
        setValor_importe_cuota_uno_nivel_inicial(getParam('importe_cuota_uno_nivel_inicial'));
        setValor_importe_cuota_dos_nivel_inicial(getParam('importe_cuota_dos_nivel_inicial'));
        setValor_importe_cuota_uno_nivel_primario(getParam('importe_cuota_uno_nivel_primario'));
        setValor_importe_cuota_dos_nivel_primario(getParam('importe_cuota_dos_nivel_primario'));
        setValor_cobra_inscripcion_en_cuotas_inicial(getParam('cobra_inscripcion_en_cuotas_inicial'));
        setValor_cobra_inscripcion_en_cuotas_primario(getParam('cobra_inscripcion_en_cuotas_primario'));
        setValor_ingresa_importe_en_generacion_cargos(getParam('ingresa_importe_en_generacion_cargos'));
        //setValor_valida_cuotas_impagas_pago_inscripcion(getParam('valida_cuotas_impagas_pago_inscripcion'));
        setValor_importe_mensual_cuota_x_grado(getParam('importe_mensual_cuota_x_grado'));
      } catch (error) {
        console.error('Error al obtener parametros:', error);
      }
    };

    obtenerParametros();
  }, []);

  // Extrae lista única de grados desde la respuesta de alumnos
  const gradosDisponibles = useMemo(() => {
    const mapa = new Map();
    alumnos.forEach((a) => {
      if (a.id_grado && a.grado && !mapa.has(a.id_grado)) {
        mapa.set(a.id_grado, { id_grado: a.id_grado, grado: a.grado });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => Number(a.id_grado) - Number(b.id_grado));
  }, [alumnos]);

  // Flags para habilitar controles dinámicos según parámetros
  const requiereGrado = esSi(importe_mensual_cuota_x_grado) && formData.forma === 'Grupal';
  const debeIngresarImporte = esSi(ingresa_importe_en_generacion_cargos) || requiereGrado;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'id_cargo_cuenta_corriente' && { mes: '', numero_cuota: '' }),
      ...(name === 'forma' && value !== 'Grupal' && { id_grado: '' }),
    }));
  };

  const handleCancel = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const alumnosValidos = alumnos.filter(
      (alumno) => alumno.es_alumno === 'S' && alumno.activo === 'S' && alumno.regular === 'S'
    );

    // Filtrado por Forma y Grado
    let alumnosAProcesar = [];
    if (formData.forma === 'Grupal') {
      alumnosAProcesar = alumnosValidos;
      if (requiereGrado && formData.id_grado) {
        alumnosAProcesar = alumnosAProcesar.filter(
          (a) => String(a.id_grado) === String(formData.id_grado)
        );
      }
    } else {
      alumnosAProcesar = alumnosValidos.filter(
        (a) => String(a.id_alumno) === String(formData.id_alumno)
      );
    }

    if (alumnosAProcesar.length === 0) {
      avisar.error('No hay alumnos que coincidan con los criterios seleccionados.');
      return;
    }

    const mesFormateado = MAPA_MESES[formData.mes] || '';
    const anioSeleccionado = anios.find((a) => String(a.id_anio) === String(formData.id_anio));
    const anioValor = anioSeleccionado ? String(anioSeleccionado.anio) : '';
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Generación de fechas
    const ahora = new Date();
    const fechaActualStr = formatFecha(ahora);
    const fechaCuota2Str = calcularFechaCuota2(ahora);

    try {
      const payload = [];

      for (const alumno of alumnosAProcesar) {
        const idNivel = Number(alumno.id_nivel);
        const datosAcademicos = {
          id_grado: alumno.id_grado,
          grado: alumno.grado,
          id_nivel: alumno.id_nivel,
          nivel: alumno.nivel,
        };

        // Determinación del importe a enviar
        const obtenerImporteFinal = (importeCalculado) => {
          if (debeIngresarImporte && formData.importe !== '') {
            return Number(formData.importe);
          }
          return Number(importeCalculado);
        };

        // CASO 1: CUOTAS MENSUALES
        if (esCuota) {
          payload.push({
            id_alumno: alumno.id_alumno,
            ...datosAcademicos,
            id_cargo_cuenta_corriente: formData.id_cargo_cuenta_corriente,
            id_anio: formData.id_anio,
            anio: anioValor,
            forma: formData.forma,
            mes: mesFormateado,
            cuota: `${mesFormateado}${anioValor}`,
            descripcion: `Cuota mensual ${parseInt(mesFormateado)} del Año ${anioValor}`,
            importe: obtenerImporteFinal(importe_mensual_cuota),
            fecha: fechaActualStr,
          });
        } 
        // CASO 2: MATERIALES
        else if (esMateriales) {
          payload.push({
            id_alumno: alumno.id_alumno,
            ...datosAcademicos,
            id_cargo_cuenta_corriente: formData.id_cargo_cuenta_corriente,
            id_anio: formData.id_anio,
            anio: anioValor,
            forma: formData.forma,
            numero_cuota: formData.numero_cuota,
            cuota: '',
            descripcion: `Materiales del Año ${anioValor} Cuota ${formData.numero_cuota}/${CantidadCuotasMateriales}`,
            importe: obtenerImporteFinal(importe_materiales),
            fecha: fechaActualStr,
          });
        } 
        // CASO 3: INSCRIPCIÓN
        else if (esInscripcion) {
          const numCuotasInscripcion = Number(cant_cuotas_cobro_inscripcion);

          // Subcaso 3A: 1 Cuota
          if (numCuotasInscripcion === 1) {
            let montoInscripcion = 0;
            if (idNivel === 1) montoInscripcion = importe_inscripcion_inicial;
            else if (idNivel === 2) montoInscripcion = importe_inscripcion_primario;

            /*
              if (esSi(valida_cuotas_impagas_pago_inscripcion)) {
                const token = localStorage.getItem('token');
                const resDeuda = await fetch(
                  `${process.env.REACT_APP_API_URL}/api/pagos/estado-deuda/${alumno.id_alumno}`,
                  {
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                      }
                  }
                );
                if (resDeuda.ok) {
                  const dataDeuda = await resDeuda.json();
                  if (Array.isArray(dataDeuda) && dataDeuda.length > 0) {
                    avisar.error(`El alumno ${alumno.apellidos} ${alumno.nombres} tiene cuotas impagas.`);
                    continue;
                  }
                }
              }*/


            payload.push({
              id_alumno: alumno.id_alumno,
              ...datosAcademicos,
              id_cargo_cuenta_corriente: formData.id_cargo_cuenta_corriente,
              id_anio: formData.id_anio,
              anio: anioValor,
              forma: formData.forma,
              cuota: anioValor,
              descripcion: `Inscripción anual del Año ${anioValor} Cuota 1/1`,
              importe: obtenerImporteFinal(montoInscripcion),
              fecha: fechaActualStr,
            });
          } 
          // Subcaso 3B: 2 Cuotas
          else if (numCuotasInscripcion > 1) {
            const permiteEnCuotas =
              (idNivel === 1 && esSi(cobra_inscripcion_en_cuotas_inicial)) ||
              (idNivel === 2 && esSi(cobra_inscripcion_en_cuotas_primario));

            if (permiteEnCuotas) {
             /* if (esSi(valida_cuotas_impagas_pago_inscripcion)) {
                const token = localStorage.getItem('token');
                const resDeuda = await fetch(
                  `${process.env.REACT_APP_API_URL}/api/pagos/estado-deuda/${alumno.id_alumno}`,
                  {
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                      }
                  }
                );
                if (resDeuda.ok) {
                  const dataDeuda = await resDeuda.json();
                  if (Array.isArray(dataDeuda) && dataDeuda.length > 0) {
                    avisar.error(`El alumno ${alumno.apellidos} ${alumno.nombres} tiene cuotas impagas.`);
                    continue;
                  }
                }
              }*/

              let impCuota1 = idNivel === 1 ? importe_cuota_uno_nivel_inicial : importe_cuota_uno_nivel_primario;
              let impCuota2 = idNivel === 1 ? importe_cuota_dos_nivel_inicial : importe_cuota_dos_nivel_primario;

              // Cuota 1: Fecha actual
              payload.push({
                id_alumno: alumno.id_alumno,
                ...datosAcademicos,
                id_cargo_cuenta_corriente: formData.id_cargo_cuenta_corriente,
                id_anio: formData.id_anio,
                anio: anioValor,
                forma: formData.forma,
                cuota: `${anioValor}`,
                descripcion: `Inscripción anual del Año ${anioValor} Cuota 1/2`,
                importe: obtenerImporteFinal(impCuota1),
                fecha: fechaActualStr,
              });

              // Cuota 2: 1 Mes después (día hábil)
              payload.push({
                id_alumno: alumno.id_alumno,
                ...datosAcademicos,
                id_cargo_cuenta_corriente: formData.id_cargo_cuenta_corriente,
                id_anio: formData.id_anio,
                anio: anioValor,
                forma: formData.forma,
                cuota: `${anioValor}`,
                descripcion: `Inscripción anual del Año ${anioValor} Cuota 2/2`,
                importe: obtenerImporteFinal(impCuota2),
                fecha: fechaCuota2Str,
              });
            }
          }
        }
      }

      if (payload.length === 0) {
        avisar.error('No se generó ningún cargo válido para procesar.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/generar-cargos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al procesar la solicitud');
      }

      // 1. Obtener los datos reales de la respuesta
      const data = await response.json(); 


      // 2. Armar el mensaje para la alerta usando el resumen recibido
      const { generados, noGenerados } = data.resumen;
      const mensaje = `Proceso completado. Generados: ${generados} | No generados: ${noGenerados}`;

      // 3. Mostrar la notificación con el mensaje en texto
      avisar.exito(mensaje);

      // 1. Formatear la lista de alumnos omitidos
      let listaOmitidosTexto = '';

      if (data.detallesNoGenerados && data.detallesNoGenerados.length > 0) {
          listaOmitidosTexto = '\n\nAlumnos omitidos:\n' +
              data.detallesNoGenerados
                  .map(a => `• ${a.apellidos}, ${a.nombres} (${a.tipo_documento}: ${a.numero_documento}) - Motivo: ${a.motivo}`)
                  .join('\n');
      }

      // 2. Armar el mensaje completo
      const mensajeAlert = `RESUMEN DE GENERACIÓN DE:\n${payload[0].descripcion.toUpperCase()}\n` +
        `-----------------------------------------\n` +
        `• Cargos generados: ${generados}\n` +
        `• Cargos no generados: ${noGenerados}` +
        listaOmitidosTexto;

      // 3. Mostrar la alerta
      alert(mensajeAlert);

      handleCancel();
    } catch (error) {
      console.error('Error al enviar los cargos:', error);
      avisar.error(`Ocurrió un error: ${error.message}`);
    }
  };

  const cargoSeleccionado = cargos.find(
    (c) => String(c.id_cargo_cuenta_corriente) === String(formData.id_cargo_cuenta_corriente)
  );

  const esInscripcion = cargoSeleccionado && /inscripci/i.test(cargoSeleccionado.nombre);
  const esCuota = cargoSeleccionado && /cuota/i.test(cargoSeleccionado.nombre);
  const esMateriales = cargoSeleccionado && /materiales/i.test(cargoSeleccionado.nombre);

  if (loading) return <div className="p-4">Cargando formulario...</div>;

  return (
    <div className="max-w-4xl mx-auto my-6 border border-indigo-900 rounded bg-gray-100 shadow-md">
      <div className="bg-indigo-900 text-white font-bold p-2 text-sm rounded-t">
        Generar cargos a alumnos
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Forma */}
        <div className="grid grid-cols-12 items-center text-sm">
          <label className="col-span-2 font-semibold text-gray-700">Forma:</label>
          <select
            name="forma"
            value={formData.forma}
            onChange={handleChange}
            required
            className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
          >
            <option value="">-- SELECCIONE --</option>
            <option value="Individual">Individual</option>
            <option value="Grupal">Grupal</option>
          </select>
        </div>

        {/* Combo Grado (Habilitado si importe_mensual_cuota_x_grado === 'S' y Forma === Grupal) */}
        {requiereGrado && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Grado:</label>
            <select
              name="id_grado"
              value={formData.id_grado}
              onChange={handleChange}
              required
              className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
            >
              <option value="">-- SELECCIONE GRADO --</option>
              {gradosDisponibles.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>
                  {g.grado}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Alumno (Solo Individual) */}
        {formData.forma === 'Individual' && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Alumno:</label>
            <select
              name="id_alumno"
              value={formData.id_alumno}
              onChange={handleChange}
              required
              className="col-span-6 p-1 border border-gray-400 rounded bg-white text-sm"
            >
              <option value="">-- SELECCIONE --</option>
              {alumnos
                .filter((alumno) => alumno.es_alumno === 'S' && alumno.activo === 'S' && alumno.regular === 'S')
                .map((alumno) => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>
                    {alumno.apellidos}, {alumno.nombres} - {alumno.nombre_corto} {alumno.numero} - {alumno.grado} ({alumno.nivel})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Cargo */}
        <div className="grid grid-cols-12 items-center text-sm">
          <label className="col-span-2 font-semibold text-gray-700">Cargo:</label>
          <select
            name="id_cargo_cuenta_corriente"
            value={formData.id_cargo_cuenta_corriente}
            onChange={handleChange}
            required
            className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
          >
            <option value="">-- SELECCIONE --</option>
            {cargos.map((cargo) => (
              <option key={cargo.id_cargo_cuenta_corriente} value={cargo.id_cargo_cuenta_corriente}>
                {cargo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Importe Manual (Habilitado si ingresa_importe_en_generacion_cargos === 'S' o importe_mensual_cuota_x_grado === 'S') */}
        {debeIngresarImporte && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Importe ($):</label>
            <input
              type="number"
              step="0.01"
              name="importe"
              value={formData.importe}
              onChange={handleChange}
              placeholder="0.00"
              required
              className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
            />
          </div>
        )}

        {/* Mes */}
        {esCuota && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Mes:</label>
            <select
              name="mes"
              value={formData.mes}
              onChange={handleChange}
              required
              className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
            >
              <option value="">-- SELECCIONE --</option>
              {MESES.map((mes) => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Número de Cuota */}
        {esMateriales && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Número de Cuota:</label>
            <select
              name="numero_cuota"
              value={formData.numero_cuota}
              onChange={handleChange}
              required
              className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
            >
              <option value="">-- SELECCIONE --</option>
              {Array.from({ length: CantidadCuotasMateriales || 0 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Año */}
        <div className="grid grid-cols-12 items-center text-sm">
          <label className="col-span-2 font-semibold text-gray-700">Año:</label>
          <select
            name="id_anio"
            value={formData.id_anio}
            onChange={handleChange}
            required
            className="col-span-4 p-1 border border-gray-400 rounded bg-white text-sm"
          >
            <option value="">-- SELECCIONE --</option>
            {[...anios]
              .sort((a, b) => a.anio - b.anio)
              .map((anio) => (
                <option key={anio.id_anio} value={anio.id_anio}>
                  {anio.anio}
                </option>
              ))}
          </select>
        </div>

        {/* Botones */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-300">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-200 border border-gray-400 rounded text-sm text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-3 py-1 bg-gray-200 border border-gray-400 rounded text-sm text-gray-800 hover:bg-gray-300 font-medium"
          >
            Procesar
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerarCargosAlumnos;