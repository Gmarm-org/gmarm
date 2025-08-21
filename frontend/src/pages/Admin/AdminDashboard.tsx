import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'licenseManagement':
        navigate('/admin/licencias');
        break;
      case 'userManagement':
        navigate('/usuarios');
        break;
      case 'systemSettings':
        navigate('/admin/configuracion');
        break;
      default:
        console.log('Página no encontrada:', page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Administración del Sistema" subtitle="Gestión de licencias, usuarios y configuración" />
      
      <div className="p-6">
        {/* Mensaje de bienvenida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Dashboard de Administración</h1>
          <p className="text-gray-600">Gestiona la configuración del sistema, licencias y usuarios del sistema.</p>
        </div>

        {/* Opciones de administración */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gestión de Licencias */}
          <div 
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
            onClick={() => handleNavigate('licenseManagement')}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800">Gestión de Licencias</h3>
              <p className="text-gray-600 mt-2">Administra las licencias del sistema</p>
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div 
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
            onClick={() => handleNavigate('userManagement')}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h3>
              <p className="text-gray-600 mt-2">Administra usuarios y roles del sistema</p>
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div 
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
            onClick={() => handleNavigate('systemSettings')}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-gray-800">Configuración</h3>
              <p className="text-gray-600 mt-2">Configuración general del sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
