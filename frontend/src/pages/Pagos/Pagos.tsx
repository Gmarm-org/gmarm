import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { mockApiService } from '../../services/mockApiService';
import type { Pago, SaldoCliente } from '../../types';
import './Pagos.css';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saldoCliente, setSaldoCliente] = useState<SaldoCliente | null>(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    montoTotal: '',
    saldoPendiente: '',
    metodoPago: '',
    observaciones: ''
  });

  // Función para obtener el servicio API apropiado
  const getApiService = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok ? apiService : mockApiService;
    } catch (error) {
      console.log('Usando datos mock para pagos');
      return mockApiService;
    }
  };

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const service = await getApiService();
      const response = await service.getPagos();
      setPagos(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = async (clienteId: string) => {
    if (!clienteId) {
      setSaldoCliente(null);
      return;
    }

    try {
      const service = await getApiService();
      const saldo = await service.getSaldoCliente(parseInt(clienteId));
      setSaldoCliente(saldo);
    } catch (err: any) {
      console.error('Error al obtener saldo:', err);
      setSaldoCliente(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const service = await getApiService();
      const pagoData = {
        clienteId: parseInt(formData.clienteId),
        montoTotal: parseFloat(formData.montoTotal),
        saldoPendiente: parseFloat(formData.saldoPendiente),
        metodoPago: formData.metodoPago,
        observaciones: formData.observaciones
      };

      await service.createPago(pagoData);
      
      // Limpiar formulario
      setFormData({
        clienteId: '',
        montoTotal: '',
        saldoPendiente: '',
        metodoPago: '',
        observaciones: ''
      });
      setShowForm(false);
      setSaldoCliente(null);
      
      // Recargar pagos
      await loadPagos();
      
    } catch (err: any) {
      setError(err.message || 'Error al crear pago');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'green';
      case 'PENDIENTE':
        return 'orange';
      case 'CANCELADO':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="pagos-container">
        <div className="loading">Cargando pagos...</div>
      </div>
    );
  }

  return (
    <div className="pagos-container">
      <div className="pagos-header">
        <h1>Gestión de Pagos</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Nuevo Pago'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="pago-form-container">
          <h2>Registrar Nuevo Pago</h2>
          <form onSubmit={handleSubmit} className="pago-form">
            <div className="form-group">
              <label>Cliente ID:</label>
              <input
                type="number"
                value={formData.clienteId}
                onChange={(e) => {
                  setFormData({ ...formData, clienteId: e.target.value });
                  handleClienteChange(e.target.value);
                }}
                required
              />
            </div>

            {saldoCliente && (
              <div className="saldo-info">
                <strong>Saldo Pendiente: ${saldoCliente.saldo.toFixed(2)}</strong>
              </div>
            )}

            <div className="form-group">
              <label>Monto Total:</label>
              <input
                type="number"
                step="0.01"
                value={formData.montoTotal}
                onChange={(e) => setFormData({ ...formData, montoTotal: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Saldo Pendiente:</label>
              <input
                type="number"
                step="0.01"
                value={formData.saldoPendiente}
                onChange={(e) => setFormData({ ...formData, saldoPendiente: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Método de Pago:</label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                required
              >
                <option value="">Seleccionar método</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label>Observaciones:</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Registrar Pago
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pagos-list">
        <h2>Pagos Registrados</h2>
        {pagos.length === 0 ? (
          <p className="no-data">No hay pagos registrados</p>
        ) : (
          <div className="pagos-grid">
            {pagos.map((pago) => (
              <div key={pago.id} className="pago-card">
                <div className="pago-header">
                  <h3>Pago #{pago.id}</h3>
                  <span 
                    className={`estado-badge estado-${getEstadoColor(pago.estado)}`}
                  >
                    {pago.estado}
                  </span>
                </div>
                
                <div className="pago-details">
                  <p><strong>Cliente:</strong> {pago.cliente?.nombres} {pago.cliente?.apellidos}</p>
                  <p><strong>Comprobante:</strong> {pago.numeroComprobante}</p>
                  <p><strong>Monto Total:</strong> ${pago.montoTotal.toFixed(2)}</p>
                  <p><strong>Saldo Pendiente:</strong> ${pago.saldoPendiente.toFixed(2)}</p>
                  <p><strong>Método:</strong> {pago.metodoPago}</p>
                  {pago.fechaPago && (
                    <p><strong>Fecha Pago:</strong> {new Date(pago.fechaPago).toLocaleDateString()}</p>
                  )}
                  {pago.observaciones && (
                    <p><strong>Observaciones:</strong> {pago.observaciones}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagos; 