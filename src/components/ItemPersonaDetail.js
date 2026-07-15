import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from './Spinner';
import ItemDetailPersonaDocumentoAlta from './ItemPersonaDocumentoDetailAlta'; 
import ItemPersonaAlumnoDetailAlta from './ItemPersonaAlumnoDetailAlta'; 
import ItemListTutorAlumnos from "./ItemListTutorAlumnos.js";
import { avisar } from "../utils/notificaciones.js";
import ItemListAlumnoAllegados from "./ItemListAlumnoAllegados.js";
//import ItemListAlumnoAcademica from "./ItemListAlumnoAcademica.js";


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

// 📥 FUNCIÓN CENTRAL DE GUARDADO CON AUDITORÍA PASO A PASO
  const grabar = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    //alert("PASO 1: Presionaste guardar. Iniciando validaciones...");

    try {
      const token = localStorage.getItem('token'); 

      // 1. Validar campos obligatorios básicos de la Persona
      if (!pers.apellidos || !pers.nombres || !pers.id_sexo || !pers.fecha_nacimiento || !pers.correo_electronico || !pers.telefono) {
          //alert("FRENADO EN PASO 1: Falta algún campo básico de Persona");
          avisar.advertencia("⚠️ Error: ¡Por favor, completa todos los campos obligatorios en la solapa de Datos de la Persona!", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      // 2. Validar "Es alumno"
      if (pers.es_alumno === undefined || pers.es_alumno === null || String(pers.es_alumno).trim() === '') {
          //alert("FRENADO EN PASO 2: El campo 'es_alumno' está vacío");
          notificar("⚠️ Error: Selecciona una opción en el campo 'Es alumno' (Sí / No) antes de continuar.", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      const esAlumno = String(pers.es_alumno).toUpperCase() === 'S' || pers.es_alumno === true || pers.es_alumno === 1 || Boolean(pers.legajo);

      if (!esAlumno && (String(pers.usuario || '').trim() === '')) {
          //alert("FRENADO EN PASO 2.B: No es alumno y falta el usuario");
          notificar("⚠️ Error: Debe ingresar un valor de Usuario antes de continuar.", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      // 3. Validar Formatos
      if (emailError || phoneError) { 
        //alert("FRENADO EN PASO 3: Hay error en formato de Email o Teléfono");
        notificar("⚠️ Error: Corrige los errores de formato (Email o Teléfono) antes de guardar.", 'error');
        setSubSolapaActiva('alta');
        return;
      }

      // 4. Validar Documentos
      if (!pers.documentos || pers.documentos.length === 0) {
        //alert("FRENADO EN PASO 4: La lista pers.documentos está vacía");
        notificar("⚠️ Error: Debes ir a la solapa 'Documentos' y agregar al menos un Documento a la grilla antes de continuar.", 'advertencia');
        setSubSolapaActiva('documentos');
        return;
      }

      // Validar datos de Alumno si corresponde
      if (esAlumno) {
        if (!pers.legajo || !pers.extranjero || !pers.regular || !pers.es_celiaco || !pers.direccion_calle || !pers.direccion_numero) {
          //alert("FRENADO EN PASO 5: Faltan datos obligatorios del Alumno (Legajo, Calle, etc)");
          notificar("⚠️ Error: ¡Por favor, completa todos los datos obligatorios del Alumno!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }

        const esNoRegular = pers.regular === 'N' || pers.regular === 'n' || pers.regular === false || pers.regular === 0;
        if (esNoRegular && (!pers.id_motivo_desercion || String(pers.id_motivo_desercion).trim() === '')) {
          alert("FRENADO EN PASO 5.B: Alumno no regular sin motivo de deserción");
          notificar("⚠️ Error: El alumno no es regular. ¡Debes seleccionar un Motivo de Deserción!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }
      }

      
// =========================================================================
  // VALIDADOR ESTRICTO CON TOASTIFY: OBLIGATORIEDAD DE ALLEGADOS
  // =========================================================================

  const allegadosParaValidar = pers?.allegados;

  if (!allegadosParaValidar || allegadosParaValidar.length === 0) {
    // 1. Mostrar la alerta flotante de advertencia
    avisar.advertencia('Debe ingresar obligatoriamente al menos un allegado antes de registrar al alumno.');
    
    // 2. Redirigir inmediatamente a la pestaña de Allegados
    // (Reemplazá el 2 por el índice de tu pestaña de Allegados si es necesario)
    setSubSolapaActiva('alumnoAllegados'); 
    
    return; // Frena la grabación
  }

  // =========================================================================
  // VALIDADOR DETALLADO: CAMPOS REQUERIDOS DENTRO DE LOS ALLEGADOS
  // =========================================================================
  const allegadosIncompletos = allegadosParaValidar.filter(all => {
    const tieneTipo = Boolean(all.id_tipo_allegado || all.id_parentesco);
    const tienePersona = Boolean(all.id_persona || all.id_persona_real);
    return !tieneTipo || !tienePersona;
  });

  if (allegadosIncompletos.length > 0) {
    avisar.advertencia('Por favor, complete los campos obligatorios (Parentesco y Persona) de todos los allegados.');
    
    // Redirigir inmediatamente a la pestaña de Allegados
    setSubSolapaActiva('alumnoAllegados'); 
    
    return; // Frena la grabación
  }



      //alert("PASO 6: Pasó todas las validaciones. Iniciando guardado en Backend...");
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

      // 1. Persona
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
        idPersonaFinal = resultadoPersona.id_persona || resultadoPersona.id || (resultadoPersona.rows && resultadoPersona.rows[0]?.id_persona);
      }
      if (!idPersonaFinal) idPersonaFinal = id;

      //alert("PASO 7: Persona guardada con éxito (ID: " + idPersonaFinal + "). Guardando documentos...");

// ==========================================
      // 2. DOCUMENTOS (CORREGIDO)
      // ==========================================
      const promesasDocumentos = documentos.map(async (doc) => {
        const idRelacionDoc = doc.id_persona_tipo_documento || doc.id_documento || doc.id;
        
        // Un documento es temporalmente nuevo si:
        // - No tiene ID de relación.
        // - Su ID de relación es un timestamp de JavaScript (Date.now() es mayor a 1000000000000).
        // - O si no estamos en modo edición de persona.
        const esNuevoDocumento = 
          !isEditMode || 
          !idRelacionDoc || 
          Number(idRelacionDoc) > 1000000000000; 

        const urlDoc = esNuevoDocumento
          ? `${process.env.REACT_APP_API_URL}/api/documentos`
          : `${process.env.REACT_APP_API_URL}/api/documentos/${idRelacionDoc}`;

        const metodo = esNuevoDocumento ? 'POST' : 'PUT';

        // Armamos el payload limpio para enviar al backend
        const payloadDoc = {
          id_persona: Number(idPersonaFinal), 
          id_tipo_documento: Number(doc.id_tipo_documento),
          numero: String(doc.numero).trim(),
          activo: doc.activo || 'S'
        };

        // Si es una edición real en el backend, le mandamos el ID intermedio de la tabla pivote
        if (!esNuevoDocumento) {
          payloadDoc.id_persona_tipo_documento = Number(idRelacionDoc);
        }

        const resDoc = await fetch(urlDoc, {
          method: metodo,
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payloadDoc)
        });

        if (!resDoc.ok) {
          const errBody = await resDoc.json().catch(() => ({}));
          throw new Error(`Error al guardar documento (${metodo}): ${errBody.error || errBody.mensaje || resDoc.statusText}`);
        }

        return resDoc;
      });

      await Promise.all(promesasDocumentos);

      //alert("PASO 8: Documentos guardados. ¿Es alumno?: " + esAlumno);

// ------------------------------------------------------------------
      // 3. GUARDAR / ACTUALIZAR ALUMNO Y OBTENER SU id_alumno REAL
      // ------------------------------------------------------------------
      let idAlumnoFinal = null;

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

        const resultadoAlumno = await resAlumno.json().catch(() => ({}));

        if (!resAlumno.ok) {
          throw new Error(`Error en datos de Alumno: ${resultadoAlumno.error || resultadoAlumno.mensaje || 'No se pudo guardar la información escolar.'}`);
        }

        // Extraer el id_alumno devuelto por la API o del estado/formulario
        idAlumnoFinal = 
          resultadoAlumno.id_alumno || 
          resultadoAlumno.id || 
          (resultadoAlumno.data && resultadoAlumno.data.id_alumno) ||
          pers.id_alumno || 
          todo.id_alumno;

        // Si es un PUT y la API no lo devuelve en la respuesta, usamos el de la propiedad
        if (!idAlumnoFinal && isEditMode) {
          idAlumnoFinal = pers.id_alumno || todo.id_alumno;
        }

        //console.log(`✅ ID Persona: ${idPersonaFinal} | ID Alumno confirmado: ${idAlumnoFinal}`);

        if (!idAlumnoFinal) {
          throw new Error("Se guardó el alumno pero no se pudo obtener el 'id_alumno' (ID 135) para vincular los allegados.");
        }

        // ------------------------------------------------------------------
        // 4. GUARDAR / ACTUALIZAR ALLEGADOS (POST Y PUT)
        // ------------------------------------------------------------------


        if (allegados && allegados.length > 0) {
          
// REEMPLAZAR LA FUNCIÓN EN ItemPersonaDetail.js (alrededor de la línea 488)
const parseIdPersona = (item) => {
  if (!item) return null;

  // Priorizar id_persona o id_persona_real
  const posiblesIds = [
    item.id_persona,
    item.id_persona_real,
    item.id_persona_allegado,
    item.id_persona_tutor,
    item.idPersona
  ];

  for (const val of posiblesIds) {
    if (val !== undefined && val !== null) {
      const sVal = String(val).trim();
      // Ignoramos cadenas 'temp-...' pero extraemos el número válido
      if (!sVal.startsWith('temp-') && !isNaN(Number(sVal)) && Number(sVal) > 0) {
        return Number(sVal);
      }
    }
  }
  return null;
};

 
          // Helper auxiliar dentro de la función de guardado para extraer el ID correcto
          const resolverId = (val1, val2, val3) => {
            const n = Number(val1 || val2 || val3);
            return isNaN(n) || n === 0 ? null : n;
          };

// En ItemPersonaDetail.js dentro de la función grabar()

// Un allegado es NUEVO (POST) si tiene la marca esNuevo, su id empieza con 'temp-' o NO tiene ID de relación previo
/*const allegadosNuevos = allegados.filter(all => 
  all.esNuevo || 
  String(all.id_persona || '').startsWith('temp-') || 
  !all.id_alumno_tutor
);

// Un allegado es EXISTENTE (PUT) si tiene id_alumno_tutor asignado y NO es una fila nueva
const allegadosExistentes = allegados.filter(all => 
  !all.esNuevo && 
  !String(all.id_persona || '').startsWith('temp-') && 
  Boolean(all.id_alumno_tutor)
);*/

// ==========================================
// CLASIFICACIÓN CORREGIDA DE ALLEGADOS (POST vs PUT)
// ==========================================

// Un allegado es NUEVO (POST) si tiene la marca esNuevo, su id empieza con 'temp-' 
// o si verdaderamente NO posee ningún ID de relación previo con la base de datos.
const allegadosNuevos = allegados.filter(all => {
  const tieneRelacionPrevia = Boolean(all.id_alumno_tutor || all.id_persona_allegado || all.id_alumno_tutores);
  return all.esNuevo || String(all.id_persona || '').startsWith('temp-') || !tieneRelacionPrevia;
});

// Un allegado es EXISTENTE (PUT) si no es nuevo y posee un ID de relación previo.
const allegadosExistentes = allegados.filter(all => {
  const tieneRelacionPrevia = Boolean(all.id_alumno_tutor || all.id_persona_allegado || all.id_alumno_tutores);
  const esTemporal = String(all.id_persona || '').startsWith('temp-');
  return !all.esNuevo && !esTemporal && tieneRelacionPrevia;
});

          // A) ALTAS (POST)
          for (const all of allegadosNuevos) {
            const idP = parseIdPersona(all);

            if (!idP) {
              throw new Error(`Uno de los allegados nuevos no tiene un ID de persona válido asignado.`);
            }

            const payloadPost = {
              id_persona: idP,
              id_alumno: Number(idAlumnoFinal),
              // Resolvemos todas las posibles variaciones de nombres de campos que vienen del backend
              id_tipo_allegado: resolverId(all.id_tipo_allegado, all.id_parentesco, all.id_tipo_parentesco),
              id_estudio_alcanzado: resolverId(all.id_estudio_alcanzado, all.id_nivel_estudio, all.id_estudio),
              id_ocupacion: resolverId(all.id_ocupacion, all.id_ocupacion_tutor),
              tutor: all.tutor || all.Tutor || 'S',
              activo: all.activo || 'S'
            };

            const resPost = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payloadPost)
            });

            if (!resPost.ok) {
              const errBody = await resPost.json().catch(() => ({}));
              throw new Error(`Error al INSERTAR allegado (POST): ${errBody.error || errBody.message || errBody.mensaje || resPost.statusText}`);
            }
          }

          // B) ACTUALIZACIONES (PUT)
          for (const all of allegadosExistentes) {
            const idRelacion = all.id_alumno_tutor || all.id_persona_allegado || all.id_alumno_tutores || all.id;

            // 🎯 SI LA FILA NO FUE EDITADA CON EL LÁPIZ, RESOLVEMOS SUS IDs BUSCANDO POR TEXTO EN LOS CATÁLOGOS/FILA
            // Si ya existía el id numérico (porque editó la fila) se usa, sino lo busca o rescata de la respuesta
            const idTipoAllegadoFinal = all.id_tipo_allegado || all.id_parentesco || null;
            const idEstudioFinal = all.id_estudio_alcanzado || all.id_nivel_estudio || all.id_estudio || null;
            const idOcupacionFinal = all.id_ocupacion || null;

            const payloadPut = {
              id_alumno_tutor: idRelacion ? Number(idRelacion) : undefined,
              id_persona: Number(all.id_persona),
              id_alumno: Number(idAlumnoFinal),
              
              // Si no presionaron el lápiz, idTipoAllegadoFinal será null pero enviamos los fallback numéricos o buscados:
              id_tipo_allegado: idTipoAllegadoFinal ? Number(idTipoAllegadoFinal) : null,
              id_estudio_alcanzado: idEstudioFinal ? Number(idEstudioFinal) : null,
              id_ocupacion: idOcupacionFinal ? Number(idOcupacionFinal) : null,
              
              tutor: all.tutor || all.Tutor || 'S',
              activo: all.activo || 'S'
            };

            const urlPut = idRelacion 
              ? `${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores/${idRelacion}`
              : `${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores`;

            const resPut = await fetch(urlPut, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payloadPut)
            });

            if (!resPut.ok) {
              const errBody = await resPut.json().catch(() => ({}));
              throw new Error(`Error al ACTUALIZAR allegado (PUT): ${errBody.error || errBody.message || errBody.mensaje || resPut.statusText}`);
            }
          }
        }
      }

      //alert("PASO FINAL: ¡Guardado completado exitosamente!");
      avisar.exito("¡Los datos se han guardado con éxito!");

      navigate('/personas/abm'); 

    } catch (error) {
      alert("❌ ERROR EN EL PROCESO DE GUARDADO: " + error.message);
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

   {/*     {(pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) && (
          <button 
            onClick={() => setSubSolapaActiva('alumnoAcademica')} 
            style={subSolapaActiva === 'alumnoAcademica' ? styles.activeSubTab : styles.subTab}
          >
            Gestión Académica {pers.allegados.length > 0 && `(${pers.allegados.length})`}
          </button>
        )}  
     */}  
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

    {/*    {subSolapaActiva === 'alumnoAcademica' && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px' }}>
            <ItemListAlumnoAcademica
              allegados={pers.allegados}
              setAllegados={setAllegadosGlobal}
              onEliminarAllegado={eliminarAllegadoBackend}
              onRecargar={() => obtenerAllegados(id || pers.id_persona)}
            />          
          </div>
        )} */}
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