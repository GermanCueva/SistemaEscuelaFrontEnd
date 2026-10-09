import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from './Spinner';
import ItemDetailPersonaDocumentoAlta from './ItemPersonaDocumentoDetailAlta'; 
import ItemPersonaAlumnoDetailAlta from './ItemPersonaAlumnoDetailAlta'; 
import ItemListTutorAlumnos from "./ItemListTutorAlumnos.js";
import { avisar } from "../utils/notificaciones.js";
import ItemListAlumnoAllegados from "./ItemListAlumnoAllegados.js";
import ItemListAlumnoAcademica from "./ItemListAlumnoAcademica.js";
import ItemListAlumnoFormaPago from "./ItemListAlumnoFormaPago.js";
import { useRol } from "./useRole.js";

const initialPersState = {
  apellidos: '', nombres: '', id_sexo: '', fecha_nacimiento: '',
  correo_electronico: '', recibe_notif_x_correo: '', telefono: '',
  id_localidad_nacimiento: '', id_localidad_residencia: '',
  id_nacionalidad: '', activo: 'S', es_alumno: 'S', usuario: 'S/U',
  legajo: '', extranjero: '', regular: '', id_motivo_desercion: '',
  es_celiaco: '', direccion_calle: '', direccion_numero: '',
  direccion_piso: '', direccion_depto: '',
  documentos: [], allegados: [], academica: [], formasPago: []
};

