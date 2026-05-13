// Helper para obtener URLs de fotos
import { api } from '../api';

/**
 * Obtiene la URL de la foto de un trabajador (intenta múltiples fuentes)
 * @param {number} workerId - ID del trabajador
 * @param {string} photoUrl - URL de la foto existente (para compatibilidad)
 * @returns {string} URL completa de la foto
 */
export function getWorkerPhotoUrl(workerId, photoUrl = null) {
  // Si no hay workerId, devolver null
  if (!workerId) {
    return null;
  }
  
  // Prioridad 1: Nuevo endpoint de foto (para fotos en base de datos)
  return api.getWorkerPhoto(workerId);
}

/**
 * Obtiene la URL de la foto para compatibilidad con fotos existentes
 * @param {string} photoUrl - URL de la foto (puede ser relativa o absoluta)
 * @returns {string} URL completa de la foto
 */
export function getCompatiblePhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  
  // Si ya es una URL completa (http:// o https://), devolverla tal cual
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // Si es una ruta relativa que comienza con /uploads/, agregar VITE_BACKEND_URL
  if (photoUrl.startsWith('/uploads/')) {
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}${photoUrl}`;
  }
  
  // Para cualquier otra cosa, devolverla tal cual
  return photoUrl;
}

/**
 * Obtiene la URL de la foto para un objeto que contiene worker info
 * @param {object} item - Objeto que contiene id y/o photo_url
 * @returns {string} URL completa de la foto
 */
export function getPhotoUrl(item) {
  if (!item) return null;
  
  // Determinar ID del trabajador
  const workerId = item.worker_id || item.id;
  const photoUrl = item.photo_url;
  
  // Si no hay ID, devolver null
  if (!workerId) {
    return getCompatiblePhotoUrl(photoUrl);
  }
  
  // Usar el nuevo endpoint de foto
  return getWorkerPhotoUrl(workerId, photoUrl);
}

/**
 * Maneja el error de carga de imagen intentando fuentes alternativas
 * @param {Event} e - Evento de error de la imagen
 * @param {object} item - Objeto que contiene info del trabajador
 * @param {HTMLElement} imgElement - Elemento de imagen
 */
export function handlePhotoError(e, item, imgElement) {
  const workerId = item.worker_id || item.id;
  const photoUrl = item.photo_url;
  
  console.log('Error cargando foto, intentando fuente alternativa:', { workerId, photoUrl });
  
  // Si falló el nuevo endpoint, intentar con la URL compatible
  if (photoUrl) {
    const compatibleUrl = getCompatiblePhotoUrl(photoUrl);
    if (compatibleUrl && compatibleUrl !== imgElement.src) {
      console.log('Intentando cargar desde URL compatible:', compatibleUrl);
      imgElement.src = compatibleUrl;
      return;
    }
  }
  
  // Si todo falla, mostrar placeholder
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