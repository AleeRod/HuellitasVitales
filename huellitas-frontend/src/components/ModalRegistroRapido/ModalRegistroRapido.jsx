import React, { useState } from 'react';
<<<<<<< HEAD
import { X, User, Mail, Phone, ArrowRight, Info } from 'lucide-react';
=======
import { X, User, Mail, Phone, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { API_BASE } from '../../api/config'; // 👈 Asegúrate de que la ruta sea correcta según tu estructura
>>>>>>> feature-GestionCarrito
import styles from './ModalRegistroRapido.module.css';

const ModalRegistroRapido = ({ isOpen, onClose, onRegistroExitoso }) => {
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: ''
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    
<<<<<<< HEAD
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: null });
=======
    // Limpiar errores al escribir
    if (errores[e.target.name] || errores.general) {
      setErrores({ ...errores, [e.target.name]: null, general: null });
>>>>>>> feature-GestionCarrito
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!form.correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.correo)) {
      nuevosErrores.correo = 'Formato de correo inválido';
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setCargando(true);
<<<<<<< HEAD
    
    // MOCK: Llamada al endpoint para registrar usuario sin contraseña y avanzar al pago
    setTimeout(() => {
      console.log('Datos enviados para checkout rápido:', form);
      setCargando(false);
      if (onRegistroExitoso) onRegistroExitoso();
    }, 1500);
=======
    setErrores({});
    
    try {
      // 👈 Pegándole al backend real
      const response = await fetch(`${API_BASE}/usuario/registro-rapido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          NombreCompleto: form.nombre, 
          Correo: form.correo,
          Telefono: form.telefono
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar el registro rápido.');
      }

      // 👈 Guardar el token para que el usuario quede "logeado"
      localStorage.setItem('token_huellitas', data.token);
      
      // 👈 Continuar con el checkout en el Carrito
      if (onRegistroExitoso) onRegistroExitoso();

    } catch (error) {
      setErrores({ general: error.message });
    } finally {
      setCargando(false);
    }
>>>>>>> feature-GestionCarrito
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.modalHeader}>
          <h2 className={styles.titulo}>Datos de contacto</h2>
          <p className={styles.subtitulo}>
            Ingresa tu información para procesar tu orden y enviarte los detalles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.inputGroup}>
            <label>Nombre completo *</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input 
                type="text" 
                name="nombre"
                placeholder="Ej: Javier Powers" 
                value={form.nombre}
                onChange={handleChange}
                className={errores.nombre ? styles.inputError : ''}
              />
            </div>
            {errores.nombre && <span className={styles.errorText}>{errores.nombre}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Correo electrónico *</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                name="correo"
                placeholder="correo@ejemplo.com" 
                value={form.correo}
                onChange={handleChange}
                className={errores.correo ? styles.inputError : ''}
              />
            </div>
            {errores.correo && <span className={styles.errorText}>{errores.correo}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label>Teléfono (Opcional)</label>
            <div className={styles.inputWrapper}>
              <Phone size={18} className={styles.inputIcon} />
              <input 
                type="tel" 
                name="telefono"
                placeholder="Ej: 8888-8888" 
                value={form.telefono}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(82, 183, 136, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '10px' }}>
            <Info size={16} color="#2d6a4f" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#1B4332', lineHeight: '1.4' }}>
              Podrás habilitar esta cuenta más tarde vinculando tus redes sociales o utilizando la opción de recuperar contraseña.
            </p>
          </div>

<<<<<<< HEAD
=======
          {/* 👈 Mensaje de error general del backend (ej: correo ya registrado) */}
          {errores.general && (
            <div style={{ color: '#d90429', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
              <AlertCircle size={16} />
              <span>{errores.general}</span>
            </div>
          )}

>>>>>>> feature-GestionCarrito
          <button type="submit" className={styles.btnSubmit} disabled={cargando}>
            {cargando ? 'Procesando...' : 'Continuar con el pago'}
            {!cargando && <ArrowRight size={18} />}
          </button>

          <p className={styles.loginHint}>
            ¿Ya tienes una cuenta activa? <a href="/login" className={styles.loginLink}>Inicia sesión aquí</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistroRapido;