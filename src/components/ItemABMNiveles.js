import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useInstitution } from "../context/InstitutionContext";
import { Layers, Plus, Pencil, Trash2, Building2 } from "lucide-react";

export const ItemABMNiveles = () => {
  const { activeInstitutionId, setActiveInstitutionId } = useInstitution();
  const [instituciones, setInstituciones] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(activeInstitutionId || 1);

  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    nombre_corto: "",
    observaciones: "",
    id_establecimiento: selectedInstId,
  });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  // Encabezados con Token de Autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Cargar lista de instituciones para el combo selector
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

  // Cargar lista de niveles educativos según la institución activa
  const fetchNiveles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/academica/nivel?id_establecimiento=${selectedInstId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error("Error al obtener los niveles");

      const data = await res.json();
      setNiveles(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los niveles educativos");
    } finally {
      setLoading(false);
    }
  }, [API_URL, selectedInstId]);

  useEffect(() => {
    fetchNiveles();
  }, [fetchNiveles]);

  // Manejo del cambio de institución
  const handleInstitutionChange = (id) => {
    setSelectedInstId(id);
    if (setActiveInstitutionId) setActiveInstitutionId(id);
  };

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormData({
      nombre: "",
      nombre_corto: "",
      observaciones: "",
      id_establecimiento: selectedInstId,
    });
    setShowModal(true);
  };

  // Abrir modal para editar (Carga todos los datos)
  const handleOpenEdit = (item) => {
    setEditMode(true);
    setCurrentId(item.id_nivel);
    setFormData({
      nombre: item.nombre || "",
      nombre_corto: item.nombre_corto || "",
      observaciones: item.observaciones || "",
      id_establecimiento: item.id_establecimiento || selectedInstId,
    });
    setShowModal(true);
  };

  // Guardar cambios (POST o PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.nombre_corto) {
      toast.warning("Complete los campos obligatorios (*)");
      return;
    }

    try {
      const url = editMode
        ? `${API_URL}/api/academica/nivel/${currentId}`
        : `${API_URL}/api/academica/nivel`;

      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al procesar la solicitud");

      toast.success(editMode ? "Nivel actualizado" : "Nivel registrado con éxito");
      setShowModal(false);
      fetchNiveles();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error al guardar el nivel");
    }
  };

  // Eliminar nivel
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este nivel educativo?")) return;

    try {
      const res = await fetch(`${API_URL}/api/academica/nivel/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error al eliminar el nivel");

      toast.success("Nivel eliminado correctamente");
      fetchNiveles();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el nivel");
    }
  };

  return (
    <div className="w-full">
      {/* Encabezado y Combo Selector de Escuela */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-indigo-600" size={24} />
            ABM Niveles Educativos
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestión de niveles para la institución seleccionada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Combo Selector de Escuela */}
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
            Nuevo Nivel
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-left text-xs sm:text-sm text-gray-600">
          <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Nombre Corto</th>
              <th className="px-4 py-3">Observaciones</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  Cargando niveles...
                </td>
              </tr>
            ) : niveles.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No hay niveles registrados para esta institución.
                </td>
              </tr>
            ) : (
              niveles.map((item) => (
                <tr key={item.id_nivel} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">{item.id_nivel}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{item.nombre}</td>
                  <td className="px-4 py-3 font-medium text-indigo-900">{item.nombre_corto}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{item.observaciones || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id_nivel)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Eliminar"
                      >
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

      {/* Modal de Creación / Edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editMode ? "Editar Nivel Educativo" : "Nuevo Nivel Educativo"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="Ej: Nivel Primario"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Nombre Corto *
                </label>
                <input
                  type="text"
                  name="nombre_corto"
                  value={formData.nombre_corto}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="Ej: Primaria / PRI"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                  placeholder="Observaciones o notas adicionales..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Establecimiento *
                </label>
                <select
                  name="id_establecimiento"
                  value={formData.id_establecimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white cursor-pointer"
                >
                  {instituciones.map((inst) => (
                    <option key={inst.identidadeducativa} value={inst.identidadeducativa}>
                      {inst.entidadeducativa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editMode ? "Guardar Cambios" : "Crear Nivel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};