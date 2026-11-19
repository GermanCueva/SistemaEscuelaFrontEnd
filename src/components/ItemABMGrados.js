// ==========================================
// 3. ABM GRADOS
// ==========================================
import React, { useState, useEffect, useCallback } from 'react';
import { useInstitution } from '../context/InstitutionContext';
import { Building2, Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';

export const ABMGrados = () => {
  const { activeInstitutionId, setActiveInstitutionId, institutions = [] } = useInstitution();
  const [grados, setGrados] = useState([]);
  const [niveles, setNiveles] = useState([]);
  
  // Estados independientes para las opciones dentro del Modal (según la escuela elegida en el form)
  const [modalNiveles, setModalNiveles] = useState([]);
  const [modalGrados, setModalGrados] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', 
    nombre_corto: '', 
    observaciones: '',
    id_nivel: '', 
    jerarquia: 1, 
    id_grado_siguiente: '',
    id_establecimiento: activeInstitutionId || ''
  });

  const safeInstitutions = Array.isArray(institutions) ? institutions : [];

  // Auxiliares para consultar backend por escuela específica
  const fetchNivelesPorEscuela = async (idEstablecimiento) => {
    if (!idEstablecimiento) return [];
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      let res = await fetch(`${baseUrl}/api/academica/nivel?id_establecimiento=${idEstablecimiento}`, { headers });
      if (res.status === 404) {
        res = await fetch(`${baseUrl}/api/academica/nivel?id_establecimiento=${idEstablecimiento}`, { headers });
      }
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (err) {
      console.error('Error cargando niveles:', err);
      return [];
    }
  };

  const fetchGradosPorEscuela = async (idEstablecimiento) => {
    if (!idEstablecimiento) return [];
    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      let res = await fetch(`${baseUrl}/api/academica/grado?id_establecimiento=${idEstablecimiento}`, { headers });
      if (res.status === 404) {
        res = await fetch(`${baseUrl}/api/academica/grado?id_establecimiento=${idEstablecimiento}`, { headers });
      }
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (err) {
      console.error('Error cargando grados:', err);
      return [];
    }
  };

