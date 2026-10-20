// ==========================================
// 4. ABM DIVISIONES
// ==========================================
import React, { useState, useEffect } from 'react';
import { useInstitution } from '../context/InstitutionContext';
import { Building2, Plus, Search, Edit, X, Copy } from 'lucide-react';

export const ABMDivisiones = () => {
  const { activeInstitutionId } = useInstitution();
  const [divisiones, setDivisiones] = useState([]);
  const [newDivision, setNewDivision] = useState('');

  const fetchDivisiones = () => {
    if (activeInstitutionId) {
      fetch(`/api/divisiones?id_establecimiento=${activeInstitutionId}`)
        .then(res => res.json())
        .then(setDivisiones)
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchDivisiones();
  }, [activeInstitutionId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDivision || !activeInstitutionId) return;

    await fetch('/api/divisiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ division: newDivision, id_establecimiento: activeInstitutionId })
    });

    setNewDivision('');
    fetchDivisiones();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Grid className="w-6 h-6 text-indigo-600" /> ABM Divisiones
        </h1>
        <p className="text-sm text-slate-500">Divisiones de la institución activa (ID: {activeInstitutionId})</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border mb-6 max-w-md">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva División (Ej: A, B, Unica)"
            value={newDivision}
            onChange={(e) => setNewDivision(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow border max-w-md overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">División</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {divisiones.map((d) => (
              <tr key={d.id_division}>
                <td className="px-4 py-3 text-xs font-mono">{d.id_division}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{d.division}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 5. ABM AÑO ACADÉMICO
// ==========================================

export const ABMAnioAcademico = () => {
  const { activeInstitutionId } = useInstitution();
  const [anios, setAnios] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    anio: new Date().getFullYear(),
    estado: 'I',
    fecha_inicio: '',
    fecha_fin: '',
    id_establecimiento: activeInstitutionId || 1
  });

  const fetchAnios = () => {
    if (activeInstitutionId) {
      fetch(`/api/anio?id_establecimiento=${activeInstitutionId}`)
        .then(res => res.json())
        .then(setAnios)
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchAnios();
  }, [activeInstitutionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeInstitutionId) return;

    const payload = { ...formData, id_establecimiento: activeInstitutionId };
    const method = formData.id_anio ? 'PUT' : 'POST';
    const endpoint = formData.id_anio ? `/api/anio/${formData.id_anio}` : '/api/anio';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setIsModalOpen(false);
    fetchAnios();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" /> ABM Año Académico
          </h1>
          <p className="text-sm text-slate-500">Ciclos lectivos para la institución activa (ID: {activeInstitutionId})</p>
        </div>
        <button
          onClick={() => { 
            setFormData({ anio: new Date().getFullYear(), estado: 'I', id_establecimiento: activeInstitutionId || 1 }); 
            setIsModalOpen(true); 
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Ciclo Lectivo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 uppercase text-xs border-b">
            <tr>
              <th className="px-4 py-3">Año Lectivo</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {anios.map((a) => (
              <tr key={a.id_anio} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-800">{a.anio}</td>
                <td className="px-4 py-3">{a.fecha_inicio || '-'}</td>
                <td className="px-4 py-3">{a.fecha_fin || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    a.estado === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {a.estado === 'A' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setFormData(a); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">{formData.id_anio ? 'Editar Año Académico' : 'Crear Año Académico'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Año Lectivo</label>
                <input
                  type="number" required
                  value={formData.anio}
                  onChange={e => setFormData({ ...formData, anio: Number(e.target.value) })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio || ''}
                    onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Fecha Fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin || ''}
                    onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={e => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full border rounded p-2 text-sm bg-white"
                >
                  <option value="I">Inactivo</option>
                  <option value="A">Activo (Ciclo Corriente)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};