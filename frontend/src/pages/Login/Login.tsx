import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Función para redirigir según el rol
  const redirectBasedOnRole = (userRoles: any[]) => {
    const roleNames = userRoles.map(role => role.rol?.nombre || '').filter(nombre => nombre !== '');
    
    if (roleNames.includes('VENDEDOR')) {
      navigate('/vendedor');
    } else if (roleNames.includes('FINANZAS')) {
      navigate('/pagos');
    } else if (roleNames.includes('ADMIN')) {
      navigate('/usuarios');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // La redirección se manejará en el useEffect cuando el usuario se actualice
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para redirigir cuando el usuario se actualice
  React.useEffect(() => {
    if (user && user.roles) {
      redirectBasedOnRole(user.roles);
    }
  }, [user, navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Sistema de Importación de Armas</h1>
          <p>Iniciar Sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Ingrese su correo electrónico"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Ingrese su contraseña"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Credenciales de prueba:</p>
          <div className="test-credentials">
            <div>
              <strong>Vendedor:</strong> vendedor@test.com / password123
            </div>
            <div>
              <strong>Admin:</strong> admin@test.com / password123
            </div>
            <div>
              <strong>Jefe Ventas:</strong> jefe@test.com / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 