import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, LayoutDashboard, LogOut } from 'lucide-react';
import { IconoDePerfil } from '../Cliente/AvatarIconos';
import { API_BASE } from '../../api/config';
import styles from './PerfilMenu.module.css';

/**
 * Zona de sesión que aparece arriba a la derecha de cualquier barra de
 * navegación: si no hay sesión, los botones de Iniciar sesión/Registrarse; si
 * hay sesión, el avatar + nombre con el mismo menú desplegable que ya usaba
 * el Navbar de la landing (Mi Perfil, ir al panel según el rol, Cerrar
 * sesión). Se extrajo a un componente propio (con su propio CSS Module) para
 * poder montarlo también en `DogNav`, que no carga `LandingPage.css` de
 * donde salían las clases originales.
 */
const PerfilMenu = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [avatarIcono, setAvatarIcono] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  // Cargar usuario del localStorage al iniciar.
  useEffect(() => {
    const guardado = localStorage.getItem('usuario_huellitas');
    if (guardado) {
      try {
        setUsuario(JSON.parse(guardado));
      } catch (error) {
        console.error('No se pudo leer el usuario guardado', error);
      }
    }
  }, []);

  // El ícono de avatar elegido no viaja en el localStorage guardado al iniciar sesión, así que
  // se refresca desde el propio perfil (mismo patrón que ClienteLayout y los demás paneles).
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem('token_huellitas');
    if (!token) return undefined;

    fetch(`${API_BASE}/usuario/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo && data?.avatarIcono) setAvatarIcono(data.avatarIcono);
      })
      .catch(() => {});

    return () => { activo = false; };
  }, []);

  // Cerrar el dropdown si se hace clic fuera de él.
  useEffect(() => {
    const alHacerClicFuera = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => document.removeEventListener('mousedown', alHacerClicFuera);
  }, []);

  // IDs confirmados en la BD: 1=Administrador, 2=Profesional, 3=Cliente, 4=Funcionario
  const irAlPanel = () => {
    if (!usuario) return;
    const rol = usuario.idRol;

    if (rol === 1) navigate('/admin');
    else if (rol === 4) navigate('/funcionario');
    else if (rol === 2) navigate('/veterinario');
    else navigate('/cliente');

    setAbierto(false);
  };

  const nombreRol = (idRol) => {
    switch (idRol) {
      case 1: return 'Admin';
      case 2: return 'Profesional';
      case 4: return 'Funcionario';
      default: return 'Cliente';
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token_huellitas');
    localStorage.removeItem('usuario_huellitas');
    setUsuario(null);
    setAbierto(false);
    navigate('/');
  };

  if (!usuario) {
    return (
      <div className={styles.anonimo}>
        <Link to="/login" className={styles.botonOutline}>Iniciar Sesión</Link>
        <Link to="/register" className={styles.botonSolido}>Registrarse</Link>
      </div>
    );
  }

  const nombreUsuario = usuario.nombre ? usuario.nombre.split(' ')[0] : 'Usuario';
  const inicial = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => setAbierto((actual) => !actual)}
        aria-expanded={abierto}
      >
        <span className={styles.avatar}>
          {avatarIcono ? <IconoDePerfil icono={avatarIcono} size={16} /> : inicial}
        </span>
        <span className={styles.nombre}>{nombreUsuario}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ''}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownCabecera}>
            <p>Conectado como</p>
            <strong>{usuario.correo || usuario.nombre}</strong>
          </div>

          <Link to="/perfil" onClick={() => setAbierto(false)} className={styles.dropdownItem}>
            <User size={16} aria-hidden="true" /> Mi Perfil
          </Link>

          <button type="button" onClick={irAlPanel} className={styles.dropdownItem}>
            <LayoutDashboard size={16} aria-hidden="true" /> Panel ({nombreRol(usuario.idRol)})
          </button>

          <div className={styles.separador} />

          <button
            type="button"
            onClick={cerrarSesion}
            className={`${styles.dropdownItem} ${styles.dropdownItemPeligro}`}
          >
            <LogOut size={16} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default PerfilMenu;
