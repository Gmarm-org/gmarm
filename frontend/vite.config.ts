import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  
  // Obtener configuración del entorno
  // NOTA: En Docker, el proxy debe usar el nombre del servicio del backend, no localhost
  // El navegador usa VITE_API_BASE_URL directamente, pero el proxy de Vite (que corre en el servidor)
  // necesita usar el nombre del servicio Docker cuando está en contenedor
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  const frontendUrl = env.VITE_FRONTEND_URL || 'http://localhost:5173'
  const wsHost = env.VITE_WS_HOST || 'localhost'
  const wsPort = env.VITE_WS_PORT || '5173'
  
  // Para el proxy de Vite (que corre en el servidor de desarrollo dentro del contenedor),
  // usar el nombre del servicio Docker si estamos en Docker, o localhost si estamos en desarrollo local
  // Detectar si estamos en Docker verificando si existe el archivo /.dockerenv o si HOSTNAME contiene el nombre del contenedor
  const isDocker = process.env.DOCKER_ENV === 'true' || process.env.HOSTNAME?.includes('gmarm-frontend')
  const proxyTarget = isDocker ? 'http://backend_local:8080' : apiBaseUrl
  
  return {
    plugins: [react()],
    esbuild: {
      pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info', 'console.warn'] : [],
      drop: mode === 'production' ? ['debugger'] : [],
    },
    server: {
      port: 5173,
      host: '0.0.0.0', // Permitir conexiones desde cualquier IP
      open: false, // No abrir automáticamente en desarrollo remoto
      hmr: {
        host: wsHost,
        port: parseInt(wsPort),
        protocol: 'ws'
      },
      // Proxy para desarrollo local (solo activo con 'npm run dev')
      // Redirige peticiones a /images y /uploads al backend
      // En producción, estas rutas se sirven directamente desde el backend
      proxy: {
        '/images': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Mantener la ruta original
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('⚠️ Proxy error:', err.message);
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('🔄 Proxying request:', req.method, req.url, '→', proxyTarget);
            });
          }
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Mantener la ruta original
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('⚠️ Proxy error:', err.message);
            });
          }
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
