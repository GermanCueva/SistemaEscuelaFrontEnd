import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Users,
  AlertTriangle
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';

// Catálogo de reportes dinámicos configurados en PostgreSQL (fn_obtener_listado)
const CATALOGO_REPORTES = [
  {
    id: 'SALDO_POR_ANIO_MES',
    nombre: 'Saldos de Alumnos por Año y Cuota',
    descripcion: 'Detalle de cuotas por alumno, año y mes. Muestra importe, pagado y saldo pendiente.',
    icono: Calendar
  },
  {
    id: 'SALDO_ALUMNOS',
    nombre: 'Saldo General Acumulado por Alumno',
    descripcion: 'Consolidado general de deuda total y cantidad de cuotas adeudadas por alumno.',
    icono: DollarSign
  },
  {
    id: 'CUOTAS_ADEUDADAS',
    nombre: 'Ranking de Morosidad (Cuotas Adeudadas)',
    descripcion: 'Alumnos que adeudan cuotas, detalle de períodos vencidos y contacto del tutor.',
    icono: AlertTriangle
  }
];

const MESES = [
  { valor: '', label: '-- Todos los meses / cuotas --' },
  { valor: '0', label: 'Matrícula / Inscripción' },
  { valor: '2', label: '02 - Febrero' },
  { valor: '3', label: '03 - Marzo' },
  { valor: '4', label: '04 - Abril' },
  { valor: '5', label: '05 - Mayo' },
  { valor: '6', label: '06 - Junio' },
  { valor: '7', label: '07 - Julio' },
  { valor: '8', label: '08 - Agosto' },
  { valor: '9', label: '09 - Septiembre' },
  { valor: '10', label: '10 - Octubre' },
  { valor: '11', label: '11 - Noviembre' },
  { valor: '12', label: '12 - Diciembre' },
];

