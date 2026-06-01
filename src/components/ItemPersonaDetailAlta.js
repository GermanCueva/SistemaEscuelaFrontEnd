import { useState, useEffect } from "react";
//import Spinner from './Spinner';
//import { useParams } from "react-router-dom"; //useNavigate
//import { Link } from "react-router-dom";

const ItemDetailPersonaAlta = () => {

  const [subSolapaActiva, setSubSolapaActiva] = useState('alta');
  
  // 1. Creamos un estado único para controlar todos los campos del formulario
  const [formData, setFormData] = useState({
    apellidos: '',
    nombres: '',
    id_sexo: '',
    fecha_nacimiento: '',
    correo_electronico: '',
    recibe_notif_x_correo: '',
    telefono: '',
    id_localidad_nacimiento: '',
    id_localidad_residencia: '',
    id_nacionalidad: '',
    activo: '',
    es_alumno: '',
    usuario: ''
  });

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState(""); 
  
  // 2. Manejador para actualizar el estado cada vez que el usuario escribe
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value // Actualiza dinámicamente el campo correcto
    });
  };

  const handleChangeEmail = (e) => {
  const nuevoValor = e.target.value;
  
  // Primero actualizas tu estado global (lo que ya hacía tu handleChange original)
  handleChange(e); 

  // Luego validas
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (nuevoValor === "") {
    setEmailError(""); // Si está vacío no mostramos error (o sí, si es obligatorio)
  } else if (!regexEmail.test(nuevoValor)) {
    setEmailError("Formato de correo inválido.");
  } else {
    setEmailError(""); // Correo correcto, borramos el error
  }
};