// Carga inicial de la tabla filtrada por la institución activa
  const fetchNiveles = useCallback(async () => {
    const data = await fetchNivelesPorEscuela(activeInstitutionId);
    setNiveles(data);
  }, [activeInstitutionId]);

  const fetchGrados = useCallback(async () => {
    const data = await fetchGradosPorEscuela(activeInstitutionId);
    setGrados(data);
  }, [activeInstitutionId]);

  useEffect(() => {
    setGrados([]);
    setNiveles([]);
    fetchNiveles();
    fetchGrados();
}, [activeInstitutionId, fetchNiveles, fetchGrados]);

  // Manejador del cambio de escuela dentro del modal (Lógica de coincidencia por nombre)
  const handleEstablecimientoChange = async (nuevoIdEstablecimiento) => {
    const idEscuelaNum = Number(nuevoIdEstablecimiento);

    // 1. Obtener los nombres actualmente seleccionados
    const nivelActual = modalNiveles.find(n => Number(n.id_nivel || n.id) === Number(formData.id_nivel));
    const nombreNivelActual = nivelActual ? (nivelActual.nombre || nivelActual.nivel) : '';

    const gradoSigActual = modalGrados.find(g => Number(g.id_grado) === Number(formData.id_grado_siguiente));
    const nombreGradoSigActual = gradoSigActual ? gradoSigActual.nombre : '';

    // 2. Traer niveles y grados de la nueva escuela
    const nuevosNiveles = await fetchNivelesPorEscuela(idEscuelaNum);
    const nuevosGrados = await fetchGradosPorEscuela(idEscuelaNum);

    // 3. Buscar coincidencia por nombre para Nivel
    const nivelCoincidente = nuevosNiveles.find(n => 
      (n.nombre || n.nivel)?.trim().toLowerCase() === nombreNivelActual?.trim().toLowerCase()
    );

    // 4. Buscar coincidencia por nombre para Grado Siguiente
    const gradoSigCoincidente = nuevosGrados.find(g => 
      g.nombre?.trim().toLowerCase() === nombreGradoSigActual?.trim().toLowerCase()
    );

    // 5. Actualizar los combos del modal y el estado del formulario
    setModalNiveles(nuevosNiveles);
    setModalGrados(nuevosGrados);

    setFormData(prev => ({
      ...prev,
      id_establecimiento: idEscuelaNum,
      // Asigna la nueva ID coincidente o resetea
      id_nivel: nivelCoincidente ? (nivelCoincidente.id_nivel || nivelCoincidente.id) : (nuevosNiveles[0]?.id_nivel || ''),
      id_grado_siguiente: gradoSigCoincidente ? gradoSigCoincidente.id_grado : ''
    }));
  };

  const handleOpenModalToCreate = () => {
    setModalNiveles(niveles);
    setModalGrados(grados);
    setFormData({ 
      nombre: '', 
      nombre_corto: '', 
      observaciones: '',
      id_nivel: niveles[0]?.id_nivel || '', 
      jerarquia: 1, 
      id_grado_siguiente: '',
      id_establecimiento: activeInstitutionId 
    }); 
    setIsModalOpen(true);
  };

  const handleOpenModalToEdit = async (g) => {
    const estId = g.id_establecimiento || activeInstitutionId;
    
    // Si la escuela del grado a editar es distinta a la activa, cargamos sus opciones específicas
    if (estId !== activeInstitutionId) {
      const niv = await fetchNivelesPorEscuela(estId);
      const gra = await fetchGradosPorEscuela(estId);
      setModalNiveles(niv);
      setModalGrados(gra);
    } else {
      setModalNiveles(niveles);
      setModalGrados(grados);
    }

    setFormData({
      ...g,
      observaciones: g.observaciones || '',
      id_grado_siguiente: g.id_grado_siguiente || '',
      id_establecimiento: estId
    }); 
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.id_establecimiento) return;

    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    const payload = { 
      ...formData, 
      id_establecimiento: Number(formData.id_establecimiento),
      id_nivel: Number(formData.id_nivel),
      jerarquia: Number(formData.jerarquia || 0),
      id_grado_siguiente: formData.id_grado_siguiente ? Number(formData.id_grado_siguiente) : null,
      observaciones: formData.observaciones ? formData.observaciones.trim() : null
    };

    const method = formData.id_grado ? 'PUT' : 'POST';
    
    let endpoint = formData.id_grado 
      ? `${baseUrl}/api/academica/grado/${formData.id_grado}` 
      : `${baseUrl}/api/academica/grado`;

    const headers = { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      let res = await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });
      if (res.status === 404) {
        endpoint = formData.id_grado ? `${baseUrl}/api/academica/grado/${formData.id_grado}` : `${baseUrl}/api/academica/grado`;
        await fetch(endpoint, { method, headers, body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      fetchGrados();
    } catch (err) {
      console.error('Error al guardar grado:', err);
    }
  };

  const handleDelete = async (id_grado) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este grado?')) return;

    const token = localStorage.getItem('token');
    const baseUrl = process.env.REACT_APP_API_URL || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      let res = await fetch(`${baseUrl}/api/academica/grado/${id_grado}`, { method: 'DELETE', headers });
      if (res.status === 404) {
        await fetch(`${baseUrl}/api/academica/grado/${id_grado}`, { method: 'DELETE', headers });
      }
      fetchGrados();
    } catch (err) {
      console.error('Error eliminando grado:', err);
    }
  };

  const obtenerNombreNivel = (id_nivel) => {
    const nivel = niveles.find(n => (n.id_nivel || n.id) === id_nivel);
    return nivel ? (nivel.nombre || nivel.nivel) : id_nivel;
  };

  const obtenerNombreGradoSiguiente = (id_grado_siguiente) => {
    if (id_grado_siguiente === null || id_grado_siguiente === undefined || id_grado_siguiente === '') {
      return '-';
    }
    const grado = grados.find(g => String(g.id_grado) === String(id_grado_siguiente));
    return grado ? grado.nombre : `ID: ${id_grado_siguiente}`;
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" /> ABM Grados / Cursos
          </h1>
          <p className="text-sm text-slate-500">Filtrado por Institución Activa (ID: {activeInstitutionId || 'Ninguna'})</p>
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
            onClick={handleOpenModalToCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo Grado
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-4 py-3">Jerarquía</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Nombre Corto</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Grado Siguiente</th>
              <th className="px-4 py-3">Observaciones</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grados.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">Sin grados / cursos cargados para esta escuela.</td>
              </tr>
            ) : (
              grados.map((g) => (
                <tr key={g.id_grado} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono">{g.jerarquia}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{g.nombre}</td>
                  <td className="px-4 py-3">{g.nombre_corto}</td>
                  <td className="px-4 py-3 font-medium text-indigo-600">{obtenerNombreNivel(g.id_nivel)}</td>
                  <td className="px-4 py-3 text-slate-700">{obtenerNombreGradoSiguiente(g.id_grado_siguiente)}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{g.observaciones || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModalToEdit(g)} 
                      className="text-blue-600 hover:bg-blue-50 p-1 rounded" 
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(g.id_grado)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Eliminar">
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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
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

              <div>
                <label className="block text-xs font-semibold mb-1">Nivel Académico</label>
                <select
                  value={formData.id_nivel || ''}
                  onChange={e => setFormData({ ...formData, id_nivel: Number(e.target.value) })}
                  className="w-full border rounded p-2 text-sm bg-white"
                  required
                >
                  <option value="">Seleccione un nivel...</option>
                  {modalNiveles.map(n => (
                    <option key={n.id_nivel || n.id} value={n.id_nivel || n.id}>
                      {n.nombre || n.nivel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Grado Siguiente (Opcional)</label>
                <select
                  value={formData.id_grado_siguiente || ''}
                  onChange={e => setFormData({ ...formData, id_grado_siguiente: e.target.value })}
                  className="w-full border rounded p-2 text-sm bg-white"
                >
                  <option value="">Ninguno / Fin de ciclo</option>
                  {modalGrados
                    .filter(g => g.id_grado !== formData.id_grado)
                    .map(g => (
                      <option key={g.id_grado} value={g.id_grado}>
                        {g.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Observaciones</label>
                <textarea
                  rows={3}
                  value={formData.observaciones || ''}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="Comentarios u observaciones adicionales..."
                />
              </div>

                            <div>
                <label className="block text-xs font-semibold mb-1">Establecimiento / Escuela</label>
                <select
                  value={formData.id_establecimiento || ''}
                  onChange={(e) => handleEstablecimientoChange(e.target.value)}
                  className="w-full border rounded p-2 text-sm bg-white font-medium text-indigo-900 border-indigo-200"
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

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};