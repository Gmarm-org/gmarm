import React from 'react';
import Header from '../../components/Header';

interface FinanzasStats {
  totalIngresos: number;
  totalPagos: number;
  pagosPendientes: number;
  pagosVencidos: number;
  promedioPago: number;
  clientesActivos: number;
}

const Finanzas: React.FC = () => {
  console.log('🔍 DEBUG: Componente Finanzas renderizado');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Finanzas" subtitle="Gestión financiera y reportes" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🎉 ¡Finanzas está funcionando!</h1>
          <p className="text-gray-600">Esta es la pantalla de Finanzas que debería cargar cuando tienes rol FINANZAS.</p>
          
          <div className="mt-6 p-4 bg-green-100 rounded-lg">
            <h2 className="font-semibold text-green-800">✅ Estado:</h2>
            <ul className="mt-2 text-green-700">
              <li>• Componente cargado correctamente</li>
              <li>• Header funcionando</li>
              <li>• Routing configurado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finanzas; 