// Helper para obtener URLs de fotos
import { api } from '../api';

/**
 * Obtiene la URL de la foto de un trabajador
 * @param {number} workerId - ID del trabajador
 * @returns {string} URL completa de la foto
 */
export function getWorkerPhotoUrl(workerId) {
  // Si no hay workerId, devolver null
  if (!workerId) {
    return null;
  }
  
  // Usar el endpoint de foto
  return api.getWorkerPhoto(workerId);
}

/**
 * Obtiene la URL de la foto para un objeto que contiene worker info
 * @param {object} item - Objeto que contiene id
 * @returns {string} URL completa de la foto
 */
export function getPhotoUrl(item) {
  if (!item) return null;
  
  // Determinar ID del trabajador
  const workerId = item.worker_id || item.id;
  
  // Si no hay ID, devolver null
  if (!workerId) {
    return null;
  }
  
  // Usar el endpoint de foto
  return getWorkerPhotoUrl(workerId);
}

/**
 * Maneja el error de carga de imagen
 * @param {Event} e - Evento de error de la imagen
 * @param {HTMLElement} imgElement - Elemento de imagen
 */
export function handlePhotoError(e, imgElement) {
  // Mostrar placeholder
  const parent = imgElement.parentElement;
  if (parent) {
    parent.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; background: #eee; color: #555;">👤</div>';
    
    // Aplicar estilos según el contexto
    if (imgElement.style.width && imgElement.style.height) {
      parent.firstChild.style.width = imgElement.style.width;
      parent.firstChild.style.height = imgElement.style.height;
      
      if (imgElement.style.borderRadius) {
        parent.firstChild.style.borderRadius = imgElement.style.borderRadius;
      }
    }
  }
}