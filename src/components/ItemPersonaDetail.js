import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Spinner from './Spinner';
import FormularioAlta from './ItemPersonaDocumentoDetailAlta'; 

const ItemDetailPersona = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Condición estricta para saber si estamos editando o dando de alta
  const isEditMode = Boolean(id) && id !== "alta" && id !== "undefined";

  const [subSolapaActiva, setSubSolapaActiva] = useState('alta');
  const [localidades, setLocalidades] = useState([]);
  const [nacionalidades, setNacionalidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); 

  // 🌟 SOLUCIÓN AL CRASH: Inicializamos el estado como objeto con campos vacíos.
  // Así nunca dará el error "Cannot read properties of null (reading 'apellidos')"
  const [pers, setPers] = useState({
    apellidos: '', nombres: '', id_sexo: '', fecha_nacimiento: '',
    correo_electronico: '', recibe_notif_x_correo: '', telefono: '',
    id_localidad_nacimiento: '', id_localidad_residencia: '',
    id_nacionalidad: '', activo: '', es_alumno: '', usuario: ''
  });

  // 1. Cargar Catálogos (Se ejecuta siempre)
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
        // Si es Alta nueva, una vez cargados los combos, liberamos la pantalla de inmediato
        if (!isEditMode) {
          setIsLoading(false);
        }
      }
    };
    cargarCatalogos();
  }, [isEditMode]);

  // 2. Cargar Datos del Registro (Sólo en Modo Edición)
  useEffect(() => {
    if (isEditMode) {
      setIsLoading(true);
      const token = localStorage.getItem('token'); 

      fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/${id}`, { 
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            // Reemplazamos las propiedades vacías con los datos reales que vienen de la Base de Datos
            setPers(data[0]); 
          }
          setIsLoading(false); // Apagamos el spinner una vez que los datos impactaron en el estado
        })
        .catch((err) => {
          console.error("Error obteniendo datos de la persona:", err);
          setIsLoading(false);
        });
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPers((prev) => ({ ...prev, [name]: value }));
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

  const grabar = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token'); 

    if (!pers.apellidos || !pers.nombres || !pers.id_sexo || !pers.fecha_nacimiento || !pers.correo_electronico || !pers.recibe_notif_x_correo || !pers.telefono || !pers.id_localidad_nacimiento || !pers.id_localidad_residencia || !pers.id_nacionalidad || !pers.activo || !pers.es_alumno) {
      alert("¡Por favor, completa todos los campos obligatorios!");
      return;
    }

    if (emailError || phoneError) { 
      alert("Corrige los errores de formato antes de guardar.");
      return;
    }

    const datosAEnviar = { ...pers };
    if (!isEditMode) {
      delete datosAEnviar.id_persona; 
      delete datosAEnviar.id; 
    }

    const url = isEditMode 
      ? `${process.env.REACT_APP_API_URL}/api/persons/${id}` 
      : `${process.env.REACT_APP_API_URL}/api/persons`;      

    const method = isEditMode ? 'PUT' : 'POST'; 

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(datosAEnviar), 
      });

      const datos = await response.json();

      if (response.ok) {
        alert(isEditMode ? '¡Usuario actualizado correctamente!' : '¡Persona registrada con éxito!');
        navigate('/personas/abm'); 
      } else {
        alert('Error del servidor: ' + (datos.error || datos.message || 'No se pudo procesar.')); 
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error); 
      alert('Error de red al intentar guardar.');
    }
  };

  // Muestra el Spinner de carga de forma segura mientras espera las APIs asíncronas
  if (isLoading) return <Spinner />;

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Pestañas de Subsolapas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setSubSolapaActiva('alta')} style={subSolapaActiva === 'alta' ? styles.activeSubTab : styles.subTab}>
          {isEditMode ? 'Editar Persona' : 'Alta de Persona'}
        </button>
        <button onClick={() => setSubSolapaActiva('documentos')} style={subSolapaActiva === 'documentos' ? styles.activeSubTab : styles.subTab}>Documentos</button>
        <button onClick={() => setSubSolapaActiva('alumnos')} style={subSolapaActiva === 'alumnos' ? styles.activeSubTab : styles.subTab}>Datos Alumno</button>
      </div>

      <div className="contenido-subsolapa">
        {subSolapaActiva === 'documentos' && <FormularioAlta />} 
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
                  <input type="text" name="usuario" value={pers.usuario || ''} onChange={handleChange} className="input input-bordered w-full" style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }} />
                </label>

                <div className="flex justify-end mt-8 gap-4">
                  <Link to={'/personas/abm'}>
                    <button type="button" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                  </Link>
                  <button onClick={grabar} className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {isEditMode ? 'Guardar Cambios' : 'Registrar Persona'}
                  </button>
                </div>

              </div>
            </div>
        </div>
      )}
    </div>  
  );
};

const styles = {
  subTab: { flex: 1, backgroundColor: '#e0e0e0', color: '#555555', padding: '12px 0', border: 'none', borderRight: '1px solid #cccccc', cursor: 'pointer', fontSize: '14px', textAlign: 'center' },
  activeSubTab: { flex: 1, backgroundColor: '#ffffff', color: '#000000', fontWeight: 'bold', padding: '12px 0', border: 'none', borderRight: '1px solid #cccccc', cursor: 'pointer', fontSize: '14px', textAlign: 'center' }
};

export default ItemDetailPersona;