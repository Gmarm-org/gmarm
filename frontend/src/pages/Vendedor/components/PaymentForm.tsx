import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import type { Arma } from '../hooks/useArmas';
import { useIVA } from '../../../hooks/useConfiguracion';

interface PaymentFormProps {
  client: Client;
  selectedWeapon: Arma;
  precioModificado: number;
  cantidad: number;
  selectedSerieNumero?: string | null; // Número de serie seleccionado (si expoferia está activa)
  onBack: () => void;
  onComplete: (paymentData: any) => void;
}

interface CuotaData {
  numeroCuota: number;
  fecha: string;
  monto: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  client,
  selectedWeapon,
  precioModificado,
  cantidad,
  selectedSerieNumero,
  onBack,
  onComplete
}) => {
  // Logs para debugging
  useEffect(() => {
    console.log('💰 PaymentForm - Valores recibidos:');
    console.log('  - Cliente:', client);
    console.log('  - Arma seleccionada:', selectedWeapon);
    console.log('  - Precio modificado:', precioModificado);
    console.log('  - Cantidad:', cantidad);
  }, [client, selectedWeapon, precioModificado, cantidad]);

  const [tipoPago, setTipoPago] = useState<'CONTADO' | 'CUOTAS'>('CONTADO');
  const [numeroCuotas, setNumeroCuotas] = useState<number>(2);
  const [cuotas, setCuotas] = useState<CuotaData[]>([]);
  
  // Obtener IVA dinámicamente desde la BD
  const { iva: ivaDecimal, ivaPorcentaje } = useIVA();

  // Calcular montos
  const subtotal = precioModificado * cantidad;
  const ivaTotal = subtotal * ivaDecimal;
  const total = subtotal + ivaTotal;
  const montoPorCuota = tipoPago === 'CUOTAS' ? total / numeroCuotas : 0;

  // Generar cuotas cuando cambie el número de cuotas
  useEffect(() => {
    if (tipoPago === 'CUOTAS') {
      const nuevasCuotas: CuotaData[] = [];
      const fechaInicial = new Date();
      
      for (let i = 0; i < numeroCuotas; i++) {
        const fechaCuota = new Date(fechaInicial);
        fechaCuota.setMonth(fechaCuota.getMonth() + i);
        
        nuevasCuotas.push({
          numeroCuota: i + 1,
          fecha: fechaCuota.toISOString().split('T')[0],
          monto: Math.round(montoPorCuota * 100) / 100 // Redondear a 2 decimales
        });
      }
      
      setCuotas(nuevasCuotas);
    }
  }, [numeroCuotas, tipoPago, montoPorCuota]);

  // Actualizar monto por cuota cuando cambie el total
  useEffect(() => {
    if (tipoPago === 'CUOTAS' && cuotas.length > 0) {
      const montoActualizado = total / numeroCuotas;
      setCuotas(prev => prev.map(cuota => ({
        ...cuota,
        monto: Math.round(montoActualizado * 100) / 100 // Redondear a 2 decimales
      })));
    }
  }, [total, numeroCuotas, tipoPago]);

  const handleCuotaChange = (index: number, field: 'fecha' | 'monto', value: string | number) => {
    setCuotas(prev => prev.map((cuota, i) => 
      i === index ? { 
        ...cuota, 
        [field]: field === 'fecha' ? value as string : value as number 
      } : cuota
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay datos del cliente (ya sea seleccionado o en formulario)
    if (!client) {
      console.error('❌ PaymentForm: No hay datos del cliente disponibles');
      console.error('❌ PaymentForm: client =', client);
      console.error('❌ PaymentForm: selectedWeapon =', selectedWeapon);
      alert('⚠️ No hay datos del cliente disponibles. Por favor, completa el proceso desde el inicio.');
      return;
    }
    
    if (tipoPago === 'CUOTAS') {
      // Validar que todas las cuotas tengan fecha y monto
      const cuotasValidas = cuotas.every(cuota => cuota.fecha && cuota.monto > 0);
      if (!cuotasValidas) {
        alert('Por favor complete todas las fechas y montos de las cuotas');
        return;
      }
      
      // Validar que la suma de cuotas sea igual al total
      const sumaCuotas = cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
      if (Math.abs(sumaCuotas - total) > 0.01) {
        alert(`La suma de las cuotas (${sumaCuotas.toFixed(2)}) debe ser igual al total (${total.toFixed(2)})`);
        return;
      }
    }

    const paymentData = {
      clienteId: client ? parseInt(client.id) : null,
      armaId: parseInt(selectedWeapon.id.toString()),
      cantidad,
      precioUnitario: precioModificado,
      subtotal,
      iva: ivaTotal,
      total,
      tipoPago,
      numeroCuotas: tipoPago === 'CUOTAS' ? numeroCuotas : 1,
      cuotas: tipoPago === 'CUOTAS' ? cuotas : [],
      numeroSerie: selectedSerieNumero // CRÍTICO: Pasar el número de serie que se recibió como prop
    };

    console.log('💰 PaymentForm - Enviando datos de pago con numeroSerie:', selectedSerieNumero);
    onComplete(paymentData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 px-8 py-12 text-center text-white">
            <h1 className="text-4xl font-bold mb-3">Forma de Pago</h1>
            <p className="text-xl text-green-100">Complete la información de pago para finalizar el proceso</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Resumen de la compra */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Resumen de la Compra</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del cliente */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Cliente</h3>
                    <div className="space-y-2">
                      {client ? (
                        <>
                          <p><span className="font-medium">Nombre:</span> {client.nombres} {client.apellidos}</p>
                          <p><span className="font-medium">Identificación:</span> {client.numeroIdentificacion}</p>
                          <p><span className="font-medium">Email:</span> {client.email}</p>
                        </>
                      ) : (
                        <p className="text-red-500">⚠️ No hay cliente seleccionado</p>
                      )}
                    </div>
                  </div>

                  {/* Información del arma */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Arma Seleccionada</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Arma:</span> {selectedWeapon.nombre}</p>
                      {selectedSerieNumero && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Número de Serie:</span> 
                          <span className="font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-bold">
                            {selectedSerieNumero}
                          </span>
                        </p>
                      )}
                      <p><span className="font-medium">Cantidad:</span> {cantidad}</p>
                      <p><span className="font-medium">Precio unitario:</span> ${precioModificado.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de montos */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Resumen de Montos</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({ivaPorcentaje}%):</span>
                    <span className="font-medium">${ivaTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forma de pago */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Forma de Pago</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Tipo de pago */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Pago *</label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoPago"
                          value="CONTADO"
                          checked={tipoPago === 'CONTADO'}
                          onChange={(e) => setTipoPago(e.target.value as 'CONTADO' | 'CUOTAS')}
                          className="mr-3"
                        />
                        <span>Contado (Pago único)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoPago"
                          value="CUOTAS"
                          checked={tipoPago === 'CUOTAS'}
                          onChange={(e) => setTipoPago(e.target.value as 'CONTADO' | 'CUOTAS')}
                          className="mr-3"
                        />
                        <span>Crédito (Pago en cuotas)</span>
                      </label>
                    </div>
                  </div>

                  {/* Número de cuotas */}
                  {tipoPago === 'CUOTAS' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Número de Cuotas *</label>
                      <select
                        value={numeroCuotas}
                        onChange={(e) => setNumeroCuotas(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                      >
                        <option value={2}>2 cuotas</option>
                        <option value={3}>3 cuotas</option>
                        <option value={4}>4 cuotas</option>
                        <option value={6}>6 cuotas</option>
                      </select>
                    </div>
                  )}

                  {/* Calendarios y montos de cuotas */}
                  {tipoPago === 'CUOTAS' && cuotas.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-4 text-lg">Configuración de Cuotas</h4>
                      <div className="space-y-4">
                        {cuotas.map((cuota, index) => (
                          <div key={cuota.numeroCuota} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-purple-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuota {cuota.numeroCuota}
                              </label>
                              <input
                                type="date"
                                value={cuota.fecha}
                                onChange={(e) => handleCuotaChange(index, 'fecha', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monto a Pagar
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="9999999999.99"
                                value={cuota.monto}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  // Redondear a 2 decimales
                                  const rounded = Math.round(value * 100) / 100;
                                  handleCuotaChange(index, 'monto', rounded);
                                }}
                                onBlur={(e) => {
                                  // Asegurar formato correcto al perder foco
                                  const value = parseFloat(e.target.value) || 0;
                                  const rounded = Math.round(value * 100) / 100;
                                  e.target.value = rounded.toFixed(2);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <span className="text-sm text-gray-500">
                                ${cuota.monto.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Resumen de cuotas */}
                        <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">Total de cuotas:</span>
                            <span className="font-bold text-purple-800">${cuotas.reduce((sum, cuota) => sum + cuota.monto, 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-medium text-gray-700">Total a pagar:</span>
                            <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors duration-200"
                >
                  ← Volver
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 font-semibold"
                >
                  {tipoPago === 'CONTADO' ? 'Finalizar Compra' : 'Crear Plan de Crédito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
