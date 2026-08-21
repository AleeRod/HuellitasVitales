import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

const Configuracion = () => {
  const [form, setForm] = useState({ nombre: '', apellidos: '', correo: '', telefono: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

  const cargarPerfil = async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/usuario/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo cargar tu perfil.');
      setForm({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        correo: data.correo || '',
        telefono: data.telefono || ''
      });
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Error al cargar tu perfil.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async (e) => {
    e.preventDefault();
    const token = obtenerToken();
    if (!token) {
      showToast('Debes iniciar sesión para editar tu perfil.', 'warning');
      return;
    }
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      showToast('Nombre y apellidos son obligatorios.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE}/usuario/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          correo: form.correo.trim(),
          telefono: form.telefono?.trim() || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'No se pudo guardar los cambios.');

      showToast(data?.mensaje || 'Perfil actualizado correctamente.', 'success');
    } catch (error) {
      showToast(error.message || 'Error al guardar los cambios.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ClienteLayout activo="configuracion">
      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Datos de la cuenta</h2>
              <p className="card-subtitle">Actualizá tu información personal de contacto.</p>
            </div>
          </div>

          {cargando ? (
            <div className="appointment" style={{ display: 'block' }}>Cargando tu perfil…</div>
          ) : (
            <form onSubmit={guardar} style={{ maxWidth: 520 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginTop: 6 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Apellidos</label>
                  <input
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Correo</label>
                  <input
                    type="email"
                    value={form.correo}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Teléfono</label>
                  <input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #dfe6e9', borderRadius: 10 }}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button className="btn-main" disabled={guardando}>
                  <Save size={16} style={{ marginRight: 6 }} />
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default Configuracion;
