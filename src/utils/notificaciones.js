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
  info: (mensaje) => toast.info(mensaje, opcionesDefault),
};