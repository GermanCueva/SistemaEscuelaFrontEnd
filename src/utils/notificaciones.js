// src/utils/notificaciones.js
import { toast } from 'react-toastify';

// Opciones por defecto que compartirán todas tus alertas custom
const opcionesDefault = {
  position: "top-right",
  autoClose: 3000,
  theme: "colored",
};

export const avisar = {
  exito: (mensaje) => toast.success(mensaje, opcionesDefault),
  error: (mensaje) => toast.error(mensaje, { ...opcionesDefault, autoClose: 5000 }), // El error dura más
  advertencia: (mensaje) => toast.warning(mensaje, opcionesDefault),
  info: (mensaje) => toast.info(mensaje, opcionesDefault)
};


export const confirmarConToast = (mensaje) => {
    return new Promise((resolve) => {
        toast.warn(
            ({ closeToast }) => (
                <div>
                    <p style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>{mensaje}</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                resolve(true);
                                closeToast();
                            }}
                            style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#d33', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                            Confirmar
                        </button>
                        <button
                            onClick={() => {
                                resolve(false);
                                closeToast();
                            }}
                            style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ),
            {
                position: 'top-center',
                style: {
                    top: '35vh',          // Lo ubica verticalmente cerca del centro
                    width: '420px',        // Ancho personalizado tipo modal
                    maxWidth: '90vw'
                },
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
            }
        );
    });
};