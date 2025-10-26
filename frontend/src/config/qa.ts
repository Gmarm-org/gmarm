// ========================================
// CONFIGURACIÓN PARA QA
// ========================================

export const QA_CONFIG = {
  // Activar modo QA (usa datos mock) - DESHABILITADO PARA FASE PILOTO
  ENABLE_QA_MODE: false,
  
  // Tiempo de timeout para detectar backend (ms)
  BACKEND_TIMEOUT: 3000,
  
  // URL del backend
  BACKEND_URL: 'http://localhost:8080',
  
  // Simular errores aleatorios (10% de probabilidad)
  SIMULATE_RANDOM_ERRORS: false,
  
  // Delay simulado para operaciones (ms)
  SIMULATED_DELAY: 500,
  
  // Credenciales de prueba - REMOVIDAS PARA FASE PILOTO
  // Solo usar credenciales reales del backend
  TEST_CREDENTIALS: {}
};

// Función para verificar si estamos en modo QA
export const isQAMode = (): boolean => {
  return QA_CONFIG.ENABLE_QA_MODE || import.meta.env.DEV;
};

// Función para obtener la URL del backend
export const getBackendUrl = (): string => {
  return QA_CONFIG.BACKEND_URL;
};

// Función para obtener el timeout del backend
export const getBackendTimeout = (): number => {
  return QA_CONFIG.BACKEND_TIMEOUT;
}; 