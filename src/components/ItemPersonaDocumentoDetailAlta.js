import { useState, useEffect } from "react";
//import Spinner from './Spinner';
//import { useParams } from "react-router-dom"; //useNavigate
//import { Link } from "react-router-dom";

const ItemDetailPersonaDocumentoAlta = () => {

  //const [subSolapaActiva, setSubSolapaActiva] = useState('documento');
  
  // 1. Creamos un estado único para controlar todos los campos del formulario
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero: '',
    activo: ''
  });


    const [documentos, setDocumentos] = useState([]);
  
  // Ejemplo de cómo cargar los datos al montar el componente
  useEffect(() => {
      // Aquí llamas a tu API de backend
      fetch(`${process.env.REACT_APP_API_URL}/api/documentos`)
          .then(res => res.json())
          .then(data => {
              setDocumentos(data); // Supongamos que data es [{id: 1, nombre: 'Concordia'}, ...]
          })
          .catch(err => console.error("Error cargando documentos", err));
  }, []);
  
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

      let mensaje = "¡Error! No podés dejar vacío: "
      let error = false


// Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.tipo_documento || formData.tipo_documento === '') {
    mensaje = mensaje + " el Tipo de Documento, "
    error = true
  }

// Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.numero || formData.numero === '') {
    mensaje = mensaje + " el Número de Documento, "
    error = true
  }

    // Verificamos si el valor no existe, es null, undefined o un texto vacío
  if (!formData.activo || formData.activo === '') {
    mensaje = mensaje + " si es Activo o No, "
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
      tipo_documento: '',
      numero: '',
      activo: ''
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

  //const [localidades, setLocalidades] = useState([]);


 
  return (

<div>
  
<div className="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
    <div className="mb-8 border-b pb-4">
      <h2 className="text-2xl font-bold text-gray-800">Alta de Documentos</h2>
    </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="form-control w-full">
                        <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Localidad de Nacimiento:</span>
                      <select 
                        name="id_tipo_documento" 
                        value={formData.id_tipo_documento || ''} 
                        onChange={handleChange}
                        className="select select-bordered w-full max-w-xs h-12"           >
                        <option value="" enabled>Seleccione</option>

                        {documentos.map((doc) => (
                          <option key={doc.id_tipo_documento} value={doc.id_tipo_documento}>
                            {doc.nombre}
                          </option>
                        ))}
                        
                      </select>
                      </label>
                  </div>

          <label className="form-control w-full">
            <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', width: '100%' }}>Número de Documento:</span>
            <input 
              type="numero"
              name="numero"
              value={formData.numero} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
    
          </label>


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



export default ItemDetailPersonaDocumentoAlta;