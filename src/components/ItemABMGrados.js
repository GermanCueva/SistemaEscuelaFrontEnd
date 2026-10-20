// ==========================================
// 3. ABM GRADOS
// ==========================================
import React, { useState, useEffect } from 'react';
import { useInstitution } from '../context/InstitutionContext';
import { Building2, Plus, Search, Edit, X, Copy } from 'lucide-react';

export const ABMGrados = () => {
  const { activeInstitutionId } = useInstitution();
  const [grados, setGrados] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', 
    nombre_corto: '', 
    id_nivel: 1, 
    jerarquia: 1, 
    id_establecimiento: activeInstitutionId || 1
  });

  const fetchGrados = () => {
    if (activeInstitutionId) {
      fetch(`/api/grados?id_establecimiento=${activeInstitutionId}`)
        .then(res => res.json())
        .then(setGrados)
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchGrados();
  }, [activeInstitutionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeInstitutionId) return;

    const payload = { ...formData, id_establecimiento: activeInstitutionId };
    const method = formData.id_grado ? 'PUT' : 'POST';
    const endpoint = formData.id_grado ? `/api/grados/${formData.id_grado}` : '/api/grados';

    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    setIsModalOpen(false);
    fetchGrados();
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> ABM Grados / Cursos
          </h1>
          <p className="text-sm text-slate-500">Filtrado por Institución Activa (ID: {activeInstitutionId})</p>
        </div>
        <button
          onClick={() => { 
            setFormData({ nombre: '', nombre_corto: '', id_nivel: 1, id_establecimiento: activeInstitutionId || 1 }); 
            setIsModalOpen(true); 
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nuevo Grado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-4 py-3">Jerarquía</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Nombre Corto</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grados.map((g) => (
              <tr key={g.id_grado} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono">{g.jerarquia}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{g.nombre}</td>
                <td className="px-4 py-3">{g.nombre_corto}</td>
                <td className="px-4 py-3">{g.id_nivel}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => { setFormData(g); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4">{formData.id_grado ? 'Editar Grado' : 'Crear Grado'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre</label>
                <input
                  type="text" required maxLength={60}
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nombre Corto</label>
                  <input
                    type="text" required maxLength={30}
                    value={formData.nombre_corto}
                    onChange={e => setFormData({ ...formData, nombre_corto: e.target.value })}
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jerarquía</label>
                  <input
                    type="number"
                    value={formData.jerarquia || 0}
                    onChange={e => setFormData({ ...formData, jerarquia: Number(e.target.value) })}
                    className="w-full border rounded p-2 text-sm"
                  />
                </div>
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
