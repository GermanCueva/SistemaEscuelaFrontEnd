import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from './Spinner';
import ItemDetailPersonaDocumentoAlta from './ItemPersonaDocumentoDetailAlta'; 
import { avisar } from "../utils/notificaciones.js";

const ItemDetailPersona = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = Boolean(id) && id !== "alta" && id !== "undefined";

  const [subSolapaActiva, setSubSolapaActiva] = useState('alta');
  const [localidades, setLocalidades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); 

  // ESTADO UNIFICADO: Persona + su array de documentos local
  const [pers, setPers] = useState({
    apellidos: '', nombres: '', id_sexo: '', fecha_nacimiento: '',
    correo_electronico: '', recibe_notif_x_correo: '', telefono: '',
    id_localidad_nacimiento: '', id_localidad_residencia: '',
    id_nacionalidad: '', activo: '', es_alumno: '', usuario: '',
    documentos: [] 
  });

  // 1. Cargar Catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resLoc, resNac] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/localidades`),
          fetch(`${process.env.REACT_APP_API_URL}/api/nacionalidades`)
        ]);
        const dataLoc = await resLoc.json();
        const dataNac = await resNac.json();
        setLocalidades(dataLoc); 
        setNacionalidades(dataNac); 
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      } finally {
        if (!isEditMode) setIsLoading(false);
      }
    };
    cargarCatalogos();
  }, [isEditMode]);

  // 2. Cargar Datos del Registro (Modo Edición)
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      const token = localStorage.getItem('token'); 

      Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/${id}`, { 
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => []) 
      ])
      .then(([dataPersona, dataDocs]) => {
        if (dataPersona && dataPersona.length > 0) {
          const misDocs = Array.isArray(dataDocs) ? dataDocs : dataDocs.docs || dataDocs.data || [];
          setPers({
            ...dataPersona[0],
            documentos: misDocs 
          }); 
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error obteniendo datos completos de la persona:", err);
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

const handleChange = (e) => {
  const { name, value } = e.target;
  
  setPers((prev) => {
    // Si están cambiando el selector de 'es_alumno' y eligen 'S' (Sí)
    if (name === 'es_alumno' && value === 'S') {
      return {
        ...prev,
        [name]: value,
        usuario: '' // 👈 Limpiamos el texto del usuario automáticamente
      };
    }
    
    // Para cualquier otro campo, se comporta normalmente
    return { ...prev, [name]: value };
  });
};

  const handleChangeEmail = (e) => {
    handleChange(e); 
    const v = e.target.value; 
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 
    setEmailError(v !== "" && !regexEmail.test(v) ? "Formato de correo inválido." : ""); 
  };

  const handleChangePhone = (e) => {
    handleChange(e); 
    const v = e.target.value; 
    const regexPhone = /^\+?[0-9\s-]{7,15}$/; 
    setPhoneError(v !== "" && !regexPhone.test(v) ? "Formato de teléfono inválido." : ""); 
  };

  const setDocumentosGlobal = (nuevosDocumentos) => {
    setPers(prev => ({ ...prev, documentos: nuevosDocumentos }));
  };

  // 🗑️ ELIMINAR EL DOCUMENTO EN EL BACKEND
  const eliminarDocumentoBackend = async (idDocumento) => {
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${idDocumento}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || 'No se pudo eliminar el documento del servidor.');
      }

      avisar.exito('¡Documento eliminado correctamente de la base de datos!');
      return true;
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      alert('Hubo un problema al eliminar el documento:\n' + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

 // 📥 FUNCIÓN CENTRAL DE GUARDADO (CON DIAGNÓSTICO DE RESPUESTA)
  const grabar = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token'); 

    // Validaciones de Solapa Alta
    if (!pers.apellidos || !pers.nombres || !pers.id_sexo || !pers.fecha_nacimiento || !pers.correo_electronico || !pers.telefono) {
       avisar.advertencia("⚠️ Error: ¡Por favor, completa todos los campos obligatorios en la solapa de Datos de la Persona!");
       setSubSolapaActiva('alta');
       return;
    }

    if (emailError || phoneError) { 
      avisar.error("⚠️ Error: Corrige los errores de formato (Email o Teléfono) antes de guardar.");
      setSubSolapaActiva('alta');
      return;
    }

    if (!pers.documentos || pers.documentos.length === 0) {
      avisar.advertencia("⚠️ Error: No puedes guardar el registro sin asignarle al menos un Documento en la solapa 'Documentos'.");
      setSubSolapaActiva('documentos');
      return;
    }

    setIsLoading(true);

    const { documentos, ...datosPersona } = pers;

    if (!isEditMode) {
      delete datosPersona.id_persona; 
      delete datosPersona.id; 
    }

    const urlPersona = isEditMode 
      ? `${process.env.REACT_APP_API_URL}/api/persons/${id}` 
      : `${process.env.REACT_APP_API_URL}/api/persons`;      

    const methodPersona = isEditMode ? 'PUT' : 'POST'; 

    try {
      // 1️⃣ PASO 1: Guardar la Persona
      const responsePersona = await fetch(urlPersona, {
        method: methodPersona,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(datosPersona), 
      });

      const resultadoPersona = await responsePersona.json();

      if (!responsePersona.ok) {
        throw new Error(resultadoPersona.error || resultadoPersona.message || 'No se pudo procesar la persona.');
      }

      // 🔍 INSPECCIÓN EN CONSOLA: Abre F12 en tu navegador para ver qué estructura llegó aquí.
      console.log("=== RESPUESTA DEL BACKEND ===");
      console.log(resultadoPersona);
      console.log("=============================");

      // 🔍 EXTRACTOR AUTOMÁTICO MULTI-ESTRUCTURA:
      let idPersonaFinal = isEditMode ? id : null;
      
      if (!isEditMode && resultadoPersona) {
        idPersonaFinal = 
          resultadoPersona.id_persona || 
          resultadoPersona.id ||
          (resultadoPersona.rows && resultadoPersona.rows[0]?.id_persona) || // Si el backend devolvió el objeto query directo
          (resultadoPersona.rows && resultadoPersona.rows[0]?.id) ||
          resultadoPersona.data?.id_persona || 
          resultadoPersona.data?.id ||
          (Array.isArray(resultadoPersona) ? resultadoPersona[0]?.id_persona : null) ||
          (Array.isArray(resultadoPersona) ? resultadoPersona[0] : null);
      }

      // Si todo lo anterior falla pero obtuvimos un objeto plano con un número único adentro, intentamos deducirlo:
      if (!idPersonaFinal && typeof resultadoPersona === 'object') {
         const valoresObjeto = Object.values(resultadoPersona);
         const posibleId = valoresObjeto.find(v => typeof v === 'number');
         if (posibleId) idPersonaFinal = posibleId;
      }

      if (!idPersonaFinal) {
        // Imprimimos en el alert el objeto convertido a texto para que veas qué campos tiene en pantalla
        throw new Error(`El backend guardó pero la propiedad del ID no se reconoció. Estructura recibida: ${JSON.stringify(resultadoPersona)}`);
      }

      // 2️⃣ PASO 2: Guardar los documentos
      const promesasDocumentos = documentos.map(async (doc) => {
        const esNuevoDocumento = !isEditMode || !doc.id_persona;
        const urlDoc = esNuevoDocumento
          ? `${process.env.REACT_APP_API_URL}/api/documentos`
          : `${process.env.REACT_APP_API_URL}/api/documentos/${doc.id_persona_tipo_documento || doc.id}`;

        const methodDoc = esNuevoDocumento ? 'POST' : 'PUT';

        const datosAEnviarDoc = {
          id_persona: Number(idPersonaFinal), 
          id_tipo_documento: Number(doc.id_tipo_documento),
          numero: String(doc.numero),
          activo: doc.activo || 'S',
          id_persona_tipo_documento: doc.id_persona_tipo_documento || doc.id_tipo_documento
        };

        const resDoc = await fetch(urlDoc, {
          method: methodDoc,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(datosAEnviarDoc)
        });

        if (!resDoc.ok) {
          const errData = await resDoc.json().catch(() => ({}));
          throw new Error(`Documento N° ${doc.numero}: ${errData.error || errData.mensaje || 'Fallo al procesar'}`);
        }
        return resDoc.json();
      });

      await Promise.all(promesasDocumentos);

      avisar.exito(isEditMode ? '¡Datos y documentos actualizados correctamente!' : '¡Persona y Documentos guardados juntos con éxito!');
      navigate('/personas/abm'); 

    } catch (error) {
      console.error('Error en el proceso de guardado:', error); 
      alert('Hubo un problema al procesar el guardado completo:\n' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Botones de Navegación de Pestañas locales */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setSubSolapaActiva('alta')} style={subSolapaActiva === 'alta' ? styles.activeSubTab : styles.subTab}>
          {isEditMode ? 'Editar Persona' : 'Alta de Persona'}
        </button>
        <button onClick={() => setSubSolapaActiva('documentos')} style={subSolapaActiva === 'documentos' ? styles.activeSubTab : styles.subTab}>
          Documentos {pers.documentos.length > 0 && `(${pers.documentos.length})`}
        </button>

        <button 
          onClick={() => {
            if (pers.es_alumno === 'S') {
              setSubSolapaActiva('alumnos');
            }
          }} 
          style={{
            ...(subSolapaActiva === 'alumnos' ? styles.activeSubTab : styles.subTab),
            ...(pers.es_alumno !== 'S' ? {
              opacity: 0.5,
              cursor: 'not-allowed',
              backgroundColor: '#f1f3f5',
              color: '#adb5bd'
            } : {})
          }}
          disabled={pers.es_alumno !== 'S'}
        >
          Datos Alumno
        </button>      
      </div>

      {/* Renderizado Condicional de Vistas */}
      <div className="contenido-subsolapa">
        {subSolapaActiva === 'documentos' && (
          <ItemDetailPersonaDocumentoAlta 
            docs={pers.documentos} 
            setDocs={setDocumentosGlobal} 
            isEditMode={isEditMode}
            onEliminarBackend={eliminarDocumentoBackend}
          />
        )} 
        {subSolapaActiva === 'alumnos' && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px', textAlign: 'center', color: '#777' }}>
            Formulario de Alumnos (Próximamente)
          </div>
        )}
      </div>
  
      {subSolapaActiva === 'alta' && (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Editar Perfil de Persona' : 'Alta de Persona'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                
                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Apellido:</span>
                  <input type="text" name="apellidos" value={pers.apellidos || ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Nombres:</span>
                  <input type="text" name="nombres" value={pers.nombres || ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Sexo:</span>
                  <select name="id_sexo" value={pers.id_sexo || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="1">Masculino</option>
                    <option value="2">Femenino</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Fecha de Nacimiento:</span>
                  <input type="date" name="fecha_nacimiento" value={pers.fecha_nacimiento ? pers.fecha_nacimiento.split('T')[0] : ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Email:</span>
                  <input type="email" name="correo_electronico" value={pers.correo_electronico || ''} onChange={handleChangeEmail} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                  {emailError && <span style={{ color: 'red', fontSize: '12px', display: 'block', textAlign: 'left' }}>{emailError}</span>}
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Recibe Notificaciones por Correo:</span>
                  <select name="recibe_notif_x_correo" value={pers.recibe_notif_x_correo || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="S">Si</option>
                    <option value="N">No</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Teléfono:</span>
                  <input type="text" name="telefono" value={pers.telefono || ''} onChange={handleChangePhone} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                  {phoneError && <span style={{ color: 'red', fontSize: '12px', display: 'block', textAlign: 'left' }}>{phoneError}</span>}
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Localidad de Nacimiento:</span>
                  <select name="id_localidad_nacimiento" value={pers.id_localidad_nacimiento || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una localidad</option>
                    {localidades.map((loc) => (<option key={loc.id_localidad} value={loc.id_localidad}>{loc.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Localidad de Residencia:</span>
                  <select name="id_localidad_residencia" value={pers.id_localidad_residencia || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una localidad</option>
                    {localidades.map((loc) => (<option key={loc.id_localidad} value={loc.id_localidad}>{loc.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Nacionalidad:</span>
                  <select name="id_nacionalidad" value={pers.id_nacionalidad || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una nacionalidad</option>
                    {nacionalidades.map((nac) => (<option key={nac.id_nacionalidad} value={nac.id_nacionalidad}>{nac.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Estado:</span>
                  <select name="activo" value={pers.activo || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="N">Inactivo</option>
                    <option value="S">Activo</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Es alumno:</span>
                  <select name="es_alumno" value={pers.es_alumno || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="S">Si</option>
                    <option value="N">No</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Usuario:</span>
                  <input 
                    type="text" 
                    name="usuario" 
                    value={pers.usuario || ''} 
                    onChange={handleChange} 
                    className="input input-bordered w-full" 
                    disabled={pers.es_alumno === 'S'} 
                    style={{ 
                      border: '1px solid #ccc', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      width: '100%',
                      backgroundColor: pers.es_alumno === 'S' ? '#e9ecef' : '#ffffff',
                      cursor: pers.es_alumno === 'S' ? 'not-allowed' : 'text'
                    }} 
                  />
                </label>

              </div>
            </div>
        </div>
      )}

      {/* BOTONES GLOBALES */}
      <div className="max-w-4xl mx-auto flex justify-end mt-4 gap-4 px-8">
        <Link to={'/personas/abm'}>
          <button type="button" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
        </Link>
        <button onClick={grabar} className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isEditMode ? 'Guardar Cambios Totales' : 'Registrar Persona Completa'}
        </button>
      </div>

    </div>  
  );
};

const styles = {
  subTab: { flex: 1, backgroundColor: '#e0e0e0', color: '#555555', padding: '12px 0', border: 'none', borderRight: '1px solid #cccccc', cursor: 'pointer', fontSize: '14px', textAlign: 'center' },
  activeSubTab: { flex: 1, backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold', padding: '12px 0', border: 'none', borderRight: '1px solid #cccccc', cursor: 'pointer', fontSize: '14px', textAlign: 'center' }
};

export default ItemDetailPersona;