import React, { useEffect } from 'react';
import type { Client } from '../types';
import type { Arma } from '../hooks/useArmas';
import { validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';
import { useIVA } from '../../../hooks/useConfiguracion';
import { apiService } from '../../../services/api';
import { getWeaponImageUrlWithCacheBusting } from '../../../utils/imageUtils';

type SelectedArma = Arma & { cantidad?: number };

interface WeaponReserveProps {
  weapons: Arma[];
  currentClient: Client | null;
  reservaParaCliente: Client | null;
  clienteParaResumen: Client | null;
  armaSeleccionadaEnReserva: Arma | null;
  selectedWeapons: SelectedArma[];
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
  isCreatingClient?: boolean;
  tipoCliente?: string; // Tipo de cliente para filtrar categorías
  respuestas?: Array<{ pregunta: string; respuesta: string }>; // Respuestas del cliente para validar límites
}

const WeaponReserve: React.FC<WeaponReserveProps> = ({
  weapons,
  currentClient,
  reservaParaCliente,
  clienteParaResumen,
  armaSeleccionadaEnReserva,
  selectedWeapons,
  onBack,
  // onWeaponSelection,
  onWeaponSelectionInReserve,
  // onAssignWeaponToClient,
  onConfirmData,
  onUpdateWeaponPrice,
  onUpdateWeaponQuantity,
  getWeaponPriceForClient,
  currentClientId,
  isCreatingClient = false,
  tipoCliente,
  respuestas = []
}) => {
 
  if (!Array.isArray(weapons)) {
    console.error('WeaponReserve: weapons no es un array, tipo recibido:', typeof weapons);
  }
  
  const { iva: ivaDecimal, ivaPorcentaje } = useIVA();
  
  const [cantidades, setCantidades] = React.useState<Record<number, number>>({});
  const [preciosEnEdicion, setPreciosEnEdicion] = React.useState<Record<number, string>>({});
  
  const getTipoClienteActual = (): string | null => {
    return tipoCliente || 
           currentClient?.tipoCliente || 
           reservaParaCliente?.tipoCliente || 
           clienteParaResumen?.tipoCliente || 
           null;
  };
  
  const esDeportista = (): boolean => {
    const tipo = getTipoClienteActual();
    return tipo === 'Deportista';
  };

  const esEmpresa = (): boolean => {
    const tipo = getTipoClienteActual();
    return tipo === 'Compañía de Seguridad' || tipo === 'Compania de Seguridad';
  };
  
  const esCivil = (): boolean => {
    const tipo = getTipoClienteActual();
    return tipo === 'Civil' || tipo === 'Cliente Civil';
  };

  const esUniformado = (): boolean => {
    const tipo = (getTipoClienteActual() || '').toLowerCase();
    return tipo.includes('militar') || tipo.includes('policial') || tipo.includes('policia');
  };
  
  const obtenerRespuestaArmasRegistradas = React.useMemo(() => {
    if (!respuestas || respuestas.length === 0) return null;
    const preguntaArmas = respuestas.find(r => 
      r.pregunta && r.pregunta.toLowerCase().includes('armas registradas')
    );
    return preguntaArmas?.respuesta || null;
  }, [respuestas]);

  const limiteMaximoArmas = React.useMemo(() => {
    if (esDeportista() || esEmpresa()) {
      return Infinity;
    }

    if (esUniformado()) {
      return 2;
    }
    
    // Para "Asignar arma sin cliente" (cliente fantasma), siempre se permite 2 armas
    // ya que el cliente fantasma no tiene respuestas previamente guardadas
    const respuesta = obtenerRespuestaArmasRegistradas;
    if (!respuesta) return 2;

    if (respuesta.toUpperCase().includes('NO') || respuesta.toUpperCase().includes('NO TIENE')) {
      return 2;
    }
    
    if (respuesta.includes('1 arma') || respuesta.includes('1 ARMA')) {
      return 1;
    }

    // Ya tiene el máximo legal
    if (respuesta.includes('2 armas') || respuesta.includes('más armas') ||
        respuesta.includes('2 ARMAS') || respuesta.includes('MÁS')) {
      return 0;
    }

    return 2;
  }, [obtenerRespuestaArmasRegistradas, esEmpresa]);

  const permiteSeleccionMultiple = React.useMemo(() => {
    return limiteMaximoArmas === Infinity || limiteMaximoArmas > 1;
  }, [limiteMaximoArmas]);

  const [armasSeleccionadas, setArmasSeleccionadas] = React.useState<SelectedArma[]>([]);

  const totalSeleccionado = React.useMemo(() => {
    return armasSeleccionadas.reduce((sum, arma) => {
      const cantidadArma = cantidades[arma.id] || 1;
      return sum + cantidadArma;
    }, 0);
  }, [armasSeleccionadas, cantidades]);
  
  React.useEffect(() => {
    if (!permiteSeleccionMultiple) {
      return;
    }

    if (!Array.isArray(selectedWeapons)) {
      return;
    }

    if (selectedWeapons.length > 0) {
      setArmasSeleccionadas(selectedWeapons);
      setCantidades(prev => {
        const next = { ...prev };
        selectedWeapons.forEach(arma => {
          next[arma.id] = arma.cantidad || 1;
        });
        return next;
      });
    } else if (armasSeleccionadas.length > 0) {
      setArmasSeleccionadas([]);
    }
  }, [permiteSeleccionMultiple, selectedWeapons]);

  React.useEffect(() => {
    if (!permiteSeleccionMultiple) {
      if (!armaSeleccionadaEnReserva && armasSeleccionadas.length > 0) {
        setArmasSeleccionadas([]);
      } else if (armaSeleccionadaEnReserva) {
        setArmasSeleccionadas([armaSeleccionadaEnReserva]);
      }
      return;
    }

    if (Array.isArray(selectedWeapons) && selectedWeapons.length > 0) {
      return;
    }

    if (armaSeleccionadaEnReserva && !armasSeleccionadas.some(a => a.id === armaSeleccionadaEnReserva.id)) {
      setArmasSeleccionadas([...armasSeleccionadas, armaSeleccionadaEnReserva]);
    }
  }, [armaSeleccionadaEnReserva, permiteSeleccionMultiple, selectedWeapons, armasSeleccionadas]);
  
  const [todasLasCategorias, setTodasLasCategorias] = React.useState<Array<{ id: number; nombre: string; codigo: string }>>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = React.useState<string>('TODAS');
  
  const categoriaPermitida = (categoriaNombre: string | undefined, categoriaCodigo: string | undefined): boolean => {
    if (esDeportista()) {
      return true;
    }
    
    // Solo permitir: PISTOLA, ESCOPETA, CARABINAS .22 para no-deportistas
    if (!categoriaNombre && !categoriaCodigo) {
      return false;
    }
    
    const nombreUpper = (categoriaNombre || '').toUpperCase();
    const codigoUpper = (categoriaCodigo || '').toUpperCase();
    
    if (nombreUpper.includes('PISTOLA') || codigoUpper === 'PIST' || codigoUpper === 'PISTOLAS') {
      return true;
    }

    if (nombreUpper.includes('ESCOPETA') || codigoUpper === 'ESCO' || codigoUpper === 'ESCOPETAS') {
      return true;
    }

    if (nombreUpper.includes('CARABINA') && nombreUpper.includes('.22')) {
      return true;
    }
    if (codigoUpper === 'CAR22') {
      return true;
    }
    
    return false;
  };
  
  const categoriasPermitidas = React.useMemo(() => {
    if (!Array.isArray(todasLasCategorias)) {
      return [];
    }
    
    if (esDeportista()) {
      return todasLasCategorias;
    }
    
    return todasLasCategorias.filter(cat => {
      const nombreUpper = cat.nombre.toUpperCase();
      const codigoUpper = cat.codigo.toUpperCase();
      
      return nombreUpper.includes('PISTOLA') || codigoUpper === 'PIST' || codigoUpper === 'PISTOLAS' ||
             nombreUpper.includes('ESCOPETA') || codigoUpper === 'ESCO' || codigoUpper === 'ESCOPETAS' ||
             (nombreUpper.includes('CARABINA') && nombreUpper.includes('.22')) || codigoUpper === 'CAR22';
    });
  }, [todasLasCategorias, tipoCliente, currentClient?.tipoCliente, reservaParaCliente?.tipoCliente, clienteParaResumen?.tipoCliente]);
  
  const armasFiltradas = React.useMemo(() => {
    if (!Array.isArray(weapons)) {
      return [];
    }
    
    const tipo = getTipoClienteActual();
    let armasPermitidas = weapons;
    
    if (tipo) {
      armasPermitidas = weapons.filter(weapon => {
        return categoriaPermitida(weapon.categoriaNombre, weapon.categoriaCodigo);
      });
    }
    
    if (categoriaSeleccionada === 'TODAS') {
      return armasPermitidas;
    }
    
    return armasPermitidas.filter(weapon => {
      const nombreUpper = (weapon.categoriaNombre || '').toUpperCase();
      const codigoUpper = (weapon.categoriaCodigo || '').toUpperCase();
      const categoriaSeleccionadaUpper = categoriaSeleccionada.toUpperCase();
      
      return nombreUpper.includes(categoriaSeleccionadaUpper) || 
             codigoUpper === categoriaSeleccionadaUpper ||
             nombreUpper === categoriaSeleccionadaUpper;
    });
  }, [weapons, categoriaSeleccionada, tipoCliente, currentClient?.tipoCliente, reservaParaCliente?.tipoCliente, clienteParaResumen?.tipoCliente]);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const categorias = await apiService.getCategoriasArma();
        setTodasLasCategorias(categorias.filter((cat: any) => cat.estado).map((cat: any) => ({
          id: cat.id,
          nombre: cat.nombre,
          codigo: cat.codigo
        })));
      } catch (error) {
        console.error('Error cargando categorías:', error);
        setTodasLasCategorias([]);
      }
    };

    cargarCategorias();
  }, []);

  const handleCantidadChange = (weaponId: number, value: string) => {
    const nuevaCantidad = Math.max(1, parseInt(value.replace(/[^0-9]/g, '')) || 1);
    let cantidadFinal = nuevaCantidad;

    if (limiteMaximoArmas !== Infinity) {
      const cantidadActual = cantidades[weaponId] || 1;
      const totalSinEsta = totalSeleccionado - cantidadActual;
      const maxPermitidoParaEsta = Math.max(0, limiteMaximoArmas - totalSinEsta);
      if (maxPermitidoParaEsta === 0) {
        cantidadFinal = 1;
      } else {
        cantidadFinal = Math.min(nuevaCantidad, maxPermitidoParaEsta);
      }
    }

    setCantidades(prev => ({ ...prev, [weaponId]: cantidadFinal }));
    if (onUpdateWeaponQuantity) onUpdateWeaponQuantity(weaponId, cantidadFinal);
  };

  const handlePrecioChange = (weaponId: number, value: string) => {
    let cleanValue = value.replace(/[^0-9.,]/g, '');
    cleanValue = cleanValue.replace(',', '.');

    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    if (parts.length === 2 && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }

    setPreciosEnEdicion(prev => ({ ...prev, [weaponId]: cleanValue }));

    const newPrice = parseFloat(cleanValue);
    if (!isNaN(newPrice)) {
      onUpdateWeaponPrice(weaponId, newPrice);
    }
  };

  const formatPrecioForDisplay = (precio: number | undefined | null) => {
    if (precio === undefined || precio === null) return '';
    return precio.toFixed(2);
  };

  const WeaponImage = ({ weapon }: { weapon: Arma }) => {
    const displayName = weapon.modelo || 'Sin modelo';
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={getWeaponImageUrlWithCacheBusting(weapon.urlImagen)}
          alt={displayName}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== getWeaponImageUrlWithCacheBusting(null)) {
              target.src = getWeaponImageUrlWithCacheBusting(null);
            }
          }}
        />
      </div>
    );
  };





  const handleWeaponClick = (weapon: Arma) => {
    const cliente = currentClient || reservaParaCliente;
    if (cliente && cliente.fechaNacimiento) {
      const puedeComprar = validarEdadMinima(cliente.fechaNacimiento);
      if (!puedeComprar) {
        const mensajeError = obtenerMensajeErrorEdad(cliente.fechaNacimiento);
        alert(`❌ No se puede asignar arma: ${mensajeError}`);
        return;
      }
    }

    const precioEnEdicion = preciosEnEdicion[weapon.id];
    const precioActual = getWeaponPriceForClient(weapon.id, currentClientId) || 0;
    const precioIngresado = precioEnEdicion !== undefined ? (parseFloat(precioEnEdicion) || 0) : precioActual;
    if (precioIngresado <= 0) {
      alert('❌ Debes ingresar el precio antes de seleccionar el arma.');
      return;
    }

    if (permiteSeleccionMultiple) {
      if (limiteMaximoArmas === 0) {
        alert('❌ El cliente ya tiene el máximo de armas permitidas. No se pueden seleccionar más armas.');
        return;
      }

      const index = armasSeleccionadas.findIndex(a => a.id === weapon.id);
      if (index >= 0) {
        const nuevasArmas = armasSeleccionadas.filter(a => a.id !== weapon.id);
        setArmasSeleccionadas(nuevasArmas);
        setCantidades(prev => {
          const next = { ...prev };
          delete next[weapon.id];
          return next;
        });
        if (nuevasArmas.length === 1) {
          onWeaponSelectionInReserve(nuevasArmas[0]);
        } else if (nuevasArmas.length === 0) {
          onWeaponSelectionInReserve(null);
        }
      } else {
        if (limiteMaximoArmas !== Infinity && totalSeleccionado >= limiteMaximoArmas) {
          alert(`❌ Ya has seleccionado el máximo de ${limiteMaximoArmas} armas permitidas.`);
          return;
        }
        setCantidades(prev => ({ ...prev, [weapon.id]: 1 }));
        const nuevasArmas = [...armasSeleccionadas, weapon];
        setArmasSeleccionadas(nuevasArmas);
        if (nuevasArmas.length === 1) {
          onWeaponSelectionInReserve(weapon);
        }
      }
    } else {
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        onWeaponSelectionInReserve(null);
        return;
      }
      onWeaponSelectionInReserve(weapon);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 px-8 py-12 text-center text-white relative">
              <button 
                onClick={onBack}
                className="absolute left-4 top-4 sm:left-8 sm:top-8 bg-white text-red-600 hover:bg-red-50 rounded-lg px-4 py-3 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold group"
                title={isCreatingClient ? "Volver a datos del cliente" : "Volver al dashboard"}
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">
                  {isCreatingClient ? "Volver a datos del cliente" : "Volver"}
                </span>
              </button>

              <div className="flex items-center justify-center mb-4">
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

            <div className="p-8">
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
                  
                  {(currentClient || reservaParaCliente)?.fechaNacimiento && (
                    (() => {
                      const cliente = currentClient || reservaParaCliente;
                      const puedeComprar = cliente!.fechaNacimiento ? validarEdadMinima(cliente!.fechaNacimiento) : false;
                      const mensajeError = cliente!.fechaNacimiento ? obtenerMensajeErrorEdad(cliente!.fechaNacimiento) : 'Fecha de nacimiento no especificada';
                      
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


              {(currentClient || reservaParaCliente) && permiteSeleccionMultiple && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold text-yellow-800 mb-1">Límite de Armas</h3>
                        <p className="text-sm text-yellow-700">
                          {limiteMaximoArmas === Infinity
                            ? 'Sin límite de armas para este tipo de cliente.'
                            : `Máximo permitido: ${limiteMaximoArmas} arma(s).`}
                        </p>
                        {obtenerRespuestaArmasRegistradas && (
                          <p className="text-xs text-yellow-600 mt-1 italic">
                            Respuesta: {obtenerRespuestaArmasRegistradas}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-800">
                      Seleccionadas: <strong>{totalSeleccionado}</strong>
                      {limiteMaximoArmas !== Infinity && ` / ${limiteMaximoArmas}`}
                    </span>
                  </div>
                </div>
              )}

              {categoriasPermitidas.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por categoría:
                  </label>
                  <select
                    value={categoriaSeleccionada}
                    onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TODAS">Todas las categorías</option>
                    {categoriasPermitidas.map((categoria) => (
                      <option key={categoria.id} value={categoria.nombre}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {armasFiltradas.map((weapon) => {
                  const cantidad = cantidades[weapon.id] || 1;
                  const precioBaseArma = weapon.precioReferencia || 0;
                  const precioActual = getWeaponPriceForClient(weapon.id, currentClientId);
                  
                  const precioModificado = preciosEnEdicion[weapon.id] !== undefined
                    ? (parseFloat(preciosEnEdicion[weapon.id]) || 0)
                    : (precioActual || 0);
                  
                  const precioIngresado = preciosEnEdicion[weapon.id] !== undefined
                    ? (parseFloat(preciosEnEdicion[weapon.id]) || 0)
                    : precioModificado;
                  const precioMenorAlBase = precioIngresado > 0 && precioIngresado < precioBaseArma;
                  
                  const subtotal = precioModificado * cantidad;
                  const ivaCalculado = subtotal * ivaDecimal;
                  const precioFinal = subtotal + ivaCalculado;
                  
                  const isSelected = permiteSeleccionMultiple
                    ? armasSeleccionadas.some(a => a.id === weapon.id)
                    : armaSeleccionadaEnReserva?.id === weapon.id;
                  
                  return (
                    <div 
                      key={weapon.id} 
                      data-weapon-id={weapon.id}
                      className={`bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                        isSelected 
                          ? 'border-red-500 shadow-lg ring-4 ring-red-100' 
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                                               <div className="relative">
                           <WeaponImage weapon={weapon} />
                           {isSelected && (
                             <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                               Seleccionado
                             </div>
                           )}
                         </div>

                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {weapon.modelo || 'Sin modelo'}
                        </h3>
                        
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

                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">Precio Base:</label>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">$</span>
                                  <input
                                    type="text"
                                    value={preciosEnEdicion[weapon.id] !== undefined ? preciosEnEdicion[weapon.id] : formatPrecioForDisplay(precioModificado)}
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
                              {precioMenorAlBase && precioBaseArma > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded text-xs text-yellow-800">
                                  <p className="font-medium">⚠️ No se permite un precio menor a ${precioBaseArma.toFixed(2)} USD</p>
                                </div>
                              )}
                            </div>

                            {(permiteSeleccionMultiple || esEmpresa()) && (
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">Cantidad:</label>
                                <input
                                  type="text"
                                  value={cantidad}
                                  onChange={e => handleCantidadChange(weapon.id, e.target.value)}
                                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500"
                                  inputMode="numeric"
                                  pattern="^\\d+$"
                                  disabled={!isSelected}
                                />
                              </div>
                            )}

                            <div className="space-y-2 pt-3 border-t border-gray-200">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">IVA ({ivaPorcentaje}%):</span>
                                <span className="font-medium text-gray-900">${ivaCalculado.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-lg font-bold text-green-600 bg-green-50 p-3 rounded-lg">
                                <span>Total:</span>
                                <span>${precioFinal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

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

              {esCivil() && armasSeleccionadas.length > 1 && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Resumen Total ({armasSeleccionadas.length} armas)
                  </h3>
                  <div className="space-y-2">
                    {armasSeleccionadas.map((arma, index) => {
                      const precioArma = getWeaponPriceForClient(arma.id, currentClientId) || 0;
                      const precioEnEdicion = preciosEnEdicion[arma.id];
                          const precioFinal = precioEnEdicion !== undefined 
                            ? (parseFloat(precioEnEdicion) || 0)
                            : precioArma;
                          const cantidadArma = cantidades[arma.id] || 1;
                          const subtotal = precioFinal * cantidadArma;
                          const ivaArma = subtotal * ivaDecimal;
                      const totalArma = subtotal + ivaArma;
                      
                      return (
                        <div key={arma.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-blue-200">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Arma {index + 1}:</span>
                            <span className="text-sm text-gray-600 ml-2">{arma.modelo || 'Sin modelo'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-blue-600">${totalArma.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t-2 border-blue-300 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-800">TOTAL GENERAL:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${armasSeleccionadas.reduce((sum, arma) => {
                            const precioArma = getWeaponPriceForClient(arma.id, currentClientId) || 0;
                            const precioEnEdicion = preciosEnEdicion[arma.id];
                            const precioFinal = precioEnEdicion !== undefined 
                              ? (parseFloat(preciosEnEdicion[arma.id]) || 0)
                              : precioArma;
                            const subtotal = precioFinal;
                            const ivaArma = subtotal * ivaDecimal;
                            return sum + subtotal + ivaArma;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (() => {
                const armasParaValidar = permiteSeleccionMultiple && armasSeleccionadas.length > 0
                  ? armasSeleccionadas
                  : (armaSeleccionadaEnReserva ? [armaSeleccionadaEnReserva] : []);
                
                let precioValido = true;
                let mensajeDeshabilitado = permiteSeleccionMultiple
                  ? 'Selecciona al menos 1 arma para continuar'
                  : 'Selecciona un arma para continuar';
                
                if (limiteMaximoArmas === 0) {
                  precioValido = false;
                  mensajeDeshabilitado = 'El cliente ya tiene el máximo de armas permitidas. No se pueden seleccionar más.';
                } else if (armasParaValidar.length === 0) {
                  precioValido = false;
                } else if (limiteMaximoArmas !== Infinity && totalSeleccionado > limiteMaximoArmas) {
                  precioValido = false;
                  mensajeDeshabilitado = `Has seleccionado ${totalSeleccionado} armas, pero el límite máximo es ${limiteMaximoArmas}.`;
                } else {
                  for (const arma of armasParaValidar) {
                    const precioArmaSeleccionada = getWeaponPriceForClient(arma.id, currentClientId);
                    const precioBaseArma = arma.precioReferencia || 0;
                    
                    const precioEnEdicion = preciosEnEdicion[arma.id];
                    const precioFinal = precioEnEdicion !== undefined 
                      ? (parseFloat(precioEnEdicion) || 0)
                      : precioArmaSeleccionada;
                    
                    if (precioFinal <= 0) {
                      precioValido = false;
                      mensajeDeshabilitado = `Ingresa un precio válido para ${arma.modelo || 'el arma'}`;
                      break;
                    } else if (precioBaseArma > 0 && precioFinal < precioBaseArma) {
                      precioValido = false;
                      mensajeDeshabilitado = `El precio de ${arma.modelo || 'el arma'} debe ser mayor o igual a $${precioBaseArma.toFixed(2)} USD`;
                      break;
                    }
                  }
                }
                
                const puedeConfirmar = armasParaValidar.length > 0 && precioValido;
                
                return (
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        if (permiteSeleccionMultiple && armasSeleccionadas.length > 0) {
                          const armasConCantidad = armasSeleccionadas.map((arma) => {
                            const precioArma = getWeaponPriceForClient(arma.id, currentClientId) || 0;
                            const precioEnEdicion = preciosEnEdicion[arma.id];
                            const precioFinal = precioEnEdicion !== undefined
                              ? (parseFloat(precioEnEdicion) || 0)
                              : precioArma;
                            return {
                              ...arma,
                              cantidad: cantidades[arma.id] || 1,
                              precioUnitario: precioFinal
                            };
                          });
                          (onConfirmData as any)({ armas: armasConCantidad, esMultiple: true });
                        } else if (armaSeleccionadaEnReserva) {
                          onConfirmData();
                        }
                      }}
                      disabled={!puedeConfirmar}
                      className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                        puedeConfirmar
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {puedeConfirmar 
                        ? (permiteSeleccionMultiple && armasSeleccionadas.length > 1
                            ? `✓ Confirmar ${totalSeleccionado} Armas Seleccionadas`
                            : '✓ Confirmar Selección')
                        : mensajeDeshabilitado}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaponReserve; 