const ItemDetailPersona = () => {
  const { esSoloLectura } = useRol();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id) && id !== "alta" && id !== "undefined";

  const [subSolapaActiva, setSubSolapaActiva] = useState('alta');
  const [localidades, setLocalidades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); 
  
  const [hasAlumnoRecord, setHasAlumnoRecord] = useState(false);

  // Estados para Búsqueda previa por DNI
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [esPersonaExistente, setEsPersonaExistente] = useState(false);
  
  // 🛑 Estado de Bloqueo si YA es alumno en ESTE establecimiento
  const [yaEsAlumnoEnEstaEscuela, setYaEsAlumnoEnEstaEscuela] = useState(null);

  const [sexos, setSexos] = useState([]);
  const [pers, setPers] = useState(initialPersState);

  useEffect(() => {
    setSubSolapaActiva('alta');
  }, [id]);

  useEffect(() => {
    const fetchSexos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/sexo`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Error al obtener los tipos de sexo");
        const data = await res.json();
        setSexos(data);
      } catch (error) {
        console.error("Error cargando sexos:", error);
      }
    };
    fetchSexos();
  }, []);

  const notificar = (mensaje, tipo = 'advertencia') => {
    try {
      if (avisar && typeof avisar[tipo] === 'function') {
        avisar[tipo](mensaje);
      } else {
        avisar.advertencia(mensaje);
      }
    } catch (e) {
      avisar.error(mensaje);
    }
  };

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

  const obtenerFormasPago = useCallback(async (idAlumno) => {
    if (!idAlumno) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/${idAlumno}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPers(prev => ({ ...prev, formasPago: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error("Error al obtener formas de pago:", err);
    }
  }, []);

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
          let idAlumnoReal = null;

          if (dataAlumno) {
            const alumnoObj = Array.isArray(dataAlumno) ? dataAlumno[0] : dataAlumno.data || dataAlumno;
            if (alumnoObj) {
              datosAlumno = alumnoObj;
              idAlumnoReal = alumnoObj.id_alumno || alumnoObj.id;
              setHasAlumnoRecord(true);
            }
          }

          setPers(prev => ({
            ...prev,
            ...dataPersona[0],
            ...datosAlumno,
            documentos: misDocs,
            allegados: misAllegados,
            academica: prev.academica
          }));

          if (idAlumnoReal) {
            obtenerFormasPago(idAlumnoReal);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error obteniendo datos completos de la persona:", err);
        setIsLoading(false);
      });
    }
  }, [id, isEditMode, obtenerFormasPago]);

  // 🔍 BÚSQUEDA Y VALIDACIÓN DE DUPLICADOS EN ESTA ESCUELA
  const buscarPersonaPorDni = async () => {
    if (!dniBusqueda || dniBusqueda.trim().length < 3) {
      avisar.advertencia("Por favor, ingrese un número de documento válido para buscar.");
      return;
    }

    setBuscandoDni(true);
    setYaEsAlumnoEnEstaEscuela(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/apellidodocumento/${encodeURIComponent(dniBusqueda.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error en la consulta al servidor");

      const data = await res.json();
      const listaPersonas = Array.isArray(data) ? data : (data.data || []);

      const personaEncontrada = listaPersonas.find(p => {
        const dniStr = String(p.numero_dni || p.numero || p.dni || p.nro_documento || p.documento || '').trim();
        return dniStr === String(dniBusqueda.trim());
      }) || listaPersonas[0];

      if (personaEncontrada) {
        const targetId = personaEncontrada.id_persona || personaEncontrada.id;

        // Consultamos simultáneamente los datos personales y la existencia de alumno en este establecimiento
        const [dataPersonaComplete, dataDocs, dataAlumno, dataAllegados] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()),
          fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).catch(() => []),
          fetch(`${process.env.REACT_APP_API_URL}/api/alumnos/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutoresId/${targetId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).catch(() => [])
        ]);

        // Verificamos si YA posee un legajo/registro de alumno en esta escuela logueada
        let alumnoExistente = null;
        if (dataAlumno) {
          const objAlumno = Array.isArray(dataAlumno) ? dataAlumno[0] : (dataAlumno.data || dataAlumno);
          if (objAlumno && (objAlumno.id_alumno || objAlumno.id || objAlumno.legajo)) {
            alumnoExistente = objAlumno;
          }
        }

        // 🛑 CASO A: LA PERSONA YA ES ALUMNO EN ESTA MISMA ESCUELA -> BLOQUEO
        if (alumnoExistente) {
          const basePersona = (dataPersonaComplete && dataPersonaComplete.length > 0) ? dataPersonaComplete[0] : personaEncontrada;
          setYaEsAlumnoEnEstaEscuela({
            id_persona: targetId,
            nombreCompleto: `${basePersona.apellidos} ${basePersona.nombres}`,
            legajo: alumnoExistente.legajo || 'S/D'
          });

          setEsPersonaExistente(false);
          avisar.advertencia(`⚠️ La persona ya está registrada como alumno en este establecimiento (Legajo: ${alumnoExistente.legajo || 'S/D'}).`);
          return;
        }

        // 🟢 CASO B: EXISTE GLOBALMENTE PERO NO ES ALUMNO EN ESTA ESCUELA -> PERMITIR VINCULAR
        const basePersona = (dataPersonaComplete && dataPersonaComplete.length > 0) ? dataPersonaComplete[0] : personaEncontrada;
        const misDocs = Array.isArray(dataDocs) ? dataDocs : dataDocs.docs || dataDocs.data || [];
        const misAllegados = Array.isArray(dataAllegados) ? dataAllegados : [];

        setPers({
          ...initialPersState,
          ...basePersona,
          id_persona: targetId,
          documentos: misDocs,
          allegados: misAllegados,
          es_alumno: 'S',
          legajo: '', extranjero: '', regular: '', id_motivo_desercion: '',
          es_celiaco: '', direccion_calle: '', direccion_numero: '',
          direccion_piso: '', direccion_depto: '',
          academica: [], formasPago: []
        });

        setEsPersonaExistente(true);
        setHasAlumnoRecord(false);

        avisar.exito("¡Persona encontrada! Se cargaron sus datos filiatorios. Complete los Datos del Alumno para matricularlo.");
        setSubSolapaActiva('alumnos');
      } else {
        // ⚪ CASO C: NO EXISTE EN EL SISTEMA -> ALTA TOTAL DESDE CERO
        avisar.advertencia("No se encontró la persona por documento. Puede continuar con la carga del nuevo registro.");
        setEsPersonaExistente(false);
      }
    } catch (err) {
      console.error("Error buscando persona por DNI:", err);
      avisar.error("Ocurrió un error al consultar la base de datos.");
    } finally {
      setBuscandoDni(false);
    }
  };

  const limpiarBusquedaExistente = () => {
    setEsPersonaExistente(false);
    setYaEsAlumnoEnEstaEscuela(null);
    setDniBusqueda('');
    setPers(initialPersState);
    setSubSolapaActiva('alta');
  };

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
        return { ...prev, [name]: value, usuario: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleChangeEmail = (e) => {
    handleChange(e); 
    const v = e.target.value; 
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\$/; 
    setEmailError(v !== "" && !regexEmail.test(v) ? "Formato de correo inválido." : ""); 
  };

  const handleChangePhone = (e) => {
    handleChange(e); 
    const v = e.target.value.trim(); 
    const regexPhone = /^\+?[0-9\s()-]{7,15}\$/; 
    setPhoneError(v !== "" && !regexPhone.test(v) ? "Formato de teléfono inválido." : ""); 
  };

  const setDocumentosGlobal = (nuevosDocumentos) => {
    setPers(prev => ({ ...prev, documentos: nuevosDocumentos }));
  };

  const setAcademicaGlobal = useCallback((nuevosDatosAcademicos) => {
    setPers(prev => ({ ...prev, academica: nuevosDatosAcademicos }));
  }, []);

  const setFormasPagoGlobal = useCallback((nuevasFormas) => {
    setPers(prev => ({ ...prev, formasPago: nuevasFormas }));
  }, []);

  const setAllegadosGlobal = (nuevaListaOFunction) => {
    setPers(prev => {
      const allegadosActuales = Array.isArray(prev.allegados) ? prev.allegados : [];
      const resultado = typeof nuevaListaOFunction === 'function' 
        ? nuevaListaOFunction(allegadosActuales)
        : nuevaListaOFunction;

      const nuevaListaBruta = Array.isArray(resultado) ? resultado : [];
      const listaSinDuplicados = [];
      const idsVistos = new Set();

      for (const item of nuevaListaBruta) {
        if (!item) continue;
        const idPersonaUnico = String(item.id_persona_real || item.id_persona || '');

        if (idPersonaUnico) {
          if (idsVistos.has(idPersonaUnico)) {
            notificar('⚠️ Esta persona ya se encuentra agregada en la lista de allegados.', 'advertencia');
            continue; 
          }
          idsVistos.add(idPersonaUnico);
        }
        listaSinDuplicados.push(item);
      }

      return { ...prev, allegados: listaSinDuplicados };
    });
  };

  const eliminarDocumentoBackend = async (idDocumento) => {
    const token = localStorage.getItem('token');
    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/documentos/${idDocumento}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || 'No se pudo eliminar el documento.');
      }

      avisar.advertencia('¡Documento eliminado correctamente de la base de datos!', 'exito');
      return true;
    } catch (error) {
      console.error('Error al eliminar el documento:', error);
      avisar.error('Hubo un problema al eliminar el documento:\n' + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarAllegadoBackend = async (idPersonaAllegado) => {
    const token = localStorage.getItem('token');
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar permanentemente este allegado?");
    if (!confirmar) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores/${idPersonaAllegado}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || "Error al eliminar de la base de datos.");
      }

      setPers(prev => ({
        ...prev,
        allegados: (prev.allegados || []).filter(item => 
          item.id_persona_allegado !== idPersonaAllegado && item.id_persona !== idPersonaAllegado
        )
      }));

      avisar.advertencia('¡Allegado eliminado correctamente!', 'exito');
    } catch (error) {
      console.error("Error al eliminar allegado:", error);
      avisar.error("Ocurrió un error al eliminar:\n" + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarAcademicaBackend = async (idAcademica) => {
    if (!idAcademica || String(idAcademica).startsWith('temp-')) {
      setPers(prev => ({
        ...prev,
        academica: (prev.academica || []).filter(item => item.id_academica !== idAcademica && item.id !== idAcademica)
      }));
      return true;
    }

    const token = localStorage.getItem('token');
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar permanentemente este registro académico?");
    if (!confirmar) return false;

    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/academica/${idAcademica}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || "Error al eliminar de la base de datos.");
      }

      setPers(prev => ({
        ...prev,
        academica: (prev.academica || []).filter(item => item.id_academica !== idAcademica && item.id !== idAcademica)
      }));

      avisar.advertencia('¡Registro académico eliminado correctamente!', 'exito');
      return true;
    } catch (error) {
      console.error("Error al eliminar registro académico:", error);
      avisar.error("Ocurrió un error al eliminar:\n" + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const eliminarFormaPagoBackend = async (idFormaPago) => {
    if (!idFormaPago || String(idFormaPago).startsWith('temp-')) {
      setPers(prev => ({
        ...prev,
        formasPago: (prev.formasPago || []).filter(item => item.id_forma_pago !== idFormaPago && item.id !== idFormaPago)
      }));
      return true;
    }

    const token = localStorage.getItem('token');
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar permanentemente esta forma de pago?");
    if (!confirmar) return false;

    try {
      setIsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/pagos/${idFormaPago}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || "Error al eliminar la forma de pago.");
      }

      setPers(prev => ({
        ...prev,
        formasPago: (prev.formasPago || []).filter(item => item.id_forma_pago !== idFormaPago && item.id !== idFormaPago)
      }));

      avisar.advertencia('¡Forma de pago eliminada correctamente!', 'exito');
      return true;
    } catch (error) {
      console.error("Error al eliminar forma de pago:", error);
      avisar.error("Ocurrió un error al eliminar:\n" + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const grabar = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevención de seguridad adicional
    if (yaEsAlumnoEnEstaEscuela) {
      avisar.advertencia("No se puede guardar: Este alumno ya pertenece a este establecimiento.");
      return;
    }

    try {
      const token = localStorage.getItem('token'); 

      if (!pers.apellidos || !pers.nombres || !pers.id_sexo || !pers.fecha_nacimiento || !pers.correo_electronico || !pers.telefono) {
          avisar.advertencia("⚠️ Error: ¡Por favor, completa todos los campos obligatorios en la solapa de Datos de la Persona!", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      if (pers.es_alumno === undefined || pers.es_alumno === null || String(pers.es_alumno).trim() === '') {
          notificar("⚠️ Error: Selecciona una opción en el campo 'Es alumno' (Sí / No) antes de continuar.", 'advertencia');
          setSubSolapaActiva('alta');
          return;
      }

      const esAlumno = String(pers.es_alumno).toUpperCase() === 'S' || pers.es_alumno === true || pers.es_alumno === 1 || Boolean(pers.legajo);

      if (emailError || phoneError) { 
        notificar("⚠️ Error: Corrige los errores de formato (Email o Teléfono) antes de guardar.", 'error');
        setSubSolapaActiva('alta');
        return;
      }

      if (!pers.documentos || pers.documentos.length === 0) {
        notificar("⚠️ Error: Debes ir a la solapa 'Documentos' y agregar al menos un Documento a la grilla antes de continuar.", 'advertencia');
        setSubSolapaActiva('documentos');
        return;
      }

      if (esAlumno) {
        if (!pers.legajo || !pers.extranjero || !pers.regular || !pers.es_celiaco || !pers.direccion_calle || !pers.direccion_numero) {
          notificar("⚠️ Error: ¡Por favor, completa todos los datos obligatorios del Alumno!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }

        const esNoRegular = pers.regular === 'N' || pers.regular === 'n' || pers.regular === false || pers.regular === 0;
        if (esNoRegular && (!pers.id_motivo_desercion || String(pers.id_motivo_desercion).trim() === '')) {
          notificar("⚠️ Error: El alumno no es regular. ¡Debes seleccionar un Motivo de Deserción!", 'advertencia');
          setSubSolapaActiva('alumnos');
          return;
        }
      }

      const allegadosParaValidar = pers?.allegados || [];
      if (esAlumno && allegadosParaValidar.length === 0) {
        avisar.advertencia('Debe ingresar obligatoriamente al menos un allegado antes de registrar al alumno.');
        setSubSolapaActiva('alumnoAllegados');
        return;
      }

      const academicaParaValidar = pers?.academica || [];
      const formasPagoParaValidar = pers?.formasPago || [];

      if (esAlumno && academicaParaValidar.length === 0) {
        avisar.advertencia("⚠️ Error: Debe ingresar obligatoriamente al menos un registro en la Gestión Académica.");
        setSubSolapaActiva('alumnoAcademica');
        return;
      }

      if (esAlumno && formasPagoParaValidar.length === 0) {
        avisar.advertencia("⚠️ Error: Debe ingresar obligatoriamente al menos un registro en la Forma de Pago.");
        setSubSolapaActiva('alumnoFormaPago');
        return;
      }

      setIsLoading(true);
      const { documentos, allegados, academica, formasPago, ...todo } = pers;

      const datosAlumno = {
        legajo: todo.legajo, extranjero: todo.extranjero, regular: todo.regular,
        id_motivo_desercion: todo.id_motivo_desercion ? Number(todo.id_motivo_desercion) : null,
        es_celiaco: todo.es_celiaco, direccion_calle: todo.direccion_calle,
        direccion_numero: todo.direccion_numero, direccion_piso: todo.direccion_piso, direccion_depto: todo.direccion_depto
      };

      const datosPersona = { ...todo };
      Object.keys(datosAlumno).forEach(key => delete datosPersona[key]);

      const esEdicionOGlobalExistente = isEditMode || esPersonaExistente;

      if (!esEdicionOGlobalExistente) {
        delete datosPersona.id_persona; 
        delete datosPersona.id; 
      }

      const urlPersona = esEdicionOGlobalExistente 
        ? `${process.env.REACT_APP_API_URL}/api/persons/${pers.id_persona || id}` 
        : `${process.env.REACT_APP_API_URL}/api/persons`;      

      const methodPersona = esEdicionOGlobalExistente ? 'PUT' : 'POST'; 

      const responsePersona = await fetch(urlPersona, {
        method: methodPersona,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datosPersona), 
      });

      const resultadoPersona = await responsePersona.json();
      if (!responsePersona.ok) throw new Error(resultadoPersona.error || resultadoPersona.message || 'No se pudo procesar la persona.');

      let idPersonaFinal = isEditMode ? id : (esPersonaExistente ? pers.id_persona : null);
      if (!idPersonaFinal && resultadoPersona) {
        idPersonaFinal = resultadoPersona.id_persona || resultadoPersona.id || (resultadoPersona.rows && resultadoPersona.rows[0]?.id_persona);
      }

      const promesasDocumentos = documentos.map(async (doc) => {
        const idRelacionDoc = doc.id_persona_tipo_documento || doc.id_documento || doc.id;
        const esNuevoDocumento = !isEditMode || !idRelacionDoc || Number(idRelacionDoc) > 1000000000000; 

        const urlDoc = esNuevoDocumento
          ? `${process.env.REACT_APP_API_URL}/api/documentos`
          : `${process.env.REACT_APP_API_URL}/api/documentos/${idRelacionDoc}`;

        const metodo = esNuevoDocumento ? 'POST' : 'PUT';
        const payloadDoc = {
          id_persona: Number(idPersonaFinal), 
          id_tipo_documento: Number(doc.id_tipo_documento),
          numero: String(doc.numero).trim(), activo: doc.activo || 'S'
        };

        if (!esNuevoDocumento) payloadDoc.id_persona_tipo_documento = Number(idRelacionDoc);

        const resDoc = await fetch(urlDoc, {
          method: metodo,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payloadDoc)
        });

        if (!resDoc.ok) throw new Error(`Error al guardar documento.`);
        return resDoc;
      });

      await Promise.all(promesasDocumentos);

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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(datosAlumno)
        });

        const resultadoAlumno = await resAlumno.json().catch(() => ({}));
        if (!resAlumno.ok) throw new Error(`Error en datos de Alumno.`);

        idAlumnoFinal = resultadoAlumno.id_alumno || resultadoAlumno.id || (resultadoAlumno.data && resultadoAlumno.data.id_alumno) || pers.id_alumno || todo.id_alumno;
        if (!idAlumnoFinal && isEditMode) idAlumnoFinal = pers.id_alumno || todo.id_alumno;

        if (!idAlumnoFinal) throw new Error("No se pudo obtener el 'id_alumno'.");

        if (allegados && allegados.length > 0) {
          const parseIdPersona = (item) => {
            if (!item) return null;
            const posiblesIds = [item.id_persona, item.id_persona_real, item.id_persona_allegado, item.id_persona_tutor, item.idPersona];
            for (const val of posiblesIds) {
              if (val !== undefined && val !== null) {
                const sVal = String(val).trim();
                if (!sVal.startsWith('temp-') && !isNaN(Number(sVal)) && Number(sVal) > 0) return Number(sVal);
              }
            }
            return null;
          };

          const resolverId = (val1, val2, val3) => {
            const n = Number(val1 || val2 || val3);
            return isNaN(n) || n === 0 ? null : n;
          };

          for (const all of allegados) {
            const idP = parseIdPersona(all);
            if (!idP) continue;

            const payloadPost = {
              id_persona: idP, id_alumno: Number(idAlumnoFinal),
              id_tipo_allegado: resolverId(all.id_tipo_allegado, all.id_parentesco, all.id_tipo_parentesco),
              id_estudio_alcanzado: resolverId(all.id_estudio_alcanzado, all.id_nivel_estudio, all.id_estudio),
              id_ocupacion: resolverId(all.id_ocupacion, all.id_ocupacion_tutor),
              tutor: all.tutor || all.Tutor || 'S', activo: all.activo || 'S'
            };

            await fetch(`${process.env.REACT_APP_API_URL}/api/persons/AlumnoTutores`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payloadPost)
            });
          }
        }

        const nuevosCrudos = (academica || []).filter(item => item.esNuevo === true);
        const registrosModificados = (academica || []).filter(item => !item.esNuevo);

        const registrosNuevos = nuevosCrudos.map(item => {
            const { id_academica, esNuevo, ...resto } = item; 
            return { ...resto, id_alumno: idAlumnoFinal };
        });

        if (registrosNuevos.length > 0) {
            const resAcademica = await fetch(`${process.env.REACT_APP_API_URL}/api/academica/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ historialAcademico: registrosNuevos })
            });

            if (!resAcademica.ok) throw new Error("Error procesando los nuevos cambios académicos.");
        }

        if (registrosModificados.length > 0) {
            const modificadosSincronizados = registrosModificados.map(item => ({
                ...item, id_anio_cursada: item.anio_cursada 
            }));

            const resAcademicaPut = await fetch(`${process.env.REACT_APP_API_URL}/api/academica/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ historialAcademico: modificadosSincronizados })
            });

            if (!resAcademicaPut.ok) throw new Error("Error actualizando los cambios académicos existentes.");
        }

        for (const pago of (formasPago || [])) {
          const payloadPost = { ...pago, id_alumno: Number(idAlumnoFinal) };
          delete payloadPost.esNuevo;
          delete payloadPost.id;
          delete payloadPost.id_pago;
          delete payloadPost.id_alumno_tarjeta;
          delete payloadPost.id_forma_pago;

          await fetch(`${process.env.REACT_APP_API_URL}/api/pagos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payloadPost)
          });
        }
      }

      avisar.exito(esPersonaExistente 
        ? "¡Alumno matriculado con éxito en este establecimiento!" 
        : "¡Los datos se han guardado con éxito!"
      );
      navigate('/personas/abm'); 
    } catch (error) {
      avisar.error("❌ ERROR EN EL PROCESO DE GUARDADO: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Pestañas locales */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-100/60 border-b border-gray-200">
        <button onClick={() => setSubSolapaActiva('alta')} style={subSolapaActiva === 'alta' ? styles.activeSubTab : styles.subTab}>
          {isEditMode ? 'Editar Persona' : (esPersonaExistente ? 'Persona Encontrada' : 'Alta de Persona')}
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

        {(pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) && (
          <button 
            onClick={() => setSubSolapaActiva('alumnoAcademica')} 
            style={subSolapaActiva === 'alumnoAcademica' ? styles.activeSubTab : styles.subTab}
          >
            Gestión Académica {pers.academica.length > 0 && `(${pers.academica.length})`}
          </button>
        )}  

        {(pers.es_alumno === 'S' || pers.es_alumno === 's' || pers.es_alumno === true || pers.es_alumno === 1) && (
          <button 
            onClick={() => setSubSolapaActiva('alumnoFormaPago')} 
            style={subSolapaActiva === 'alumnoFormaPago' ? styles.activeSubTab : styles.subTab}
          >
            Formas de Pago {pers.formasPago.length > 0 && `(${pers.formasPago.length})`}
          </button>
        )}  
      </div>

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
            {esPersonaExistente && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-300 text-blue-900 rounded-md text-sm">
                ℹ️ <strong>Matriculando a persona existente:</strong> Complete los datos a continuación para dar de alta la matrícula en este establecimiento.
              </div>
            )}
            <ItemPersonaAlumnoDetailAlta 
              formData={pers} 
              handleChange={handleChange} 
            />          
          </div>
        )}

        {subSolapaActiva === 'alumnosTutor' && (
          <div style={{ padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px' }}>
           <ItemListTutorAlumnos id={id || pers.id_persona} />          
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

        <div style={{ 
          padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px',
          display: subSolapaActiva === 'alumnoAcademica' ? 'block' : 'none'
        }}>
          <ItemListAlumnoAcademica 
            idAlumno={pers.id_alumno} 
            idPersona={id || pers.id_persona} 
            onCambioDatos={setAcademicaGlobal}
            onEliminarBackend={eliminarAcademicaBackend}
          />          
        </div>

        <div style={{ 
          padding: '20px', background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: '4px',
          display: subSolapaActiva === 'alumnoFormaPago' ? 'block' : 'none'
        }}>
          <ItemListAlumnoFormaPago
            idAlumno={pers.id_alumno}
            idPersona={id || pers.id_persona}
            formasPago={pers.formasPago || []}
            onCambioDatos={setFormasPagoGlobal}
            onEliminarBackend={eliminarFormaPagoBackend}
            onRecargar={() => obtenerFormasPago(pers.id_alumno)}
          />   
        </div>
      </div>  
  
      {subSolapaActiva === 'alta' && (
        <div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
          
          {/* 🔍 SECCIÓN DE BÚSQUEDA PREVIA POR DOCUMENTO (Solo en Alta) */}
          {!isEditMode && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <h3 className="font-bold text-blue-900 mb-1">🔍 Verificación previa por Documento</h3>
              <p className="text-xs text-blue-700 mb-3">
                Verifique si la persona ya existe en el sistema global antes de cargar un nuevo registro:
              </p>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Ingrese N° de Documento / DNI..."
                  value={dniBusqueda}
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  className="input input-bordered w-full text-sm bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && buscarPersonaPorDni()}
                />
                <button
                  type="button"
                  onClick={buscarPersonaPorDni}
                  disabled={buscandoDni}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  {buscandoDni ? "Buscando..." : "Buscar"}
                </button>
              </div>

              {/* 🛑 TARJETA DE BLOQUEO: Si YA ES ALUMNO en esta misma escuela */}
              {yaEsAlumnoEnEstaEscuela && (
                <div className="mt-3 p-4 bg-red-50 border border-red-300 text-red-900 rounded-lg text-sm flex flex-col gap-2">
                  <div>
                    ⚠️ <strong>Acción no permitida:</strong> <span>{yaEsAlumnoEnEstaEscuela.nombreCompleto}</span> ya se encuentra registrado como alumno en este establecimiento (Legajo: <strong>{yaEsAlumnoEnEstaEscuela.legajo}</strong>).
                  </div>
                  <div className="flex gap-3 mt-1">
                    <Link to={`/personas/${yaEsAlumnoEnEstaEscuela.id_persona}`}>
                      <button type="button" className="px-3 py-1 bg-red-700 text-white font-semibold rounded text-xs hover:bg-red-800 transition-colors">
                        Ver / Editar Perfil de este Alumno
                      </button>
                    </Link>
                    <button type="button" onClick={limpiarBusquedaExistente} className="text-xs text-gray-600 hover:underline">
                      Limpiar Búsqueda
                    </button>
                  </div>
                </div>
              )}

              {/* 🟢 TARJETA DE CONFIRMACIÓN: Si EXISTE pero NO es alumno en esta escuela */}
              {esPersonaExistente && !yaEsAlumnoEnEstaEscuela && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-sm flex justify-between items-center">
                  <span>
                    ✅ <strong>Persona encontrada:</strong> {pers.apellidos} {pers.nombres}. Se autocompletaron sus datos filiatorios. Complete la pestaña <strong>Datos Alumno</strong> para matricularlo.
                  </span>
                  <button
                    type="button"
                    onClick={limpiarBusquedaExistente}
                    className="text-xs text-red-600 hover:underline font-semibold ml-3"
                  >
                    Limpiar / Nueva Persona
                  </button>
                </div>
              )}
            </div>
          )}

          <fieldset disabled={esSoloLectura || Boolean(yaEsAlumnoEnEstaEscuela)}>
            <div className="mb-8 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800 text-left">
                {esSoloLectura
                  ? 'Ver Perfil de Persona'
                  : isEditMode
                  ? 'Editar Perfil de Persona'
                  : (esPersonaExistente ? 'Vincular Persona Existente' : 'Alta de Persona')}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Apellido:</span>
                  <input type="text" name="apellidos" value={pers.apellidos || ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Nombres:</span>
                  <input type="text" name="nombres" value={pers.nombres || ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Sexo:</span>
                  <select 
                    name="id_sexo" 
                    value={pers.id_sexo || ''} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  >
                    <option value="" disabled>Seleccione una opción</option>
                    {Array.isArray(sexos) && sexos.map((s) => (
                      <option key={s.id_sexo} value={s.id_sexo}>{s.nombre}</option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Fecha de Nacimiento:</span>
                  <input type="date" name="fecha_nacimiento" value={pers.fecha_nacimiento ? pers.fecha_nacimiento.split('T')[0] : ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Email:</span>
                  <input type="email" name="correo_electronico" value={pers.correo_electronico || ''} onChange={handleChangeEmail} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
                  {emailError && <span style={{ color: 'red', fontSize: '12px', display: 'block', textAlign: 'left' }}>{emailError}</span>}
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Recibe Notificaciones por Correo:</span>
                  <select name="recibe_notif_x_correo" value={pers.recibe_notif_x_correo || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="S">Si</option>
                    <option value="N">No</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Teléfono:</span>
                  <input type="text" name="telefono" value={pers.telefono || ''} onChange={handleChangePhone} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }} />
                  {phoneError && <span style={{ color: 'red', fontSize: '12px', display: 'block', textAlign: 'left' }}>{phoneError}</span>}
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Localidad de Nacimiento:</span>
                  <select name="id_localidad_nacimiento" value={pers.id_localidad_nacimiento || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una localidad</option>
                    {localidades.map((loc) => (<option key={loc.id_localidad} value={loc.id_localidad}>{loc.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Localidad de Residencia:</span>
                  <select name="id_localidad_residencia" value={pers.id_localidad_residencia || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una localidad</option>
                    {localidades.map((loc) => (<option key={loc.id_localidad} value={loc.id_localidad}>{loc.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Nacionalidad:</span>
                  <select name="id_nacionalidad" value={pers.id_nacionalidad || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una nacionalidad</option>
                    {nacionalidades.map((nac) => (<option key={nac.id_nacionalidad} value={nac.id_nacionalidad}>{nac.nombre}</option>))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Estado:</span>
                  <select name="activo" value={pers.activo || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="N">Inactivo</option>
                    <option value="S">Activo</option>
                  </select>
                </label>

                <label className="form-control w-full">
                  <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left' }}>Es alumno:</span>
                  <select name="es_alumno" value={pers.es_alumno || ''} onChange={handleChange} className="select select-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px' }}>
                    <option value="" disabled>Seleccione una opción</option>
                    <option value="S">Si</option>
                    <option value="N">No</option>
                  </select>
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* BOTONES GLOBALES */}
      <div className="max-w-4xl mx-auto flex justify-end mt-4 gap-4 px-8">
        {!esSoloLectura && (
          <Link to={'/personas/abm'}>
            <button type="button" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
          </Link>
        )}
        {esSoloLectura && (
          <Link to={'/tutor'}>
            <button type="button" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
          </Link>
        )}
        {!esSoloLectura && !yaEsAlumnoEnEstaEscuela && (
          <button onClick={grabar} type="button" className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isEditMode 
              ? 'Guardar Cambios Totales' 
              : (esPersonaExistente ? 'Vincular y Matricular Alumno' : 'Registrar Persona Completa')
            }
          </button>
        )}
      </div>

    </div>  
  );
};

const styles = {
  subTab: { 
    flex: '1 1 0%', minWidth: 'max-content', padding: '10px 14px', borderRadius: '6px',
    backgroundColor: '#e5e7eb', color: '#374151', fontSize: '13px', fontWeight: '500',
    border: 'none', cursor: 'pointer', textAlign: 'center'
  },
  activeSubTab: { 
    flex: '1 1 0%', minWidth: 'max-content', padding: '10px 14px', borderRadius: '6px',
    backgroundColor: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: '600',
    border: 'none', cursor: 'pointer', textAlign: 'center'
  }
};

export default ItemDetailPersona;