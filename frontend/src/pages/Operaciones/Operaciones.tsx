import React, { useState } from 'react';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';

const Operaciones: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'series'>('series');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Operaciones" subtitle="Gestión operativa y asignación de series" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'dashboard'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Dashboard Operativo
          </button>
          
          <button
            onClick={() => setVistaActual('series')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'series'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔢 Asignación de Series
          </button>
        </div>

        {/* Contenido: Dashboard Operativo */}
        {vistaActual === 'dashboard' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Dashboard Operativo</h2>
            <p className="text-gray-600 mb-6">Panel de control operativo del sistema GMARM.</p>
            
            {/* Estadísticas operativas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">Importaciones Activas</p>
                    <p className="text-3xl font-bold text-blue-800">-</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">Series Asignadas</p>
                    <p className="text-3xl font-bold text-green-800">-</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-orange-800">-</p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium">
                ℹ️ Módulo en desarrollo. Por ahora, puedes usar la pestaña "Asignación de Series" para gestionar las series de armas.
              </p>
            </div>
          </div>
        )}

        {/* Contenido: Asignación de Series */}
        {vistaActual === 'series' && (
          <AsignacionSeries />
        )}
      </div>
    </div>
  );
};

export default Operaciones;

