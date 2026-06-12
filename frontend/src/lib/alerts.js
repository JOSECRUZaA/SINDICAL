import Swal from 'sweetalert2';

// Diseño unificado
const baseConfig = {
  background: '#1e293b', // var(--surface-color)
  color: '#f8fafc',      // var(--text-main)
  customClass: {
    popup: 'swal-custom-popup',
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn btn-outline',
    actions: 'swal-custom-actions'
  },
  buttonsStyling: false // Usa nuestras clases CSS de botones
};

// Confirmación Peligrosa (Eliminar)
export const showConfirmDelete = async (title = '¿Está seguro?', text = 'Esta acción no se puede deshacer.') => {
  const result = await Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      ...baseConfig.customClass,
      confirmButton: 'btn btn-primary bg-danger border-danger' // Fuerza rojo
    }
  });
  return result.isConfirmed;
};

// Error
export const showError = (text = 'Ha ocurrido un error inesperado.', title = 'Error') => {
  return Swal.fire({
    ...baseConfig,
    title,
    text,
    icon: 'error',
    confirmButtonText: 'Entendido'
  });
};

// Alerta informativa / de advertencia genérica
export const showAlert = (text, title = 'Atención', icon = 'info') => {
  return Swal.fire({
    ...baseConfig,
    title,
    text,
    icon,
    confirmButtonText: 'Aceptar'
  });
};

// Toast de Éxito (No bloqueante, esquina superior derecha)
export const showSuccessToast = (title = 'Guardado exitosamente') => {
  return Swal.fire({
    ...baseConfig,
    title,
    icon: 'success',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'swal-custom-toast'
    }
  });
};
