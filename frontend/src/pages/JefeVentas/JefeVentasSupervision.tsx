import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const JefeVentasSupervision: React.FC = () => {
  const navigate = useNavigate();

  console.log('🔍 DEBUG: Componente JefeVentasSupervision renderizado');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Supervisión de Ventas" subtitle="Gestión y reportes del equipo" />
      <div className="p-6">
        {/* Botón de regreso */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/jefe-ventas')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
          >
            ← Volver al Dashboard
          </button>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 Supervisión de Ventas</h1>
          <p className="text-gray-600">Panel de control para supervisar el rendimiento del equipo de ventas.</p>
        </div>

        {/* Estadísticas del equipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Equipo</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ventas del Mes</p>
                <p className="text-3xl font-bold">$45,230</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Meta Cumplida</p>
                <p className="text-3xl font-bold">78%</p>
              </div>
              <span className="text-4xl">📈</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Clientes Nuevos</p>
                <p className="text-3xl font-bold">34</p>
              </div>
              <span className="text-4xl">🎯</span>
            </div>
          </div>
        </div>

        {/* Acciones de supervisión */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📊</span>
              <h3 className="text-lg font-semibold text-gray-900">Reportes de Rendimiento</h3>
            </div>
            <p className="text-gray-600 mb-4">Generar reportes detallados del rendimiento del equipo</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-200">
              Ver Reportes
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">👤</span>
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Vendedores</h3>
            </div>
            <p className="text-gray-600 mb-4">Administrar vendedores y asignar cuotas</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all duration-200">
              Gestionar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📈</span>
              <h3 className="text-lg font-semibold text-gray-900">Análisis de Tendencias</h3>
            </div>
            <p className="text-gray-600 mb-4">Analizar tendencias de ventas y mercado</p>
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all duration-200">
              Analizar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🎯</span>
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Metas</h3>
            </div>
            <p className="text-gray-600 mb-4">Establecer y monitorear metas del equipo</p>
            <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-all duration-200">
              Configurar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📋</span>
              <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
            </div>
            <p className="text-gray-600 mb-4">Supervisar inventario y disponibilidad</p>
            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200">
              Revisar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">⚙️</span>
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
            </div>
            <p className="text-gray-600 mb-4">Configurar parámetros del sistema</p>
            <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-all duration-200">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JefeVentasSupervision; 