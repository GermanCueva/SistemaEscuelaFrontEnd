import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 35, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  title: { fontSize: 18, marginBottom: 4, color: '#0f172a', fontWeight: 'bold' },
  subtitle: { fontSize: 9, marginBottom: 15, color: '#64748b' },
  table: { display: 'table', width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row' },
  tableHeader: { backgroundColor: '#1e293b' },
  tableCell: { padding: 6, fontSize: 8, borderRightWidth: 1, borderRightColor: '#e2e8f0' },
});

export const GenericPDFReport = ({ title = 'Reporte', columns, data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Generado el: {new Date().toLocaleDateString()}
      </Text>

      <View style={styles.table}>
        {/* Encabezado de la tabla */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {columns.map((col, idx) => (
            <Text key={idx} style={[styles.tableCell, { width: col.width || '25%', color: '#ffffff', fontWeight: 'bold' }]}>
              {col.header}
            </Text>
          ))}
        </View>

        {/* Filas con striped background */}
        {data.map((row, rIdx) => (
          <View key={rIdx} style={[styles.tableRow, { backgroundColor: rIdx % 2 === 0 ? '#f8fafc' : '#ffffff' }]}>
            {columns.map((col, cIdx) => (
              <Text key={cIdx} style={[styles.tableCell, { width: col.width || '25%' }]}>
                {row[col.key]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);