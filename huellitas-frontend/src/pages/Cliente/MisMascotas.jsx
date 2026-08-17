import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardCliente.css';
import { 
  Home, PawPrint, CalendarDays, Activity, Syringe, FileText, 
  Settings, LogOut, Bell, Plus, Dog, Cat
} from 'lucide-react';

import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const MisMascotas = () => {
  const [usuario, setUsuario] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [cargandoMascotas, setCargandoMascotas] = useState(false);
  const [mostrarFormularioMascota, setMostrarFormularioMascota] = useState(false);
  const [editandoMascotaId, setEditandoMascotaId] = useState(null);
  const [formMascota, setFormMascota] = useState({
    nombre: '',
    idEspecie: 1,
    raza: '',
    fechaNacimiento: '',
    activo: true
  });
  const { toasts, showToast, removeToast } = useToast();
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

  const cargarMisMascotas = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    try {
      setCargandoMascotas(true);
      const res = await fetch(`${API_BASE}/usuario/mascotas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tus mascotas');
      setMascotas(Array.isArray(data?.mascotas) ? data.mascotas : []);
    } catch (error) {
      console.error(error);
      setMascotas([]);
      showToast('Error al cargar tus mascotas', 'error');
    } finally {
      setCargandoMascotas(false);
    }
  };

  useEffect(() => {
    cargarMisMascotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFormularioMascota = () => {
    setFormMascota({
      nombre: '',
      idEspecie: 1,
      raza: '',
      fechaNacimiento: '',
      activo: true
    });
    setEditandoMascotaId(null);
    setMostrarFormularioMascota(false);
  };

  const abrirFormularioNuevaMascota = () => {
    resetFormularioMascota();
    setMostrarFormularioMascota(true);
  };

  const abrirFormularioEdicionMascota = (mascota) => {
    setEditandoMascotaId(mascota.idMascota ?? mascota.IdMascota);
    setFormMascota({
      nombre: mascota.nombre || mascota.Nombre || '',
      idEspecie: Number(mascota.idEspecie ?? mascota.IdEspecie ?? 1),
      raza: mascota.raza || mascota.Raza || '',
      fechaNacimiento: mascota.fechaNacimiento || mascota.FechaNacimiento ? (mascota.fechaNacimiento || mascota.FechaNacimiento).slice(0, 10) : '',
      activo: mascota.activo ?? mascota.Activo ?? true
    });
    setMostrarFormularioMascota(true);
  };

  const guardarMascota = async () => {
    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      showToast('Debes iniciar sesión para gestionar mascotas.', 'warning');
      return;
    }

    const payload = {
      nombre: formMascota.nombre.trim(),
      idEspecie: Number(formMascota.idEspecie),
      raza: formMascota.raza?.trim() || null,
      fechaNacimiento: formMascota.fechaNacimiento || null,
      activo: formMascota.activo
    };

    if (!payload.nombre) {
      showToast('El nombre de la mascota es obligatorio.', 'error');
      return;
    }

    try {
      const url = editandoMascotaId
        ? `${API_BASE}/usuario/mascotas/${editandoMascotaId}`
        : `${API_BASE}/usuario/mascotas`;
      const method = editandoMascotaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo guardar la mascota.');

      showToast(data?.mensaje || 'Mascota guardada correctamente.', 'success');
      resetFormularioMascota();
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al guardar la mascota.', 'error');
    }
  };

  const eliminarMascota = async (mascota) => {
    const idMascota = mascota.idMascota ?? mascota.IdMascota;
    const nombre = mascota.nombre || mascota.Nombre || 'esta mascota';

    const confirmar = window.confirm(`¿Deseas eliminar a ${nombre}?`);
    if (!confirmar) return;

    const token = localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) {
      showToast('Debes iniciar sesión para eliminar mascotas.', 'warning');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/usuario/mascotas/${idMascota}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo eliminar la mascota.');

      showToast(data?.mensaje || 'Mascota eliminada.', 'success');
      await cargarMisMascotas();
    } catch (error) {
      showToast(error.message || 'Error al eliminar la mascota.', 'error');
    }
  };

  return (
    <div className="client-shell">
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-card">
            <img src="/Imagenes/logo.png" alt="Logo Huellitas Vitales" />
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
          <a href="#mascotas" className="nav-link-client active" onClick={(e) => e.preventDefault()}>
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
          <a href="#reportes" className="nav-link-client" onClick={(e) => { e.preventDefault(); navigate('/cliente/reportes'); }}>
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
              <div className="pet-avatar"><Dog size={16} color="#4a4a4a" /></div>
              <div>
                <div className="pet-name">Max</div>
                <div className="pet-text">Próxima cita: 15 de julio</div>
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
              Mis mascotas
            </div>
            <h1 className="hero-title">Gestiona tus mascotas 🐾</h1>
            <p className="hero-sub">Crea, edita y elimina los datos de tus compañeros peludos.</p>
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
                <h2 className="card-title">Mis mascotas</h2>
                <p className="card-subtitle">Gestiona las mascotas registradas en tu cuenta.</p>
              </div>
              <button className="btn-main" onClick={abrirFormularioNuevaMascota}>
                <Plus size={16} style={{marginRight: '6px'}} /> Agregar mascota
              </button>
            </div>

            {mostrarFormularioMascota && (
              <div style={{ marginTop: 18, marginBottom: 18, padding: 18, border: '1px solid #e9ecef', borderRadius: 14, background: '#f7f9f8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre</label>
                    <input
                      value={formMascota.nombre}
                      onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                      placeholder="Ej. Luna"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Especie</label>
                    <select
                      value={formMascota.idEspecie}
                      onChange={(e) => setFormMascota({ ...formMascota, idEspecie: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    >
                      <option value={1}>Perro</option>
                      <option value={2}>Gato</option>
                      <option value={3}>Otra</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Raza</label>
                    <input
                      value={formMascota.raza}
                      onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nacimiento</label>
                    <input
                      type="date"
                      value={formMascota.fechaNacimiento}
                      onChange={(e) => setFormMascota({ ...formMascota, fechaNacimiento: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14, gap: 10 }}>
                  <button className="btn-soft" onClick={resetFormularioMascota}>Cancelar</button>
                  <button className="btn-main" onClick={guardarMascota}>{editandoMascotaId ? 'Guardar cambios' : 'Guardar mascota'}</button>
                </div>
              </div>
            )}

            <div className="pet-list">
              {cargandoMascotas && <div className="appointment" style={{ display: 'block' }}>Cargando tus mascotas…</div>}
              {!cargandoMascotas && mascotas.length === 0 && (
                <div className="appointment" style={{ display: 'block' }}>Aún no tienes mascotas vinculadas a tu cuenta.</div>
              )}
              {!cargandoMascotas && mascotas.map((mascota) => {
                const nombre = mascota.nombre || mascota.Nombre;
                const especie = mascota.especie || mascota.Especie || 'Otra';
                const raza = mascota.raza || mascota.Raza || 'Sin raza';
                const edad = mascota.fechaNacimiento || mascota.FechaNacimiento
                  ? `${new Date(mascota.fechaNacimiento || mascota.FechaNacimiento).getFullYear() === new Date().getFullYear() ? 'Este año' : 'Registrada'}`
                  : 'Sin edad registrada';
                const Icon = especie === 'Gato' ? Cat : Dog;
                const mascotaId = mascota.idMascota ?? mascota.IdMascota;

                return (
                  <div className="pet-item" key={mascotaId}>
                    <div className="pet-info">
                      <div className="pet-icon"><Icon size={24} color="#52B788" /></div>
                      <div>
                        <div className="pet-title">{nombre}</div>
                        <div className="pet-detail">{especie} · {raza} · {edad}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="btn-soft" onClick={() => abrirFormularioEdicionMascota(mascota)} style={{ padding: '8px 10px' }}>Editar</button>
                      <button className="btn-main" onClick={() => eliminarMascota(mascota)} style={{ padding: '8px 10px', background: '#ef4444', borderColor: '#ef4444' }}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default MisMascotas;
