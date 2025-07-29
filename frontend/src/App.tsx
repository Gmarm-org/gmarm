import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Vendedor from './pages/Vendedor/Vendedor';
import Usuario from './pages/Usuario/Usuario';
import Dashboard from './pages/Dashboard/Dashboard';
import Pagos from './pages/Pagos/Pagos';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import { useAuth } from './contexts/AuthContext';
import './styles/App.css';

// Componente para redirección inteligente basada en rol
const SmartRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleNames = user.roles?.map(role => role.rol?.nombre || '').filter(nombre => nombre !== '') || [];

  if (roleNames.includes('VENDEDOR')) {
    return <Navigate to="/vendedor" replace />;
  } else if (roleNames.includes('FINANZAS')) {
    return <Navigate to="/pagos" replace />;
  } else if (roleNames.includes('ADMIN')) {
    return <Navigate to="/usuarios" replace />;
  } else {
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
              path="/usuarios" 
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Usuario />
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
