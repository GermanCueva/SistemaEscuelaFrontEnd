import { useState, useEffect } from "react";
//import Spinner from './Spinner';
//import { useParams } from "react-router-dom"; //useNavigate
//import { Link } from "react-router-dom";

const ItemDetailPersonaAlta = () => {

  // 1. Creamos un estado único para controlar todos los campos del formulario
  const [formData, setFormData] = useState({
    apellidos: '',
    nombres: ''
  });

  // 2. Manejador para actualizar el estado cada vez que el usuario escribe
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value // Actualiza dinámicamente el campo correcto
    });
  };

  // 3. Manejador para enviar los datos al backend en Node.js
  const grabar = async (e) => {
    e.preventDefault();

        const token = localStorage.getItem('token');

    try {
      // Ajusta la URL según el puerto donde corra tu Node.js (ej. 5000)
      const respuesta = await fetch('http://localhost:8080/api/persons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Le pasamos el token de la línea 27
        },
        body: JSON.stringify(formData), // Convertimos el estado de React a JSON
      });

      const datos = await respuesta.json();

      
      if (respuesta.ok) {
        alert('¡Datos guardados en Node.js con éxito!');
        console.log('Respuesta del servidor:', datos);
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
    fetch('http://localhost:8080/api/localidades')
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
    fetch('http://localhost:8080/api/nacionalidades')
        .then(res => res.json())
        .then(data => {
            setNacionalidades(data); // Supongamos que data es [{id: 1, nombre: 'Concordia'}, ...]
        })
        .catch(err => console.error("Error cargando nacionalidades", err));
}, []);

 
  return (
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
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
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
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
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
  );
};

export default ItemDetailPersonaAlta;