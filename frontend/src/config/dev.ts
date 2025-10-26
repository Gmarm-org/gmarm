// ========================================
// CONFIGURACIÓN DE DESARROLLO
// ========================================
// Este archivo maneja la configuración para desarrollo local y servidor

export const devConfig = {
  // URLs del backend
  backend: {
    local: 'http://localhost:8080',
    server: 'http://72.167.52.14:8080',
    // Determinar automáticamente la URL correcta
    get url() {
      // Si estamos en el servidor (IP externa), usar la IP del servidor
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return this.server;
      }
      // Si estamos en localhost, usar localhost
      return this.local;
    }
  },

  // URLs del frontend
  frontend: {
    local: 'http://localhost:5173',
    server: 'http://72.167.52.14:5173',
    // Determinar automáticamente la URL correcta
    get url() {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return this.server;
      }
      return this.local;
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
    defaultWeapon: '/images/weapons/default-weapon.jpg',
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
      devConfig.frontend.server,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
  };
};

export default devConfig;
