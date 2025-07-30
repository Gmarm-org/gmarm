import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleSelection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || !user.roles || user.roles.length === 0) {
    return <div>No hay roles disponibles</div>;
  }

  const handleRoleSelect = (roleName: string) => {
    // Guardar el rol seleccionado en localStorage para esta sesión
    localStorage.setItem('selectedRole', roleName);
    
    // Redirigir según el rol seleccionado
    switch (roleName) {
      case 'Vendedor':
        navigate('/vendedor');
        break;
      case 'Dirección de Ventas':
        navigate('/jefe-ventas');
        break;
      case 'Finanzas':
        navigate('/finanzas');
        break;
      case 'Administrador':
        navigate('/dashboard');
        break;
      case 'Operaciones':
        navigate('/operaciones');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'Vendedor':
        return '🛒';
      case 'Dirección de Ventas':
        return '👔';
      case 'Finanzas':
        return '💰';
      case 'Administrador':
        return '⚙️';
      case 'Operaciones':
        return '📋';
      default:
        return '👤';
    }
  };

  const getRoleDescription = (roleName: string) => {
    switch (roleName) {
      case 'Vendedor':
        return 'Registro de clientes y selección de armas';
      case 'Dirección de Ventas':
        return 'Aprobación de solicitudes y gestión de ventas';
      case 'Finanzas':
        return 'Gestión de pagos y facturación';
      case 'Administrador':
        return 'Acceso completo al sistema';
      case 'Operaciones':
        return 'Gestión de importación y documentación';
      default:
        return 'Acceso al sistema';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido, {user.nombres} {user.apellidos}
          </h1>
          <p className="text-gray-600">
            Selecciona el contexto en el que deseas trabajar
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.roles.map((userRole, index) => {
            const role = userRole.rol;
            if (!role) return null;

            return (
              <div
                key={index}
                onClick={() => handleRoleSelect(role.nombre)}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
              >
                <div className="p-6 text-center">
                  <div className="text-4xl mb-4">
                    {getRoleIcon(role.nombre)}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {role.nombre}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {getRoleDescription(role.nombre)}
                  </p>
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium inline-block">
                    {(user.roles?.length || 0) > 1 ? 'Múltiples roles' : 'Rol único'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Puedes cambiar de contexto en cualquier momento desde el menú de usuario
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection; 