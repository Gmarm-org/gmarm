import React from 'react';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';
import { useAuth } from '../../contexts/AuthContext';
import { useJefeVentasExport } from './hooks/useJefeVentasExport';
import { useTableFilters } from '../../hooks/useTableFilters';
import { useJefeVentasState } from './hooks/useJefeVentasState';
import { useJefeVentasData } from './hooks/useJefeVentasData';
import { useJefeVentasHandlers } from './hooks/useJefeVentasHandlers';
import ImportGroupManagement from './components/ImportGroupManagement';
import GestionImportaciones from '../../components/shared/GestionImportaciones';
import ClientForm from '../Vendedor/components/ClientForm';
import WeaponListContent from '../Admin/WeaponManagement/WeaponListContent';
import WeaponCategoryList from '../Admin/WeaponManagement/WeaponCategoryList';
import ModalGenerarContrato from './components/ModalGenerarContrato';
import ModalReasignarArma from './components/ModalReasignarArma';
import ModalEditarArma from './components/ModalEditarArma';
import ModalDesistimiento from './components/ModalDesistimiento';
import ModalClienteReasignado from './components/ModalClienteReasignado';
import ModalAutorizacion from './components/ModalAutorizacion';
import type { ClienteConVendedor } from './types';
import StockView from './views/StockView';
import ClientesListView from './views/ClientesListView';
import ClientesAsignadosView from './views/ClientesAsignadosView';
import ReasignarArmasView from './views/ReasignarArmasView';
import ClientDetailModal from './views/ClientDetailModal';

