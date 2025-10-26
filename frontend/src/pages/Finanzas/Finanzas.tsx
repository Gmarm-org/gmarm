import React, { useState } from 'react';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';

const Finanzas: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'series'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Finanzas" subtitle="Gestión financiera y asignación de series" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('dashboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💰 Dashboard Financiero
          </button>
          
          <button
            onClick={() => setVistaActual('series')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'series'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔢 Asignación de Series
          </button>
        </div>

        {/* Contenido: Dashboard Financiero */}
        {vistaActual === 'dashboard' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Financiero</h2>
            <p className="text-gray-600">Módulo de gestión financiera del sistema.</p>
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

export default Finanzas; 