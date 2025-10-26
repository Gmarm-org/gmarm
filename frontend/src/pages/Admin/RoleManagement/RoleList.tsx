import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { roleApi, type Role } from '../../../services/adminApi';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const data = await roleApi.getAll();
      setRoles(data);
      setFilteredRoles(data);
    } catch (error) {
      console.error('Error cargando roles:', error);
      // Fallback a datos mock si la API falla
      const mockRoles: Role[] = [
        {
          id: 1,
          nombre: 'Administrador',
          codigo: 'ADMIN',
          descripcion: 'Acceso completo al sistema',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 2,
          nombre: 'Vendedor',
          codigo: 'VENDEDOR',
          descripcion: 'Registro de clientes y selección de armas catálogo',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 3,
          nombre: 'Jefe de Ventas',
          codigo: 'JEFE_VENTAS',
          descripcion: 'Aprobación de solicitudes y creación de grupos de importación',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 4,
          nombre: 'Finanzas',
          codigo: 'FINANZAS',
          descripcion: 'Gestión de pagos y facturación',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 5,
          nombre: 'Operaciones',
          codigo: 'OPERACIONES',
          descripcion: 'Gestión de importación y documentación',
          estado: true,
          fecha_creacion: '2024-01-01'
        }
      ];
      setRoles(mockRoles);
      setFilteredRoles(mockRoles);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterRoles();
  }, [searchTerm, roles]);

  const filterRoles = () => {
    let filtered = roles;

    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoles(filtered);
  };

  const handleCreate = async () => {
    console.log('Crear nuevo rol');
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (role: Role) => {
    console.log('Editar rol:', role);
    // TODO: Implementar modal de edición
    alert(`Funcionalidad de edición en desarrollo para: ${role.nombre}`);
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el rol "${role.nombre}"?`)) {
      try {
        await roleApi.delete(role.id);
        // Recargar la lista después de eliminar
        await loadRoles();
        alert('Rol eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando rol:', error);
        alert('Error al eliminar el rol');
      }
    }
  };

  const handleView = async (role: Role) => {
    console.log('Ver rol:', role);
    // TODO: Implementar modal de vista detallada
    alert(`Vista detallada en desarrollo para: ${role.nombre}`);
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'nombre',
      label: 'Rol',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {value.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.descripcion}</div>
          </div>
        </div>
      )
    },
    {
      key: 'codigo',
      label: 'Código',
      render: (value) => (
        <div className="text-sm text-gray-900 font-mono">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'fecha_creacion',
      label: 'Fecha Creación',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString('es-EC')}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Roles',
      value: roles.length,
      icon: '👥',
      color: 'blue',
      description: 'Roles registrados'
    },
    {
      label: 'Activos',
      value: roles.filter(r => r.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Roles activos'
    },
    {
      label: 'Inactivos',
      value: roles.filter(r => !r.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Roles inactivos'
    }
  ];

  return (
    <AdminDataTable
      title="Gestión de Roles"
      description="Administra los roles y permisos del sistema"
      columns={columns}
      data={filteredRoles}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      searchPlaceholder="Buscar roles..."
      stats={<AdminStats stats={stats} />}
    />
  );
};

export default RoleList;
