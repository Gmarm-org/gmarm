import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const JefeVentas: React.FC = () => {
  const navigate = useNavigate();

  console.log('🔍 DEBUG: Componente JefeVentas renderizado');

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'licenseManagement':
        navigate('/jefe-ventas/licencias');
        break;
      case 'importGroupManagement':
        navigate('/jefe-ventas/grupos-importacion');
        break;
      case 'clientManagement':
        navigate('/jefe-ventas/clientes');
        break;
      case 'reportsAndStats':
        navigate('/jefe-ventas/reportes');
        break;
      case 'supervision':
        navigate('/jefe-ventas-supervision');
        break;
      default:
        console.log('Página no encontrada:', page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dirección de Ventas" subtitle="Gestión de licencias y grupos de importación" />
      
      <div className="p-6">
        {/* Mensaje de bienvenida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🎯 Dashboard Dirección de Ventas</h1>
          <p className="text-gray-600">Gestiona las licencias y grupos de importación para clientes que han completado el proceso inicial:</p>
        </div>

        {/* Opciones de proceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gestión de Licencias */}
          <div 
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
            onClick={() => handleNavigate('licenseManagement')}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800">Gestión de Licencias</h3>
            </div>
          </div>

          {/* Gestión de Grupos de Importación */}
          <div 
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-200"
            onClick={() => handleNavigate('importGroupManagement')}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800">Gestión de Grupos de Importación</h3>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Estadísticas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Licencias Activas</p>
              <p className="text-2xl font-bold text-green-900">8</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium">Grupos Activos</p>
              <p className="text-2xl font-bold text-purple-900">3</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Clientes Listos</p>
              <p className="text-2xl font-bold text-blue-900">15</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-600 text-sm font-medium">Cupos Disponibles</p>
              <p className="text-2xl font-bold text-yellow-900">127</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JefeVentas; 