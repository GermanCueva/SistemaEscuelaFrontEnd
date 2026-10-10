import React, { useState, useEffect, useMemo } from 'react';
import { avisar } from '../utils/notificaciones';
import { showConfirm } from '../utils/alerts';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ReporteTabs } from './ReporteTabs';
import { useAuth } from '../context/AuthContext';

const MySwal = withReactContent(Swal);

const esSi = (val) => String(val).toUpperCase() === 'S' || String(val).toUpperCase() === 'SI';

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

const calcularFechaCuota2 = (fechaBase) => {
  const d = new Date(fechaBase);
  d.setMonth(d.getMonth() + 1);

  if (d.getDay() === 6) {
    d.setDate(d.getDate() + 2);
  } else if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
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
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);

  const [alumnos, setAlumnos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [anios, setAnios] = useState([]);
  const [listaGrados, setListaGrados] = useState([]);
  const [loading, setLoading] = useState(true);

  const idEstablecimientoActual = Number(user?.identidadeducativa || user?.id_establecimiento || 1);

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
  const [importe_mensual_cuota_x_grado, setValor_importe_mensual_cuota_x_grado] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      try {
        setLoading(true);
        const [resAlumnos, resCargos, resAnios, resGrados] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/alumnos`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/pagos/cargos`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/academica/aniocursado`, { headers }),
          fetch(`${process.env.REACT_APP_API_URL}/api/academica/grados`, { headers }).catch(() => null),
        ]);

        if (resAlumnos && resAlumnos.ok) {
          const dataAlumnos = await resAlumnos.json();
          setAlumnos(Array.isArray(dataAlumnos) ? dataAlumnos : dataAlumnos.data || []);
        }

        if (resCargos && resCargos.ok) {
          const dataCargos = await resCargos.json();
          setCargos(Array.isArray(dataCargos) ? dataCargos : dataCargos.data || []);
        }

        if (resAnios && resAnios.ok) {
          const dataAnios = await resAnios.json();
          setAnios(Array.isArray(dataAnios) ? dataAnios : dataAnios.data || []);
        }

        if (resGrados && resGrados.ok) {
          const dataGrados = await resGrados.json();
          setListaGrados(Array.isArray(dataGrados) ? dataGrados : dataGrados.data || []);
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.identidadeducativa, user?.id_establecimiento]);

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
        const getParam = (nombre) => listaParametros.find((item) => item?.parametro === nombre)?.valor;

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
        setValor_importe_mensual_cuota_x_grado(getParam('importe_mensual_cuota_x_grado'));
      } catch (error) {
        console.error('Error al obtener parametros:', error);
      }
    };

    obtenerParametros();
  }, [user?.identidadeducativa, user?.id_establecimiento]);

  const gradosDisponibles = useMemo(() => {
    const mapa = new Map();
    const listado = Array.isArray(alumnos) ? alumnos : [];
    listado.forEach((a) => {
      if (a && a.id_grado && a.grado && !mapa.has(a.id_grado)) {
        mapa.set(a.id_grado, { id_grado: a.id_grado, grado: a.grado });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => Number(a.id_grado) - Number(b.id_grado));
  }, [alumnos]);

/**
   * PROYECCIÓN DE NIVEL 100% DINÁMICA
   * Consulta `id_grado_siguiente` en `listaGrados` recuperados del Backend.
   */
  const obtenerProyeccionAlumno = (alumno) => {
    if (!alumno) return { id_nivel_proximo: 1, egresa: false };

    const idGradoActual = Number(alumno.id_grado);

    if (Array.isArray(listaGrados) && listaGrados.length > 0) {
      const infoGradoActual = listaGrados.find((g) => Number(g.id_grado) === idGradoActual);

      if (infoGradoActual) {
        // Si no tiene grado siguiente (NULL o 0), es egresado
        if (!infoGradoActual.id_grado_siguiente || Number(infoGradoActual.id_grado_siguiente) === 0) {
          return { id_nivel_proximo: null, egresa: true };
        }

        // Buscamos el objeto del grado siguiente para obtener su id_nivel
        const infoGradoSiguiente = listaGrados.find(
          (g) => Number(g.id_grado) === Number(infoGradoActual.id_grado_siguiente)
        );

        if (infoGradoSiguiente && infoGradoSiguiente.id_nivel) {
          return {
            id_nivel_proximo: Number(infoGradoSiguiente.id_nivel),
            egresa: false,
          };
        }
      }
    }

    // Fallback conservador si los grados aún no cargaron
    return { id_nivel_proximo: Number(alumno.id_nivel) || 1, egresa: false };
  };

  const requiereGrado = esSi(importe_mensual_cuota_x_grado) && formData.forma === 'Grupal';
  const debeIngresarImporte = esSi(ingresa_importe_en_generacion_cargos) || requiereGrado;

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'forma' && value === 'Grupal') {
      const confirmado = await showConfirm(
        '⚠️ ¡Atención! Va a seleccionar la modalidad Grupal. Esto generará cargos a todos los alumnos. ¿Desea continuar?'
      );
      if (!confirmado) return;
    }

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

    const result = await MySwal.fire({
      title: '¿Desea procesar los cargos?',
      text: `Se generarán las cuotas para el período seleccionado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, procesar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#dc2626'
    });

    if (!result.isConfirmed) return;

    MySwal.fire({
      title: 'Procesando cargos...',
      text: 'Por favor espera un momento...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        MySwal.showLoading();
      }
    });

    const listadoAlumnos = Array.isArray(alumnos) ? alumnos : [];
    const alumnosValidos = listadoAlumnos.filter(
      (alumno) => alumno.es_alumno === 'S' && alumno.activo === 'S' && alumno.regular === 'S'
    );

    let alumnosAProcesar = [];
    if (formData.forma === 'Grupal') {
      alumnosAProcesar = alumnosValidos;

      if (String(formData.id_cargo_cuenta_corriente) === '3') {
        alumnosAProcesar = alumnosAProcesar.filter(
          (a) => String(a.id_grado) === '1'
        );
      } else if (requiereGrado && formData.id_grado) {
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
      MySwal.close();
      avisar.error('No hay alumnos que coincidan con los criterios seleccionados.');
      return;
    }

    const listadoAnios = Array.isArray(anios) ? anios : [];
    const mesFormateado = MAPA_MESES[formData.mes] || '';
    const anioSeleccionado = listadoAnios.find((a) => String(a.id_anio) === String(formData.id_anio));
    const anioValor = anioSeleccionado ? String(anioSeleccionado.anio) : '';
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const ahora = new Date();
    const fechaActualStr = formatFecha(ahora);
    const fechaCuota2Str = calcularFechaCuota2(ahora);

    try {
      const payload = [];

      for (const alumno of alumnosAProcesar) {
        const datosAcademicos = {
          id_grado: alumno.id_grado,
          grado: alumno.grado,
          id_nivel: alumno.id_nivel,
          nivel: alumno.nivel,
        };

        const obtenerImporteFinal = (importeCalculado) => {
          if (debeIngresarImporte && formData.importe !== '') {
            return Number(formData.importe);
          }
          return Number(importeCalculado || 0);
        };

        // CASO 1: CUOTAS MENSUALES
        if (esCuota) {
          payload.push({
            id_alumno: alumno.id_alumno,
            id_establecimiento: idEstablecimientoActual,
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
        // CASO 3: INSCRIPCIÓN ANUAL (ASIGNA IMPORTE SEGÚN EL NIVEL DEL PRÓXIMO AÑO)
        else if (esInscripcion) {
          const proyeccion = obtenerProyeccionAlumno(alumno);
          const idNivelProximo = Number(proyeccion.id_nivel_proximo || 1);
          const numCuotasInscripcion = Number(cant_cuotas_cobro_inscripcion || 1);

          const permiteEnCuotas =
            numCuotasInscripcion > 1 &&
            ((idNivelProximo === 1 && esSi(cobra_inscripcion_en_cuotas_inicial)) ||
             (idNivelProximo === 2 && esSi(cobra_inscripcion_en_cuotas_primario)));

          if (permiteEnCuotas) {
            let impCuota1 = idNivelProximo === 1 ? importe_cuota_uno_nivel_inicial : importe_cuota_uno_nivel_primario;
            let impCuota2 = idNivelProximo === 1 ? importe_cuota_dos_nivel_inicial : importe_cuota_dos_nivel_primario;

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
          } else {
            let montoInscripcion = 0;
            if (idNivelProximo === 1) montoInscripcion = importe_inscripcion_inicial;
            else if (idNivelProximo === 2) montoInscripcion = importe_inscripcion_primario;

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
        }
      }

      if (payload.length === 0) {
        MySwal.close();
        avisar.error('No se generó ningún cargo válido para procesar.');
        return;
      }

const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/generar-cargos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const jsonRaw = await response.json().catch(() => ({}));

      // Si la respuesta no fue exitosa o no trajo estructura válida
      if (!response.ok || !jsonRaw || (jsonRaw.exito === false)) {
        throw new Error(jsonRaw?.message || jsonRaw?.error || `Error ${response.status}: No se pudo procesar la solicitud`);
      }

      const data = jsonRaw.data || jsonRaw.resultado || jsonRaw;
      const generados = data?.resumen?.generados ?? data?.generados ?? 0;
      const noGenerados = data?.resumen?.noGenerados ?? data?.noGenerados ?? 0;
      const detallesGenerados = data?.detallesGenerados || [];
      const detallesNoGenerados = data?.detallesNoGenerados || [];

      const mensaje = `Proceso completado. Generados: ${generados} | No generados: ${noGenerados}`;

      if (generados > 0) {
        avisar.exito(mensaje);
      }

      const tituloAlert = `RESUMEN DE GENERACIÓN DE:<br><strong style="font-size: 1.1rem;">${(payload[0]?.descripcion || '').toUpperCase()}</strong>`;

      await MySwal.fire({
        title: <span dangerouslySetInnerHTML={{ __html: tituloAlert }} />,
        html: (
          <ReporteTabs 
            generados={generados}
            noGenerados={noGenerados}
            detallesGenerados={detallesGenerados}
            detallesNoGenerados={detallesNoGenerados}
          />
        ),
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2563eb',
        width: '700px',
      });

      handleCancel();
    } catch (error) {
      console.error('Error al enviar los cargos:', error);
      MySwal.close();
      avisar.error(error.message);
    }
  };

  const listadoCargos = Array.isArray(cargos) ? cargos : [];
  const cargoSeleccionado = listadoCargos.find(
    (c) => String(c.id_cargo_cuenta_corriente) === String(formData.id_cargo_cuenta_corriente)
  );

  const esInscripcion = cargoSeleccionado && /inscripci/i.test(cargoSeleccionado.nombre);
  const esCuota = cargoSeleccionado && /cuota/i.test(cargoSeleccionado.nombre);
  const esMateriales = cargoSeleccionado && /materiales/i.test(cargoSeleccionado.nombre);

  if (loading) return <div className="p-4">Cargando formulario...</div>;

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-emerald-700 text-white px-5 py-3 font-bold text-base">
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

        {/* Combo Grado */}
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
              {Array.isArray(alumnos) &&
                alumnos
                  .filter((alumno) => alumno.es_alumno === 'S' && alumno.activo === 'S' && alumno.regular === 'S')
                  .map((alumno) => (
                    <option key={alumno.id_alumno} value={alumno.id_alumno}>
                      {alumno.apellidos}, {alumno.nombres} ({alumno.grado} - {alumno.nivel})
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
            {listadoCargos.map((cargo) => (
              <option key={cargo.id_cargo_cuenta_corriente} value={cargo.id_cargo_cuenta_corriente}>
                {cargo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Importe Manual */}
        {debeIngresarImporte && (
          <div className="grid grid-cols-12 items-center text-sm">
            <label className="col-span-2 font-semibold text-gray-700">Importe (\$):</label>
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
            {Array.isArray(anios) &&
              [...anios]
                .sort((a, b) => Number(a.anio) - Number(b.anio))
                .map((anio) => (
                  <option key={anio.id_anio} value={anio.id_anio}>
                    {anio.anio}
                  </option>
                ))}
          </select>
        </div>

        {/* Botones */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-semibold shadow transition-colors"
          >
            Procesar
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerarCargosAlumnos;