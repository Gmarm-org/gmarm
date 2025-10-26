import React from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // const { logout } = useAuth();

  // const _handleLogout = () => {
  //   logout();
  //   navigate('/login');
  // };

  const catalogItems = [
    {
      title: '👥 Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      path: '/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
      icon: '👥'
    },
    {
      title: '🛡️ Gestión de Roles',
      description: 'Administrar roles y permisos',
      path: '/admin/roles',
      color: 'bg-purple-500 hover:bg-purple-600',
      icon: '🛡️'
    },
    {
      title: '🔫 Armas',
      description: 'Gestión del catálogo de armas',
      path: '/admin/weapons',
      color: 'bg-green-500 hover:bg-green-600',
      icon: '🔫'
    },
    {
      title: '🏷️ Categorías de Armas',
      description: 'Administrar categorías de armas',
      path: '/admin/weapon-categories',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      icon: '🏷️'
    },
    {
      title: '📜 Gestión de Licencias',
      description: 'Administrar licencias de importación',
      path: '/admin/licenses',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      icon: '📜'
    },
    {
      title: '👤 Gestión de Clientes',
      description: 'Administrar clientes del sistema',
      path: '/admin/clients',
      color: 'bg-pink-500 hover:bg-pink-600',
      icon: '👤'
    },
    {
      title: '🏷️ Tipos de Cliente',
      description: 'Administrar tipos de cliente',
      path: '/admin/client-types',
      color: 'bg-teal-500 hover:bg-teal-600',
      icon: '🏷️'
    },
    {
      title: '📦 Tipos de Importación',
      description: 'Administrar tipos de importación',
      path: '/admin/import-types',
      color: 'bg-orange-500 hover:bg-orange-600',
      icon: '📦'
    },
    {
      title: '🔄 Tipos de Proceso',
      description: 'Administrar tipos de proceso',
      path: '/admin/process-types',
      color: 'bg-red-500 hover:bg-red-600',
      icon: '🔄'
    },
    {
      title: '🆔 Tipos de Identificación',
      description: 'Administrar tipos de identificación',
      path: '/admin/identification-types',
      color: 'bg-gray-500 hover:bg-gray-600',
      icon: '🆔'
    },
    {
      title: '📄 Tipos de Documento',
      description: 'Administrar tipos de documento',
      path: '/admin/document-types',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      icon: '📄'
    },
    {
      title: '❓ Preguntas del Cliente',
      description: 'Administrar preguntas para clientes',
      path: '/admin/client-questions',
      color: 'bg-lime-500 hover:bg-lime-600',
      icon: '❓'
    },
    {
      title: '💳 Planes de Pago',
      description: 'Administrar planes de pago',
      path: '/admin/payment-plans',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      icon: '💳'
    },
    {
      title: '📋 Documentos de Cliente',
      description: 'Documentos asociados a clientes',
      path: '/admin/client-documents',
      color: 'bg-violet-500 hover:bg-violet-600',
      icon: '📋'
    },
    {
      title: '📦 Grupos de Importación',
      description: 'Administrar grupos de importación',
      path: '/admin/import-groups',
      color: 'bg-amber-500 hover:bg-amber-600',
      icon: '📦'
    },
    {
      title: '💰 Gestión de Pagos',
      description: 'Administrar pagos y cuotas',
      path: '/admin/payments',
      color: 'bg-rose-500 hover:bg-rose-600',
      icon: '💰'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Panel de Administración" 
        subtitle="Gestión integral del sistema de armas de importación"
      />
      
      <div className="p-6">
        {/* Estadísticas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="text-2xl">🔫</span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Armas</div>
                  <div className="text-2xl font-bold text-gray-900">30</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Usuarios</div>
                  <div className="text-2xl font-bold text-gray-900">5</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="text-2xl">📜</span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Licencias</div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-600">Clientes</div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Catálogos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catálogos del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {catalogItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`${item.color} text-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-left group`}
              >
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">{item.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:scale-105 transition-transform duration-200">
                      {item.title}
                    </h3>
                  </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4 text-right">
                  <span className="text-white/70 text-sm">→ Ir al catálogo</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