const handleChangePhone = (e) => {
  const nuevoValor = e.target.value;
  
  // 1. Actualizamos el estado global del formulario
  handleChange(e); 

  // 2. Expresión regular para teléfonos (compara números, espacios, guiones y el +)
  // Permite formatos como: +54 9 345 1234567, 345-4211111, 4211111, etc.
  const regexPhone = /^\+?[0-9\s-]{7,15}$/;

  if (nuevoValor === "") {
    setPhoneError(""); // Si está vacío no hay error de formato (controlado por el "grabar")
  } else if (!regexPhone.test(nuevoValor)) {
    setPhoneError("Formato de teléfono inválido (solo números, espacios o guiones. Entre 7 y 15 dígitos).");
  } else {
    setPhoneError(""); // Formato correcto
  }
};

  // 3. Manejador para enviar los datos al backend en Node.js
  const grabar = async (e) => {
    e.preventDefault();

        const token = localStorage.getItem('token');

    try {

      let mensaje = "¡Error! No podés dejar vacío: "
      let error = false


// Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.apellidos || formData.apellidos === '') {
    mensaje = mensaje + " el apellido, "
    error = true
  }

// Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.nombres || formData.nombres === '') {
    mensaje = mensaje + " el nombre, "
    error = true
  }

    // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.id_sexo || formData.id_sexo === '') {
    mensaje = mensaje + " el sexo, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.fecha_nacimiento || formData.fecha_nacimiento === '') {
    mensaje = mensaje + " la fecha de nacimiento, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.correo_electronico || formData.correo_electronico === '') {
    mensaje = mensaje + " el correo electrónico, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.recibe_notif_x_correo || formData.recibe_notif_x_correo === '') {
    mensaje = mensaje + " si desea recibir notificaciones por correo, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.telefono || formData.telefono === '') {
    mensaje = mensaje + " el teléfono, "
    error = true
  }

  // Bloqueo por formato de Email
  if (emailError) {
    alert(`Por favor, corrige los errores antes de guardar: ${emailError}`);
    return;
  }

  // --- NUEVO: Bloqueo por formato de Teléfono ---
  if (phoneError) {
    alert(`Por favor, corrige los errores antes de guardar: ${phoneError}`);
    return;
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.id_localidad_nacimiento || formData.id_localidad_nacimiento === '') {
    mensaje = mensaje + " la localidad de nacimiento, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.id_localidad_residencia || formData.id_localidad_residencia === '') {
    mensaje = mensaje + " la localidad de residencia, "
    error = true
  }

    // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.id_nacionalidad || formData.id_nacionalidad === '') {
    mensaje = mensaje + " la nacionalidad, "
    error = true
  }

  // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.activo || formData.activo === '') {
    mensaje = mensaje + " si está Activo o Inactivo, "
    error = true
  }

    // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.es_alumno || formData.es_alumno === '') {
    mensaje = mensaje + " si está es o no Alumno, "
    error = true
  }

  if(error){
    // Aquí ponés la alerta que prefieras (un alert común o cambiar un estado de error)
    alert(mensaje);
    return; // <--- IMPORTANTE: Detiene la función para que no siga ejecutando el guardado
  }

      // Ajusta la URL según el puerto donde corra tu Node.js (ej. 5000)
      const respuesta = await fetch(`${process.env.REACT_APP_API_URL}/api/persons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Le pasamos el token de la línea 27
        },
        body: JSON.stringify(formData), // Convertimos el estado de React a JSON
      });

      const datos = await respuesta.json();

      
      if (respuesta.ok) {
// Reseteamos el estado a su forma inicial
    setFormData({
        apellidos: '',
        nombres: '',
        id_sexo: '',
        fecha_nacimiento: '',
        correo_electronico: '',
        recibe_notif_x_correo: '',
        telefono: '',
        id_localidad_nacimiento: '',
        id_localidad_residencia: '',
        id_nacionalidad: '',
        activo: '',
        es_alumno: '',
        usuario: ''
    });
    
        alert('¡Datos guardados en Node.js con éxito!');

        console.log('Respuesta del servidor:', datos);
       // setFormData()
      } else {
        alert('Error en el servidor: ' + datos.error);
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    }
  };

  const [localidades, setLocalidades] = useState([]);

// Ejemplo de cómo cargar los datos al montar el componente
useEffect(() => {
    // Aquí llamas a tu API de backend
    fetch(`${process.env.REACT_APP_API_URL}/api/localidades`)
        .then(res => res.json())
        .then(data => {
            setLocalidades(data); // Supongamos que data es [{id: 1, nombre: 'Concordia'}, ...]
        })
        .catch(err => console.error("Error cargando localidades", err));
}, []);


  const [nacionalidades, setNacionalidades] = useState([]);

// Ejemplo de cómo cargar los datos al montar el componente
useEffect(() => {
    // Aquí llamas a tu API de backend
    fetch(`${process.env.REACT_APP_API_URL}/api/nacionalidades`)
        .then(res => res.json())
        .then(data => {
            setNacionalidades(data); // Supongamos que data es [{id: 1, nombre: 'Concordia'}, ...]
        })
        .catch(err => console.error("Error cargando nacionalidades", err));
}, []);

 
  return (

<div>
 {/* Botones de las 3 subsolapas abajo de ABM */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setSubSolapaActiva('alta')}
          style={subSolapaActiva === 'alta' ? styles.activeSubTab : styles.subTab}          
          >
          Alta de Persona
        </button>
        <button 
          onClick={() => setSubSolapaActiva('domicilios')}
          style={subSolapaActiva === 'domicilios' ? styles.activeSubTab : styles.subTab}          
          >
          Domicilios
        </button>
        <button 
          onClick={() => setSubSolapaActiva('documentos')}
          style={subSolapaActiva === 'documentos' ? styles.activeSubTab : styles.subTab}          
          >
          Documentos
        </button>
      </div>

      {/* Renderizado condicional del contenido 
      <div className="contenido-subsolapa">
        {subSolapaActiva === 'alta' && <FormularioAlta />}
        {subSolapaActiva === 'baja' && <FormularioBaja />}
        {subSolapaActiva === 'modificacion' && <FormularioModificacion />}
      </div>*/}
  
<div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
    <div className="mb-8 border-b pb-4">
      <h2 className="text-2xl font-bold text-gray-800">Alta de Persona</h2>
    </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Apellido:</span>
            <input 
              type="text"
              name="apellidos"
              value={formData.apellidos} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Nombres:</span>
            <input 
              required
              type="text"
              name="nombres"
              value={formData.nombres} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Sexo:</span>
            <select
              name="id_sexo"
              value={formData.id_sexo} 
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" enabled>Seleccione una opción</option>
              <option value="1">Masculino</option>
              <option value="2">Femenino</option>
            </select>
          </label>
      </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Fecha de Nacimiento:</span>
            <input 
              type="date"
              name="fecha_nacimiento"
              // .split('T')[0] asegura que si la fecha viene con hora desde la DB, 
              // el input la pueda leer correctamente (formato YYYY-MM-DD)
              value={formData.fecha_nacimiento ? formData.fecha_nacimiento.split('T')[0] : ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>
       </div>
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Email:</span>
            <input 
              type="email"
              name="correo_electronico"
              value={formData.correo_electronico} 
              onChange={handleChangeEmail}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
              {/* --- MUESTRA EL ERROR EN PANTALLA --- */}
              {emailError && (
                <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', textAlign: 'left' }}>
                  {emailError}
                </span>
              )}
          </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ whiteSpace: 'nowrap', textAlign: 'left', width: '100%' }}>Recibe Notificaciones por Correo:</span>
            <select
              name="recibe_notif_x_correo"
              value={formData.recibe_notif_x_correo}
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" enabled>Seleccione una opción</option>
              <option value="S">Si</option>
              <option value="N">No</option>
            </select>
          </label>
       </div>

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Teléfono:</span>
            <input 
              type="telefono"
              name="telefono"
              value={formData.telefono} 
              onChange={handleChangePhone}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
            {/* --- MUESTRA EL ERROR EN PANTALLA --- */}
              {phoneError && (
                <span style={{ color: 'red', fontSize: '12px', marginTop: '4px', textAlign: 'left', display: 'block' }}>
                  {phoneError}
                </span>
              )}
          </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Localidad de Nacimiento:</span>
          <select 
            name="id_localidad_nacimiento" 
            value={formData.id_localidad_nacimiento || ''} 
            onChange={handleChange}
            className="select select-bordered w-full max-w-xs h-12"          >
            <option value="" enabled>Seleccione una localidad</option>

            {localidades.map((loc) => (
              <option key={loc.id_localidad} value={loc.id_localidad}>
                {loc.nombre}
              </option>
            ))}
            
          </select>
          </label>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Localidad de Residencia:</span>
          <select 
            name="id_localidad_residencia" 
            value={formData.id_localidad_residencia || ''} 
            onChange={handleChange}
            className="select select-bordered w-full max-w-xs h-12"          >
            <option value="" enabled>Seleccione una localidad</option>

            {localidades.map((loc) => (
              <option key={loc.id_localidad} value={loc.id_localidad}>
                {loc.nombre}
              </option>
            ))}
            
          </select>
          </label>
       </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Nacionalidad:</span>
          <select 
            name="id_nacionalidad" 
            value={formData.id_nacionalidad || ''} 
            onChange={handleChange}
            className="select select-bordered w-full max-w-xs h-12"          >
            <option value="" enabled>Seleccione una nacionalidad</option>

            {nacionalidades.map((nac) => (
              <option key={nac.id_nacionalidad} value={nac.id_nacionalidad}>
                {nac.nombre}
              </option>
            ))}
            
          </select>
          </label>
       </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Estado:</span>
            <select
              name="activo"
              value={formData.activo || ''}
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" enabled>Seleccione una opción</option>
              <option value="N">Inactivo</option>
              <option value="S">Activo</option>
            </select>
          </label>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Es alumno:</span>
            <select
              name="es_alumno"
              value={formData.es_alumno || ''}
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" enabled>Seleccione una opción</option>
              <option value="S">Si</option>
              <option value="N">No</option>
            </select>
          </label>
       </div>

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Usuario:</span>
            <input 
              type="usuario"
              name="usuario"
              value={formData.usuario || ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

     <div className="flex justify-end mt-8">
        <button 
          onClick={(e) => grabar(e)}  //console.log("Enviar a la API:", pers)}
          className="btn btn-primary mt-6"
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Guardar Cambios
        </button>

      </div>
        </div>

      </div>
      </div>
   </div> 
   </div>  
  );
};

// Agrega esto al final absoluto del archivo, AFUERA de la función del componente
// Agrega esto al final del archivo (AFUERA de la función del componente)
const styles = {
  subTabHeader: {
    display: 'flex',
    width: '100%',
    backgroundColor: '#e0e0e0',    // El gris de fondo idéntico al de arriba
    border: '1px solid #cccccc',   // Borde gris que encierra la barra completa
    borderRadius: '4px',          // Esquinas sutilmente redondeadas
    marginBottom: '25px',         /* Separación con el formulario de abajo */
    overflow: 'hidden'            // Mantiene los botones dentro del borde redondeado
  },
  subTab: {
    flex: 1,                      // Distribuye los 3 botones en partes exactamente iguales
    backgroundColor: '#e0e0e0',   // Mismo gris de fondo que el contenedor
    color: '#555555',              // Texto gris oscuro para el estado inactivo
    padding: '12px 0',             // Relleno vertical para darles altura
    border: 'none',
    borderRight: '1px solid #cccccc', // Línea divisoria a la derecha
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'center'
  },
  activeSubTab: {
    flex: 1,
    backgroundColor: '#ffffff',   // Fondo blanco (o #f5f5f5) para resaltar cuál está activa
    color: '#000000',              // Texto completamente negro
    fontWeight: 'bold',           // Texto en negrita
    padding: '12px 0',
    border: 'none',
    borderRight: '1px solid #cccccc',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'center'
  }
};

export default ItemDetailPersonaAlta;