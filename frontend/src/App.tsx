import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import Vendedor from './pages/Vendedor/Vendedor';
import Pagos from './pages/Pagos/Pagos';
import Finanzas from './pages/Finanzas/Finanzas';
import JefeVentas from './pages/JefeVentas/JefeVentas';
import JefeVentasSupervision from './pages/JefeVentas/JefeVentasSupervision';

import ClientManagementPage from './pages/JefeVentas/ClientManagementPage';
import ReportsAndStatsPage from './pages/JefeVentas/ReportsAndStatsPage';
import ClientAssignmentPage from './pages/JefeVentas/ClientAssignmentPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import LicenseManagementPage from './pages/Admin/LicenseManagementPage';
import Usuario from './pages/Usuario/Usuario';
import Profile from './pages/Profile/Profile';
import RoleSelection from './pages/RoleSelection/RoleSelection';
import './styles/App.css';

// Componente para redirección inteligente basada en rol
const SmartRedirect: React.FC = React.memo(() => {
  const { user } = useAuth();
  
  // Memoizar la lógica de redirección para evitar re-renders
  const redirectPath = useMemo(() => {
    if (!user) {
      console.log('SmartRedirect - No hay usuario, redirigiendo a login');
      return '/login';
    }

    // Si el usuario tiene el rol "SALES_CHIEF", ir directamente al dashboard de jefe de ventas
    const hasSalesChief = (user as any).roles?.some((role: any) => role.codigo === 'SALES_CHIEF');
    console.log('SmartRedirect - Tiene SALES_CHIEF:', hasSalesChief);

    if (hasSalesChief) {
      console.log('SmartRedirect - Redirigiendo a jefe-ventas');
      return '/jefe-ventas';
    }

    // Si el usuario tiene múltiples roles (pero no SALES_CHIEF), mostrar pantalla de selección
    if ((user as any).roles && (user as any).roles.length > 1) {
      console.log('SmartRedirect - Múltiples roles, redirigiendo a role-selection');
      return '/role-selection';
    }

    // Si tiene un solo rol, redirigir directamente
    const firstRole = (user as any).roles?.[0] || '';
    console.log('SmartRedirect - Primer rol:', firstRole);

    // Comparar con el código del rol
    const roleCode = firstRole?.codigo || '';
    console.log('SmartRedirect - Código del rol:', roleCode);

    switch (roleCode) {
      case 'VENDOR':
        console.log('SmartRedirect - Redirigiendo a vendedor');
        return '/vendedor';
      case 'SALES_CHIEF':
        console.log('SmartRedirect - Redirigiendo a jefe-ventas');
        return '/jefe-ventas';
      case 'FINANCE':
        console.log('SmartRedirect - Redirigiendo a finanzas');
        return '/finanzas';
      case 'ADMIN':
        console.log('SmartRedirect - Redirigiendo a admin');
        return '/admin';
      case 'OPERATIONS':
        console.log('SmartRedirect - Redirigiendo a operaciones');
        return '/operaciones';
      default:
        console.log('SmartRedirect - Rol por defecto, redirigiendo a vendedor');
        return '/vendedor';
    }
  }, [user]);

  return <Navigate to={redirectPath} replace />;
});

const App = React.memo(() => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
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
              path="/vendedor" 
              element={
                <ProtectedRoute anyRole={['VENDOR', 'SALES_CHIEF', 'ADMIN']}>
                  <Vendedor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute anyRole={['FINANCE', 'ADMIN']}>
                  <Pagos />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/finanzas" 
              element={
                <ProtectedRoute anyRole={['FINANCE', 'ADMIN']}>
                  <Finanzas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas" 
              element={
                <ProtectedRoute anyRole={['SALES_CHIEF', 'ADMIN']}>
                  <JefeVentas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas-supervision" 
              element={
                <ProtectedRoute anyRole={['SALES_CHIEF', 'ADMIN']}>
                  <JefeVentasSupervision />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas/clientes" 
              element={
                <ProtectedRoute anyRole={['SALES_CHIEF', 'ADMIN']}>
                  <ClientManagementPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas/reportes" 
              element={
                <ProtectedRoute anyRole={['SALES_CHIEF', 'ADMIN']}>
                  <ReportsAndStatsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas/grupos-importacion/:groupId/asignar-clientes" 
              element={
                <ProtectedRoute anyRole={['SALES_CHIEF', 'ADMIN']}>
                  <ClientAssignmentPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute anyRole={['ADMIN']}>
                  <Usuario />
                </ProtectedRoute>
              } 
            />
            
            {/* Rutas de Administración */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute anyRole={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/licencias" 
              element={
                <ProtectedRoute anyRole={['ADMIN']}>
                  <LicenseManagementPage />
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
            
            {/* Redirección inteligente por defecto */}
            <Route path="/" element={<SmartRedirect />} />
            <Route path="*" element={<SmartRedirect />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
});

export default App;
