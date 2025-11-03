import React, { useState } from 'react';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';
import ClientesAsignados from './ClientesAsignados';
import PagosFinanzas from './PagosFinanzas';
import CargaMasivaSeries from './CargaMasivaSeries';

const Finanzas: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<'pagos' | 'series' | 'clientes-asignados' | 'carga-series'>('pagos');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Finanzas" subtitle="Gestión financiera y asignación de series" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('pagos')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'pagos'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            💰 Pagos
          </button>
          
          <button
            onClick={() => setVistaActual('clientes-asignados')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'clientes-asignados'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📋 Clientes con Armas Asignadas
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

          <button
            onClick={() => setVistaActual('carga-series')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'carga-series'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📤 Carga Masiva de Series
          </button>
        </div>

        {/* Contenido: Pagos */}
        {vistaActual === 'pagos' && (
          <PagosFinanzas />
        )}

        {/* Contenido: Asignación de Series */}
        {vistaActual === 'series' && (
          <AsignacionSeries />
        )}

        {/* Contenido: Clientes Asignados */}
        {vistaActual === 'clientes-asignados' && (
          <ClientesAsignados />
        )}

        {/* Contenido: Carga Masiva de Series */}
        {vistaActual === 'carga-series' && (
          <CargaMasivaSeries />
        )}
      </div>
    </div>
  );
};

export default Finanzas; 