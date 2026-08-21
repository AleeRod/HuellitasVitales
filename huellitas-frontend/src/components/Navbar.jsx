import React from 'react';
import CarritoIcono from './CarritoIcono/CarritoIcono';
import PerfilMenu from './PerfilMenu/PerfilMenu';

const Navbar = () => {
  return (
    <nav className="landing-nav">
      <div className="landing-brand">
        <img src="/Imagenes/logo-huellitas.png" alt="Logo Huellitas" style={{ width: '62px', height: 'auto', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))', objectFit: 'contain' }} />
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
        {/* Visible siempre: el carrito se puede armar sin iniciar sesión. */}
        <CarritoIcono />
        <PerfilMenu />
      </div>
    </nav>
  );
};

export default Navbar;
