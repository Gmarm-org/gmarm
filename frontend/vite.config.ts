import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  
  // Obtener configuración del entorno
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  const frontendUrl = env.VITE_FRONTEND_URL || 'http://localhost:5173'
  const wsHost = env.VITE_WS_HOST || 'localhost'
  const wsPort = env.VITE_WS_PORT || '5173'
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0', // Permitir conexiones desde cualquier IP
      open: false, // No abrir automáticamente en desarrollo remoto
      hmr: {
        host: wsHost,
        port: parseInt(wsPort),
        protocol: 'ws'
      }
    },
    preview: {
      port: 5173,
      host: '0.0.0.0'
    },
    // Configuración para servir archivos estáticos
    publicDir: 'public',
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: 'index.html'
        }
      }
    },
    // Definir variables de entorno para el cliente
    define: {
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __FRONTEND_URL__: JSON.stringify(frontendUrl)
    }
  }
})
