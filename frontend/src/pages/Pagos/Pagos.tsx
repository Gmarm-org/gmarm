import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Pago, SaldoCliente } from '../../types';
import './Pagos.css';

const Pagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saldoCliente, setSaldoCliente] = useState<SaldoCliente | null>(null);

  // Formulario de pago
  const [formData, setFormData] = useState({
    clienteId: '',
    montoTotal: '',
    saldoPendiente: '',
    metodoPago: '',
    observaciones: ''
  });

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPagos();
      setPagos(response.data || []);
    } catch (err) {
      setError('Error al cargar los pagos');
      console.error('Error loading pagos:', err);
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
      const saldo = await apiService.getSaldoCliente(parseInt(clienteId));
      setSaldoCliente(saldo);
    } catch (err) {
      console.error('Error loading saldo:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const pagoData = {
        clienteId: parseInt(formData.clienteId),
        montoTotal: parseFloat(formData.montoTotal),
        saldoPendiente: parseFloat(formData.saldoPendiente),
        metodoPago: formData.metodoPago,
        observaciones: formData.observaciones
      };

      await apiService.createPago(pagoData);
      setShowForm(false);
      setFormData({
        clienteId: '',
        montoTotal: '',
        saldoPendiente: '',
        metodoPago: '',
        observaciones: ''
      });
      loadPagos();
    } catch (err) {
      setError('Error al crear el pago');
      console.error('Error creating pago:', err);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO': return 'green';
      case 'PENDIENTE': return 'orange';
      case 'CANCELADO': return 'red';
      default: return 'gray';
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
          onClick={() => setShowForm(true)}
        >
          ➕ Nuevo Pago
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Formulario de nuevo pago */}
      {showForm && (
        <div className="pago-form-overlay">
          <div className="pago-form">
            <h2>Registrar Nuevo Pago</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cliente ID:</label>
                <input
                  type="number"
                  value={formData.clienteId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, clienteId: e.target.value }));
                    handleClienteChange(e.target.value);
                  }}
                  required
                />
              </div>

              {saldoCliente && (
                <div className="saldo-info">
                  <p>Saldo actual: ${saldoCliente.saldo}</p>
                  <p>¿Tiene saldo pendiente? {saldoCliente.tieneSaldoPendiente ? 'Sí' : 'No'}</p>
                </div>
              )}

              <div className="form-group">
                <label>Monto Total:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.montoTotal}
                  onChange={(e) => setFormData(prev => ({ ...prev, montoTotal: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Saldo Pendiente:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.saldoPendiente}
                  onChange={(e) => setFormData(prev => ({ ...prev, saldoPendiente: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Método de Pago:</label>
                <select
                  value={formData.metodoPago}
                  onChange={(e) => setFormData(prev => ({ ...prev, metodoPago: e.target.value }))}
                  required
                >
                  <option value="">Seleccionar método</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observaciones:</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
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
        </div>
      )}

      {/* Lista de pagos */}
      <div className="pagos-list">
        <h2>Pagos Registrados</h2>
        {pagos.length === 0 ? (
          <p className="no-data">No hay pagos registrados</p>
        ) : (
          <div className="pagos-grid">
            {pagos.map((pago) => (
              <div key={pago.id} className="pago-card">
                <div className="pago-header">
                  <h3>Pago #{pago.numeroComprobante}</h3>
                  <span 
                    className={`estado-badge estado-${getEstadoColor(pago.estado)}`}
                  >
                    {pago.estado}
                  </span>
                </div>
                
                <div className="pago-details">
                  <p><strong>Cliente ID:</strong> {pago.clienteId}</p>
                  <p><strong>Monto Total:</strong> ${pago.montoTotal}</p>
                  <p><strong>Saldo Pendiente:</strong> ${pago.saldoPendiente}</p>
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