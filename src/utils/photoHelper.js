// Helper para obtener URLs de fotos
import { api } from '../api';

/**
 * Obtiene la URL completa de la foto de un trabajador
 * @param {number} workerId - ID del trabajador
 * @param {string} photoUrl - URL de la foto (opcional, para compatibilidad)
 * @returns {string} URL completa de la foto
 */
export function getWorkerPhotoUrl(workerId, photoUrl = null) {
  // Si no hay workerId, devolver placeholder
  if (!workerId) {
    return null;
  }
  
  // Usar el nuevo endpoint de foto
  return api.getWorkerPhoto(workerId);
}

/**
 * Obtiene la URL de la foto para un objeto que contiene worker info
 * @param {object} item - Objeto que contiene id y/o photo_url
 * @returns {string} URL completa de la foto
 */
export function getPhotoUrl(item) {
  if (!item) return null;
  
  // Prioridad: usar worker_id si está disponible
  if (item.worker_id) {
    return getWorkerPhotoUrl(item.worker_id, item.photo_url);
  }
  
  // Si no, usar id directo
  if (item.id) {
    return getWorkerPhotoUrl(item.id, item.photo_url);
  }
  
  return null;
}