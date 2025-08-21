import React from 'react';
import type { Client } from '../types';
import type { Arma } from '../hooks/useArmas';
import { validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';

interface WeaponReserveProps {
  weapons: Arma[];
  currentClient: Client | null;
  reservaParaCliente: Client | null;
  clienteParaResumen: Client | null;
  armaSeleccionadaEnReserva: Arma | null;
  onBack: () => void;
  onWeaponSelection: (weapon: Arma | null) => void;
  onWeaponSelectionInReserve: (weapon: Arma | null) => void;
  onAssignWeaponToClient: (client: Client, weapon: Arma) => void;
  onAssignWeaponToCupoCivil: (weapon: Arma) => void;
  onConfirmData: () => void;
  onUpdateWeaponPrice: (weaponId: number, newPrice: number) => void;
  onUpdateWeaponQuantity: (weaponId: number, newQuantity: number) => void;
  getWeaponPriceForClient: (weaponId: number, clientId?: string) => number;
  currentClientId?: string;
}

const WeaponReserve: React.FC<WeaponReserveProps> = ({
  weapons,
  currentClient,
  reservaParaCliente,
  clienteParaResumen,
  armaSeleccionadaEnReserva,
  onBack,
  // onWeaponSelection,
  onWeaponSelectionInReserve,
  // onAssignWeaponToClient,
  onConfirmData,
  onUpdateWeaponPrice,
  onUpdateWeaponQuantity,
  getWeaponPriceForClient,
  currentClientId
}) => {
  console.log('🔫 WeaponReserve - COMPONENTE INICIADO - SIMPLE');
  
  // LOGS DE DEPURACIÓN - VER EXACTAMENTE QUÉ RECIBE EL COMPONENTE
  console.log('🔫 WeaponReserve - Props weapons recibidas:', weapons);
  console.log('🔫 WeaponReserve - Tipo de weapons:', typeof weapons);
  console.log('🔫 WeaponReserve - Es array:', Array.isArray(weapons));
  console.log('🔫 WeaponReserve - Longitud de weapons:', weapons?.length || 0);
  
  if (Array.isArray(weapons)) {
    console.log('🔫 WeaponReserve - ✅ weapons es array - Analizando contenido...');
    console.log('🔫 WeaponReserve - Primeras 3 armas:', weapons.slice(0, 3));
    console.log('🔫 WeaponReserve - Últimas 3 armas:', weapons.slice(-3));
    
    // Verificar estructura de cada arma
    weapons.forEach((weapon, index) => {
      console.log(`🔫 WeaponReserve - Arma ${index + 1} recibida:`, {
        id: weapon.id,
        nombre: weapon.nombre,
        codigo: weapon.codigo,
        calibre: weapon.calibre,
        categoriaNombre: weapon.categoriaNombre,
        precioReferencia: weapon.precioReferencia,
        urlImagen: weapon.urlImagen,
        armaCompleta: weapon
      });
    });
    
    // Verificar armas sin nombre
    const armasSinNombre = weapons.filter(weapon => !weapon.nombre);
    if (armasSinNombre.length > 0) {
      console.error('🔫 WeaponReserve - ❌ ARMAS SIN NOMBRE ENCONTRADAS:', armasSinNombre);
    } else {
      console.log('🔫 WeaponReserve - ✅ Todas las armas tienen nombre');
    }
  } else {
    console.error('🔫 WeaponReserve - ❌ weapons NO es array:', weapons);
    console.error('🔫 WeaponReserve - Estructura completa:', JSON.stringify(weapons, null, 2));
  }
  
  // Estado local para cantidades por arma
  const [cantidades, setCantidades] = React.useState<Record<number, number>>({});
  const [preciosEnEdicion, setPreciosEnEdicion] = React.useState<Record<number, string>>({});

  // Handler para cantidad
  const handleCantidadChange = (weaponId: number, value: string) => {
    const cantidad = Math.max(1, parseInt(value.replace(/[^0-9]/g, '')) || 1);
    setCantidades(prev => ({ ...prev, [weaponId]: cantidad }));
    if (onUpdateWeaponQuantity) onUpdateWeaponQuantity(weaponId, cantidad);
  };

  // Handler para precio
  const handlePrecioChange = (weaponId: number, value: string) => {
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
  const formatPrecioForDisplay = (precio: number | undefined | null) => {
    if (precio === undefined || precio === null || precio === 0) return '';
    // Mostrar el precio con formato uniforme usando punto como separador decimal
    return precio.toFixed(2);
  };

  // Función para obtener la imagen del arma con detección automática de formato
  const getWeaponImage = (weapon: Arma): string => {
    // Si la arma tiene URL de imagen en la base de datos, usarla
    if (weapon.urlImagen && weapon.urlImagen.trim() !== '') {
      console.log(`🔍 Usando imagen de BD para ${weapon.codigo}: ${weapon.urlImagen}`);
      return weapon.urlImagen;
    }
    
    // Si no hay URL en BD, usar imagen por defecto
    console.log(`🔍 No hay imagen en BD para ${weapon.codigo}, usando imagen por defecto`);
    return '/images/weapons/default-weapon.jpg';
  };





   // Determinar si es empresa
   const esEmpresa = (currentClient?.tipoCliente === 'Compañía de Seguridad' || reservaParaCliente?.tipoCliente === 'Compañía de Seguridad' || clienteParaResumen?.tipoCliente === 'Compañía de Seguridad');

  const handleWeaponClick = (weapon: Arma) => {
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

    // Si ya está seleccionada, deseleccionarla
    if (armaSeleccionadaEnReserva?.id === weapon.id) {
      onWeaponSelectionInReserve(null);
      return;
    }

    // Seleccionar la nueva arma
    onWeaponSelectionInReserve(weapon);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="container mx-auto px-4 py-8">
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
              {(() => {
                console.log('🔫 WeaponReserve - Renderizando weapons:', weapons);
                console.log('🔫 WeaponReserve - Total de weapons:', weapons?.length || 0);
                console.log('🔫 WeaponReserve - Tipo de weapons:', typeof weapons);
                console.log('🔫 WeaponReserve - Es array:', Array.isArray(weapons));
                if (Array.isArray(weapons)) {
                  console.log('🔫 WeaponReserve - Primeras 3 armas:', weapons.slice(0, 3));
                  console.log('🔫 WeaponReserve - Últimas 3 armas:', weapons.slice(-3));
                }
                return null;
              })()}
              
              {/* Contador de armas visible */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-center">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    Total de armas disponibles: {weapons?.length || 0}
                  </span>
                </div>
              </div>
              
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {(() => {
                  console.log('🔫 WeaponReserve - Iniciando mapeo de weapons');
                  return null;
                })()}
                {weapons.map((weapon, index) => {
                  console.log(`🔫 WeaponReserve - Renderizando arma ${index + 1}/${weapons.length}:`, {
                    id: weapon.id,
                    nombre: weapon.nombre,
                    codigo: weapon.codigo,
                    calibre: weapon.calibre,
                    categoriaNombre: weapon.categoriaNombre,
                    precioReferencia: weapon.precioReferencia,
                    urlImagen: weapon.urlImagen,
                    armaCompleta: weapon
                  });
                  const iva = 0.15;
                  const cantidad = cantidades[weapon.id] || 1;
                  const precioBase = getWeaponPriceForClient(weapon.id, currentClientId);
                  
                  // Usar el precio modificado si existe, sino el precio base
                  const precioModificado = preciosEnEdicion[weapon.id] !== undefined 
                    ? parseFloat(preciosEnEdicion[weapon.id]) || precioBase
                    : precioBase;
                  
                  // Logs para debuggear el precio
                  console.log(`🔍 Arma ${weapon.id} - Precio Base: ${precioBase}, Precio Modificado: ${precioModificado}, Cantidad: ${cantidad}`);
                  
                  const subtotal = precioModificado * cantidad;
                  const ivaCalculado = subtotal * iva;
                  const precioFinal = subtotal + ivaCalculado;
                  
                  console.log(`🔍 Arma ${weapon.id} - Subtotal: ${subtotal}, IVA: ${ivaCalculado}, Total: ${precioFinal}`);
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
                                                       {/* Imagen del arma desde la base de datos */}
                                                         {/* Imagen del arma con múltiples formatos */}
                                                         <picture>
                                                           {/* Fuentes de imagen en orden de prioridad */}
                                                           <source srcSet={`${getWeaponImage(weapon)}.webp`} type="image/webp" />
                                                           <source srcSet={`${getWeaponImage(weapon)}.png`} type="image/png" />
                                                           <source srcSet={`${getWeaponImage(weapon)}.jpg`} type="image/jpeg" />
                                                           <source srcSet={`${getWeaponImage(weapon)}.jpeg`} type="image/jpeg" />
                                                           <source srcSet={`${getWeaponImage(weapon)}.svg`} type="image/svg+xml" />
                                                           <source srcSet={`${getWeaponImage(weapon)}.gif`} type="image/gif" />
                                                           
                                                           {/* Imagen principal con fallback */}
                                                           <img 
                                                             src={`${getWeaponImage(weapon)}.jpg`}
                                                             alt={weapon.nombre} 
                                                             className="w-full h-48 object-cover rounded-t-2xl"
                                                             onLoad={() => console.log(`✅ Imagen cargada exitosamente: ${weapon.codigo} -> ${getWeaponImage(weapon)}`)}
                                                             onError={(e) => {
                                                               console.log(`❌ Error cargando imagen para ${weapon.codigo}:`, e);
                                                               console.log(`❌ Ruta intentada: ${getWeaponImage(weapon)}`);
                                                               
                                                               // Intentar con otros formatos
                                                               const target = e.target as HTMLImageElement;
                                                               const currentSrc = target.src;
                                                               const baseUrl = currentSrc.substring(0, currentSrc.lastIndexOf('.'));
                                                               
                                                               // Si falla JPG, intentar PNG
                                                               if (currentSrc.endsWith('.jpg')) {
                                                                 target.src = `${baseUrl}.png`;
                                                                 return;
                                                               }
                                                               
                                                               // Si falla PNG, intentar WebP
                                                               if (currentSrc.endsWith('.png')) {
                                                                 target.src = `${baseUrl}.webp`;
                                                                 return;
                                                               }
                                                               
                                                               // Si falla WebP, intentar SVG
                                                               if (currentSrc.endsWith('.webp')) {
                                                                 target.src = `${baseUrl}.svg`;
                                                                 return;
                                                               }
                                                               
                                                               // Si falla SVG, intentar GIF
                                                               if (currentSrc.endsWith('.svg')) {
                                                                 target.src = `${baseUrl}.gif`;
                                                                 return;
                                                               }
                                                               
                                                               // Si fallan todos, mostrar placeholder
                                                               console.log(`❌ Todos los formatos fallaron para ${weapon.codigo}`);
                                                               target.style.display = 'none';
                                                               target.nextElementSibling?.classList.remove('hidden');
                                                             }}
                                                           />
                                                         </picture>
                           {/* Placeholder SVG cuando no hay imagen */}
                           <div className="w-full h-48 bg-gray-200 rounded-t-2xl flex items-center justify-center hidden">
                             <div className="text-center text-gray-500">
                               <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               <p className="text-sm font-medium">Imagen no disponible</p>
                             </div>
                           </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Seleccionado
                          </div>
                        )}
                      </div>

                      {/* Información del arma */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{weapon.nombre}</h3>
                        
                        <div className="space-y-2 mb-4">
                          {weapon.calibre && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Calibre:</span>
                              <span className="font-semibold text-gray-900">{weapon.calibre}</span>
                            </div>
                          )}
                          {weapon.capacidad && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Capacidad:</span>
                              <span className="font-semibold text-gray-900">{weapon.capacidad}</span>
                            </div>
                          )}
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
                                  value={preciosEnEdicion[weapon.id] !== undefined ? preciosEnEdicion[weapon.id] : formatPrecioForDisplay(precioModificado)}
                                  onChange={e => handlePrecioChange(weapon.id, e.target.value)}
                                  onBlur={e => {
                                    const value = parseFloat(e.target.value) || precioBase;
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
    </div>
  );
};

export default WeaponReserve; 