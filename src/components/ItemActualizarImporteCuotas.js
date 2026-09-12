import React, { useState, useEffect } from 'react';
import { showConfirm, 
  //showSuccess, showInfo, 
  showError } from '../utils/alerts';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ReporteTabs } from './ReporteTabs'; // O la ruta donde lo ubiques

const MySwal = withReactContent(Swal);

// Mapeo estático de Meses con su número de Cuota (01 - 12)
const MESES_CUOTAS = [
  { numero: '01', nombre: 'Enero' },
  { numero: '02', nombre: 'Febrero' },
  { numero: '03', nombre: 'Marzo' },
  { numero: '04', nombre: 'Abril' },
  { numero: '05', nombre: 'Mayo' },
  { numero: '06', nombre: 'Junio' },
  { numero: '07', nombre: 'Julio' },
  { numero: '08', nombre: 'Agosto' },
  { numero: '09', nombre: 'Septiembre' },
  { numero: '10', nombre: 'Octubre' },
  { numero: '11', nombre: 'Noviembre' },
  { numero: '12', nombre: 'Diciembre' },
];

export default function ItemActualizarImporteCuotas() {
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [listaAnios, setListaAnios] = useState([]);
  const [incluirNoRegulares, setIncluirNoRegulares] = useState(false);
  
  const [alumnos, setAlumnos] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const [loading, setLoading] = useState(false);

  const [valorCuotaAplicar, setValor_importe_mensual_cuota] = useState(null);

  // Helper para obtener Token de autenticación
  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  // Función para obtener identificador único por fila
  const getRowId = (item, idx) => item.id_alumno_cc || item.id_pago || `${item.id_alumno}-${idx}`;

  // Obtener parámetro de importe cuota
  useEffect(() => {
    const obtenerParametros = async () => {
      try {
        const token = getToken();
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

        setValor_importe_mensual_cuota(getParam('importe_mensual_cuota'));

      } catch (error) {
        console.error('Error al obtener parametros:', error);
      }
    };

    obtenerParametros();
  }, []);

  // Obtener lista de años desde el endpoint
  useEffect(() => {
    const obtenerAnios = async () => {
      try {
        const token = getToken();

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/academica/aniocursado`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error(`Error status: ${response.status}`);

        const data = await response.json();
        const aniosProcesados = Array.isArray(data)
          ? data.map(item => (typeof item === 'object' ? (item.anio || item.aniocursado) : item))
          : [];

        setListaAnios(aniosProcesados);
      } catch (error) {
        console.error('Error al cargar años:', error);
        showError('Error', 'No se pudieron cargar los años desde el servidor.');
      }
    };

    obtenerAnios();
  }, []);

  // Filtrado de alumnos (Aplica para cualquier combinación de combos)
  const handleFiltrar = async (e) => {
    e.preventDefault();
    setLoading(true);


    try {

      MySwal.fire({
        title: 'Filtrando...',
        text: 'Filtrando alumnos con importe desactualizado.',
        allowOutsideClick: false,
        didOpen: () => MySwal.showLoading(),
      });

      const token = getToken();
      const queryParams = new URLSearchParams({
        cuota: mes || '',
        anio: anio || '',
        incluirNoRegulares: incluirNoRegulares
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/alumnos-pendientes?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
          cache: 'no-store' // 👈 Evita el estado 304 Not Modified
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);



      const data = await response.json();
      const listaObtenida = Array.isArray(data) ? data : data.alumnos || [];

      setAlumnos(listaObtenida);
      // Por defecto seleccionamos todas las filas obtenidas
      setSelectedRowIds(listaObtenida.map((item, idx) => getRowId(item, idx)));
      setBuscado(true);
// 👈 AGREGÁ ESTA LÍNEA AQUÍ
    MySwal.close();
    } catch (error) {
      console.error('Error al filtrar alumnos:', error);
      showError('Error al filtrar', 'Ocurrió un problema al buscar los registros pendientes.');
      // 👈 AGREGÁ ESTA LÍNEA AQUÍ
    MySwal.close();
    } finally {
      setLoading(false);
      // 👈 AGREGÁ ESTA LÍNEA AQUÍ
    MySwal.close();
    }
  };

  // Checkbox: Seleccionar todos
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(alumnos.map((item, idx) => getRowId(item, idx)));
    } else {
      setSelectedRowIds([]);
    }
  };

  // Checkbox: Toggle individual
  const handleToggleRow = (rowId) => {
    setSelectedRowIds(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  };

  // Limpiar filtros y tabla
  const handleLimpiar = () => {
    setMes('');
    setAnio('');
    setIncluirNoRegulares(false);
    setAlumnos([]);
    setSelectedRowIds([]);
    setBuscado(false);
  };

  // Confirmar y Procesar actualización
const handleProcesar = async () => {
    let listaAlumnosBase = alumnos;

    // 1. Si el usuario NO presionó "Filtrar" (alumnos está vacío), obtenemos la lista automáticamente
    if (listaAlumnosBase.length === 0) {

      try {
           
      MySwal.fire({
        title: 'Filtrando...',
        text: 'Filtrando alumnos con importe desactualizado.',
        allowOutsideClick: false,
        didOpen: () => MySwal.showLoading(),
      });
      

        const token = getToken();
        // ⚠️ Reemplaza esta URL y parámetros por la que usas en tu botón "Filtrar" / "Buscar"
        const params = new URLSearchParams({
          anio: anio || '',
          mes: mes || '',
          incluirNoRegulares: incluirNoRegulares
        });

        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/alumnos-pendientes?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          // Ajusta según cómo devuelva los datos tu API (ej: data.alumnos o data)
          listaAlumnosBase = Array.isArray(data) ? data : (data.alumnos || []); 
        }
        MySwal.close();
      } catch (err) {
        MySwal.close();
        console.error('Error al traer los alumnos para procesar:', err);
      }
    }

    // 2. Determinar alumnos a procesar (si seleccionó manualmente usa esos, sino usa la lista completa)
    const alumnosAProcesar = selectedRowIds.length > 0
      ? listaAlumnosBase.filter((item, idx) => selectedRowIds.includes(getRowId(item, idx)))
      : listaAlumnosBase;

    // 3. Mapear para el backend
    const listaSeleccionada = alumnosAProcesar.map(a => ({
      id_alumno: a.id_alumno,
      id_alumno_cc: a.id_alumno_cc,
      cuota: a.cuota,
      cuotaid: a.cuotaid,
      importeActualVal: Number(a.importeActual).toFixed(2)
    }));

    // Mensajes de confirmación
    let confirmTitle = '¿Confirmar actualización?';
    let confirmText = '';
    //const mesObj = MESES_CUOTAS.find(m => m.numero === mes);
    //const nombreMes = mesObj ? mesObj.nombre : mes;

    if (selectedRowIds.length > 0) {
      confirmText = `Se actualizará el importe a $${Number(valorCuotaAplicar).toFixed(2)} para los ${selectedRowIds.length} registro(s) seleccionado(s) manualmente.`;
    } else if (listaSeleccionada.length > 0) {
      confirmText = `Se actualizará el importe a $${Number(valorCuotaAplicar).toFixed(2)} para los ${listaSeleccionada.length} registro(s) encontrados con los filtros actuales.`;
    } else {
      if (!mes && !anio) {
        confirmTitle = '¿Actualizar TODAS las cuotas?';
        confirmText = `No ha seleccionado ningún filtro. Se actualizarán TODAS las cuotas impagas al importe de $${Number(valorCuotaAplicar).toFixed(2)}. ¿Desea continuar?`;
      } else {
        confirmText = `Se actualizarán las cuotas correspondientes a los filtros seleccionados al importe de $${Number(valorCuotaAplicar).toFixed(2)}.`;
      }
    }

    // Modal de confirmación
    const result = await showConfirm({
      title: confirmTitle,
      text: confirmText,
      confirmButtonText: 'Sí, procesar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      MySwal.fire({
        title: 'Procesando...',
        text: 'Actualizando importes en la base de datos.',
        allowOutsideClick: false,
        didOpen: () => MySwal.showLoading(),
      });

      try {
        const token = getToken();

        const payload = {
          valorCuotaAplicar: Number(Number(valorCuotaAplicar).toFixed(2)),
          actualizacionDirecta: listaSeleccionada.length === 0,
          cuota: mes || null,
          anio: anio || null,
          incluirNoRegulares: incluirNoRegulares,
          alumnos: listaSeleccionada // <-- Ahora siempre llevará los elementos encontrados
        };

        //console.log(payload);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/actualizarimporte`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        // 2. 👈 PARSEAR EL JSON PRIMERO
        const data = await response.json();
        //console.log("Respuesta del Backend:", data);
        if (!response.ok) {
          throw new Error(data.message || `Error status: ${response.status}`);
        }

        MySwal.close();
        //showSuccess('¡Proceso completado!', 'Los importes se actualizaron correctamente.');

        // Mostrar el reporte interactivo con las solapas
        MySwal.fire({
          title: '¡Proceso de actualización completado!',
          html: (
            <ReporteTabs 
              generados={data.generados}
              noGenerados={data.noGenerados}
              detallesGenerados={data.detallesGenerados}
              detallesNoGenerados={data.detallesNoGenerados}
              tipo="actualizacion"
          />
        ),
        icon: 'success',
        confirmButtonText: 'Aceptar',
        customClass: {
          popup: 'swal2-overflow'
        }
      });

        handleLimpiar();

      } catch (error) {
        MySwal.close();
        console.error('Error al actualizar importes:', error);
        showError('Error', error.message || 'No se pudo completar la actualización de cuotas.');
      }
    }
  };


  return (
    <div className="max-w-5xl mx-auto my-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden text-gray-800">
      
      {/* Header Principal */}
      <div className="bg-emerald-700 text-white px-5 py-3.5 font-bold text-base shadow-sm">
        Actualizar importe cuotas impagas
      </div>

      <div className="p-6 space-y-6">

        {/* Panel Filtro */}
        <div className="border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden shadow-sm">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 font-semibold text-gray-700 text-sm">
            Filtro de búsqueda
          </div>
          
          <div className="p-5 space-y-4">
            
            {/* Cuadro informativo */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r text-xs text-blue-950 space-y-2">
              <p className="font-semibold text-sm text-blue-900">
                Tenga en cuenta que va a actualizar todas aquellas cuotas que cumplan con las siguientes condiciones:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Solo cuotas mensuales</li>
                <li>Sin datos de pago cargados y en estado pendiente</li>
                <li>Que no hayan sido abonadas parcial o totalmente</li>
                <li>Cuotas ya vencidas (fecha anterior al primer día del mes actual)</li>
                <li>Que no hayan sido actualizadas en el mes vigente ni en el anterior</li>
                <li>Solo de alumnos regulares, salvo que se tilde <em>Incluir alumnos no regulares</em></li>
              </ul>
            </div>

            {/* Aviso de precio */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-emerald-900 text-sm font-medium">
              El valor de cuota que se aplicará a cada cuota adeudada es: <span className="font-bold text-emerald-700 text-base ml-1">${Number(valorCuotaAplicar).toFixed(2)}</span>
            </div>

            {/* Formulario Filtro */}
            <form onSubmit={handleFiltrar} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                
                {/* Desplegable Cuota / Mes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cuota / Mes:</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  >
                    <option value="">-- SELECCIONAR --</option>
                    {MESES_CUOTAS.map((m) => (
                      <option key={m.numero} value={m.numero}>
                        Cuota {m.numero} - {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desplegable Años */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Año:</label>
                  <select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                  >
                    <option value="">-- SELECCIONAR --</option>
                    {listaAnios.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center pt-1">
                <input
                  id="incluirNoRegulares"
                  type="checkbox"
                  checked={incluirNoRegulares}
                  onChange={(e) => setIncluirNoRegulares(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="incluirNoRegulares" className="ml-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                  Incluir alumnos no regulares
                </label>
              </div>

              {/* Botones de acción del filtro */}
              <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleLimpiar}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-md text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {loading ? 'Filtrando...' : 'Filtrar'}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Panel Listado de Alumnos */}
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700">
              Listado de alumnos que cumplen con los requisitos
            </span>
            {alumnos.length > 0 && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Seleccionados: {selectedRowIds.length} / {alumnos.length}
              </span>
            )}
          </div>
          
          <div className="p-4">
            {!buscado ? (
              <div className="text-center py-8 text-sm font-medium text-gray-500">
                Utilice el botón "Filtrar" para buscar registros antes de seleccionar, o presione "Procesar" para actualizar masivamente según los combos.
              </div>
            ) : alumnos.length === 0 ? (
              <div className="text-center py-8 text-sm font-medium text-gray-500">
                No se encontraron cuotas impagas para el criterio de búsqueda seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs">
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={alumnos.length > 0 && selectedRowIds.length === alumnos.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                        />
                      </th>
                      <th className="p-3 font-semibold">Apellido</th>
                      <th className="p-3 font-semibold">Nombre</th>
                      <th className="p-3 font-semibold">Tipo Doc.</th>
                      <th className="p-3 font-semibold">Documento</th>
                      <th className="p-3 font-semibold">Cuota</th>
                      <th className="p-3 font-semibold">Importe Actual</th>
                      <th className="p-3 font-semibold">Nuevo Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700 text-xs">
                    {alumnos.map((a, idx) => {
                      const rowId = getRowId(a, idx);
                      const isSelected = selectedRowIds.includes(rowId);
                      const importeActualVal = Number(a.importeActual).toFixed(2);;

                      return (
                        <tr 
                          key={rowId} 
                          className={`transition-colors ${isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(rowId)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-medium text-gray-900">{a.apellido}</td>
                          <td className="p-3 font-medium text-gray-900">{a.nombre}</td>
                          <td className="p-3">{a.tipo_documento}</td>
                          <td className="p-3">{a.documento}</td>
                          <td className="p-3">{a.cuota}</td>
                          <td className="p-3 text-red-600 font-medium">${importeActualVal}</td>
                          <td className="p-3 text-emerald-600 font-semibold">${Number(valorCuotaAplicar ).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Botón Acción Principal (Procesar) */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleProcesar}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded text-sm font-semibold shadow transition-colors"
          >
            Procesar
          </button>
        </div>

      </div>
    </div>
  );
}