export default function ItemReportes() {
  const { user } = useAuth();
  const anioActual = new Date().getFullYear();

  // Selección de reporte activo
  const [tipoReporte, setTipoReporte] = useState('SALDO_POR_ANIO_MES');

  // Filtros dinámicos
  const [filtros, setFiltros] = useState({
    anio: anioActual,
    mes: '',
    solo_deudores: false,
    min_cuotas: 1,
    curso_id: ''
  });

  const aniosDisponibles = [2027, 2026, 2025, 2024, 2023, 2022, 2021];
  const [grados, setGrados] = useState([]);

  // Estados de datos y vista
  const [datosReporte, setDatosReporte] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 15;

  // Cargar lista de grados desde la API
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/academica/grado`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGrados(data);
      })
      .catch(err => console.error('Error al cargar grados:', err));
  }, []);

  // Ejecutar el reporte dinámico
  const handleConsultar = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    setError(null);
    setPaginaActual(1);

    try {
      const token = localStorage.getItem('token');

      // Preparar payload de filtros limpios
      const payloadFiltros = {
        identidadeducativa: user?.identidadeducativa
      };

      if (filtros.curso_id) payloadFiltros.curso_id = Number(filtros.curso_id);

      if (tipoReporte === 'SALDO_POR_ANIO_MES') {
        if (filtros.anio) payloadFiltros.anio = Number(filtros.anio);
        if (filtros.mes !== '') payloadFiltros.mes = Number(filtros.mes);
        if (filtros.solo_deudores) payloadFiltros.solo_deudores = true;
      } else if (tipoReporte === 'SALDO_ALUMNOS') {
        if (filtros.solo_deudores) payloadFiltros.solo_deudores = true;
      } else if (tipoReporte === 'CUOTAS_ADEUDADAS') {
        if (filtros.min_cuotas) payloadFiltros.min_cuotas = Number(filtros.min_cuotas);
        if (filtros.anio) payloadFiltros.anio_hasta = Number(filtros.anio);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reportes/ejecutar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipoReporte: tipoReporte,
          parametros: payloadFiltros
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.mensaje || 'Error al ejecutar reporte');
      }

      const resultado = await response.json();
      setDatosReporte(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      console.error('Error al ejecutar reporte:', err);
      setError(err.message || 'No se pudo obtener la información.');
      setDatosReporte([]);
    } finally {
      setCargando(false);
    }
  };

  // Filtrado en vivo por texto de búsqueda
  const datosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return datosReporte;
    const q = busqueda.toLowerCase();
    return datosReporte.filter(item => 
      (item.alumno_nombre && item.alumno_nombre.toLowerCase().includes(q)) ||
      (item.documento && String(item.documento).includes(q)) ||
      (item.legajo && String(item.legajo).toLowerCase().includes(q)) ||
      (item.grado && item.grado.toLowerCase().includes(q)) ||
      (item.tutor_nombre && item.tutor_nombre.toLowerCase().includes(q))
    );
  }, [datosReporte, busqueda]);

  // Totales y KPIs según el reporte activo
  const metricas = useMemo(() => {
    let saldoTotal = 0;
    let pagadoTotal = 0;
    let cuotasTotal = 0;

    datosFiltrados.forEach(item => {
      saldoTotal += Number(item.saldo_periodo ?? item.saldo_total ?? item.deuda_acumulada ?? 0);
      pagadoTotal += Number(item.importe_pagado ?? 0);
      cuotasTotal += Number(item.cantidad_cuotas_vencidas ?? item.cuotas_adeudadas ?? 0);
    });

    return {
      totalRegistros: datosFiltrados.length,
      saldoTotal,
      pagadoTotal,
      cuotasTotal
    };
  }, [datosFiltrados]);

  // Paginación
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina) || 1;
  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return datosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [datosFiltrados, paginaActual, registrosPorPagina]);

  const formatearMoneda = (val) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
  };

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (datosFiltrados.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    if (tipoReporte === 'SALDO_POR_ANIO_MES') {
      worksheet.columns = [
        { header: 'Año', key: 'anio', width: 10 },
        { header: 'Mes', key: 'mes', width: 8 },
        { header: 'Legajo', key: 'legajo', width: 14 },
        { header: 'Alumno', key: 'alumno_nombre', width: 32 },
        { header: 'Documento', key: 'documento', width: 14 },
        { header: 'Grado', key: 'grado', width: 18 },
        { header: 'Cuota / Concepto', key: 'descripcion_cuota', width: 30 },
        { header: 'Importe ($)', key: 'importe', width: 15 },
        { header: 'Pagado ($)', key: 'importe_pagado', width: 15 },
        { header: 'Saldo ($)', key: 'saldo_periodo', width: 15 },
        { header: 'Estado', key: 'estado', width: 14 }
      ];
    } else if (tipoReporte === 'SALDO_ALUMNOS') {
      worksheet.columns = [
        { header: 'Legajo', key: 'legajo', width: 14 },
        { header: 'Alumno', key: 'alumno_nombre', width: 32 },
        { header: 'Documento', key: 'documento', width: 14 },
        { header: 'Grado', key: 'grado', width: 20 },
        { header: 'Cuotas Adeudadas', key: 'cuotas_adeudadas', width: 18 },
        { header: 'Saldo Total Deuda ($)', key: 'saldo_total', width: 20 }
      ];
    } else {
      worksheet.columns = [
        { header: 'Legajo', key: 'legajo', width: 14 },
        { header: 'Alumno', key: 'alumno_nombre', width: 32 },
        { header: 'Documento', key: 'documento', width: 14 },
        { header: 'Grado', key: 'grado', width: 18 },
        { header: 'Cant. Cuotas Vencidas', key: 'cantidad_cuotas_vencidas', width: 20 },
        { header: 'Deuda Acumulada ($)', key: 'deuda_acumulada', width: 20 },
        { header: 'Períodos Adeudados', key: 'periodos_adeudados', width: 35 },
        { header: 'Tutor', key: 'tutor_nombre', width: 28 },
        { header: 'Teléfono Tutor', key: 'tutor_telefono', width: 18 }
      ];
    }

    // Estilos del encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    datosFiltrados.forEach(row => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_${tipoReporte}.xlsx`);
  };

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (datosFiltrados.length === 0) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const nombreReporte = reporteActualInfo?.nombre || 'Reporte de Gestión';
    const fechaHora = new Date().toLocaleString('es-AR');

    // Título y encabezado
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(nombreReporte, 40, 35);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    const resumenSubtitulo = `Generado: ${fechaHora}  |  Registros: ${datosFiltrados.length}  |  Deuda/Saldo Total: ${formatearMoneda(metricas.saldoTotal)}`;
    doc.text(resumenSubtitulo, 40, 48);

    let columns = [];
    let rows = [];
    let columnStyles = {};

    if (tipoReporte === 'SALDO_POR_ANIO_MES') {
      columns = [
        { header: 'Año', dataKey: 'anio' },
        { header: 'Mes', dataKey: 'mes' },
        { header: 'Legajo', dataKey: 'legajo' },
        { header: 'Alumno', dataKey: 'alumno_nombre' },
        { header: 'Documento', dataKey: 'documento' },
        { header: 'Grado', dataKey: 'grado' },
        { header: 'Cuota / Concepto', dataKey: 'descripcion_cuota' },
        { header: 'Importe', dataKey: 'importe' },
        { header: 'Pagado', dataKey: 'importe_pagado' },
        { header: 'Saldo', dataKey: 'saldo_periodo' },
        { header: 'Estado', dataKey: 'estado' }
      ];

      columnStyles = {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 120 },
        4: { cellWidth: 55 },
        5: { cellWidth: 70 },
        6: { cellWidth: 100 },
        7: { cellWidth: 55, halign: 'right' },
        8: { cellWidth: 55, halign: 'right' },
        9: { cellWidth: 55, halign: 'right' },
        10: { cellWidth: 55, halign: 'center' }
      };

      rows = datosFiltrados.map(item => ({
        anio: item.anio,
        mes: item.mes > 0 ? item.mes : 'Insc.',
        legajo: item.legajo || '-',
        alumno_nombre: item.alumno_nombre,
        documento: item.documento || '-',
        grado: item.grado || '-',
        descripcion_cuota: item.descripcion_cuota || '-',
        importe: formatearMoneda(item.importe),
        importe_pagado: formatearMoneda(item.importe_pagado),
        saldo_periodo: formatearMoneda(item.saldo_periodo),
        estado: item.estado || '-'
      }));
    } else if (tipoReporte === 'SALDO_ALUMNOS') {
      columns = [
        { header: 'Legajo', dataKey: 'legajo' },
        { header: 'Alumno', dataKey: 'alumno_nombre' },
        { header: 'Documento', dataKey: 'documento' },
        { header: 'Grado', dataKey: 'grado' },
        { header: 'Cuotas Adeudadas', dataKey: 'cuotas_adeudadas' },
        { header: 'Saldo Total Deuda', dataKey: 'saldo_total' }
      ];

      columnStyles = {
        0: { cellWidth: 70 },
        1: { cellWidth: 200 },
        2: { cellWidth: 80 },
        3: { cellWidth: 120 },
        4: { cellWidth: 90, halign: 'center' },
        5: { cellWidth: 100, halign: 'right' }
      };

      rows = datosFiltrados.map(item => ({
        legajo: item.legajo || '-',
        alumno_nombre: item.alumno_nombre,
        documento: item.documento || '-',
        grado: item.grado || '-',
        cuotas_adeudadas: item.cuotas_adeudadas || 0,
        saldo_total: formatearMoneda(item.saldo_total)
      }));
    } else {
      columns = [
        { header: 'Legajo', dataKey: 'legajo' },
        { header: 'Alumno', dataKey: 'alumno_nombre' },
        { header: 'Documento', dataKey: 'documento' },
        { header: 'Grado', dataKey: 'grado' },
        { header: 'Cant. Venc.', dataKey: 'cantidad_cuotas_vencidas' },
        { header: 'Deuda Total', dataKey: 'deuda_acumulada' },
        { header: 'Períodos Adeudados', dataKey: 'periodos_adeudados' },
        { header: 'Tutor', dataKey: 'tutor_nombre' },
        { header: 'Teléfono Tutor', dataKey: 'tutor_telefono' }
      ];

      columnStyles = {
        0: { cellWidth: 50 },
        1: { cellWidth: 140 },
        2: { cellWidth: 60 },
        3: { cellWidth: 80 },
        4: { cellWidth: 55, halign: 'center' },
        5: { cellWidth: 65, halign: 'right' },
        6: { cellWidth: 130 },
        7: { cellWidth: 100 },
        8: { cellWidth: 70 }
      };

      rows = datosFiltrados.map(item => ({
        legajo: item.legajo || '-',
        alumno_nombre: item.alumno_nombre,
        documento: item.documento || '-',
        grado: item.grado || '-',
        cantidad_cuotas_vencidas: item.cantidad_cuotas_vencidas || 0,
        deuda_acumulada: formatearMoneda(item.deuda_acumulada),
        periodos_adeudados: item.periodos_adeudados || '-',
        tutor_nombre: item.tutor_nombre || '-',
        tutor_telefono: item.tutor_telefono || '-'
      }));
    }

    autoTable(doc, {
      startY: 60,
      columns: columns,
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [37, 99, 235], // azul #2563eb
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      columnStyles: columnStyles,
      didDrawPage: (data) => {
        const str = `Página ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        doc.text(str, pageWidth - 60, pageHeight - 15);
      }
    });

    doc.save(`Reporte_${tipoReporte}.pdf`);
  };

  const reporteActualInfo = CATALOGO_REPORTES.find(r => r.id === tipoReporte);

  return (
    <div className="w-full space-y-5">
      {/* Encabezado del Módulo de Reportes */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            Módulo de Reportes y Listados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {reporteActualInfo?.descripcion}
          </p>
        </div>

        {/* Selector de Listado */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Seleccionar Reporte:</label>
          <select
            value={tipoReporte}
            onChange={(e) => {
              setTipoReporte(e.target.value);
              setDatosReporte([]);
            }}
            className="w-full md:w-80 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {CATALOGO_REPORTES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulario de Parámetros Dinámicos según el tipo de listado */}
      <form onSubmit={handleConsultar} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
          <Filter size={18} className="text-blue-600" />
          Parámetros para: <span className="text-blue-700 font-bold">{reporteActualInfo?.nombre}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Parámetro Año (para SALDO_POR_ANIO_MES o límite de año en CUOTAS_ADEUDADAS) */}
          {(tipoReporte === 'SALDO_POR_ANIO_MES' || tipoReporte === 'CUOTAS_ADEUDADAS') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar size={14} className="text-gray-500" />
                {tipoReporte === 'CUOTAS_ADEUDADAS' ? 'Año Límite (Hasta):' : 'Año:'}
              </label>
              <select
                value={filtros.anio}
                onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Todos los años --</option>
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parámetro Mes (solo para SALDO_POR_ANIO_MES) */}
          {tipoReporte === 'SALDO_POR_ANIO_MES' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cuota / Mes:
              </label>
              <select
                value={filtros.mes}
                onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Parámetro Grado / Curso */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Grado / Sala:
            </label>
            <select
              value={filtros.curso_id}
              onChange={(e) => setFiltros({ ...filtros, curso_id: e.target.value })}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Todos los grados --</option>
              {grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
              ))}
            </select>
          </div>

          {/* Parámetro Mínimo de Cuotas (solo para CUOTAS_ADEUDADAS) */}
          {tipoReporte === 'CUOTAS_ADEUDADAS' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mínimo de Cuotas Adeudadas:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={filtros.min_cuotas}
                onChange={(e) => setFiltros({ ...filtros, min_cuotas: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Checkbox Solo Deudores (para SALDO_POR_ANIO_MES o SALDO_ALUMNOS) */}
          {tipoReporte !== 'CUOTAS_ADEUDADAS' && (
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.solo_deudores}
                  onChange={(e) => setFiltros({ ...filtros, solo_deudores: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Solo mostrar alumnos con deuda
              </label>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
            {cargando ? 'Consultando...' : 'Ejecutar Consulta'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Métricas Resumen */}
      {datosReporte.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Registros</p>
              <p className="text-xl font-bold text-gray-800">{metricas.totalRegistros}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <DollarSign size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Deuda / Saldo Total</p>
              <p className="text-lg font-bold text-red-600">{formatearMoneda(metricas.saldoTotal)}</p>
            </div>
          </div>

          {tipoReporte === 'SALDO_POR_ANIO_MES' && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Cobrado</p>
                <p className="text-lg font-bold text-green-700">{formatearMoneda(metricas.pagadoTotal)}</p>
              </div>
            </div>
          )}

          {tipoReporte === 'CUOTAS_ADEUDADAS' && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Cuotas Vencidas Acumuladas</p>
                <p className="text-lg font-bold text-amber-700">{metricas.cuotasTotal}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Barra de Filtro Rápido y Exportar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por alumno, DNI, legajo..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportarExcel}
              disabled={datosFiltrados.length === 0}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download size={15} />
              Exportar Excel
            </button>

            <button
              type="button"
              onClick={handleExportarPDF}
              disabled={datosFiltrados.length === 0}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <FileText size={15} />
              PDF
            </button>
          </div>
        </div>

        {/* Tabla Dinámica según el listado seleccionado */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-3">Legajo</th>
                <th className="py-3 px-3">Alumno</th>
                <th className="py-3 px-3">Documento</th>
                <th className="py-3 px-3">Grado</th>

                {tipoReporte === 'SALDO_POR_ANIO_MES' && (
                  <>
                    <th className="py-3 px-3">Cuota / Concepto</th>
                    <th className="py-3 px-3 text-right">Importe</th>
                    <th className="py-3 px-3 text-right">Pagado</th>
                    <th className="py-3 px-3 text-right">Saldo</th>
                    <th className="py-3 px-3 text-center">Estado</th>
                  </>
                )}

                {tipoReporte === 'SALDO_ALUMNOS' && (
                  <>
                    <th className="py-3 px-3 text-center">Cuotas Adeudadas</th>
                    <th className="py-3 px-3 text-right">Saldo Total</th>
                  </>
                )}

                {tipoReporte === 'CUOTAS_ADEUDADAS' && (
                  <>
                    <th className="py-3 px-3 text-center">Cant. Vencidas</th>
                    <th className="py-3 px-3 text-right">Deuda Total</th>
                    <th className="py-3 px-3">Períodos Adeudados</th>
                    <th className="py-3 px-3">Tutor / Contacto</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500 font-medium">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Consultando listado...
                  </td>
                </tr>
              ) : datosPaginados.length > 0 ? (
                datosPaginados.map((item, idx) => (
                  <tr key={`${item.alumno_id}-${item.id_alumno_cc || idx}`} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-700">{item.legajo || '-'}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-900">{item.alumno_nombre}</td>
                    <td className="py-2.5 px-3 text-gray-600">{item.documento || '-'}</td>
                    <td className="py-2.5 px-3 text-gray-600">{item.grado || '-'}</td>

                    {/* Columnas específicas: SALDO_POR_ANIO_MES */}
                    {tipoReporte === 'SALDO_POR_ANIO_MES' && (
                      <>
                        <td className="py-2.5 px-3 text-gray-700">
                          <span className="font-semibold text-blue-700">
                            {item.mes > 0 ? `Mes ${item.mes}/${item.anio}` : `Inscripción ${item.anio}`}
                          </span>
                          <span className="text-[10px] text-gray-400 block">{item.descripcion_cuota}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                          {formatearMoneda(item.importe)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-green-700">
                          {formatearMoneda(item.importe_pagado)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {formatearMoneda(item.saldo_periodo)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            item.estado === 'PAGADO' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : item.estado === 'PAGO PARCIAL'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Columnas específicas: SALDO_ALUMNOS */}
                    {tipoReporte === 'SALDO_ALUMNOS' && (
                      <>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                          {item.cuotas_adeudadas}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {formatearMoneda(item.saldo_total)}
                        </td>
                      </>
                    )}

                    {/* Columnas específicas: CUOTAS_ADEUDADAS */}
                    {tipoReporte === 'CUOTAS_ADEUDADAS' && (
                      <>
                        <td className="py-2.5 px-3 text-center font-bold text-red-700 bg-red-50/50">
                          {item.cantidad_cuotas_vencidas}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">
                          {formatearMoneda(item.deuda_acumulada)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate" title={item.periodos_adeudados}>
                          {item.periodos_adeudados}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div className="font-medium text-gray-800">{item.tutor_nombre || '-'}</div>
                          <div className="text-[10px] text-gray-400">{item.tutor_telefono || ''}</div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-400">
                    {datosReporte.length === 0 
                      ? 'No hay datos cargados. Configura los filtros y presiona "Ejecutar Consulta".' 
                      : 'No se encontraron resultados para la búsqueda ingresada.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {datosFiltrados.length > 0 && (
          <div className="p-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <div>
              Mostrando {Math.min((paginaActual - 1) * registrosPorPagina + 1, datosFiltrados.length)} a{' '}
              {Math.min(paginaActual * registrosPorPagina, datosFiltrados.length)} de {datosFiltrados.length} registros
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-2 font-medium text-gray-700">
                {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-2.5 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
