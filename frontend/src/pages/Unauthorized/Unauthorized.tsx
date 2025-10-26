import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 px-8 py-12 text-center text-white">
            <div className="bg-white/20 p-4 rounded-full inline-block mb-4 backdrop-blur-sm">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Acceso Denegado</h1>
            <p className="text-xl text-red-100">No tienes permisos para acceder a esta página</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-6">
                Lo sentimos, no tienes los permisos necesarios para acceder a esta sección del sistema.
              </p>
              
              {user && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Información del Usuario</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Usuario:</strong> {user.nombres} {user.apellidos}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <div>
                      <strong>Roles:</strong> 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles?.map((role, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {typeof role === 'string' ? role : role.rol?.nombre || 'Rol'}
                          </span>
                        )) || <span className="text-blue-600">Sin roles asignados</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleGoBack}
                className="w-full py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
              >
                ← Volver
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
              >
                Ir al Dashboard
              </button>
            </div>

            {/* Help */}
            <div className="mt-8 text-center">
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-yellow-800">¿Necesitas ayuda?</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Si crees que esto es un error, contacta al administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 