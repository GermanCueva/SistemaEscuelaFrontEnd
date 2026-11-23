// ==========================================
// 4. ABM DIVISIONES
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import { useInstitution } from '../context/InstitutionContext';
import { Building2, Plus, Pencil, Trash2, Grid } from 'lucide-react';
import { showConfirm, showSuccess, showError } from '../utils/alerts';


export const ABMDivisiones = () => {
  const { activeInstitutionId, setActiveInstitutionId, institutions = [] } = useInstitution();
  const [divisiones, setDivisiones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_division: null,
    division: '',
    id_establecimiento: activeInstitutionId || ''
  });
  
  const safeInstitutions = Array.isArray(institutions) ? institutions : [];

const fetchDivisiones = useCallback(async () => {
    if (!activeInstitutionId) return;
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      let res = await fetch(`${baseUrl}/api/academica/division?id_establecimiento=${activeInstitutionId}`, { headers });
      
      // Si la respuesta no es OK (incluyendo 404 u otros errores de red)
      if (!res.ok) {
        throw new Error(`Error en la petición: ${res.statusText}`);
      }

      const data = await res.json();
      setDivisiones(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Error cargando divisiones:', err);
    }
  }, [activeInstitutionId]); // <--- Dependencia añadida aquí

useEffect(() => {
    setDivisiones([]);
    fetchDivisiones();
  }, [fetchDivisiones]);

const handleSave = async (e) => {
    e.preventDefault();
    const divisionLimpia = formData.division.trim();
    if (!divisionLimpia || !formData.id_establecimiento) return;

    if (Number(formData.id_establecimiento) === Number(activeInstitutionId)) {
      const duplicada = divisiones.some(
        (d) =>
          d.id_division !== formData.id_division &&
          d.division.trim().toLowerCase() === divisionLimpia.toLowerCase()
      );
      if (duplicada) {
        showError({
          title: 'División duplicada',
          text: `Ya existe la división "${divisionLimpia}" en esta escuela.`,
        });
        return;
      }
    }

    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const payload = {
      division: divisionLimpia,
      id_establecimiento: Number(formData.id_establecimiento),
    };
    const method = formData.id_division ? 'PUT' : 'POST';
    const endpoint = formData.id_division
      ? `${baseUrl}/api/academica/division/${formData.id_division}`
      : `${baseUrl}/api/academica/division`;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError({
          title: 'No se pudo guardar',
          text: data.message || data.error || 'Error al guardar la división.',
        });
        return;
      }

      showSuccess({
        title: 'Guardado',
        text: formData.id_division
          ? 'División actualizada correctamente.'
          : 'División creada correctamente.',
      });

      setIsModalOpen(false);
      setFormData({ id_division: null, division: '', id_establecimiento: activeInstitutionId });
      fetchDivisiones();
    } catch (err) {
      console.error('Error guardando división:', err);
      showError({ title: 'Error', text: 'Error de conexión con el servidor.' });
    }
  };

const handleDelete = async (id_division) => {
    const result = await showConfirm({
      title: '¿Eliminar división?',
      text: '¿Está seguro de que desea eliminar esta división?',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`${baseUrl}/api/academica/division/${id_division}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError({
          title: 'No se puede eliminar',
          text: data.message || data.error || 'No se pudo eliminar la división.',
        });
        return;
      }

      showSuccess({
        title: 'Eliminada',
        text: 'La división fue eliminada correctamente.',
      });
      fetchDivisiones();
    } catch (err) {
      console.error('Error eliminando división:', err);
      showError({ title: 'Error', text: 'Error de conexión con el servidor.' });
    }
  };

  
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Grid className="w-6 h-6 text-indigo-600" /> ABM Divisiones
          </h1>
          <p className="text-sm text-slate-500">
            Divisiones de la institución activa (ID: {activeInstitutionId || 'Ninguna'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border p-2 rounded-lg shadow-sm">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-600">Escuela:</span>
            <select
              value={activeInstitutionId || ''}
              onChange={(e) => setActiveInstitutionId(Number(e.target.value))}
              className="text-sm font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {safeInstitutions.map(inst => {
                const id = inst.identidadeducativa || inst.id_establecimiento || inst.id;
                const nombre = inst.entidadeducativa || inst.nombre || inst.escuela;
                return <option key={id} value={id}>{nombre}</option>;
              })}
            </select>
          </div>

          <button
            onClick={() => {
              setFormData({ id_division: null, division: '', id_establecimiento: activeInstitutionId });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva División
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border max-w-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">División</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {divisiones.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-slate-400">Sin divisiones registradas.</td>
              </tr>
            ) : (
              divisiones.map((d) => (
                <tr key={d.id_division || d.division} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs font-mono">{d.id_division || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{d.division}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => { 
                        setFormData({
                          id_division: d.id_division,
                          division: d.division,
                          id_establecimiento: d.id_establecimiento || activeInstitutionId
                        }); 
                        setIsModalOpen(true); 
                      }}
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id_division)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">{formData.id_division ? 'Editar División' : 'Crear División'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre de la División</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: A, B, Única"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
                            <div>
                <label className="block text-xs font-semibold mb-1">Establecimiento / Escuela</label>
                <select
                  value={formData.id_establecimiento || ''}
                  onChange={(e) => setFormData({ ...formData, id_establecimiento: Number(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="">Seleccione una escuela...</option>
                  {safeInstitutions.map(inst => {
                    const id = inst.identidadeducativa || inst.id_establecimiento || inst.id;
                    const nombre = inst.entidadeducativa || inst.nombre || inst.escuela;
                    return <option key={id} value={id}>{nombre}</option>;
                  })}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
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