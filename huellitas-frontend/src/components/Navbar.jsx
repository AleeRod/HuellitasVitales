import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
      
      <div className="landing-nav-links">
        <Link to="/login" className="btn-outline">Iniciar Sesión</Link>
        <Link to="/register" className="btn-solid">Registrarse</Link>
      </div>
    </nav>
  );
};

export default Navbar;