import React from 'react';
import './Navbar.css';
function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
            <div className="container-fluid">
                <span className="navbar-brand fw-bold text-success">Huellitas Vitales</span>
                <button className="btn btn-outline-danger btn-sm">Cerrar Sesión</button>
            </div>
        </nav>
    );
}

export default Navbar;