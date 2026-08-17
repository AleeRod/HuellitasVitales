import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CarritoIcono from './CarritoIcono/CarritoIcono';

const Navbar = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_huellitas');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para redirigir según el rol
  // IDs confirmados en la BD: 1=Administrador, 2=Profesional, 3=Cliente, 4=Funcionario
  const irAlPanel = () => {
    if (!usuario) return;
    const rol = usuario.idRol;

    if (rol === 1) {
      navigate('/admin');
    } else if (rol === 4) {
      navigate('/funcionario');
    } else if (rol === 2) {
      navigate('/profesional');
    } else {
      navigate('/cliente');
    }
    setDropdownOpen(false);
  };

  // Texto del rol para mostrar en el botón del dropdown
  const nombreRol = (idRol) => {
    switch (idRol) {
      case 1: return 'Admin';
      case 2: return 'Profesional';
      case 4: return 'Funcionario';
      default: return 'Cliente';
    }
  };

  // Cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem('token_huellitas');
    localStorage.removeItem('usuario_huellitas');
    setUsuario(null);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="landing-nav">
      <div className="landing-brand">
        <img src="/Imagenes/logo.png" alt="Logo Huellitas" style={{ width: '40px', height: 'auto' }} />
        <span>Huellitas Vitales</span>
      </div>
      
      <div className="landing-nav-menu">
        <a href="#inicio" className="nav-item-link">Inicio</a>
        <a href="#servicios" className="nav-item-link">Servicios</a>
        <a href="#funciones" className="nav-item-link">Funciones</a>
        <a href="#marketplace" className="nav-item-link">Marketplace</a>
        <a href="#registro-mascota" className="nav-item-link">Registra tu Mascota</a>
        <a href="#comercios" className="nav-item-link">Comercios</a>
        <a href="#contacto" className="nav-item-link">Contacto</a>
      </div>
      
      <div className="landing-nav-links" ref={dropdownRef}>
        {/* Visible siempre: el carrito se puede armar sin iniciar sesión. */}
        <CarritoIcono />

        {usuario ? (
          // 🟢 CONTENEDOR DEL DROPDOWN DE USUARIO
          <div className="user-dropdown-container" style={{ position: 'relative' }}>
            
            {/* Botón principal del perfil */}
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className="user-menu-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(82, 183, 136, 0.15)',
                border: '1px solid #52B788',
                padding: '6px 14px',
                borderRadius: '30px',
                cursor: 'pointer',
                color: '#fff',
                fontFamily: 'inherit',
                fontWeight: '600'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#52B788',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <span>{usuario.nombre ? usuario.nombre.split(' ')[0] : 'Usuario'}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            {/* Menú Desplegable (Dropdown) */}
            {dropdownOpen && (
              <div className="dropdown-menu-custom" style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                background: '#1a2e26',
                border: '1px solid rgba(82, 183, 136, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                width: '230px',
                padding: '8px 0',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '5px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#a0aec0' }}>Conectado como</p>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {usuario.correo || usuario.nombre}
                  </p>
                </div>

                {/* Opción: Mi Perfil */}
                <Link 
                  to="/perfil" 
                  onClick={() => setDropdownOpen(false)}
                  style={dropdownItemStyle}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Mi Perfil
                </Link>

                {/* Opción: Ir al Panel */}
                <button 
                  onClick={irAlPanel}
                  style={{ ...dropdownItemStyle, background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>Panel ({nombreRol(usuario.idRol)})</span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>

                {/* Opción: Cerrar Sesión */}
                <button 
                  onClick={cerrarSesion}
                  style={{ ...dropdownItemStyle, color: '#ff6b6b', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            )}

          </div>
        ) : (
          // 🔴 VISTA ANÓNIMA
          <>
            <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
            <Link to="/register" className="btn-solid">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const dropdownItemStyle = {
  padding: '10px 16px',
  color: '#e2e8f0',
  textDecoration: 'none',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  transition: 'background 0.2s',
  fontFamily: 'inherit'
};

export default Navbar;