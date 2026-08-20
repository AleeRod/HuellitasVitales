import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../api/config';
import { ToastContainer } from '../../components/Toast/Toast';
import { useToast } from '../../components/Toast/useToast';

export default function SolicitarEmergencia() {
  const [mascotas, setMascotas] = useState([]), [mascota, setMascota] = useState(''), [expediente, setExpediente] = useState(null);
  const [form, setForm] = useState({ ubicacion: '', motivo: '', descripcion: '' }); const { toasts, showToast, removeToast } = useToast();
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token_huellitas')}` });
  useEffect(() => { fetch(`${API_BASE}/usuario/mascotas`, { headers: headers() }).then(r => r.json()).then(d => setMascotas(d.mascotas || [])); }, []);
  const buscar = async id => { setMascota(id); setExpediente(null); const r = await fetch(`${API_BASE}/expediente/mascota/${id}`, { headers: headers() }); const d = await r.json(); if (!r.ok) return showToast(d.mensaje, 'warning'); setExpediente(d.expediente); };
  const enviar = async e => { e.preventDefault(); if (!expediente) return showToast('Selecciona una mascota con expediente.', 'warning'); const r = await fetch(`${API_BASE}/expedientes/${expediente.idExpediente}/emergencias`, { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const d = await r.json(); if (!r.ok) return showToast(d.mensaje || 'No se pudo enviar la emergencia.', 'error'); showToast('Solicitud de emergencia enviada.', 'success'); setForm({ ubicacion: '', motivo: '', descripcion: '' }); };
  return <main className="main-content" style={{ padding: 32, maxWidth: 780 }}><h1>Solicitar emergencia</h1><p>Solicita ayuda veterinaria inmediata para tu mascota.</p><select value={mascota} onChange={e => buscar(e.target.value)}><option value="">Selecciona una mascota</option>{mascotas.map(m => <option key={m.idMascota} value={m.idMascota}>{m.nombre}</option>)}</select><form onSubmit={enviar} style={{ display: 'grid', gap: 12, marginTop: 24 }}><input required placeholder="Ubicación exacta" value={form.ubicacion} onChange={e => setForm({...form, ubicacion:e.target.value})}/><input required placeholder="Motivo de la emergencia" value={form.motivo} onChange={e => setForm({...form, motivo:e.target.value})}/><textarea placeholder="Describe síntomas, accidente o condición" value={form.descripcion} onChange={e => setForm({...form, descripcion:e.target.value})}/><button className="btn-main" disabled={!expediente}>Enviar solicitud de emergencia</button></form><ToastContainer toasts={toasts} removeToast={removeToast}/></main>;
}