const JefeVentas: React.FC = () => {
  const { user } = useAuth();
  const state = useJefeVentasState();
  const dataActions = useJefeVentasData(state);
  const handlers = useJefeVentasHandlers(state, dataActions);
  const { exportarClientesAExcel } = useJefeVentasExport();

  const puedeVerAsignacionSeries = user?.roles?.some(
    role => {
      const codigo = role.rol?.codigo || (role as any).codigo;
      return codigo === 'SALES_CHIEF' || codigo === 'FINANCE';
    }
  ) || false;

  const {
    filteredAndSortedData: clientesFiltrados,
    sortConfig: sortConfigClientes,
    handleSort: handleSortClientes,
    filters: filtersClientes,
    setFilter: setFilterClientes,
    clearFilters: clearFiltersClientes,
  } = useTableFilters<ClienteConVendedor>(state.clientes);

  const {
    filteredAndSortedData: clientesAsignadosFiltrados,
    sortConfig: sortConfigAsignados,
    handleSort: handleSortAsignados,
    filters: filtersAsignados,
    setFilter: setFilterAsignados,
    clearFilters: clearFiltersAsignados,
  } = useTableFilters<ClienteConVendedor>(state.clientesAsignados);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Panel de Jefe de Ventas"
        subtitle="Gestión de inventario, clientes e importaciones"
      />

      <div className="w-full px-2 py-4">

        {/* Si estamos en modo edición de cliente, mostrar solo el formulario */}
        {state.currentPage === 'clientForm' && state.selectedClient ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Editar Cliente</h2>
              <button
                onClick={handlers.handleCloseForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Volver a la lista
              </button>
            </div>
            <ClientForm
              mode={state.clientFormMode}
              client={state.selectedClient as any}
              onSave={handlers.handleClientSaved as any}
              onCancel={handlers.handleCloseForm}
              onEdit={() => state.selectedClient && handlers.handleEditarCliente(state.selectedClient as ClienteConVendedor)}
              selectedWeapon={state.selectedWeapon}
              precioModificado={state.precioModificado}
              cantidad={state.cantidad}
              onPriceChange={handlers.handlePriceChangeWrapper}
              onQuantityChange={handlers.handleQuantityChangeWrapper}
              onNavigateToWeaponSelection={handlers.handleNavigateToWeaponSelection}
              onConfirmData={handlers.handleClientDataConfirm}
              onClienteBloqueado={handlers.handleClienteBloqueado}
            />
          </div>
        ) : (
          <>
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => state.setVistaActual('clientes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'clientes'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👥 Todos los Clientes
          </button>

          <button
            onClick={() => state.setVistaActual('clientes-asignados')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'clientes-asignados'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Clientes con Serie Asignada
          </button>

          <button
            onClick={() => state.setVistaActual('importaciones')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'importaciones'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📦 Importaciones
          </button>

          <button
            onClick={() => state.setVistaActual('gestion-importaciones')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'gestion-importaciones'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Gestión Importaciones
          </button>

          <button
            onClick={() => state.setVistaActual('reasignar-armas')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'reasignar-armas'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔄 Reasignar Armas
          </button>

          {puedeVerAsignacionSeries && (
            <button
              onClick={() => state.setVistaActual('series')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                state.vistaActual === 'series'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔢 Asignación de Series
            </button>
          )}

          <button
            onClick={() => state.setVistaActual('armas')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'armas'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔫 Armas
          </button>

          <button
            onClick={() => state.setVistaActual('categorias')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              state.vistaActual === 'categorias'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏷️ Categorías
          </button>
        </div>

        {/* Contenido: Stock de Armas */}
        {state.vistaActual === 'stock' && (
          <StockView
            stockArmas={state.stockArmas}
            loadingStock={state.loadingStock}
            onRefresh={dataActions.cargarStockArmas}
          />
        )}

        {/* Contenido: Todos los Clientes */}
        {state.vistaActual === 'clientes' && (
          <ClientesListView
            clientesFiltrados={clientesFiltrados}
            loadingClientes={state.loadingClientes}
            sortConfig={sortConfigClientes}
            onSort={handleSortClientes}
            filters={filtersClientes}
            setFilter={setFilterClientes}
            clearFilters={clearFiltersClientes}
            onRefresh={dataActions.cargarClientes}
            onExport={exportarClientesAExcel}
            onVerDetalle={handlers.handleVerDetalleCliente}
            onEditar={handlers.handleEditarCliente}
            onReasignarArma={handlers.handleAbrirModalReasignarArma}
            onDesistimiento={handlers.handleAbrirModalDesistimiento}
          />
        )}

        {/* Contenido: Clientes con Serie Asignada */}
        {state.vistaActual === 'clientes-asignados' && (
          <ClientesAsignadosView
            clientesAsignadosFiltrados={clientesAsignadosFiltrados}
            loadingClientes={state.loadingClientes}
            sortConfig={sortConfigAsignados}
            onSort={handleSortAsignados}
            filters={filtersAsignados}
            setFilter={setFilterAsignados}
            clearFilters={clearFiltersAsignados}
            clientWeaponAssignments={state.clientWeaponAssignments}
            autorizaciones={state.autorizaciones}
            onRefresh={dataActions.cargarClientesAsignados}
            onVerDetalle={handlers.handleVerDetalleCliente}
            onGenerarAutorizacion={handlers.handleGenerarAutorizacion}
          />
        )}

        {/* Modal de Detalle de Cliente */}
        {state.clienteSeleccionado && (
          <ClientDetailModal
            cliente={state.clienteSeleccionado}
            onClose={handlers.handleCerrarDetalle}
            loadingDetalleCliente={state.loadingDetalleCliente}
            armasCliente={state.armasCliente}
            documentosCliente={state.documentosCliente}
            contratosCliente={state.contratosCliente}
            setContratosCliente={state.setContratosCliente}
            pagosCliente={state.pagosCliente}
            vistaActual={state.vistaActual}
            user={user}
            onAbrirModalGenerarContrato={handlers.handleAbrirModalGenerarContrato}
            onAbrirModalEditarArma={handlers.handleAbrirModalEditarArma}
          />
        )}

        {/* Modal de Generar Contrato */}
        <ModalGenerarContrato
          state={state.modalGenerarContrato}
          onGenerar={handlers.handleGenerarContrato}
          onClose={() => state.setModalGenerarContrato({ isOpen: false, datosContrato: null, isLoading: false })}
        />

        {/* Contenido: Importaciones */}
        {state.vistaActual === 'importaciones' && (
          <ImportGroupManagement />
        )}

        {/* Contenido: Gestión de Importaciones */}
        {state.vistaActual === 'gestion-importaciones' && (
          <GestionImportaciones />
        )}

        {/* Contenido: Reasignar Armas */}
        {state.vistaActual === 'reasignar-armas' && (
          <ReasignarArmasView
            armasReasignadas={state.armasReasignadas}
            loadingArmasReasignadas={state.loadingArmasReasignadas}
            onRefresh={dataActions.cargarArmasReasignadas}
            onClienteReasignado={handlers.handleAbrirModalClienteReasignado}
          />
        )}

        {/* Contenido: Asignación de Series */}
        {state.vistaActual === 'series' && (
          <AsignacionSeries />
        )}

        {/* Contenido: Gestión de Armas - Para Jefe de Ventas */}
        {state.vistaActual === 'armas' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <WeaponListContent />
          </div>
        )}

        {/* Contenido: Gestión de Categorías - Para Jefe de Ventas */}
        {state.vistaActual === 'categorias' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <WeaponCategoryList />
          </div>
        )}
          </>
        )}

        {/* Modal de Reasignar Arma */}
        <ModalReasignarArma
          isOpen={state.modalReasignarArma.isOpen}
          cliente={state.modalReasignarArma.cliente}
          onClose={() => state.setModalReasignarArma({ isOpen: false, cliente: null, isLoading: false })}
        />

        {/* Modal de Editar Arma */}
        <ModalEditarArma
          state={state.modalEditarArma}
          onArmaChange={(arma, nuevoPrecio) => state.setModalEditarArma(prev => ({ ...prev, armaSeleccionada: arma, nuevoPrecio }))}
          onPrecioChange={(precio) => state.setModalEditarArma(prev => ({ ...prev, nuevoPrecio: precio }))}
          onConfirm={handlers.handleConfirmarEditarArma}
          onClose={() => state.setModalEditarArma({ isOpen: false, clienteArma: null, armasDisponibles: [], armaSeleccionada: null, nuevoPrecio: '', isLoading: false })}
        />

        {/* Modal de Desistimiento */}
        <ModalDesistimiento
          state={state.modalDesistimiento}
          onObservacionChange={(obs) => state.setModalDesistimiento(prev => ({ ...prev, observacion: obs }))}
          onConfirm={handlers.handleConfirmarDesistimiento}
          onClose={() => state.setModalDesistimiento({ isOpen: false, cliente: null, observacion: '', isLoading: false })}
        />

        {/* Modal de Cliente Reasignado */}
        <ModalClienteReasignado
          state={state.modalClienteReasignado}
          clientes={state.clientes}
          onClienteChange={(clienteId) => state.setModalClienteReasignado(prev => ({ ...prev, nuevoClienteId: clienteId }))}
          onConfirm={handlers.handleConfirmarClienteReasignado}
          onClose={() => state.setModalClienteReasignado({ isOpen: false, arma: null, nuevoClienteId: null, isLoading: false })}
        />

        {/* Modal de Generar Autorización de Venta */}
        <ModalAutorizacion
          isOpen={state.mostrarModalAutorizacion}
          cliente={state.clienteAutorizacion}
          autorizaciones={state.autorizaciones}
          weaponAssignment={state.clienteAutorizacion ? state.clientWeaponAssignments[state.clienteAutorizacion.id] : undefined}
          numeroFactura={state.numeroFacturaAutorizacion}
          onNumeroFacturaChange={state.setNumeroFacturaAutorizacion}
          tramite={state.tramiteAutorizacion}
          onTramiteChange={state.setTramiteAutorizacion}
          generando={state.generandoAutorizacion}
          onConfirm={handlers.handleConfirmarGeneracionAutorizacion}
          onClose={handlers.handleCerrarModalAutorizacion}
        />
      </div>
    </div>
  );
};

export default JefeVentas;
