import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import Dashboard from './pages/Dashboard/Dashboard';
import Vendedor from './pages/Vendedor/Vendedor';
import Pagos from './pages/Pagos/Pagos';
import Finanzas from './pages/Finanzas/Finanzas';
import JefeVentas from './pages/JefeVentas/JefeVentas';
import JefeVentasSupervision from './pages/JefeVentas/JefeVentasSupervision';
import Usuario from './pages/Usuario/Usuario';
import Profile from './pages/Profile/Profile';
import RoleSelection from './pages/RoleSelection/RoleSelection';
import './styles/App.css';

// Componente para redirección inteligente basada en rol
const SmartRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // TEMPORAL: Forzar jefe de ventas a role-selection
  if (user.email === 'jefe@test.com') {
    return <Navigate to="/role-selection" replace />;
  }

  // Si el usuario tiene múltiples roles, mostrar pantalla de selección
  if (user.roles && user.roles.length > 1) {
    return <Navigate to="/role-selection" replace />;
  }

  // Si tiene un solo rol, redirigir directamente
  const firstRole = user.roles?.[0]?.rol?.nombre?.toLowerCase() || '';

  switch (firstRole) {
    case 'vendedor':
      return <Navigate to="/vendedor" replace />;
    case 'dirección de ventas':
      return <Navigate to="/jefe-ventas" replace />;
    case 'finanzas':
      return <Navigate to="/finanzas" replace />;
    case 'administrador':
      return <Navigate to="/dashboard" replace />;
    case 'operaciones':
      return <Navigate to="/operaciones" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

function App() {
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
                <ProtectedRoute anyRole={['vendedor', 'dirección de ventas', 'administrador']}>
                  <Vendedor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute anyRole={['finanzas', 'administrador']}>
                  <Pagos />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/finanzas" 
              element={
                <ProtectedRoute anyRole={['finanzas', 'administrador']}>
                  <Finanzas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas" 
              element={
                <ProtectedRoute anyRole={['dirección de ventas', 'administrador']}>
                  <JefeVentas />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jefe-ventas-supervision" 
              element={
                <ProtectedRoute anyRole={['dirección de ventas', 'administrador']}>
                  <JefeVentasSupervision />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/usuarios" 
              element={
                <ProtectedRoute anyRole={['administrador']}>
                  <Usuario />
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
}

export default App;
