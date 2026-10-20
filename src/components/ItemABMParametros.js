import React, { useState, useEffect } from 'react';
import { useInstitution } from '../context/InstitutionContext';
import { Settings, Building2, Edit } from 'lucide-react';

export const ABMParametros = () => {
  const { activeInstitutionId, setActiveInstitutionId, institutions = [] } = useInstitution();
  const [params, setParams] = useState([]);
  const [editingParam, setEditingParam] = useState(null);

  const safeInstitutions = Array.isArray(institutions) ? institutions : [];

  // Cargar parámetros según la institución activa seleccionada
  useEffect(() => {
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // Si hay activeInstitutionId lo enviamos por query param, o llamamos a /api/parametros directamente
    const url = activeInstitutionId 
      ? `${baseUrl}/api/parametros?id_establecimiento=${activeInstitutionId}`
      : `${baseUrl}/api/parametros`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setParams(list);
      })
      .catch(err => console.error('Error cargando parámetros:', err));
  }, [activeInstitutionId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingParam) return;

    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const paramId = editingParam.id_parametro || editingParam.parametro;

    try {
      const res = await fetch(`${baseUrl}/api/parametros/${paramId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editingParam)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      setParams(params.map(p => 
        (p.id_parametro === editingParam.id_parametro || p.parametro === editingParam.parametro) 
          ? editingParam 
          : p
      ));
      setEditingParam(null);
    } catch (err) {
      console.error('Error al actualizar parámetro:', err);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" /> Parámetros del Sistema
          </h1>
          <p className="text-sm text-slate-500">
            Ajuste de valores para la institución activa (ID: {activeInstitutionId || 'Ninguna'})
          </p>
        </div>

        {/* SELECTOR DE INSTITUCIÓN SIEMPRE VISIBLE */}
        <div className="flex items-center gap-2 bg-white border p-2 rounded-lg shadow-sm">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-600">Escuela:</span>
          <select
            value={activeInstitutionId || ''}
            onChange={(e) => setActiveInstitutionId(Number(e.target.value))}
            className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            {safeInstitutions.length === 0 ? (
              <option value="">Cargando / Sin escuelas</option>
            ) : (
              safeInstitutions.map(inst => {
                const id = inst.identidadeducativa || inst.id_establecimiento || inst.id;
                const nombre = inst.entidadeducativa || inst.nombre || inst.escuela;
                return (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>

      {/* TABLA DE PARÁMETROS */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-4 py-3">Parámetro</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Valor Actual</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {params.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  No hay parámetros cargados para esta institución.
                </td>
              </tr>
            ) : (
              params.map((p) => {
                const key = p.id_parametro || p.parametro;
                return (
                  <tr key={key} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.parametro}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.descripcion}</td>
                    <td className="px-4 py-3 font-mono bg-slate-50 rounded text-slate-900">{p.valor}</td>
                    <td className="px-4 py-3 text-xs">{p.version_publicacion || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingParam(p)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingParam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Editar Valor del Parámetro</h3>
            <p className="text-xs text-slate-500 mb-4">{editingParam.descripcion}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valor</label>
                <input
                  type="text"
                  value={editingParam.valor || ''}
                  onChange={(e) => setEditingParam({ ...editingParam, valor: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm font-mono"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingParam(null)}
                  className="px-4 py-2 text-sm border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};