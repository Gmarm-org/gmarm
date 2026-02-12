import React from 'react';
import type { User } from '../../../services/adminApi';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface UserViewModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user, isOpen, onClose, onEdit }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Detalles del Usuario</h3>
              <p className="text-blue-100 text-sm mt-1">Información completa del usuario</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Estado y Foto */}
          <div className="flex items-start space-x-6">
            {user.foto ? (
              <img
                src={user.foto}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100">
                {user.nombres?.charAt(0)}{user.apellidos?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900">
                {formatNombreCompleto(user.nombres, user.apellidos)}
              </h4>
              <p className="text-gray-600 mt-1">@{user.username}</p>
              <div className="flex gap-2 mt-3">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  user.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.estado ? '✅ Activo' : '❌ Inactivo'}
                </span>
                {user.bloqueado && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    🔒 Bloqueado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">📧 Información de Contacto</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{user.email}</p>
              </div>
              {user.telefono_principal && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Teléfono Principal</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{user.telefono_principal}</p>
                </div>
              )}
              {user.telefono_secundario && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Teléfono Secundario</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{user.telefono_secundario}</p>
                </div>
              )}
              {user.direccion && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Dirección</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{user.direccion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Roles */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">🛡️ Roles Asignados</h5>
            <div className="flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((rol: any) => (
                  <span
                    key={rol.id}
                    className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800 border border-purple-200"
                  >
                    {rol.nombre}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin roles asignados</p>
              )}
            </div>
          </div>

          {/* Información de Sesión */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">🔐 Información de Sesión</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Último Login</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDateTime(user.ultimo_login, 'Nunca')}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Intentos de Login</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.intentos_login || 0}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Usuario ID</label>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  #{user.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onEdit(user);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Editar Usuario</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserViewModal;

