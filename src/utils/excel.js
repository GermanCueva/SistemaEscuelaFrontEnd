import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Exporta un dataset a Excel con formato estilizado
 * @param {Object} params
 * @param {Array<Object>} params.columnsConfig - Configuración de columnas (header, key, width, isCurrency)
 * @param {Array<Object>} params.data - Arreglo de objetos con los datos
 * @param {string} params.fileName - Nombre del archivo final (sin extensión)
 * @param {string} params.sheetName - Nombre de la pestaña en Excel
 */
export const exportToExcelCustom = async ({
  columnsConfig,
  data,
  fileName = 'Reporte',
  sheetName = 'Datos',
}) => {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar');
    return;
  }

  // 1. Instanciar Workbook y Worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 2. Mapear columnas y anchos
  worksheet.columns = columnsConfig.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  // 3. Estilar la fila de encabezados
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' }, // Color slate oscuro
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 4. Agregar filas y formatear celdas (monedas/números)
  data.forEach((item) => {
    const row = worksheet.addRow(item);
    columnsConfig.forEach((col) => {
      if (col.isCurrency) {
        row.getCell(col.key).numFmt = '$#,##0.00';
      }
    });
  });

  // 5. Generar Buffer y descargar mediante file-saver
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${fileName}.xlsx`);
};