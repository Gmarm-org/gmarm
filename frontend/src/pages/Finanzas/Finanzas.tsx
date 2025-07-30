import React from 'react';
import Header from '../../components/Header';

const Finanzas: React.FC = () => {
  return (
    <div>
      <Header title="Finanzas" subtitle="Gestión financiera" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Finanzas</h1>
        <p className="text-gray-600">Módulo de gestión financiera del sistema.</p>
      </div>
    </div>
  );
};

export default Finanzas; 