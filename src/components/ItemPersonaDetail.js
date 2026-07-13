import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from './Spinner';
import ItemDetailPersonaDocumentoAlta from './ItemPersonaDocumentoDetailAlta'; 
import ItemPersonaAlumnoDetailAlta from './ItemPersonaAlumnoDetailAlta'; 
import ItemListTutorAlumnos from "./ItemListTutorAlumnos.js";
import { avisar } from "../utils/notificaciones.js";
import ItemListAlumnoAllegados from "./ItemListAlumnoAllegados.js";

const ItemDetailPersona = () => {

  const { id } = useParams();
  const navigate = useNavigate();

  // Resetear la pestaña activa a 'alta' cada vez que cambie el ID de la persona en la URL
  useEffect(() => {
    setSubSolapaActiva('alta');
  }, [id]);
  
  const isEditMode = Boolean(id) && id !== "alta" && id !== "undefined";

  const [subSolapaActiva, setSubSolapaActiva] = useState('alta');
  const [localidades, setLocalidades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); 
  
  // Flag para saber si el registro de alumno ya existe en el backend (Modo Edición)
  const [hasAlumnoRecord, setHasAlumnoRecord] = useState(false);

  // ESTADO UNIFICADO (Incluye allegados)
  const [pers, setPers] = useState({
    apellidos: '', nombres: '', id_sexo: '', fecha_nacimiento: '',
    correo_electronico: '', recibe_notif_x_correo: '', telefono: '',
    id_localidad_nacimiento: '', id_localidad_residencia: '',
    id_nacionalidad: '', activo: '', es_alumno: '', usuario: '',
    // Campos de Alumno
    legajo: '',
    extranjero: '',
    regular: '',
    id_motivo_desercion: '',
    es_celiaco: '',
    direccion_calle: '',
    direccion_numero: '',
    direccion_piso: '',
    direccion_depto: '',
    documentos: [],
    allegados: [] // <-- Lista de allegados integrada
  });

  // Helper seguro para mostrar notificaciones garantizadas
  const notificar = (mensaje, tipo = 'advertencia') => {
    try {
      if (avisar && typeof avisar[tipo] === 'function') {
        avisar[tipo](mensaje);
      } else if (avisar && typeof avisar.advertencia === 'function') {
        avisar.advertencia(mensaje);
      } else {
        alert(mensaje);
      }
    } catch (e) {
      alert(mensaje);
    }
  };

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

  // Carga de Allegados de forma aislada / reutilizable
  const obtenerAllegados = useCallback(async (idAlumno) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutoresId/${idAlumno}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPers(prev => ({ ...prev, allegados: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error("Error al obtener allegados:", err);
    }
  }, []);

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
        }).then(res => res.json()).catch(() => []),
        fetch(`${process.env.REACT_APP_API_URL}/api/alumnos/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : null).catch(() => null),
        fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutoresId/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => [])
      ])
      .then(([dataPersona, dataDocs, dataAlumno, dataAllegados]) => {
        if (dataPersona && dataPersona.length > 0) {
          const misDocs = Array.isArray(dataDocs) ? dataDocs : dataDocs.docs || dataDocs.data || [];
          const misAllegados = Array.isArray(dataAllegados) ? dataAllegados : [];

          let datosAlumno = {};
          if (dataAlumno) {
            const alumnoObj = Array.isArray(dataAlumno) ? dataAlumno[0] : dataAlumno.data || dataAlumno;
            if (alumnoObj) {
              datosAlumno = alumnoObj;
              setHasAlumnoRecord(true);
            }
          }

          setPers(prev => ({
            ...prev,
            ...dataPersona[0],
            ...datosAlumno,
            documentos: misDocs,
            allegados: misAllegados
          })); 
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error obteniendo datos completos de la persona:", err);
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fecha_nacimiento' && value) {
      const edad = calcularEdad(value);
      if (edad < 4) {
        avisar.error("El alumno debe tener al menos 4 años de edad.");
        return; 
      }
    }
    
    setPers((prev) => {
      if (name === 'es_alumno' && value === 'S') {
        return {
          ...prev,
          [name]: value,
          usuario: '' 
        };
      }
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

// En ItemDetailPersona.js
  const setAllegadosGlobal = (nuevaListaOFunction) => {
    setPers(prev => {
      const allegadosActuales = Array.isArray(prev.allegados) ? prev.allegados : [];

      // 1. Resolvemos si viene una función updater (prev => ...) o un valor directo
      const resultado = typeof nuevaListaOFunction === 'function' 
        ? nuevaListaOFunction(allegadosActuales)
        : nuevaListaOFunction;

      const nuevaListaBruta = Array.isArray(resultado) ? resultado : [];

      // 2. FILTRADO DE DUPLICADOS:
      // Conservamos solo un registro por persona (comparando id_persona / id_persona_real)
      const listaSinDuplicados = [];
      const idsVistos = new Set();

      for (const item of nuevaListaBruta) {
        if (!item) continue;
        
        // Obtenemos el ID real/único de la persona agregada
        const idPersonaUnico = String(item.id_persona_real || item.id_persona || '');

        if (idPersonaUnico) {
          if (idsVistos.has(idPersonaUnico)) {
            // Notificamos que se intentó agregar un duplicado
            notificar('⚠️ Esta persona ya se encuentra agregada en la lista de allegados.', 'advertencia');
            continue; // Se saltea esta entrada duplicada
          }
          idsVistos.add(idPersonaUnico);
        }

        listaSinDuplicados.push(item);
      }

      return {
        ...prev,
        allegados: listaSinDuplicados
      };
    });
  };

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

      avisar.advertencia('¡Documento eliminado correctamente de la base de datos!', 'exito');
      return true;
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      alert('Hubo un problema al eliminar el documento:\n' + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

const eliminarAllegadoBackend = async (idPersonaAllegado) => {
  const token = localStorage.getItem('token');

  try {
    setIsLoading(true);

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores/${idPersonaAllegado}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.mensaje || "Error al eliminar de la base de datos.");
    }

    // 🎯 AQUÍ ESTÁ EL TRUCO PARA EL REFRESO INMEDIATO:
    // Filtramos pers.allegados en tiempo real para quitar la fila borrada
    setPers(prev => {
      const listaActual = Array.isArray(prev.allegados) ? prev.allegados : [];
      return {
        ...prev,
        allegados: listaActual.filter(item => 
          item.id_persona_allegado !== idPersonaAllegado && 
          item.id_persona !== idPersonaAllegado
        )
      };
    });

    avisar.advertencia('¡Allegado eliminado correctamente!', 'exito');

  } catch (error) {
    console.error("Error al eliminar allegado:", error);
    alert("Ocurrió un error al eliminar:\n" + error.message);
  } finally {
    setIsLoading(false);
  }
};

  // 📥 FUNCIÓN CENTRAL DE GUARDADO (CON OPCIÓN A APLICADA)
  const grabar = async (e) => {
    if (e) e.preventDefault();

    try {
      const token = localStorage.getItem('token'); 

      // 1. Validar campos obligatorios básicos de la Persona
      if (!pers.apellidos || !pers.nombres || !pers.id_sexo || !pers.fecha_nacimiento || !pers.correo_electronico || !pers.telefono) {
          avisar.advertencia("⚠️ Error: ¡Por favor, completa todos los campos obligatorios en la solapa de Datos de la Persona!", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      // 2. Validar que se haya indicado si "Es alumno"
      if (!pers.es_alumno || String(pers.es_alumno).trim() === '') {
          notificar("⚠️ Error: Selecciona una opción en el campo 'Es alumno' (Sí / No) antes de continuar.", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

            // Verificao haya cargado Usuario (solo cuando no es alumno)
      if (pers.es_alumno === 'N' && (String(pers.usuario).trim() === '' || pers.usuario === null )) {
          notificar("⚠️ Error: Debe ingresar un valor de Usuario antes de continuar.", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }


      // 3. Validar Formatos (Email / Teléfono)
      if (emailError || phoneError) { 
        notificar("⚠️ Error: Corrige los errores de formato (Email o Teléfono) antes de guardar.", 'error');
        setSubSolapaActiva('alta');
        return;
      }

      // 4. Validar DOCUMENTOS PRIMERO (Antes de Alumno)
      if (!pers.documentos || pers.documentos.length === 0) {
        notificar("⚠️ Error: Debes ir a la solapa 'Documentos' y agregar al menos un Documento a la grilla antes de continuar.", 'advertencia');
        setSubSolapaActiva('documentos');
        return;
      }


      // -----------------------------------------------------------------
      // 🛡️ NUEVO: CONTROL DE EXISTENCIA POR DOCUMENTO EN MODO ALTA
      // -----------------------------------------------------------------
      if (!isEditMode) {
        setIsLoading(true);

        for (const doc of pers.documentos) {
          const tipoDoc = doc.id_tipo_documento;
          const numDoc = String(doc.numero).trim();

          if (tipoDoc && numDoc) {
            // Se realiza la petición al backend para consultar si ya existe esa combinación
            const resCheck = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos/validar?tipo=${tipoDoc}&numero=${numDoc}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (resCheck.ok) {
              const dataCheck = await resCheck.json();
              
              // Si la API responde que ya existe
              if (dataCheck.existe) {
                setIsLoading(false);
                avisar.error(`⚠️ Error: Ya existe una persona registrada con el documento N° ${numDoc}.`, 'error');
                setSubSolapaActiva('documentos');
                return; // ✋ Frena la grabación
              }
            }
          }
        }
      }
      // -----------------------------------------------------------------


      // Normalización para saber si es Alumno ('S', 's', true, 1)
      const esAlumno = pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1;

      // 5. Validaciones si ES ALUMNO
      if (esAlumno) {
        if (!pers.legajo || !pers.extranjero || !pers.regular || !pers.es_celiaco || !pers.direccion_calle || !pers.direccion_numero) {
          notificar("⚠️ Error: ¡Por favor, completa todos los datos obligatorios del Alumno (Legajo, Extranjero, Regularidad, Celiaquía y Dirección)!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }

        const esNoRegular = pers.regular === 'N' || pers.regular === 'n' || pers.regular === false || pers.regular === 0;

        if (esNoRegular && (!pers.id_motivo_desercion || String(pers.id_motivo_desercion).trim() === '')) {
          notificar("⚠️ Error: El alumno no es regular. ¡Debes seleccionar un Motivo de Deserción!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }

        // Validaciones en Allegados (que no queden inconclusos)
        if (pers.allegados && pers.allegados.length > 0) {
          for (let item of pers.allegados) {
            if (!item.Tutor || !item.tutor || !item.activo) {
              notificar("⚠️ Error: Hay filas en la tabla de Allegados con datos incompletos.", 'advertencia');
              setSubSolapaActiva('alumnoAllegados');
              return;
            }
          }
        }
      }

      setIsLoading(true);

      const { documentos, allegados, ...todo } = pers;

      const datosAlumno = {
        legajo: todo.legajo,
        extranjero: todo.extranjero,
        regular: todo.regular,
        id_motivo_desercion: todo.id_motivo_desercion ? Number(todo.id_motivo_desercion) : null,
        es_celiaco: todo.es_celiaco,
        direccion_calle: todo.direccion_calle,
        direccion_numero: todo.direccion_numero,
        direccion_piso: todo.direccion_piso,
        direccion_depto: todo.direccion_depto
      };

      const datosPersona = { ...todo };
      Object.keys(datosAlumno).forEach(key => delete datosPersona[key]);

      if (!isEditMode) {
        delete datosPersona.id_persona; 
        delete datosPersona.id; 
      }

      const urlPersona = isEditMode 
        ? `${process.env.REACT_APP_API_URL}/api/persons/${id}` 
        : `${process.env.REACT_APP_API_URL}/api/persons`;      

      const methodPersona = isEditMode ? 'PUT' : 'POST'; 

      // 1. Guardar Persona
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

      let idPersonaFinal = isEditMode ? id : null;
      
      if (!isEditMode && resultadoPersona) {
        idPersonaFinal = 
          resultadoPersona.id_persona || 
          resultadoPersona.id ||
          (resultadoPersona.rows && resultadoPersona.rows[0]?.id_persona) || 
          (resultadoPersona.rows && resultadoPersona.rows[0]?.id) ||
          resultadoPersona.data?.id_persona || 
          resultadoPersona.data?.id ||
          (Array.isArray(resultadoPersona) ? resultadoPersona[0]?.id_persona : null) ||
          (Array.isArray(resultadoPersona) ? resultadoPersona[0] : null);
      }

      if (!idPersonaFinal && typeof resultadoPersona === 'object') {
         const valoresObjeto = Object.values(resultadoPersona);
         const posibleId = valoresObjeto.find(v => typeof v === 'number');
         if (posibleId) idPersonaFinal = posibleId;
      }

      if (!idPersonaFinal) {
        throw new Error(`El backend guardó la persona pero no devolvió un ID reconocible.`);
      }

// 2. Guardar Documentos (CORREGIDO)
      const promesasDocumentos = documentos.map(async (doc) => {
        // Detectar si el documento ya tiene un ID de registro asignado previamente en la BD
        const idRelacionDoc = doc.id_persona_tipo_documento || doc.id_documento || doc.id;
        const esNuevoDocumento = !isEditMode || !idRelacionDoc;

        const urlDoc = esNuevoDocumento
          ? `${process.env.REACT_APP_API_URL}/api/documentos`
          : `${process.env.REACT_APP_API_URL}/api/documentos/${idRelacionDoc}`;

        const methodDoc = esNuevoDocumento ? 'POST' : 'PUT';

        const datosAEnviarDoc = {
          id_persona: Number(idPersonaFinal), 
          id_tipo_documento: Number(doc.id_tipo_documento),
          numero: String(doc.numero).trim(), // Trim para limpiar espacios extra
          activo: doc.activo || 'S',
          id_persona_tipo_documento: idRelacionDoc ? Number(idRelacionDoc) : null
        };

        console.log(`📡 Enviando Documento (${methodDoc}):`, datosAEnviarDoc);

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
          throw new Error(`Documento N° ${doc.numero}: ${errData.error || errData.mensaje || 'Fallo al procesar en la BD'}`);
        }
        return resDoc.json();
      });

      await Promise.all(promesasDocumentos);

      // 3. Guardar Alumno
      if (esAlumno) {
        const esNuevoAlumno = !isEditMode || !hasAlumnoRecord;
        const urlAlumno = esNuevoAlumno 
          ? `${process.env.REACT_APP_API_URL}/api/alumnos`
          : `${process.env.REACT_APP_API_URL}/api/alumnos/${idPersonaFinal}`;
        
        const methodAlumno = esNuevoAlumno ? 'POST' : 'PUT';
        datosAlumno.id_persona = Number(idPersonaFinal);

        const resAlumno = await fetch(urlAlumno, {
          method: methodAlumno,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(datosAlumno)
        });

        if (!resAlumno.ok) {
          const errAlumno = await resAlumno.json().catch(() => ({}));
          throw new Error(`Error en datos de Alumno: ${errAlumno.error || errAlumno.mensaje || 'No se pudo guardar la información escolar.'}`);
        }

        // 4. Guardar SOLO Allegados NUEVOS (OPCIÓN A APLICADA)
        if (allegados && allegados.length > 0) {
          
          // 🎯 FILTRADO EXCLUSIVO: ignora las filas ya persistidas previamente
          const allegadosNuevos = allegados.filter(all => {
            const esTemporal = String(all.id_persona).startsWith('temp-');
            return all.esNuevo || esTemporal;
          });

          if (allegadosNuevos.length > 0) {
            const promesasAllegados = allegadosNuevos.map(async (all) => {
              
              const urlAllegado = `${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores`;

              // Helper para convertir enteros o retornar null limpia y explícitamente
              const parseOrNull = (val) => {
                const n = Number(val);
                return isNaN(n) || n === 0 ? null : n;
              };

              const payloadAllegado = {
                id_persona: parseOrNull(all.id_persona_real || all.id_persona),
                id_alumno: Number(pers.id_alumno),
                id_tipo_allegado: parseOrNull(all.id_tipo_allegado || all.nombre),
                id_estudio_alcanzado: parseOrNull(all.id_estudio_alcanzado || all.id_nivel_estudio || all.nivel_estudio_tutor),
                id_ocupacion: parseOrNull(all.id_ocupacion || all.ocupacion_tutor),
                tutor: all.tutor || 'S',
                activo: all.activo || 'S'
              };

              const resAllegado = await fetch(urlAllegado, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payloadAllegado)
              });

              if (!resAllegado.ok) {
                const errAllegado = await resAllegado.json().catch(() => ({}));
                throw new Error(`Fallo al insertar allegado: ${errAllegado.error || errAllegado.mensaje || ''}`);
              }
            });

            await Promise.all(promesasAllegados);
          }
        }
      }

      notificar(isEditMode ? '¡Datos, documentos, alumno y allegados actualizados!' : '¡Registro completo guardado con éxito!', 'exito');
      navigate('/personas/abm'); 

    } catch (error) {
      console.error('Error en el proceso de guardado:', error); 
      alert('Hubo un problema al procesar el guardado:\n' + error.message);
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

        {(pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) ? (
          <button 
            onClick={() => setSubSolapaActiva('alumnos')} 
            style={subSolapaActiva === 'alumnos' ? styles.activeSubTab : styles.subTab}
          >
            Datos Alumno
          </button>
        ) : isEditMode && (
          <button 
            onClick={() => setSubSolapaActiva('alumnosTutor')} 
            style={subSolapaActiva === 'alumnosTutor' ? styles.activeSubTab : styles.subTab}
          >
            Alumnos Vinculados
          </button>
        )}    

        {(pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) && (
          <button 
            onClick={() => setSubSolapaActiva('alumnoAllegados')} 
            style={subSolapaActiva === 'alumnoAllegados' ? styles.activeSubTab : styles.subTab}
          >
            Allegados {pers.allegados.length > 0 && `(${pers.allegados.length})`}
          </button>
        )}  

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
        {subSolapaActiva === 'alumnos' && (pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px' }}>
            <ItemPersonaAlumnoDetailAlta 
              formData={pers} 
              handleChange={handleChange} 
            />          
          </div>
        )}

        {subSolapaActiva === 'alumnosTutor' && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px' }}>
           <ItemListTutorAlumnos
              id={id || pers.id_persona} 
            />          
          </div>
        )}

        {subSolapaActiva === 'alumnoAllegados' && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px' }}>
            <ItemListAlumnoAllegados
              allegados={pers.allegados}
              setAllegados={setAllegadosGlobal}
              onEliminarAllegado={eliminarAllegadoBackend}
              onRecargar={() => obtenerAllegados(id || pers.id_persona)}
            />          
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
        <button onClick={grabar} type="button" className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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