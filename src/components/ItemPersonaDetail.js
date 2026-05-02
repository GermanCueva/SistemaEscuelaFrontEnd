import { useState, useEffect } from "react";
import Spinner from './Spinner';
import { useParams } from "react-router-dom";

const ItemDetailPersona = () => {
  const [pers, setPers] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    fetch(`http://localhost:8080/api/personsconfiltro/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setPers(data[0]); 
        }
      })
      .catch((err) => console.error("Error:", err));
  }, [id]);

  // Función para actualizar el estado cuando escribes en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPers({
      ...pers,
      [name]: value
    });
  };

  if (!pers) return <Spinner />;

  return (
    <div className="card w-96 bg-base-100 shadow-xl px-6 py-6" style={{ margin: '20px auto' }}>
      <div key={pers.id_persona}>
      {/*  <img 
          className="imagen_detalle" 
          src={pers.img || 'https://via.placeholder.com/150'} 
          alt="Imagen" 
          style={{ width: '100%', marginBottom: '15px' }}
        />*/}

        <div className="flex flex-col gap-4">
          <label className="form-control w-full">
            <span className="label-text font-bold">Apellido:</span>
            <input 
              type="text"
              name="apellidos"
              value={pers.apellidos || ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Nombres:</span>
            <input 
              type="text"
              name="nombres"
              value={pers.nombres || ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Sexo:</span>
            <select
              name="id_sexo"
              value={pers.id_sexo || ''}
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" disabled>Seleccione una opción</option>
              <option value="1">Masculino</option>
              <option value="2">Femenino</option>
            </select>
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Fecha de Nacimiento:</span>
            <input 
              type="date"
              name="fecha_nacimiento"
              // .split('T')[0] asegura que si la fecha viene con hora desde la DB, 
              // el input la pueda leer correctamente (formato YYYY-MM-DD)
              value={pers.fecha_nacimiento ? pers.fecha_nacimiento.split('T')[0] : ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Email:</span>
            <input 
              type="email"
              name="correo_electronico"
              value={pers.correo_electronico || ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Recibe Notificaciones por Correo:</span>
            <select
              name="recibe_notif_x_correo"
              value={pers.recibe_notif_x_correo || ''}
              onChange={handleChange}
              className="select select-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            >
              <option value="" disabled>Seleccione una opción</option>
              <option value="S">Si</option>
              <option value="N">No</option>
            </select>
          </label>

          <label className="form-control w-full">
            <span className="label-text font-bold">Teléfono:</span>
            <input 
              type="telefono"
              name="telefono"
              value={pers.telefono || ''} 
              onChange={handleChange}
              className="input input-bordered w-full"
              style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
            />
          </label>

        </div>

        <button 
          onClick={() => console.log("Enviar a la API:", pers)}
          className="btn btn-primary mt-6"
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Guardar Cambios
        </button>
      </div>
   </div> 
  );
};

export default ItemDetailPersona;