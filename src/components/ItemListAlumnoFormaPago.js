import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { avisar } from "../utils/notificaciones";

const ItemListAlumnoFormaPago = ({ 
  idAlumno, 
  idPersona,
  formasPago = [], 
  cargando = false, 
  onCambioDatos, 
  onEliminarBackend 
}) => {
  // Inicializamos el estado directamente con las props que vienen del padre
  const [listado, setListado] = useState(Array.isArray(formasPago) ? formasPago : []);
  const token = localStorage.getItem("token");

  // Estados para catálogos
  const [listaMediosPago, setMediosPago] = useState([]);
  const [listaMarcas, setMarcas] = useState([]);
  const [listaEntidades, setEntidades] = useState([]);

  // Estados para CRUD local
  const [editingId, setEditingId] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  const initialFormState = {
    id_medio_pago: "",
    id_marca_tarjeta: "",
    id_entidad_bancaria: "",
    numero_tarjeta: "",
    nombre_titular: "",
    activo: "-"
  };

  const [newForm, setNewForm] = useState(initialFormState);

  // Sincronizar CADA VEZ que el padre le pase un nuevo arreglo de formasPago
  useEffect(() => {
    if (Array.isArray(formasPago)) {
      setListado(formasPago);
    }
  }, [formasPago]);

  // --- HELPER: Evalúa si el medio de pago requiere datos de tarjeta ---
  const requiereTarjeta = (idMedio, listaMedios) => {
    if (!idMedio) return true;
    const medio = listaMedios.find(m => String(m.id_medio_pago || m.id) === String(idMedio));
    if (!medio) return true;
    
    const nombre = (medio.nombre || medio.medio_pago || "").toLowerCase();
    const sinTarjeta = ["postnet", "efectivo", "transferencia", "deposito", "depósito"];
    return !sinTarjeta.some(palabra => nombre.includes(palabra));
  };

  // --- OBTENER CATÁLOGOS ---
  const obtenerCatalogos = useCallback(async () => {
    try {
      const [resMedios, resMarcas, resEntidades] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/pagos/medios`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/pagos/marcas`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/pagos/entidades`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const g = await resMedios.json().catch(() => []);
      const a = await resMarcas.json().catch(() => []);
      const d = await resEntidades.json().catch(() => []);

      setMediosPago(Array.isArray(g) ? g : (g.data && Array.isArray(g.data) ? g.data : []));
      setMarcas(Array.isArray(a) ? a : (a.data && Array.isArray(a.data) ? a.data : []));
      setEntidades(Array.isArray(d) ? d : (d.data && Array.isArray(d.data) ? d.data : []));
      
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
    }
  }, [token]);

  useEffect(() => {
    obtenerCatalogos();
  }, [obtenerCatalogos]);

  // --- FUNCIONES DE LECTURA ---
  const getNombreMedio = (item) => {
    if (item.medio_pago) return item.medio_pago;
    if (item.nombre_medio) return item.nombre_medio;
    if (item.nombre_medio_pago) return item.nombre_medio_pago;
    
    const id = item.id_medio_pago;
    if (!id) return null;
    const encontrado = listaMediosPago.find(m => String(m.id_medio_pago || m.id) === String(id));
    return encontrado ? (encontrado.nombre || encontrado.medio_pago) : "-";
  };

  const getNombreMarca = (item) => {
    if (item.marca_tarjeta) return item.marca_tarjeta;
    if (item.nombre_marca) return item.nombre_marca;
    if (item.marca) return item.marca;

    const id = item.id_marca_tarjeta || item.id_marca;
    if (!id) return null;
    const encontrado = listaMarcas.find(m => String(m.id_marca_tarjeta || m.id) === String(id));
    return encontrado ? (encontrado.nombre || encontrado.marca) : "-";
  };

  const getNombreEntidad = (item) => {
    if (item.entidad_bancaria) return item.entidad_bancaria;
    if (item.nombre_entidad) return item.nombre_entidad;
    if (item.entidad) return item.entidad;

    const id = item.id_entidad_bancaria || item.id_entidad;
    if (!id) return null;
    const encontrado = listaEntidades.find(e => String(e.id_entidad_bancaria || e.id) === String(id));
    return encontrado ? (encontrado.nombre || encontrado.entidad) : null;
  };

 // const handleAddChange = (e) => setNewForm({ ...newForm, [e.target.name]: e.target.value });
  //const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });
const handleAddChange = (e) => {
  const { name, value } = e.target;
  const valorFinal = name === "numero_tarjeta" 
    ? value.replace(/\D/g, "").slice(0, 16) 
    : value;

  setNewForm({ ...newForm, [name]: valorFinal });
};

const handleEditChange = (e) => {
  const { name, value } = e.target;
  const valorFinal = name === "numero_tarjeta" 
    ? value.replace(/\D/g, "").slice(0, 16) 
    : value;

  setEditForm({ ...editForm, [name]: valorFinal });
};
 

  const guardarNuevo = () => {

// Verificamos si es ID 3 o 4 (Tarjeta)
  const esTarjeta = ["3", "4"].includes(String(newForm.id_medio_pago));

  if (esTarjeta) {
    const numTarjeta = String(newForm.numero_tarjeta || "").trim();

    if (numTarjeta.length < 15 || numTarjeta.length > 16) {
      return avisar.advertencia(`⚠️ El número de tarjeta debe tener 15 o 16 dígitos (ingresaste ${numTarjeta.length}).`);
    }
  }

  // 🛑 2. AQUÍ PREGUNTA SI LA NUEVA TARJETA ES ACTIVA
  // Evaluamos si el campo de 'newForm' tiene valor 'S', true o 'Sí'
  const esActivaNueva = newForm.activo === "S" || newForm.activo === true || newForm.activo === "Sí";

  // 3. Si la nueva va a ser Activa, buscamos en el listado si ya hay alguna otra activa
  if (esActivaNueva) {
    const yaExisteActiva = listado.some(
      (item) => item.activo === "S" || item.activo === true || item.activo === "Sí"
    );

    if (yaExisteActiva) {
      return avisar.advertencia("⚠️ Ya existe una tarjeta activa. Solo puede haber una activa a la vez.");
    }
  }

  // Normalizamos el valor que eligió el usuario en el formulario
  const valorNuevo = String(newForm.activo || "").trim().toUpperCase();
  const esActivoNuevo = valorNuevo === "S" || valorNuevo === "SÍ" || valorNuevo === "TRUE";

  if (esActivoNuevo) {
    // Buscamos si ya hay alguna tarjeta con activo = "S" (o Sí/true) en la lista local
    const yaExisteActiva = listado.some((item) => {
      const valItem = String(item.activo).trim().toUpperCase();
      return valItem === "S" || valItem === "SÍ" || valItem === "TRUE";
    });

    if (yaExisteActiva) {
      return avisar.advertencia("⚠️ Ya existe una tarjeta marcada como Activa en la lista. Solo se permite una tarjeta activa.");
    }
  }



    const necesitaTarjeta = requiereTarjeta(newForm.id_medio_pago, listaMediosPago);

    if (!newForm.id_medio_pago) {
      return avisar.advertencia("Por favor, seleccione un medio de pago.");
    }

    if (necesitaTarjeta) {
      if (
        !newForm.id_marca_tarjeta || 
        !newForm.id_entidad_bancaria || 
        !newForm.numero_tarjeta.trim() || 
        !newForm.nombre_titular.trim()
      ) {
        return avisar.advertencia("Por favor, complete todos los datos de la tarjeta antes de continuar.");
      }
    }

    const medioObj = listaMediosPago.find(g => String(g.id_medio_pago || g.id) === String(newForm.id_medio_pago));
    const marcaObj = necesitaTarjeta ? listaMarcas.find(g => String(g.id_marca_tarjeta || g.id) === String(newForm.id_marca_tarjeta)) : "-";
    const entidadObj = necesitaTarjeta ? listaEntidades.find(d => String(d.id_entidad_bancaria || d.id) === String(newForm.id_entidad_bancaria)) : "-";

    const itemNuevo = {
      id_pago: `temp-${Date.now()}`,
      id_medio_pago: newForm.id_medio_pago,
      medio_pago: medioObj ? (medioObj.nombre || medioObj.medio_pago) : "-",
      id_marca_tarjeta: necesitaTarjeta ? newForm.id_marca_tarjeta : null,
      marca_tarjeta: necesitaTarjeta ? (marcaObj?.nombre || marcaObj?.marca) : "-",
      id_entidad_bancaria: necesitaTarjeta ? newForm.id_entidad_bancaria : null,
      entidad_bancaria: necesitaTarjeta ? (entidadObj?.nombre || entidadObj?.entidad) : "-",
      numero_tarjeta: necesitaTarjeta ? newForm.numero_tarjeta : "-",
      nombre_titular: necesitaTarjeta ? newForm.nombre_titular : "-",
      activo: necesitaTarjeta ? newForm.activo : null,
      id_alumno: idAlumno,
      esNuevo: true
    };

    const nuevoListado = [...listado, itemNuevo];
    setListado(nuevoListado);
    if (onCambioDatos) onCambioDatos(nuevoListado); 

    setIsAdding(false);
    setNewForm(initialFormState);
    avisar.exito("Forma de pago agregada a la lista.");
  };

  const iniciarEdicion = (item, indexFila) => {
    setEditingId(indexFila);
    setEditForm({
      id_medio_pago: item.id_medio_pago || "",
      id_marca_tarjeta: item.id_marca_tarjeta || item.id_marca || null,
      id_entidad_bancaria: item.id_entidad_bancaria || item.id_entidad || null, 
      numero_tarjeta: item.numero_tarjeta === '-' ? "" : (item.numero_tarjeta || ""), 
      nombre_titular: item.nombre_titular === '-' ? "" : (item.nombre_titular || ""),
      activo: item.activo || null
    });
  };

  const guardarEdicion = (indexFila) => {

    // Si el medio de pago seleccionado es una tarjeta
const esTarjeta = String(newForm.id_medio_pago).toLowerCase().includes("3", "4");

if (esTarjeta) {
  const num = String(newForm.numero_tarjeta || "").trim();
  
  if (num.length < 15 || num.length > 16) {
    return avisar.advertencia("⚠️ El número de tarjeta debe tener entre 15 y 16 dígitos.");
  }
}

// 1. Leemos el valor de 'activo' que el usuario seleccionó en la edición
  const valorEdit = String(editForm.activo || editForm.activa || editForm.es_activa || "").trim().toUpperCase();
  const intentaMarcarActiva = valorEdit === "S" || valorEdit === "SÍ" || valorEdit === "TRUE" || valorEdit === "1";

  // 2. Si intenta ponerla como Activa, verificamos los demás registros
  if (intentaMarcarActiva) {
    const yaExisteOtraActiva = listado.some((item, idx) => {
      // ⚠️ IMPORTANTE: Ignoramos la fila actual que estamos editando
      if (idx === indexFila) return false;

      const valItem = String(item.activo || item.activa || item.es_activa || "").trim().toUpperCase();
      return valItem === "S" || valItem === "SÍ" || valItem === "TRUE" || valItem === "1";
    });

    if (yaExisteOtraActiva) {
      return avisar.advertencia("⚠️ Ya existe otro medio de pago activo en la lista. Debe desactivarlo antes de activar este.");
    }
  }




    const necesitaTarjeta = requiereTarjeta(editForm.id_medio_pago, listaMediosPago);

    if (!editForm.id_medio_pago) {
      return avisar.advertencia("Por favor, seleccione un medio de pago.");
    }

    if (necesitaTarjeta) {
      if (
        !editForm.id_marca_tarjeta || 
        !editForm.id_entidad_bancaria || 
        !editForm.numero_tarjeta.trim() || 
        !editForm.nombre_titular.trim()
      ) {
        return avisar.advertencia("Por favor, complete todos los datos de la tarjeta antes de guardar.");
      }
    }

    const medioObj = listaMediosPago.find(g => String(g.id_medio_pago || g.id) === String(editForm.id_medio_pago));
    const marcaObj = necesitaTarjeta ? listaMarcas.find(a => String(a.id_marca_tarjeta || a.id) === String(editForm.id_marca_tarjeta)) : "-";
    const entidadObj = necesitaTarjeta ? listaEntidades.find(d => String(d.id_entidad_bancaria || d.id) === String(editForm.id_entidad_bancaria)) : "-";

    const nuevoListado = listado.map((item, idx) => {
      if (idx === indexFila) {
        return {
          ...item,
          id_medio_pago: editForm.id_medio_pago,
          medio_pago: medioObj?.nombre || medioObj?.medio_pago || item.medio_pago,
          id_marca_tarjeta: necesitaTarjeta ? editForm.id_marca_tarjeta : null,
          marca_tarjeta: necesitaTarjeta ? (marcaObj?.nombre || marcaObj?.marca || item.marca_tarjeta) : "-",
          id_entidad_bancaria: necesitaTarjeta ? editForm.id_entidad_bancaria : null,
          entidad_bancaria: necesitaTarjeta ? (entidadObj?.nombre || entidadObj?.entidad || item.entidad_bancaria) : "-",
          numero_tarjeta: necesitaTarjeta ? editForm.numero_tarjeta : "-", 
          nombre_titular: necesitaTarjeta ? editForm.nombre_titular : "-", 
          activo: necesitaTarjeta ? editForm.activo : null
        };
      }
      return item;
    });

    setListado(nuevoListado);
    if (onCambioDatos) onCambioDatos(nuevoListado); 
    setEditingId(null);
    avisar.exito("Forma de pago modificada.");
  };

  const eliminarRegistro = async (idRegistro) => {
    if (String(idRegistro).startsWith("temp-")) {
      const nuevoListado = listado.filter(item => item.id_pago !== idRegistro);
      setListado(nuevoListado);
      if (onCambioDatos) onCambioDatos(nuevoListado);
      return;
    }

    if (onEliminarBackend) {
      const eliminadoExitosamente = await onEliminarBackend(idRegistro);
      if (eliminadoExitosamente) {
        const nuevoListado = listado.filter(item => (item.id_alumno_tarjeta || item.id_pago) !== idRegistro);
        setListado(nuevoListado);
        if (onCambioDatos) onCambioDatos(nuevoListado);
      }
    }
  };

  //const formatBoolean = (val) => String(val).toUpperCase() === 'S' ? 'Sí' : 'No';
  /*const formatBoolean = (val) => 
  val == null ? '-' : (String(val).toUpperCase() === 'S' ? 'Sí' : 'No');*/
  const formatBoolean = (val) => 
  (val == null || val === '-') ? '-' : (String(val).toUpperCase() === 'S' ? 'Sí' : 'No');

  // Validaciones de formulario
  const newEsTarjeta = requiereTarjeta(newForm.id_medio_pago, listaMediosPago);
  const formularioIncompleto = 
    !newForm.id_medio_pago || 
    (newEsTarjeta && (
      !newForm.id_marca_tarjeta || 
      !newForm.id_entidad_bancaria || 
      !newForm.numero_tarjeta.trim() || 
      !newForm.nombre_titular.trim() ||
      !newForm.activo.trim() || newForm.activo === '-' || newForm.activo === null
    ));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancelar" : "Nuevo Registro"}
        </button>
      </div>

{/* 🔹 1. Envoltorio con scroll horizontal habilitado */}
<div className="w-full max-w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm my-4">  {/* 🔹 2. La tabla exige al menos 750px para mostrar todas las columnas sin recortar */}
  <table className="w-full min-w-[750px] text-left text-sm text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Medio de Pago</th>
              <th className="px-4 py-3 text-left">Marca</th>
              <th className="px-4 py-3 text-left">Entidad Emisora</th>
              <th className="px-4 py-3 text-left">N° Tarjeta</th>
              <th className="px-4 py-3 text-left">Titular</th>
              <th className="px-4 py-3"><div className="flex items-center justify-center">Activa</div></th>  
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* --- FILA DE ALTA --- */}
            {isAdding && (() => {
              const necesitaTarjeta = requiereTarjeta(newForm.id_medio_pago, listaMediosPago);
              return (
                <tr className="bg-blue-50">
                  <td className="px-4 py-2">
                    <select 
                      name="id_medio_pago" 
                      value={newForm.id_medio_pago} 
                      onChange={(e) => {
                        handleAddChange(e);
                        if (!requiereTarjeta(e.target.value, listaMediosPago)) {
                          setNewForm(prev => ({
                            ...prev,
                            id_medio_pago: e.target.value,
                            id_marca_tarjeta: "",
                            id_entidad_bancaria: "",
                            numero_tarjeta: "",
                            nombre_titular: "",
                            activo: ""
                          }));
                        }
                      }} 
                      className="select select-bordered select-sm w-full"
                    >
                      <option value="">Seleccione...</option>
                      {listaMediosPago.map(g => (
                        <option key={g.id_medio_pago || g.id} value={g.id_medio_pago || g.id}>{g.nombre || g.medio_pago}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <select 
                      name="id_marca_tarjeta" 
                      value={necesitaTarjeta ? newForm.id_marca_tarjeta : null} 
                      onChange={handleAddChange} 
                      disabled={!necesitaTarjeta}
                      className="select select-bordered select-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione...</option>
                      {listaMarcas.map(m => (
                        <option key={m.id_marca_tarjeta || m.id} value={m.id_marca_tarjeta || m.id}>{m.nombre || m.marca}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <select 
                      name="id_entidad_bancaria" 
                      value={necesitaTarjeta ? newForm.id_entidad_bancaria : null} 
                      onChange={handleAddChange} 
                      disabled={!necesitaTarjeta}
                      className="select select-bordered select-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione...</option>
                      {listaEntidades.map(e => (
                        <option key={e.id_entidad_bancaria || e.id} value={e.id_entidad_bancaria || e.id}>{e.nombre || e.entidad}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-2">
                    <input 
                      type="text"
                      name="numero_tarjeta"
                      placeholder={necesitaTarjeta ? "**** **** **** 1234" : "N/A"}
                      value={necesitaTarjeta ? newForm.numero_tarjeta : ""} 
                      onChange={handleAddChange}
                      disabled={!necesitaTarjeta}
                      className="input input-bordered input-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <input 
                      type="text"
                      name="nombre_titular"
                      placeholder={necesitaTarjeta ? "Nombre completo" : "N/A"}
                      value={necesitaTarjeta ? newForm.nombre_titular : ""} 
                      onChange={handleAddChange}
                      disabled={!necesitaTarjeta}
                      className="input input-bordered input-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center">
                      <select 
                        name="activo" 
                        value={necesitaTarjeta ? newForm.activo : "-"} 
                        onChange={handleAddChange} 
                        disabled={!necesitaTarjeta}
                        className="select select-bordered select-sm w-full text-center disabled:bg-gray-200 disabled:cursor-not-allowed"
                      >
                        <option value="-">Seleccione</option>
                        <option value="S">Sí</option>
                        <option value="N">No</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={guardarNuevo} 
                        disabled={formularioIncompleto} 
                        className={formularioIncompleto ? "text-gray-300 cursor-not-allowed" : "text-green-600 hover:scale-110 transition-transform"}
                      >
                        <Check size={20} />
                      </button>
                      <button 
                      onClick={() => {
                        setIsAdding(false);
                        setNewForm(initialFormState);
                      }} 
                      className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform"
                      title="Cancelar"
                    >
                      <X size={20} />
                    </button>
                    </div>
                  </td>
                </tr>
              );
            })()}

            {/* --- MUESTRA MENSAJE SI NO HAY REGISTROS --- */}
            {listado.length === 0 && !isAdding && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-400">
                  No hay formas de pago asociadas. Pulsa en <strong>"Nuevo Registro"</strong> para agregar una.
                </td>
              </tr>
            )}

            {/* --- LISTADO Y MODO EDICIÓN --- */}
            {listado.map((item, index) => {
              const isEditing = editingId === index;
              const idRegistro = item.id_alumno_tarjeta || item.id_pago || item.id || `fila-${index}`;

              return (
                <tr key={idRegistro} className="hover:bg-gray-50 border-b">
                  {isEditing ? (() => {
                    const editNecesitaTarjeta = requiereTarjeta(editForm.id_medio_pago, listaMediosPago);
                    return (
                      <>
                        <td className="px-4 py-2">
                          <select 
                            name="id_medio_pago" 
                            value={editForm.id_medio_pago} 
                            onChange={(e) => {
                              handleEditChange(e);
                              if (!requiereTarjeta(e.target.value, listaMediosPago)) {
                                setEditForm(prev => ({
                                  ...prev,
                                  id_medio_pago: e.target.value,
                                  id_marca_tarjeta: "",
                                  id_entidad_bancaria: "",
                                  numero_tarjeta: "",
                                  nombre_titular: "",
                                  activo: ""
                                }));
                              }
                            }} 
                            className="select select-bordered select-sm w-full"
                          >
                            <option value="">Seleccione...</option>
                            {listaMediosPago.map(g => (
                              <option key={g.id_medio_pago || g.id} value={g.id_medio_pago || g.id}>{g.nombre || g.medio_pago}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2">
                          <select 
                            name="id_marca_tarjeta" 
                            value={editNecesitaTarjeta ? editForm.id_marca_tarjeta : ""} 
                            onChange={handleEditChange} 
                            disabled={!editNecesitaTarjeta}
                            className="select select-bordered select-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                          >
                            <option value="">Seleccione...</option>
                            {listaMarcas.map(m => (
                              <option key={m.id_marca_tarjeta || m.id} value={m.id_marca_tarjeta || m.id}>{m.nombre || m.marca}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2">
                          <select 
                            name="id_entidad_bancaria" 
                            value={editNecesitaTarjeta ? editForm.id_entidad_bancaria : ""} 
                            onChange={handleEditChange} 
                            disabled={!editNecesitaTarjeta}
                            className="select select-bordered select-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                          >
                            <option value="">Seleccione...</option>
                            {listaEntidades.map(e => (
                              <option key={e.id_entidad_bancaria || e.id} value={e.id_entidad_bancaria || e.id}>{e.nombre || e.entidad}</option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            name="numero_tarjeta" 
                            placeholder={editNecesitaTarjeta ? "**** **** **** 1234" : "N/A"}
                            value={editNecesitaTarjeta ? editForm.numero_tarjeta : ""} 
                            onChange={handleEditChange} 
                            disabled={!editNecesitaTarjeta}
                            className="input input-bordered input-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                          />
                        </td>

                        <td className="px-4 py-2">
                          <input 
                            type="text" 
                            name="nombre_titular" 
                            placeholder={editNecesitaTarjeta ? "Nombre completo" : "N/A"}
                            value={editNecesitaTarjeta ? editForm.nombre_titular : ""} 
                            onChange={handleEditChange} 
                            disabled={!editNecesitaTarjeta}
                            className="input input-bordered input-sm w-full disabled:bg-gray-200 disabled:cursor-not-allowed"
                          />
                        </td>

                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center">
                            <select 
                              name="activo" 
                              value={editNecesitaTarjeta ? editForm.activo : "-"} 
                              onChange={handleEditChange} 
                              disabled={!editNecesitaTarjeta}
                              className="select select-bordered select-sm w-full text-center disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                              <option value="-">Seleccione</option>
                              <option value="S">Sí</option>
                              <option value="N">No</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => guardarEdicion(index)} className="text-green-600 hover:scale-110"><Check size={18} /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform"><X size={18} /></button>
                          </div>
                        </td>
                      </>
                    );
                  })() : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800 text-left">
                        {getNombreMedio(item)}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {getNombreMarca(item)}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {getNombreEntidad(item)}
                      </td>
                      <td className="px-4 py-3 font-mono text-left">
                        {item.numero_tarjeta}
                      </td>
                      <td className="px-4 py-3 text-left">
                        {item.nombre_titular}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${item.activo === 'S' ? 'text-green-700 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                            {formatBoolean(item.activo)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => iniciarEdicion(item, index)} className="text-blue-600 hover:text-blue-800"><Pencil size={18} /></button>
                          <button onClick={() => eliminarRegistro(idRegistro)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemListAlumnoFormaPago;