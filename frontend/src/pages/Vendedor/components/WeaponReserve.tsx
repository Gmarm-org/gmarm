import React from 'react';
import type { Weapon, Client } from '../types';
import { validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';

interface WeaponReserveProps {
  weapons: Weapon[];
  currentClient: Client | null;
  reservaParaCliente: Client | null;
  clienteParaResumen: Client | null;
  armaSeleccionadaEnReserva: Weapon | null;
  onBack: () => void;
  onWeaponSelection: (weapon: Weapon | null) => void;
  onWeaponSelectionInReserve: (weapon: Weapon | null) => void;
  onAssignWeaponToClient: (client: Client, weapon: Weapon) => void;
  onAssignWeaponToCupoCivil: (weapon: Weapon) => void;
  onConfirmData: () => void;
  onUpdateWeaponPrice: (weaponId: string, newPrice: number) => void;
  onUpdateWeaponQuantity: (weaponId: string, newQuantity: number) => void;
  getWeaponPriceForClient: (weaponId: string, clientId?: string) => number;
  currentClientId?: string;
}

const WeaponReserve: React.FC<WeaponReserveProps> = ({
  weapons,
  currentClient,
  reservaParaCliente,
  clienteParaResumen,
  armaSeleccionadaEnReserva,
  onBack,
  onWeaponSelectionInReserve,
  onAssignWeaponToClient,
  onConfirmData,
  onUpdateWeaponPrice,
  onUpdateWeaponQuantity,
  getWeaponPriceForClient,
  currentClientId
}) => {
  // Estado local para cantidades por arma
  const [cantidades, setCantidades] = React.useState<Record<string, number>>({});
  const [preciosEnEdicion, setPreciosEnEdicion] = React.useState<Record<string, string>>({});

  // Handler para cantidad
  const handleCantidadChange = (weaponId: string, value: string) => {
    const cantidad = Math.max(1, parseInt(value.replace(/[^0-9]/g, '')) || 1);
    setCantidades(prev => ({ ...prev, [weaponId]: cantidad }));
    if (onUpdateWeaponQuantity) onUpdateWeaponQuantity(weaponId, cantidad);
  };

  // Handler para precio
  const handlePrecioChange = (weaponId: string, value: string) => {
    // Permitir números, punto y coma decimal
    let cleanValue = value.replace(/[^0-9.,]/g, '');
    
    // Convertir coma a punto para procesamiento interno
    cleanValue = cleanValue.replace(',', '.');
    
    // Asegurar que solo haya un punto decimal
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limitar a máximo 2 decimales
    if (parts.length === 2 && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Guardar el valor en el estado local
    setPreciosEnEdicion(prev => ({ ...prev, [weaponId]: cleanValue }));
    
    // Actualizar el precio solo si es un número válido
    const newPrice = parseFloat(cleanValue);
    if (!isNaN(newPrice)) {
      onUpdateWeaponPrice(weaponId, newPrice);
    }
  };

  // Función para formatear el precio para mostrar
  const formatPrecioForDisplay = (precio: number) => {
    if (precio === 0) return '';
    // Mostrar el precio con formato uniforme usando punto como separador decimal
    return precio.toFixed(2);
  };

  // Determinar si es empresa
  const esEmpresa = (currentClient?.tipoCliente === 'Compañía de Seguridad' || reservaParaCliente?.tipoCliente === 'Compañía de Seguridad' || clienteParaResumen?.tipoCliente === 'Compañía de Seguridad');

  const handleWeaponClick = (weapon: Weapon) => {
    // Verificar edad del cliente antes de permitir asignación
    const cliente = currentClient || reservaParaCliente;
    if (cliente && cliente.fechaNacimiento) {
      const puedeComprar = validarEdadMinima(cliente.fechaNacimiento);
      if (!puedeComprar) {
        const mensajeError = obtenerMensajeErrorEdad(cliente.fechaNacimiento);
        alert(`❌ No se puede asignar arma: ${mensajeError}`);
        return;
      }
    }

    if (!currentClient && !reservaParaCliente && !clienteParaResumen) {
      // Para "Reserva armas sin cliente" - permitir selección/deselección
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        // Si ya está seleccionada, la deselecciona
        onWeaponSelectionInReserve(null);
      } else {
        // Si no está seleccionada, la selecciona
        onWeaponSelectionInReserve(weapon);
      }
    } else if (clienteParaResumen) {
      // Para cliente en proceso de creación
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        // Si ya está seleccionada, la deselecciona
        onWeaponSelectionInReserve(null);
      } else {
        // Si no está seleccionada, la selecciona
        onWeaponSelectionInReserve(weapon);
      }
    } else {
      // Para cliente existente - asignación directa
      onAssignWeaponToClient((currentClient || reservaParaCliente) as Client, weapon);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 px-8 py-12 text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <button 
                onClick={onBack}
                className="absolute left-8 top-12 bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="bg-white/20 p-4 rounded-full mr-4 backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Selección de Armas</h1>
                <p className="text-xl text-red-100">Elige el modelo que mejor se adapte a tus necesidades</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Información del Cliente */}
            {(currentClient || reservaParaCliente) && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Cliente Seleccionado</h2>
                    <p className="text-blue-600 font-medium">
                      {`${(currentClient || reservaParaCliente)?.nombres || ''} ${(currentClient || reservaParaCliente)?.apellidos || ''}`}
                    </p>
                  </div>
                </div>
                
                {/* Validación de edad */}
                {(currentClient || reservaParaCliente)?.fechaNacimiento && (
                  (() => {
                    const cliente = currentClient || reservaParaCliente;
                    const puedeComprar = validarEdadMinima(cliente!.fechaNacimiento);
                    const mensajeError = obtenerMensajeErrorEdad(cliente!.fechaNacimiento);
                    
                    if (!puedeComprar) {
                      return (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700 font-medium">ADVERTENCIA: {mensajeError}</p>
                              <p className="text-sm text-red-600 mt-1">No se puede proceder con la compra de armas.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700 font-medium">Cliente cumple con la edad mínima para comprar armas</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Mensaje informativo */}
            {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-center">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium">Selecciona un modelo de arma para continuar</span>
                </div>
              </div>
            )}

            {/* Grid de Armas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {weapons.map(weapon => {
                const iva = 0.15;
                const cantidad = cantidades[weapon.id] || 1;
                const precioBase = getWeaponPriceForClient(weapon.id, currentClientId);
                const subtotal = precioBase * cantidad;
                const ivaCalculado = subtotal * iva;
                const precioFinal = subtotal + ivaCalculado;
                const isSelected = armaSeleccionadaEnReserva?.id === weapon.id;
                
                return (
                  <div 
                    key={weapon.id} 
                    className={`bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                      isSelected 
                        ? 'border-red-500 shadow-lg ring-4 ring-red-100' 
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {/* Imagen del arma */}
                    <div className="relative">
                      <img 
                        src={weapon.imagen} 
                        alt={weapon.modelo} 
                        className="w-full h-48 object-cover rounded-t-2xl"
                      />
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Seleccionado
                        </div>
                      )}
                    </div>

                    {/* Información del arma */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{weapon.modelo}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Calibre:</span>
                          <span className="font-semibold text-gray-900">{weapon.calibre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacidad:</span>
                          <span className="font-semibold text-gray-900">{weapon.capacidad}</span>
                        </div>
                      </div>

                      {/* Sección de Precio */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="space-y-3">
                          {/* Precio Base */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-700">Precio Base:</label>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">$</span>
                              <input
                                type="text"
                                value={preciosEnEdicion[weapon.id] !== undefined ? preciosEnEdicion[weapon.id] : formatPrecioForDisplay(precioBase)}
                                onChange={e => handlePrecioChange(weapon.id, e.target.value)}
                                onBlur={e => {
                                  const value = parseFloat(e.target.value) || 0;
                                  onUpdateWeaponPrice(weapon.id, value);
                                  setPreciosEnEdicion(prev => {
                                    const newState = { ...prev };
                                    delete newState[weapon.id];
                                    return newState;
                                  });
                                }}
                                placeholder="0.00"
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500"
                                inputMode="decimal"
                              />
                            </div>
                          </div>

                          {/* Cantidad para empresas */}
                          {esEmpresa && (
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
                              <input
                                type="text"
                                value={cantidad}
                                onChange={e => handleCantidadChange(weapon.id, e.target.value)}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500"
                                inputMode="numeric"
                                pattern="^\\d+$"
                              />
                            </div>
                          )}

                          {/* Cálculos */}
                          <div className="space-y-2 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">IVA (15%):</span>
                              <span className="font-medium text-gray-900">${ivaCalculado.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-green-600 bg-green-50 p-3 rounded-lg">
                              <span>Total:</span>
                              <span>${precioFinal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Asignación */}
                      <button 
                        onClick={() => handleWeaponClick(weapon)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isSelected ? '✓ Seleccionado' : 'Seleccionar Arma'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón Confirmar */}
            {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (
              <div className="flex justify-center">
                <button 
                  onClick={onConfirmData}
                  disabled={!armaSeleccionadaEnReserva}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                    armaSeleccionadaEnReserva
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {armaSeleccionadaEnReserva ? '✓ Confirmar Selección' : 'Selecciona un arma para continuar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaponReserve; 