import React from 'react';
import Header from '../../components/Header';
import ImportGroupManagement from './components/ImportGroupManagement';

const JefeVentas: React.FC = () => {



  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Grupos de Importación" subtitle="Crear y gestionar grupos de importación" />
      


      <ImportGroupManagement />
    </div>
  );
};

export default JefeVentas; 