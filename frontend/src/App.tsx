import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TiposClienteProvider } from './contexts/TiposClienteContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import RoleSelection from './pages/RoleSelection/RoleSelection';
import Vendedor from './pages/Vendedor/Vendedor';

import Pagos from './pages/Pagos/Pagos';
import Finanzas from './pages/Finanzas/Finanzas';
import GestionSeries from './pages/Finanzas/GestionSeries';
import AsignacionSeries from './pages/AsignacionSeries';
import JefeVentas from './pages/JefeVentas/JefeVentas';
import Operaciones from './pages/Operaciones';
// import JefeVentasSupervision from './pages/JefeVentas/JefeVentasSupervision';
// import ReportsAndStatsPage from './pages/JefeVentas/ReportsAndStatsPage';
// import ClientAssignmentPage from './pages/JefeVentas/ClientAssignmentPage';
import AdminRoutes from './pages/Admin/AdminRoutes';
// import LicenseManagementPage from './pages/Admin/LicenseManagementPage';
import Usuario from './pages/Usuario/Usuario';
import Profile from './pages/Profile/Profile';
import VerifyPage from './pages/Verify/VerifyPage';
// import ClientManagementPage from './pages/JefeVentas/ClientManagementPage';

const App = React.memo(() => {
  return (
    <AuthProvider>
      <TiposClienteProvider>
        <BrowserRouter>
        <div className="App">
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
        </div>
        </BrowserRouter>
      </TiposClienteProvider>
    </AuthProvider>
  );
});

export default App;
