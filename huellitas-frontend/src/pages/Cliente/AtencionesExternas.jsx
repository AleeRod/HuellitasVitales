import React, { useEffect, useState } from 'react';
import { Paperclip, FileText, Download, UploadCloud } from 'lucide-react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import MascotaChips from '../../components/Cliente/MascotaChips/MascotaChips';
import ExpedienteBadge from '../../components/Cliente/ExpedienteBadge/ExpedienteBadge';
import { API_BASE, resolverImagen, manejarSesionExpirada } from '../../api/config';
import { useToast } from '../../components/Toast/useToast';
import { ToastContainer } from '../../components/Toast/Toast';
import styles from './AtencionesExternas.module.css';

const FORM_VACIO = { nombreVeterinaria: '', nombreProfesional: '', fechaAtencion: '', motivo: '', diagnostico: '', tratamiento: '' };

export default function AtencionesExternas() {
  const [mascotas, setMascotas] = useState([]);
  const [mascotaId, setMascotaId] = useState('');
  const [expedienteBasico, setExpedienteBasico] = useState(null);
  const [detalleExpediente, setDetalleExpediente] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [atenciones, setAtenciones] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [archivosPendientes, setArchivosPendientes] = useState({});
  const [subiendoId, setSubiendoId] = useState(null);
  const [arrastrandoSobre, setArrastrandoSobre] = useState(null);
  const { toasts, showToast, removeToast } = useToast();

  const token = () => localStorage.getItem('token_huellitas') || localStorage.getItem('jwt') || localStorage.getItem('token');
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  useEffect(() => {
    fetch(`${API_BASE}/usuario/mascotas`, { headers: headers() })
      .then((r) => {
        if (r.status === 401) {
          manejarSesionExpirada();
          return null;
        }
        return r.json();
      })
      .then((d) => d && setMascotas(d.mascotas || []))
      .catch(() => showToast('No se pudieron cargar las mascotas.', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarAtenciones = async (idExpediente) => {
    const a = await fetch(`${API_BASE}/expedientes/${idExpediente}/atenciones-externas`, { headers: headers() });
    const ad = await a.json();
    setAtenciones(ad.atenciones || []);
  };

  const cargarDetalle = async (expediente) => {
    setExpedienteBasico(expediente);
    cargarAtenciones(expediente.idExpediente);

    const rDetalle = await fetch(`${API_BASE}/expediente/${expediente.idExpediente}`, { headers: headers() });
    const detalle = await rDetalle.json();
    if (detalle.success) setDetalleExpediente(detalle.expediente);
  };

  const seleccionarMascota = async (id) => {
    setMascotaId(id);
    setExpedienteBasico(null);
    setDetalleExpediente(null);
    setAtenciones([]);
    setCargandoExpediente(true);

    try {
      const r = await fetch(`${API_BASE}/expediente/mascota/${id}`, { headers: headers() });
      const d = await r.json();
      if (!r.ok) {
        // La mascota nunca tuvo una cita, así que no hay expediente todavía. A diferencia de
        // Emergencia/Traslado, una atención externa no tiene nada que ver con ninguna veterinaria
        // de la plataforma, así que el expediente se abre solo, sin pedirle nada al cliente.
        const ra = await fetch(`${API_BASE}/expediente/abrir-sin-veterinaria`, {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ idMascota: Number(id) }),
        });
        const da = await ra.json();
        if (!ra.ok) {
          showToast(da.mensaje || 'No se pudo abrir el expediente.', 'error');
          return;
        }
        await cargarDetalle(da.expediente);
        return;
      }
      await cargarDetalle(d.expediente);
    } finally {
      setCargandoExpediente(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!expedienteBasico) return showToast('Selecciona una mascota con expediente.', 'warning');

    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/expedientes/${expedienteBasico.idExpediente}/atenciones-externas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo registrar.');

      showToast('Atención externa registrada.', 'success');
      setForm(FORM_VACIO);
      cargarAtenciones(expedienteBasico.idExpediente);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const elegirArchivo = (idAtencion, archivo) => {
    if (!archivo) return;
    setArchivosPendientes((prev) => ({ ...prev, [idAtencion]: archivo }));
  };

  const adjuntar = async (idAtencion) => {
    const archivo = archivosPendientes[idAtencion];
    if (!archivo) return showToast('Elegí un archivo primero.', 'warning');

    setSubiendoId(idAtencion);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      const r = await fetch(`${API_BASE}/expedientes/${expedienteBasico.idExpediente}/atenciones-externas/${idAtencion}/documentos`, {
        method: 'POST',
        headers: headers(),
        body: formData,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensaje || 'No se pudo adjuntar el documento.');

      showToast('Documento adjuntado.', 'success');
      setArchivosPendientes((prev) => {
        const copia = { ...prev };
        delete copia[idAtencion];
        return copia;
      });
      cargarAtenciones(expedienteBasico.idExpediente);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubiendoId(null);
    }
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return '-';
    return new Date(fechaISO).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <ClienteLayout activo="atenciones">
      <div className={styles.panel}>
        <div className={styles.hero}>
          <div className={styles.heroIcono}><Paperclip size={24} /></div>
          <div>
            <h1 className={styles.heroTitulo}>Atenciones externas</h1>
            <p className={styles.heroSub}>Registrá consultas que le hicieron a tu mascota fuera de Huellitas Vitales, con sus comprobantes.</p>
          </div>
        </div>

        <div className={styles.seccion}>
          <span className={styles.pasoLabel}><span className={styles.pasoNumero}>1</span> Elegí la mascota</span>
          <MascotaChips mascotas={mascotas} valor={mascotaId} onSeleccionar={seleccionarMascota} />
        </div>

        {mascotaId && (
          <div className={styles.seccion}>
            <span className={styles.pasoLabel}><span className={styles.pasoNumero}>2</span> Registrar atención</span>
            <ExpedienteBadge detalle={detalleExpediente} cargando={cargandoExpediente} />

            {expedienteBasico && (
              <form onSubmit={guardar} className={styles.form}>
                <label className={`${styles.campo} ${styles.campoAncho}`}>
                  <span>Veterinaria o establecimiento</span>
                  <input
                    required
                    value={form.nombreVeterinaria}
                    onChange={(e) => setForm({ ...form, nombreVeterinaria: e.target.value })}
                    placeholder="Ej. Clínica Veterinaria San José"
                  />
                </label>
                <label className={styles.campo}>
                  <span>Profesional (opcional)</span>
                  <input
                    value={form.nombreProfesional}
                    onChange={(e) => setForm({ ...form, nombreProfesional: e.target.value })}
                  />
                </label>
                <label className={styles.campo}>
                  <span>Fecha de atención</span>
                  <input
                    required
                    type="datetime-local"
                    value={form.fechaAtencion}
                    onChange={(e) => setForm({ ...form, fechaAtencion: e.target.value })}
                  />
                </label>
                <label className={`${styles.campo} ${styles.campoAncho}`}>
                  <span>Motivo</span>
                  <textarea
                    required
                    rows={2}
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  />
                </label>
                <label className={styles.campo}>
                  <span>Diagnóstico (opcional)</span>
                  <textarea
                    rows={2}
                    value={form.diagnostico}
                    onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                  />
                </label>
                <label className={styles.campo}>
                  <span>Tratamiento (opcional)</span>
                  <textarea
                    rows={2}
                    value={form.tratamiento}
                    onChange={(e) => setForm({ ...form, tratamiento: e.target.value })}
                  />
                </label>
                <button className={styles.btnEnviar} disabled={enviando}>
                  {enviando ? 'Guardando…' : 'Registrar atención'}
                </button>
              </form>
            )}
          </div>
        )}

        {mascotaId && (
          <div className={styles.seccion}>
            <h2 className={styles.seccionTitulo}>Historial externo</h2>
            {atenciones.length === 0 ? (
              <div className={styles.estadoVacio}>Todavía no registraste ninguna atención externa para esta mascota.</div>
            ) : (
              <div className={styles.lista}>
                {atenciones.map((a) => {
                  const arrastrando = arrastrandoSobre === a.idAtencionExterna;
                  return (
                    <div key={a.idAtencionExterna} className={styles.item}>
                      <div className={styles.itemTop}>
                        <div className={styles.itemIcono}><FileText size={18} /></div>
                        <div>
                          <div className={styles.itemTitulo}>{a.nombreVeterinaria}</div>
                          <div className={styles.itemMeta}>{formatFecha(a.fechaAtencion)} · {a.motivo}</div>
                        </div>
                      </div>

                      {a.diagnostico && <div className={styles.itemDiagnostico}>Diagnóstico: {a.diagnostico}</div>}

                      {a.documentos && a.documentos.length > 0 && (
                        <ul className={styles.documentos}>
                          {a.documentos.map((doc) => (
                            <li key={doc.idDocumentoAtencionExterna}>
                              <a className={styles.documentoLink} href={resolverImagen(doc.rutaArchivo)} target="_blank" rel="noreferrer">
                                <Download size={14} /> {doc.nombreOriginal}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className={styles.dropzoneRow}>
                        <label
                          className={`${styles.dropzone} ${arrastrando ? styles.dropzoneActivo : ''}`}
                          onDragOver={(e) => { e.preventDefault(); setArrastrandoSobre(a.idAtencionExterna); }}
                          onDragLeave={() => setArrastrandoSobre(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setArrastrandoSobre(null);
                            elegirArchivo(a.idAtencionExterna, e.dataTransfer.files?.[0]);
                          }}
                        >
                          <UploadCloud size={16} />
                          {archivosPendientes[a.idAtencionExterna]?.name || 'Arrastrá un archivo o hacé clic (PDF, JPG, PNG)'}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => elegirArchivo(a.idAtencionExterna, e.target.files?.[0])}
                          />
                        </label>
                        <button
                          type="button"
                          className={styles.btnAdjuntar}
                          onClick={() => adjuntar(a.idAtencionExterna)}
                          disabled={subiendoId === a.idAtencionExterna || !archivosPendientes[a.idAtencionExterna]}
                        >
                          <Paperclip size={14} />
                          {subiendoId === a.idAtencionExterna ? 'Subiendo…' : 'Adjuntar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ClienteLayout>
  );
}
