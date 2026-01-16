// ========================================
// CONFIGURACIÓN DE DESARROLLO
// ========================================
// Este archivo maneja la configuración para desarrollo local y servidor

export const devConfig = {
  // URLs del backend
  backend: {
    local: 'http://localhost:8080',
    // Usar variable de entorno o localhost por defecto
    get url() {
      return process.env.VITE_API_BASE_URL || this.local;
    }
  },

  // URLs del frontend
  frontend: {
    local: 'http://localhost:5173',
    // Usar variable de entorno o localhost por defecto
    get url() {
      return process.env.VITE_FRONTEND_URL || this.local;
    }
  },

  // Configuración de API
  api: {
    baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 10000,
    retries: 3
  },

  // Configuración de imágenes
  images: {
    weaponsPath: '/images/weapons',
    defaultWeapon: '/images/weapons/default-weapon.svg',
    supportedFormats: ['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif']
  },

  // Configuración de desarrollo
  development: {
    debug: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    enableHotReload: true
  }
};

// Función para obtener la URL del backend automáticamente
export const getBackendURL = (): string => {
  return devConfig.backend.url;
};

// Función para obtener la URL del frontend automáticamente
export const getFrontendURL = (): string => {
  return devConfig.frontend.url;
};

// Función para verificar si estamos en desarrollo local
export const isLocalDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Función para verificar si estamos en el servidor
export const isServerDevelopment = (): boolean => {
  return !isLocalDevelopment();
};

// Función para obtener la configuración de CORS
export const getCORSConfig = () => {
  return {
    allowedOrigins: [
      devConfig.frontend.local,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
  };
};

export default devConfig;
