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
      },
      // Proxy para servir imágenes y archivos desde el backend
      proxy: {
        '/images': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false
        }
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
      // Generar nombres únicos para assets (cache busting)
      manifest: true,
      // Hash en nombres de archivos para evitar cache
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        input: {
          main: 'index.html'
        },
        output: {
          // Incluir hash en nombres de archivos
          entryFileNames: 'assets/js/[name].[hash].js',
          chunkFileNames: 'assets/js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            if (!name) return `assets/[name].[hash].[ext]`;
            
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name].[hash].[ext]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name].[hash].[ext]`;
            }
            return `assets/[name].[hash].[ext]`;
          }
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
