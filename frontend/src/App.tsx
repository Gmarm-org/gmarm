import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Vendedor from './pages/Vendedor/Vendedor';
import Usuario from './pages/Usuario/Usuario';
import Dashboard from './pages/Dashboard/Dashboard';
import Pagos from './pages/Pagos/Pagos';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import './styles/App.css';

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
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vendedor" 
              element={
                <ProtectedRoute anyRole={['VENDEDOR', 'ADMIN']}>
                  <Vendedor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pagos" 
              element={
                <ProtectedRoute anyRole={['FINANZAS', 'ADMIN']}>
                  <Pagos />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/usuario" 
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <Usuario />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
