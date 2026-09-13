import React, { useState } from 'react';

export const ReporteTabs = ({ 
  generados, 
  noGenerados, 
  detallesGenerados = [], 
  detallesNoGenerados = [],
  tipo = 'generacion' // 👈 'generacion' por defecto para no romper el otro uso
}) => {
  const [tab, setTab] = useState(detallesNoGenerados.length > 0 ? 'noGenerados' : 'generados');

  const tabStyle = (active) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
    background: 'none',
    fontWeight: active ? 'bold' : 'normal',
    color: active ? '#2563eb' : '#64748b',
    cursor: 'pointer',
    fontSize: '0.95rem'
  });

  return (
    <div style={{ textAlign: 'left', fontSize: '0.9rem' }}>
      {/* Solapas */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '12px' }}>
        <button type="button" style={tabStyle(tab === 'generados')} onClick={() => setTab('generados')}>
          {tipo === 'actualizacion' ? 'Actualizados' : 'Generados'} ({generados})
        </button>
        <button type="button" style={tabStyle(tab === 'noGenerados')} onClick={() => setTab('noGenerados')}>
          No Generados ({noGenerados})
        </button>
      </div>

      {/* Contenido: Generados / Actualizados */}
      {tab === 'generados' && (
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 10px 0', color: '#15803d' }}>
            <strong>
              {tipo === 'actualizacion' ? 'Alumnos actualizados' : 'Alumnos procesados'} ({generados}):
            </strong>
          </p>
          
          {detallesGenerados && detallesGenerados.length > 0 ? (
            detallesGenerados.map((a, index) => (
              <div key={index} style={{ marginBottom: '6px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                • {a.apellidos}, {a.nombres} ({a.tipo_documento || 'DNI'}: {a.numero_documento || a.documento})
                
                {/* Muestra los montos solo si estamos en modo actualización y existen los datos */}
                {tipo === 'actualizacion' && a.importeAnterior !== undefined && (
                  <span style={{ color: '#059669', fontWeight: '600', marginLeft: '6px' }}>
                    [${Number(a.importeAnterior).toFixed(2)} ➔ ${Number(a.nuevoImporte).toFixed(2)}]
                  </span>
                )}
              </div>
            ))
          ) : generados > 0 ? (
            <p style={{ margin: 0, color: '#15803d', fontWeight: '500' }}>
              ✓ {tipo === 'actualizacion' 
                  ? `Se actualizaron correctamente los ${generados} importes.` 
                  : `Se generaron correctamente los ${generados} cargos.`}
            </p>
          ) : (
            <p style={{ margin: 0, color: '#64748b' }}>
              {tipo === 'actualizacion' ? 'No se actualizaron registros en esta tanda.' : 'No se generaron cargos en esta tanda.'}
            </p>
          )}
        </div>
      )}

      {/* Contenido: No Generados */}
      {tab === 'noGenerados' && (
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 10px 0', color: '#b91c1c' }}>
            <strong>Alumnos omitidos ({noGenerados}):</strong>
          </p>
          
          {detallesNoGenerados.length > 0 ? (
            detallesNoGenerados.map((a, index) => (
              <div key={index} style={{ marginBottom: '6px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                • {a.apellidos}, {a.nombres} ({a.tipo_documento}: {a.numero_documento}) — <em>Motivo: {a.motivo}</em>
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: '#64748b' }}>No hubo cargos omitidos.</p>
          )}
        </div>
      )}
    </div>
  );
};