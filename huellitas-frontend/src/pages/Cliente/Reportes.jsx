import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardCliente.css';
import { 
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText, 
  Settings, LogOut, Bell, AlertCircle
} from 'lucide-react';

import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const Reportes = () => {
  const [usuario, setUsuario] = useState(null);
  const { toasts, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const guardado = localStorage.getItem('usuario_huellitas') || localStorage.getItem('usuario') || localStorage.getItem('user');
      if (guardado) {
        setUsuario(JSON.parse(guardado));
      }
    } catch (err) {
      console.error('No se pudo leer el usuario guardado', err);
    }
  }, []);

  const nombreUsuario = usuario?.nombre || usuario?.Nombre || usuario?.nombreCompleto || 'Cliente';
  const rolUsuario = usuario?.rol?.nombre || usuario?.rolNombre || usuario?.rol || 'Cliente';
  const inicialAvatar = nombreUsuario.charAt(0).toUpperCase();

  const handleCerrarSesion = (e) => {
    e.preventDefault();
    localStorage.removeItem('usuario_huellitas');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('token_huellitas');
    localStorage.removeItem('jwt');
    localStorage.removeItem('huellitas_token');
    navigate('/');
  };

  return (
    <div className="client-shell">
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-card">
            <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas Vitales" />
            <div>
              <div className="brand-name">Huellitas Vitales</div>
              <div className="brand-label">Portal Cliente</div>
            </div>
          </div>

          <div className="nav-section">Mi cuenta</div>
          <a href="#dashboard" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente'); }}>
            <span className="nav-icon"><Home size={18} /></span>
            Dashboard
          </a>
          <a href="#mascotas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/mis-mascotas'); }}>
            <span className="nav-icon"><PawPrint size={18} /></span>
            Mis mascotas
          </a>
          <a href="#citas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/mis-citas'); }}>
            <span className="nav-icon"><CalendarDays size={18} /></span>
            Mis citas
          </a>
          <a href="#historial" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/historial-clinico'); }}>
            <span className="nav-icon"><Activity size={18} /></span>
            Historial clínico
          </a>
          <a href="#vacunas" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/vacunas'); }}>
            <span className="nav-icon"><Syringe size={18} /></span>
            Vacunas
          </a>
          <a href="#reportes" className="nav-link-client active" onClick={(e) => e.preventDefault()}>
            <span className="nav-icon"><FileText size={18} /></span>
            Reportes
          </a>

          <div className="nav-section">Sistema</div>
          <a href="#configuracion" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/configuracion'); }}>
            <span className="nav-icon"><Settings size={18} /></span>
            Configuración
          </a>
          
          <button 
            onClick={handleCerrarSesion} 
            className="nav-link-client" 
            style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', color: '#ff4d4d', cursor: 'pointer' }}
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            Cerrar sesión
          </button>

          <div className="sidebar-pet-card">
            <div className="pet-mini">
              <div className="pet-avatar"><AlertCircle size={16} color="#4a4a4a" /></div>
              <div>
                <div className="pet-name">Pendiente</div>
                <div className="pet-text">Sin reportes disponibles</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className="topbar">
          <div>
            <div className="hero-badge">
              <svg width="9" height="9" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="5" fill="#52B788" />
              </svg>
              Reportes
            </div>
            <h1 className="hero-title">Mis reportes 📊</h1>
            <p className="hero-sub">Descarga y consulta los reportes generados por los veterinarios.</p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notificaciones">
              <Bell size={20} />
            </button>
            <div className="profile-mini">
              <div className="profile-avatar">{inicialAvatar}</div>
              <div>
                <div className="profile-name">{nombreUsuario}</div>
                <div className="profile-role">{rolUsuario}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Reportes</h2>
                <p className="card-subtitle">Consulta los reportes clínicos de tus mascotas.</p>
              </div>
            </div>

            <div className="appointment-list">
              <div className="appointment" style={{ display: 'block', textAlign: 'center', padding: '3rem 1rem' }}>
                <AlertCircle size={48} style={{ color: '#dde3d8', marginBottom: '1rem' }} />
                <strong style={{ color: '#718096' }}>Sin datos disponibles</strong>
                <p style={{ color: '#cbd5e0', fontSize: '.9rem', marginTop: '.5rem' }}>
                  Los reportes clínicos aparecerán aquí cuando los veterinarios los generen y asignen a tus mascotas.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Reportes;
