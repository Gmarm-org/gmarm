import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const JefeVentas: React.FC = () => {
  const navigate = useNavigate();

  console.log('🔍 DEBUG: Componente JefeVentas renderizado');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Jefe de Ventas" subtitle="Panel de control de ventas" />
      <div className="p-6">
        {/* Mensaje de bienvenida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🎯 Dashboard Jefe de Ventas</h1>
          <p className="text-gray-600">Selecciona el proceso que deseas gestionar:</p>
        </div>

        {/* Opciones de proceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Proceso de Vendedor */}
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/vendedor')}
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">👤</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Proceso de Vendedor</h3>
                <p className="text-blue-100">Gestión de clientes, armas y ventas directas</p>
                <ul className="mt-3 text-blue-100 text-sm space-y-1">
                  <li>• Crear y editar clientes</li>
                  <li>• Asignar armas a clientes</li>
                  <li>• Gestionar reservas</li>
                  <li>• Ver historial de ventas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Proceso de Jefe de Ventas */}
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            onClick={() => navigate('/jefe-ventas-supervision')}
          >
            <div className="flex items-center space-x-4">
              <span className="text-4xl">📊</span>
              <div>
                <h3 className="text-xl font-bold mb-2">Proceso de Jefe de Ventas</h3>
                <p className="text-purple-100">Supervisión, reportes y gestión de equipo</p>
                <ul className="mt-3 text-purple-100 text-sm space-y-1">
                  <li>• Supervisar ventas del equipo</li>
                  <li>• Reportes de rendimiento</li>
                  <li>• Gestión de cuotas</li>
                  <li>• Análisis de tendencias</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Estadísticas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-600 text-sm font-medium">Total Ventas Hoy</p>
              <p className="text-2xl font-bold text-blue-900">$12,450</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 text-sm font-medium">Clientes Nuevos</p>
              <p className="text-2xl font-bold text-green-900">8</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-600 text-sm font-medium">Armas Vendidas</p>
              <p className="text-2xl font-bold text-yellow-900">15</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-600 text-sm font-medium">Meta Mensual</p>
              <p className="text-2xl font-bold text-purple-900">85%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JefeVentas; 