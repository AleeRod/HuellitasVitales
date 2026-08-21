import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Dog, Cat } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';
import { useConfirm } from '../../components/ConfirmModal/useConfirm';
import CustomSelect from '../../components/CustomSelect/CustomSelect';

const MisMascotas = () => {
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
  const { pedirConfirmacion, ConfirmacionModal } = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();

  const obtenerToken = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');

  const cargarMisMascotas = async () => {
    const token = obtenerToken();
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
    setFormMascota({ nombre: '', idEspecie: 1, raza: '', fechaNacimiento: '', activo: true });
    setEditandoMascotaId(null);
    setMostrarFormularioMascota(false);
  };

  const abrirFormularioNuevaMascota = () => {
    resetFormularioMascota();
    setMostrarFormularioMascota(true);
  };

  // Llegada desde "Crear Perfil de Mascota Gratis" del landing (ya con sesión iniciada): abre
  // el formulario directo en vez de dejar a la persona en la lista buscando el botón.
  useEffect(() => {
    if (location.state?.abrirFormulario) {
      abrirFormularioNuevaMascota();
      // Limpia el state: si la persona refresca o vuelve atrás, no se vuelve a abrir solo.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const token = obtenerToken();
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const eliminarMascota = (mascota) => {
    const idMascota = mascota.idMascota ?? mascota.IdMascota;
    const nombre = mascota.nombre || mascota.Nombre || 'esta mascota';

    pedirConfirmacion({
      titulo: 'Eliminar mascota',
      mensaje: `¿Deseás eliminar a ${nombre}?`,
      textoConfirmar: 'Sí, eliminar',
      onConfirmar: async () => {
        const token = obtenerToken();
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
      }
    });
  };

  return (
    <ClienteLayout activo="mascotas">
      <section className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="content-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Mis mascotas</h2>
              <p className="card-subtitle">Gestiona las mascotas registradas en tu cuenta.</p>
            </div>
            <button className="btn-main" onClick={abrirFormularioNuevaMascota}>
              <Plus size={16} style={{ marginRight: '6px' }} /> Agregar mascota
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
                  <CustomSelect
                    value={formMascota.idEspecie}
                    onChange={(valor) => setFormMascota({ ...formMascota, idEspecie: Number(valor) })}
                    style={{ width: '100%' }}
                    opciones={[
                      { value: 1, label: 'Perro' },
                      { value: 2, label: 'Gato' },
                      { value: 3, label: 'Otra' }
                    ]}
                  />
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

      {ConfirmacionModal}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
};

export default MisMascotas;
