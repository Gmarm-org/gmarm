import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendedor.module.css';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

function Vendedor() {
  const [activeTab, setActiveTab] = useState<'clients' | 'create'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored auth data
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="vendedor-container">
      {/* Header */}
      <header className="vendedor-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="gear-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </span>
            <h1>GMARM - Vendedor</h1>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="vendedor-nav">
        <button 
          className={`nav-tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Clientes
        </button>
        <button 
          className={`nav-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Crear Cliente
        </button>
      </nav>

      {/* Main Content */}
      <main className="vendedor-main">
        {activeTab === 'clients' && (
          <div className="clients-section">
            <h2>Lista de Clientes</h2>
            {clients.length === 0 ? (
              <div className="empty-state">
                <p>No hay clientes registrados</p>
                <button onClick={() => setActiveTab('create')} className="create-btn">
                  Crear primer cliente
                </button>
              </div>
            ) : (
              <div className="clients-grid">
                {clients.map(client => (
                  <div key={client.id} className="client-card">
                    <h3>{client.name}</h3>
                    <p>{client.email}</p>
                    <p>{client.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-section">
            <h2>Crear Nuevo Cliente</h2>
            <form className="client-form">
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input type="text" id="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Correo:</label>
                <input type="email" id="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono:</label>
                <input type="tel" id="phone" required />
              </div>
              <div className="form-group">
                <label htmlFor="address">Dirección:</label>
                <textarea id="address" rows={3}></textarea>
              </div>
              <button type="submit" className="submit-btn">
                Crear Cliente
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default Vendedor; 