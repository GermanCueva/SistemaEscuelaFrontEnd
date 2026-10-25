import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useInstitution } from "../context/InstitutionContext";
import { Calendar, Plus, Pencil, Trash2, CheckCircle2, XCircle, Building2 } from "lucide-react";

export const ItemABMAnios = () => {
  const { activeInstitutionId, setActiveInstitutionId } = useInstitution();
  const [instituciones, setInstituciones] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(activeInstitutionId || 1);

  const [anios, setAnios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    anio: new Date().getFullYear(),
    fecha_inicio: "",
    fecha_fin: "",
    estado: "A",
    id_establecimiento: selectedInstId,
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Cargar lista de instituciones para el selector
  useEffect(() => {
    const usuarioStorage = localStorage.getItem("usuario");
    if (usuarioStorage) {
      try {
        const userObj = JSON.parse(usuarioStorage);
        if (userObj.entidades && Array.isArray(userObj.entidades)) {
          setInstituciones(userObj.entidades);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Cargar Años Lectivos según la institución seleccionada
  const fetchAnios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/academica/aniocursado?id_establecimiento=${selectedInstId}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error al obtener años lectivos");

      const data = await res.json();
      setAnios(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los años lectivos");
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedInstId]);

  useEffect(() => {
    fetchAnios();
  }, [fetchAnios]);

  const handleInstitutionChange = (id) => {
    setSelectedInstId(id);
    if (setActiveInstitutionId) setActiveInstitutionId(id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrentId(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      anio: currentYear,
      fecha_inicio: `${currentYear}-03-01`,
      fecha_fin: `${currentYear}-12-15`,
      estado: "A",
      id_establecimiento: selectedInstId,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.id_anio);
    setFormData({
      anio: item.anio,
      fecha_inicio: formatDateForInput(item.fecha_inicio),
      fecha_fin: formatDateForInput(item.fecha_fin),
      estado: item.estado || "A",
      id_establecimiento: item.id_establecimiento || selectedInstId,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editMode
        ? `${API_URL}/api/academica/anos/${currentId}`
        : `${API_URL}/api/academica/anos`;

      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al guardar el año lectivo");

      toast.success(editMode ? "Año lectivo actualizado" : "Año lectivo registrado");
      setShowModal(false);
      fetchAnios();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al procesar la solicitud");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este año lectivo?")) return;

    try {
      const res = await fetch(`${API_URL}/api/academica/anos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast.success("Año lectivo eliminado");
      fetchAnios();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el registro");
    }
  };

  return (
    <div className="w-full">
      {/* Encabezado y Selector de Escuela */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            Gestión de Años Lectivos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Administre los períodos lectivos de la institución seleccionada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Combo Selector de Establecimiento */}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Building2 size={16} className="text-indigo-600" />
            <span className="text-xs font-semibold text-gray-700">Escuela:</span>
            <select
              value={selectedInstId}
              onChange={(e) => handleInstitutionChange(Number(e.target.value))}
              className="bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {instituciones.length > 0 ? (
                instituciones.map((inst) => (
                  <option key={inst.identidadeducativa} value={inst.identidadeducativa}>
                    {inst.entidadeducativa}
                  </option>
                ))
              ) : (
                <option value={selectedInstId}>Institución ID: {selectedInstId}</option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer"
          >
            <Plus size={18} />
            Nuevo Año Lectivo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs sm:text-sm text-gray-600">
          <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Año Lectivo</th>
              <th className="px-4 py-3">Fecha Inicio</th>
              <th className="px-4 py-3">Fecha Fin</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">Cargando...</td></tr>
            ) : anios.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No hay registros para este establecimiento.</td></tr>
            ) : (
              anios.map((item) => (
                <tr key={item.id_anio} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.id_anio}</td>
                  <td className="px-4 py-3 font-bold text-indigo-900 text-sm">{item.anio}</td>
                  <td className="px-4 py-3">{formatDateForInput(item.fecha_inicio)}</td>
                  <td className="px-4 py-3">{formatDateForInput(item.fecha_fin)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.estado === "A" || item.estado === true ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={12} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        <XCircle size={12} /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.id_anio)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{editMode ? "Editar Año Lectivo" : "Nuevo Año Lectivo"}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Año Lectivo *</label>
                <input
                  type="number"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Fecha de Inicio *</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Fecha de Fin *</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Establecimiento *</label>
                <select
                  name="id_establecimiento"
                  value={formData.id_establecimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {instituciones.map((inst) => (
                    <option key={inst.identidadeducativa} value={inst.identidadeducativa}>
                      {inst.entidadeducativa}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="A">Activo (A)</option>
                  <option value="I">Inactivo (I)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};