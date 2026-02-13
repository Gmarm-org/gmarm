import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TiposClienteProvider } from './contexts/TiposClienteContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Eager: Login is the entry point
import Login from './pages/Login/Login';

// Lazy-loaded pages
const Unauthorized = lazy(() => import('./pages/Unauthorized/Unauthorized'));
const RoleSelection = lazy(() => import('./pages/RoleSelection/RoleSelection'));
const Vendedor = lazy(() => import('./pages/Vendedor/Vendedor'));
const Pagos = lazy(() => import('./pages/Pagos/Pagos'));
const Finanzas = lazy(() => import('./pages/Finanzas/Finanzas'));
const GestionSeries = lazy(() => import('./pages/Finanzas/GestionSeries'));
const AsignacionSeries = lazy(() => import('./pages/AsignacionSeries'));
const JefeVentas = lazy(() => import('./pages/JefeVentas/JefeVentas'));
const Operaciones = lazy(() => import('./pages/Operaciones'));
const AdminRoutes = lazy(() => import('./pages/Admin/AdminRoutes'));
const Usuario = lazy(() => import('./pages/Usuario/Usuario'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const VerifyPage = lazy(() => import('./pages/Verify/VerifyPage'));

const App = React.memo(() => {
  return (
    <AuthProvider>
      <TiposClienteProvider>
        <BrowserRouter>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/verify" element={<VerifyPage />} />
            
            {/* Rutas protegidas */}
            <Route 
              path="/role-selection" 
              element={
                <ProtectedRoute>
                  <RoleSelection />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vendedor/*" 
              element={
                <ProtectedRoute>
                  <Vendedor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute>
                  <Pagos />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/finanzas" 
              element={
                <ProtectedRoute>
                  <Finanzas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/finanzas/series" 
              element={
                <ProtectedRoute>
                  <GestionSeries />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/asignacion-series" 
              element={
                <ProtectedRoute>
                  <AsignacionSeries />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas" 
              element={
                <ProtectedRoute>
                  <JefeVentas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas/*" 
              element={
                <ProtectedRoute>
                  <JefeVentas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/operaciones" 
              element={
                <ProtectedRoute>
                  <Operaciones />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute>
                  <Usuario />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas de Administración */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminRoutes />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Ruta raíz - redirigir al login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Ruta catch-all - redirigir al login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </div>
        </BrowserRouter>
      </TiposClienteProvider>
    </AuthProvider>
  );
});

export default App;
