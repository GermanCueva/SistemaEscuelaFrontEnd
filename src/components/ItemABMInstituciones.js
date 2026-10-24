import React, { useState, useEffect } from 'react';
import { Building2, Edit, Plus, Upload, Image as ImageIcon } from 'lucide-react';

export const ABMEntidadesEducativas = () => {
  const [instituciones, setInstituciones] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [paises, setPaises] = useState([]);

  const [selectedInst, setSelectedInst] = useState(null); // Objeto cargado en el formulario
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const token = localStorage.getItem('token');
  const baseUrl = process.env.REACT_APP_API_URL || '';

  // 1. Cargar Instituciones y Catálogos de Geografía al montar
  useEffect(() => {
    fetchInstituciones();
    fetchCatalogos();
  }, []);

  const fetchInstituciones = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/escuela/todas`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setInstituciones(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err) {
      console.error('Error cargando instituciones:', err);
    }
  };

  const fetchCatalogos = async () => {
    const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    
    // Peticiones paralelas para traer nombres de geografía
    try {
      const [resLoc, resProv, resDep, resPais] = await Promise.all([
        fetch(`${baseUrl}/api/localidades`, { headers }).catch(() => null),
        fetch(`${baseUrl}/api/provincias`, { headers }).catch(() => null),
        fetch(`${baseUrl}/api/departamentos`, { headers }).catch(() => null),
        fetch(`${baseUrl}/api/nacionalidades`, { headers }).catch(() => null)
      ]);

      if (resLoc && resLoc.ok) setLocalidades(await resLoc.json());
      if (resProv && resProv.ok) setProvincias(await resProv.json());
      if (resDep && resDep.ok) setDepartamentos(await resDep.json());
      if (resPais && resPais.ok) setPaises(await resPais.json());
    } catch (err) {
      console.error('Error cargando catálogos geográficos:', err);
    }
  };

  // Manejar cambio de campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedInst((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar selección de nueva imagen de logo
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Previsualización inmediata
    }
  };

  // Cargar una institución para editar
  const handleEdit = (inst) => {
    setSelectedInst(inst);
    setLogoFile(null);
    setPreviewUrl(''); // Reset de previsualización temporal
  };

  // Guardar / Actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInst) return;

    try {
      const formDataToSend = new FormData();
      Object.keys(selectedInst).forEach((key) => {
        if (selectedInst[key] !== null && selectedInst[key] !== undefined) {
          formDataToSend.append(key, selectedInst[key]);
        }
      });

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      const id = selectedInst.identidadeducativa || selectedInst.id_establecimiento;
      const url = id ? `${baseUrl}/api/escuela/${id}` : `${baseUrl}/api/escuela`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formDataToSend
      });

      if (res.ok) {
        alert('Institución guardada correctamente');
        fetchInstituciones();
        setSelectedInst(null);
        setLogoFile(null);
        setPreviewUrl('');
      } else {
        alert('Error al guardar la institución');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      
      {/* 1. LISTA DE INSTITUCIONES (CON COLUMNA DE LOGO) */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Instituciones Educativas
          </h2>
        </div>

        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Entidad Educativa</th>
              <th className="px-4 py-3">CUIT / CUE</th>
              <th className="px-4 py-3">Localidad / Provincia</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {instituciones.map((inst) => {
              const id = inst.identidadeducativa || inst.id_establecimiento;
              const logoPath = inst.logo || inst.imagen_url || inst.url_logo;
              const fullLogoUrl = logoPath ? (logoPath.startsWith('http') ? logoPath : `${baseUrl}/${logoPath}`) : null;

              return (
                <tr key={id} className="hover:bg-slate-50">
                  {/* COLUMNA LOGO */}
                  <td className="px-4 py-3">
                    {fullLogoUrl ? (
                      <img
                        src={fullLogoUrl}
                        alt="Logo"
                        className="w-10 h-10 object-contain rounded border bg-white p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{inst.entidadeducativa}</td>
                  <td className="px-4 py-3 text-xs">{inst.cuit} / {inst.cue}</td>
                  <td className="px-4 py-3 text-xs">
                    {inst.nombre || inst.id_localidad || '-'}, {inst.nombre || inst.id_provincia || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs">{inst.telefono || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(inst)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. FORMULARIO DE EDICIÓN / ALTA */}
      {selectedInst && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
            Editar Institución: {selectedInst.entidadeducativa}
          </h3>

          {/* DATOS PRINCIPALES + PREVISUALIZACIÓN DE LOGO */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Datos Principales</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Entidad *</label>
                <input
                  type="text"
                  name="entidadeducativa"
                  value={selectedInst.entidadeducativa || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>

              {/* SECCIÓN PREVISUALIZACIÓN DE LOGO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Logo Institucional</label>
                <div className="flex items-center gap-3 border p-2 rounded-lg bg-slate-50">
                  {/* Vista Previa de Imagen (Nueva o Existente) */}
                  {previewUrl || selectedInst.logo ? (
                    <img
                      src={previewUrl || (selectedInst.logo?.startsWith('http') ? selectedInst.logo : `${baseUrl}/${selectedInst.logo}`)}
                      alt="Preview Logo"
                      className="w-12 h-12 object-contain rounded border bg-white p-1"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded border bg-slate-200 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-sm">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>{previewUrl ? 'Cambiar nueva' : 'Subir imagen'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CUIT</label>
                <input
                  type="text"
                  name="cuit"
                  value={selectedInst.cuit || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CUE</label>
                <input
                  type="text"
                  name="cue"
                  value={selectedInst.cue || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* DOMICILIO Y GEOGRAFÍA (COMBOS CON NOMBRES) */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Domicilio y Geografía</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección</label>
                <input
                  type="text"
                  name="domicilio"
                  value={selectedInst.domicilio || selectedInst.direccion || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={selectedInst.numero || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código Postal</label>
                <input
                  type="text"
                  name="codigo_postal"
                  value={selectedInst.cp || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              {/* SELECT LOCALIDAD */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Localidad</label>
                <select
                  name="localidad"
                  value={selectedInst.localidad || selectedInst.id_localidad || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                >
                  <option value="">Seleccione localidad...</option>
                  {localidades.map((loc) => {
                    const id = loc.id_localidad; // ID primario de la tabla localidades
                    const nombre = loc.nombre;   // Nombre de la localidad
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* SELECT DEPARTAMENTO */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Departamento</label>
                <select
                  name="departamento"
                  value={selectedInst.departamento || selectedInst.id_departamento || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                >
                  <option value="">Seleccione departamento...</option>
                  {departamentos.map((dep) => {
                    const id = dep.id_departamento; // ID primario de la tabla departamentos
                    const nombre = dep.nombre;          // Nombre del departamento
                    return (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    );
                  })}
                </select>
              </div>
                {/* SELECT PROVINCIA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Provincia</label>
                  <select
                    name="provincia"
                    value={selectedInst.provincia || selectedInst.id_provincia || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="">Seleccione provincia...</option>
                    {provincias.map((prov) => {
                      const id = prov.id_provincia; // ID primario de la tabla provincias
                      const nombre = prov.nombre || prov.provincia; // Nombre de la provincia
                      return (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>

                    {/* SELECT PAÍS */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">País</label>
                  <select
                    name="pais"
                    value={selectedInst.pais || selectedInst.id_pais || ''}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="">Seleccione país...</option>
                    {paises.map((p) => {
                      const id = p.id_pais; // ID primario de la tabla pais
                      const nombre = p.nombre || p.pais; // Nombre del país
                      return (
                        <option key={id} value={id}>
                          {nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>
            </div>
          </div>

          {/* CONTACTO */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Contacto y Representante</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={selectedInst.email || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={selectedInst.telefono || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Apoderado</label>
                <input
                  type="text"
                  name="apoderado"
                  value={selectedInst.apoderado || ''}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setSelectedInst(null); setPreviewUrl(''); }}
              className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700 shadow"
            >
              Guardar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};