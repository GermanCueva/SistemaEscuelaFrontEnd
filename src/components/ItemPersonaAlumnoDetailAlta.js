import { useState, useEffect, useCallback } from "react";

const ItemPersonaAlumnoDetailAlta = ({ formData, handleChange }) => {
    const [desercion, setDesercion] = useState([]);

    const cargarDeserciones = useCallback(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/desercion`)
            .then(res => res.json())
            .then(data => {
                const listaDesercion = Array.isArray(data) ? data : data.desercion || data.data || [];
                setDesercion(listaDesercion);
            })
            .catch(err => console.error("Error cargando motivos de deserción", err));
    }, []);

    useEffect(() => {
        cargarDeserciones();
    }, [cargarDeserciones]);

    return (      
        <div style={{ padding: '0px', backgroundColor: '#ffffff' }}>
            {/* Forzamos una sola columna vertical limpia con espaciado constante */}
            <div className="flex flex-col gap-4 max-w-xl mx-auto">
                
                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Legajo:</span>
                    <input 
                        type="text"
                        name="legajo"
                        value={formData?.legajo || ''} 
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    />
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Extranjero:</span>
                    <select
                        name="extranjero"
                        value={formData?.extranjero || ''}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="S">Si</option>
                        <option value="N">No</option>
                    </select>
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Alumno Regular:</span>
                    <select
                        name="regular"
                        value={formData?.regular || ''}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="S">Si</option>
                        <option value="N">No</option>
                    </select>
                </label>

                {/* 👇 RENDERIZADO CONDICIONAL: Solo se muestra si Alumno Regular es "No" */}
                {formData?.regular === 'N' && (
                    <label className="form-control w-full">
                        <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Motivo Deserción:</span>
                        <select 
                            name="id_motivo_desercion" 
                            value={formData?.id_motivo_desercion || ''} 
                            onChange={handleChange}
                            className="select select-bordered w-full"
                            style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                        >
                            <option value="">Ninguno / Seleccione</option>
                            {desercion.map((des) => (
                                <option key={des.id_motivo_desercion || des.id} value={String(des.id_motivo_desercion || des.id)}>
                                    {des.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Es celíaco:</span>
                    <select
                        name="es_celiaco"
                        value={formData?.es_celiaco || ''}
                        onChange={handleChange}
                        className="select select-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    >
                        <option value="">Seleccione...</option>
                        <option value="S">Si</option>
                        <option value="N">No</option>
                    </select>
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Calle:</span>
                    <input 
                        type="text"
                        name="direccion_calle"
                        value={formData?.direccion_calle || ''} 
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    />
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Número:</span>
                    <input 
                        type="text"
                        name="direccion_numero"
                        value={formData?.direccion_numero || ''} 
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    />
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Piso:</span>
                    <input 
                        type="text"
                        name="direccion_piso"
                        value={formData?.direccion_piso || ''} 
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    />
                </label>

                <label className="form-control w-full">
                    <span className="label-text font-bold" style={{ display: 'block', textAlign: 'left', marginBottom: '4px' }}>Depto:</span>
                    <input 
                        type="text"
                        name="direccion_depto"
                        value={formData?.direccion_depto || ''} 
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', width: '100%' }}
                    />
                </label>

            </div>
        </div>
    );
};

export default ItemPersonaAlumnoDetailAlta;