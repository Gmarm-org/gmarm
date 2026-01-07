import React, { useEffect } from 'react';
import type { Client } from '../types';
import type { Arma } from '../hooks/useArmas';
import { validarEdadMinima, obtenerMensajeErrorEdad } from '../../../utils/ageValidation';
import { useIVA } from '../../../hooks/useConfiguracion';
import { apiService } from '../../../services/api';
import { getWeaponImageUrlWithCacheBusting } from '../../../utils/imageUtils';

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
 
  // Validando estructura de armas recibidas
  if (!Array.isArray(weapons)) {
    console.error('WeaponReserve: weapons no es un array:', weapons);
  }
  
  // Obtener IVA dinámicamente desde la BD
  const { iva: ivaDecimal, ivaPorcentaje } = useIVA();
  
  // Estado local para cantidades por arma
  const [cantidades, setCantidades] = React.useState<Record<number, number>>({});
  const [preciosEnEdicion, setPreciosEnEdicion] = React.useState<Record<number, string>>({});
  
  // Obtener respuesta sobre armas registradas del cliente
  const obtenerRespuestaArmasRegistradas = React.useMemo(() => {
    if (!respuestas || respuestas.length === 0) return null;
    const preguntaArmas = respuestas.find(r => 
      r.pregunta && r.pregunta.toLowerCase().includes('armas registradas')
    );
    return preguntaArmas?.respuesta || null;
  }, [respuestas]);

  // Determinar límite máximo de armas según respuesta del cliente
  const limiteMaximoArmas = React.useMemo(() => {
    if (!esCivil()) {
      return esDeportista() ? Infinity : 1; // Deportista sin límite, otros 1
    }
    
    const respuesta = obtenerRespuestaArmasRegistradas;
    if (!respuesta) return 2; // Si no hay respuesta, permitir 2 por defecto
    
    // Si respondió "NO" o no tiene armas, puede seleccionar 2
    if (respuesta.toUpperCase().includes('NO') || respuesta.toUpperCase().includes('NO TIENE')) {
      return 2;
    }
    
    // Si respondió "1 arma", solo puede seleccionar 1 más (máximo 2 total)
    if (respuesta.includes('1 arma') || respuesta.includes('1 ARMA')) {
      return 1; // Solo puede agregar 1 más
    }
    
    // Si respondió "2 armas" o más, no puede seleccionar ninguna (ya tiene el máximo)
    if (respuesta.includes('2 armas') || respuesta.includes('más armas') || 
        respuesta.includes('2 ARMAS') || respuesta.includes('MÁS')) {
      return 0; // Ya tiene el máximo legal
    }
    
    // Por defecto, si responde "SI" sin especificar cantidad, permitir 2
    return 2;
  }, [obtenerRespuestaArmasRegistradas]);

  // Estado para cantidad de armas a seleccionar (solo para Cliente Civil: 1 o 2)
  // Inicializar con un valor por defecto (se actualizará en useEffect)
  const [cantidadArmasACeleccionar, setCantidadArmasACeleccionar] = React.useState<number>(2);

  // Actualizar cantidad cuando cambia el límite (esto se ejecuta después de que limiteMaximoArmas esté disponible)
  React.useEffect(() => {
    if (limiteMaximoArmas === 0) {
      setCantidadArmasACeleccionar(0);
    } else if (limiteMaximoArmas === 1) {
      setCantidadArmasACeleccionar(1);
    } else if (limiteMaximoArmas >= 2) {
      setCantidadArmasACeleccionar(2);
    }
  }, [limiteMaximoArmas]);
  
  // Estado para múltiples armas seleccionadas (para Cliente Civil con 2 armas)
  const [armasSeleccionadas, setArmasSeleccionadas] = React.useState<Arma[]>([]);
  
  // Sincronizar armasSeleccionadas con armaSeleccionadaEnReserva cuando cambia desde afuera
  React.useEffect(() => {
    if (armaSeleccionadaEnReserva && !armasSeleccionadas.some(a => a.id === armaSeleccionadaEnReserva.id)) {
      // Si hay una arma seleccionada desde afuera y no está en la lista, agregarla (para compatibilidad)
      if (!esCivil() || armasSeleccionadas.length < cantidadArmasACeleccionar) {
        setArmasSeleccionadas([...armasSeleccionadas, armaSeleccionadaEnReserva]);
      }
    } else if (!armaSeleccionadaEnReserva && armasSeleccionadas.length > 0 && !esCivil()) {
      // Si se deselecciona desde afuera y no es Civil, limpiar la lista
      setArmasSeleccionadas([]);
    }
  }, [armaSeleccionadaEnReserva]);
  
  // Estado para categorías y filtro
  const [todasLasCategorias, setTodasLasCategorias] = React.useState<Array<{ id: number; nombre: string; codigo: string }>>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = React.useState<string>('TODAS');
  
  // Filtrar armas según el tipo de cliente
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
  
  const esCivil = (): boolean => {
    const tipo = getTipoClienteActual();
    return tipo === 'Civil' || tipo === 'Cliente Civil';
  };
  
  // Función para verificar si una categoría está permitida
  const categoriaPermitida = (categoriaNombre: string | undefined, categoriaCodigo: string | undefined): boolean => {
    // Si es deportista, todas las categorías están permitidas
    if (esDeportista()) {
      return true;
    }
    
    // Para otros tipos, solo permitir: PISTOLA, ESCOPETA, CARABINAS .22
    if (!categoriaNombre && !categoriaCodigo) {
      return false; // Sin categoría, no permitir
    }
    
    const nombreUpper = (categoriaNombre || '').toUpperCase();
    const codigoUpper = (categoriaCodigo || '').toUpperCase();
    
    // Permitir PISTOLA (nombre o código)
    if (nombreUpper.includes('PISTOLA') || codigoUpper === 'PIST' || codigoUpper === 'PISTOLAS') {
      return true;
    }
    
    // Permitir ESCOPETA (nombre o código)
    if (nombreUpper.includes('ESCOPETA') || codigoUpper === 'ESCO' || codigoUpper === 'ESCOPETAS') {
      return true;
    }
    
    // Permitir CARABINAS .22 (nombre o código)
    if (nombreUpper.includes('CARABINA') && nombreUpper.includes('.22')) {
      return true;
    }
    if (codigoUpper === 'CAR22') {
      return true;
    }
    
    // No permitir otras categorías (CARABINAS 9MM, RIFLE, etc.)
    return false;
  };
  
  // Obtener categorías permitidas según el tipo de cliente
  const categoriasPermitidas = React.useMemo(() => {
    if (!Array.isArray(todasLasCategorias)) {
      return [];
    }
    
    if (esDeportista()) {
      // Deportista: todas las categorías
      return todasLasCategorias;
    }
    
    // Otros tipos: solo PISTOLA, ESCOPETA, CARABINAS .22
    return todasLasCategorias.filter(cat => {
      const nombreUpper = cat.nombre.toUpperCase();
      const codigoUpper = cat.codigo.toUpperCase();
      
      return nombreUpper.includes('PISTOLA') || codigoUpper === 'PIST' || codigoUpper === 'PISTOLAS' ||
             nombreUpper.includes('ESCOPETA') || codigoUpper === 'ESCO' || codigoUpper === 'ESCOPETAS' ||
             (nombreUpper.includes('CARABINA') && nombreUpper.includes('.22')) || codigoUpper === 'CAR22';
    });
  }, [todasLasCategorias, tipoCliente, currentClient?.tipoCliente, reservaParaCliente?.tipoCliente, clienteParaResumen?.tipoCliente]);
  
  // Filtrar armas según la categoría seleccionada en el dropdown
  const armasFiltradas = React.useMemo(() => {
    if (!Array.isArray(weapons)) {
      return [];
    }
    
    // Si no hay tipo de cliente definido, mostrar todas las armas (comportamiento por defecto)
    const tipo = getTipoClienteActual();
    let armasPermitidas = weapons;
    
    if (tipo) {
      // Primero filtrar por categorías permitidas según el tipo de cliente
      armasPermitidas = weapons.filter(weapon => {
        return categoriaPermitida(weapon.categoriaNombre, weapon.categoriaCodigo);
      });
    }
    
    // Luego filtrar por la categoría seleccionada en el dropdown
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

  // Cargar categorías al montar el componente
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
    if (precio === undefined || precio === null) return '';
    // Mostrar el precio con formato uniforme usando punto como separador decimal
    // Si es 0, mostrar '0.00' para que el vendedor pueda editarlo
    return precio.toFixed(2);
  };

  // Componente de imagen SIMPLE (igual que Admin - SIN carrusel por ahora)
  const WeaponImage = ({ weapon }: { weapon: Arma }) => {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={getWeaponImageUrlWithCacheBusting(weapon.urlImagen)}
          alt={weapon.nombre}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // Silenciosamente cambiar a imagen por defecto sin imprimir errores
            const target = e.target as HTMLImageElement;
            if (target.src !== getWeaponImageUrlWithCacheBusting(null)) {
              target.src = getWeaponImageUrlWithCacheBusting(null);
            }
          }}
        />
      </div>
    );
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

    // Si es Cliente Civil, manejar múltiples selecciones (máximo según límite)
    if (esCivil()) {
      // Si ya tiene el máximo de armas permitidas, no permitir más
      if (limiteMaximoArmas === 0) {
        alert('❌ El cliente ya tiene el máximo de armas registradas permitidas (2). No se pueden seleccionar más armas.');
        return;
      }
      
      const index = armasSeleccionadas.findIndex(a => a.id === weapon.id);
      if (index >= 0) {
        // Deseleccionar si ya está seleccionada
        const nuevasArmas = armasSeleccionadas.filter(a => a.id !== weapon.id);
        setArmasSeleccionadas(nuevasArmas);
        // Si solo queda una arma, actualizar la selección única
        if (nuevasArmas.length === 1) {
          onWeaponSelectionInReserve(nuevasArmas[0]);
        } else if (nuevasArmas.length === 0) {
          onWeaponSelectionInReserve(null);
        }
      } else {
        // Verificar límite de cantidad (usar límite máximo en lugar de cantidadArmasACeleccionar)
        if (armasSeleccionadas.length >= limiteMaximoArmas) {
          const mensajeLimite = limiteMaximoArmas === 1 
            ? 'Ya has seleccionado 1 arma. El cliente solo puede agregar 1 arma más porque ya tiene 1 registrada (máximo legal: 2).'
            : `Ya has seleccionado el máximo de ${limiteMaximoArmas} armas permitidas. Deselecciona una arma primero.`;
          alert(`❌ ${mensajeLimite}`);
          return;
        }
        // Agregar a la selección múltiple
        const nuevasArmas = [...armasSeleccionadas, weapon];
        setArmasSeleccionadas(nuevasArmas);
        // Si es solo una arma, mantener compatibilidad con el comportamiento anterior
        if (nuevasArmas.length === 1) {
          onWeaponSelectionInReserve(weapon);
        }
      }
    } else {
      // Para otros tipos (Deportista, etc.), comportamiento normal (solo una arma)
      // Si ya está seleccionada, deseleccionarla
      if (armaSeleccionadaEnReserva?.id === weapon.id) {
        onWeaponSelectionInReserve(null);
        return;
      }

      // Seleccionar la nueva arma
      onWeaponSelectionInReserve(weapon);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 px-8 py-12 text-center text-white relative">
              {/* Botón de Volver - Mejorado y más visible */}
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

              {/* Dropdown para cantidad de armas (solo Cliente Civil) - Mostrar solo si no hay armas seleccionadas todavía */}
              {esCivil() && (currentClient || reservaParaCliente) && limiteMaximoArmas > 0 && armasSeleccionadas.length === 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-bold text-yellow-800 mb-1">Cantidad de Armas a Seleccionar</h3>
                        <p className="text-sm text-yellow-700">
                          {limiteMaximoArmas === 1 
                            ? 'El cliente puede agregar 1 arma más (ya tiene 1 registrada, máximo legal: 2)'
                            : 'Cliente Civil puede solicitar máximo 2 armas (mismo tipo o diferentes)'}
                        </p>
                        {obtenerRespuestaArmasRegistradas && (
                          <p className="text-xs text-yellow-600 mt-1 italic">
                            Respuesta: {obtenerRespuestaArmasRegistradas}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 mr-3">Cantidad:</label>
                      <select
                        value={cantidadArmasACeleccionar}
                        onChange={(e) => {
                          const nuevaCantidad = parseInt(e.target.value);
                          if (nuevaCantidad > limiteMaximoArmas) {
                            alert(`❌ No se puede seleccionar ${nuevaCantidad} armas. El límite máximo permitido es ${limiteMaximoArmas}.`);
                            return;
                          }
                          setCantidadArmasACeleccionar(nuevaCantidad);
                        }}
                        className="px-4 py-2 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-900 font-semibold"
                        disabled={limiteMaximoArmas === 1} // Deshabilitar si solo puede 1
                      >
                        {limiteMaximoArmas >= 2 && <option value={1}>1 arma</option>}
                        {limiteMaximoArmas >= 2 && <option value={2}>2 armas</option>}
                        {limiteMaximoArmas === 1 && <option value={1}>1 arma</option>}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Contador dinámico de armas seleccionadas - Mostrar solo si ya hay armas seleccionadas */}
              {esCivil() && armasSeleccionadas.length > 0 && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">
                      Armas seleccionadas: <strong>{armasSeleccionadas.length}</strong> / {limiteMaximoArmas}
                    </span>
                    {armasSeleccionadas.length === limiteMaximoArmas && (
                      <span className="text-sm font-bold text-green-600 flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Máximo alcanzado
                      </span>
                    )}
                    {limiteMaximoArmas === 0 && (
                      <span className="text-sm font-bold text-red-600 flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Ya tiene el máximo legal
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Grid de Armas */}
              
              {/* Filtro por categoría */}
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
                  const precioBaseArma = weapon.precioReferencia || 0; // Precio base del arma desde BD
                  const precioActual = getWeaponPriceForClient(weapon.id, currentClientId);
                  
                  // Usar el precio en edición si existe, sino el precio actual, sino 0
                  const precioModificado = preciosEnEdicion[weapon.id] !== undefined 
                    ? (parseFloat(preciosEnEdicion[weapon.id]) || 0)
                    : (precioActual || 0);
                  
                  // Validar si el precio es menor al precio base del arma
                  const precioIngresado = preciosEnEdicion[weapon.id] !== undefined 
                    ? (parseFloat(preciosEnEdicion[weapon.id]) || 0)
                    : precioModificado;
                  const precioMenorAlBase = precioIngresado > 0 && precioIngresado < precioBaseArma;
                  
                  // Calculando precios con IVA dinámico
                  const subtotal = precioModificado * cantidad;
                  const ivaCalculado = subtotal * ivaDecimal;
                  const precioFinal = subtotal + ivaCalculado;
                  
                  // Verificar si está seleccionada (comportamiento diferente para Civil vs otros)
                  const isSelected = esCivil() 
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
                                               {/* Imagen del arma */}
                         <div className="relative">
                           <WeaponImage weapon={weapon} />
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
                              {/* Advertencia si el precio es menor al precio base */}
                              {precioMenorAlBase && precioBaseArma > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded text-xs text-yellow-800">
                                  <p className="font-medium">⚠️ No se permite un precio menor a ${precioBaseArma.toFixed(2)} USD</p>
                                </div>
                              )}
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

              {/* Resumen de Totales (solo si hay múltiples armas seleccionadas) */}
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
                      const subtotal = precioFinal;
                      const ivaArma = subtotal * ivaDecimal;
                      const totalArma = subtotal + ivaArma;
                      
                      return (
                        <div key={arma.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-blue-200">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Arma {index + 1}:</span>
                            <span className="text-sm text-gray-600 ml-2">{arma.nombre}</span>
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

              {/* Botón Confirmar */}
              {(clienteParaResumen || (!currentClient && !reservaParaCliente)) && (() => {
                // Para Cliente Civil: validar múltiples armas
                // Para otros tipos: validar arma única
                const armasParaValidar = esCivil() && armasSeleccionadas.length > 0 
                  ? armasSeleccionadas 
                  : (armaSeleccionadaEnReserva ? [armaSeleccionadaEnReserva] : []);
                
                let precioValido = true;
                let mensajeDeshabilitado = esCivil() 
                  ? `Selecciona ${limiteMaximoArmas === 1 ? '1 arma' : '1 o 2 armas'} para continuar`
                  : 'Selecciona un arma para continuar';
                
                // Si es Civil, verificar límite máximo (debe haber al menos 1 arma si el límite > 0)
                if (esCivil()) {
                  if (limiteMaximoArmas === 0) {
                    precioValido = false;
                    mensajeDeshabilitado = 'El cliente ya tiene el máximo de armas permitidas (2). No se pueden seleccionar más.';
                  } else if (armasSeleccionadas.length === 0) {
                    precioValido = false;
                    mensajeDeshabilitado = `Debes seleccionar al menos 1 arma (máximo ${limiteMaximoArmas}).`;
                  } else if (armasSeleccionadas.length > limiteMaximoArmas) {
                    precioValido = false;
                    mensajeDeshabilitado = `Has seleccionado ${armasSeleccionadas.length} armas, pero el límite máximo es ${limiteMaximoArmas}.`;
                  }
                } else if (armasParaValidar.length === 0) {
                  precioValido = false;
                } else {
                  // Validar precios de todas las armas seleccionadas
                  for (const arma of armasParaValidar) {
                    const precioArmaSeleccionada = getWeaponPriceForClient(arma.id, currentClientId);
                    const precioBaseArma = arma.precioReferencia || 0;
                    
                    // Verificar si hay un precio en edición para esta arma
                    const precioEnEdicion = preciosEnEdicion[arma.id];
                    const precioFinal = precioEnEdicion !== undefined 
                      ? (parseFloat(precioEnEdicion) || 0)
                      : precioArmaSeleccionada;
                    
                    // El precio debe ser mayor o igual al precio base, y mayor que 0
                    if (precioFinal <= 0) {
                      precioValido = false;
                      mensajeDeshabilitado = `Ingresa un precio válido para ${arma.nombre}`;
                      break;
                    } else if (precioBaseArma > 0 && precioFinal < precioBaseArma) {
                      precioValido = false;
                      mensajeDeshabilitado = `El precio de ${arma.nombre} debe ser mayor o igual a $${precioBaseArma.toFixed(2)} USD`;
                      break;
                    }
                  }
                }
                
                const puedeConfirmar = armasParaValidar.length > 0 && precioValido;
                
                return (
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        // Pasar las armas seleccionadas al callback
                        if (esCivil() && armasSeleccionadas.length > 0) {
                          // Para Civil, pasar todas las armas seleccionadas
                          // El callback puede recibir un objeto con las armas
                          (onConfirmData as any)({ armas: armasSeleccionadas, esMultiple: true });
                        } else if (armaSeleccionadaEnReserva) {
                          // Para otros tipos, mantener comportamiento normal
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
                        ? (esCivil() && armasSeleccionadas.length === 2 
                            ? `✓ Confirmar ${armasSeleccionadas.length} Armas Seleccionadas`
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