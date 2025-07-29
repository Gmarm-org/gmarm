import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Unauthorized.css';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="unauthorized-icon">🚫</div>
        <h1>Acceso Denegado</h1>
        <p>
          Lo sentimos, no tienes permisos para acceder a esta página.
        </p>
        
        {user && (
          <div className="user-info">
            <p>
              <strong>Usuario:</strong> {user.nombres} {user.apellidos}
            </p>
            <div>
              <strong>Roles:</strong> {user.roles?.join(', ') || 'Sin roles asignados'}
            </div>
          </div>
        )}
        
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            Volver
          </button>
          <button onClick={handleGoHome} className="btn-primary">
            Ir al Dashboard
          </button>
        </div>
        
        <div className="unauthorized-help">
          <p>
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 