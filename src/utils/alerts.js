import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Opciones predeterminadas globales (puedes personalizar colores o temas aquí)
const baseConfig = {
  confirmButtonColor: '#2563eb', // Azul estándar (Tailwind bg-blue-600)
  cancelButtonColor: '#dc2626',  // Rojo estándar (Tailwind bg-red-600)
};

/**
 * Alerta de Éxito
 */
export const showSuccess = (title = '¡Éxito!', text = '', customConfig = {}) => {
  return MySwal.fire({
    icon: 'success',
    title,
    html: text,
    confirmButtonText: 'Aceptar',
    ...baseConfig,
    ...customConfig,
  });
};

/**
 * Alerta de Error
 */
export const showError = (title = '¡Error!', text = 'Ocurrió un error inesperado.', customConfig = {}) => {
  return MySwal.fire({
    icon: 'error',
    title,
    html: text,
    confirmButtonText: 'Entendido',
    ...baseConfig,
    ...customConfig,
  });
};

/**
 * Alerta de Advertencia
 */
export const showWarning = (title = 'Advertencia', text = '', customConfig = {}) => {
  return MySwal.fire({
    icon: 'warning',
    title,
    html: text,
    confirmButtonText: 'Entendido',
    ...baseConfig,
    ...customConfig,
  });
};

/**
 * Alerta de Información
 */
export const showInfo = (title = 'Información', text = '', customConfig = {}) => {
  return MySwal.fire({
    icon: 'info',
    title,
    html: text,
    confirmButtonText: 'Aceptar',
    ...baseConfig,
    ...customConfig,
  });
};

/**
 * Modal de Confirmación (Retorna promesa con result.isConfirmed)
 */
export const showConfirm = ({
  title = '¿Estás seguro?',
  text = 'Esta acción no se puede deshacer.',
  confirmButtonText = 'Sí, confirmar',
  cancelButtonText = 'Cancelar',
  icon = 'warning',
  ...customConfig
} = {}) => {
  return MySwal.fire({
    icon,
    title,
    html: text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    ...baseConfig,
    ...customConfig,
  });
};

/**
 * Alerta para reportes largos con contenedor scrolleable
 */
export const showReportAlert = (title, htmlContent) => {
  return MySwal.fire({
    title,
    html: htmlContent,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#2563eb', // Cambia el color si usas otro tema
    width: '600px',
  });
};