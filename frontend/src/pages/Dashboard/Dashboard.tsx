import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <Header title="Dashboard" subtitle="Panel de administración" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Bienvenido, {user?.nombres} {user?.apellidos}</p>
        <p className="text-gray-600">Esta es la pantalla de administración del sistema.</p>
      </div>
    </div>
  );
};

export default Dashboard; 