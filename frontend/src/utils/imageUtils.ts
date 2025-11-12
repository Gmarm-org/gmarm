/**
 * Utilidades para manejo de imágenes
 * 
 * Construye URLs correctas para imágenes del backend,
 * funcionando tanto en desarrollo local como en Docker.
 * 
 * La URL del backend se configura mediante variables de entorno:
 * - LOCAL: VITE_API_BASE_URL=http://localhost:8080
 * - PROD:  VITE_API_BASE_URL=https://api.gmarm.com
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Construye la URL completa para una imagen de arma
 * @param imageUrl - Ruta de la imagen (ej: /images/weapons/CZ-P10-C.png)
 * @returns URL completa del backend
 */
export const getWeaponImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    // Retornar placeholder si no hay imagen
    return `${API_BASE_URL}/images/weapons/default-weapon.jpg`;
  }

  // Si la URL ya es completa (comienza con http), retornarla tal cual
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Si comienza con /, quitarla para evitar doble barra
  const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;

  // Construir URL completa con el backend
  return `${API_BASE_URL}/${cleanPath}`;
};

/**
 * Construye la URL de imagen con cache-busting
 * @param imageUrl - Ruta de la imagen
 * @returns URL completa con timestamp para evitar caché
 */
export const getWeaponImageUrlWithCacheBusting = (imageUrl: string | null | undefined): string => {
  const fullUrl = getWeaponImageUrl(imageUrl);
  const timestamp = Date.now();
  return `${fullUrl}?t=${timestamp}`;
};

/**
 * Placeholder por defecto para armas sin imagen
 */
export const DEFAULT_WEAPON_IMAGE = `${API_BASE_URL}/images/weapons/default-weapon.jpg`;

