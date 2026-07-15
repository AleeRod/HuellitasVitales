import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      {/* Menú de Navegación */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3">
        <div className="container">
          <a className="navbar-brand text-primary fw-bold" href="#">
            Huellitas Vitales
          </a>
          <div className="ms-auto d-flex gap-2">
            {/* Usamos <Link to="..."> en lugar de <a href="..."> para cambiar de página al instante */}
            <Link to="/login" className="btn btn-outline-primary">Iniciar Sesión</Link>
            <Link to="/register" className="btn btn-primary">Regístrate</Link>
          </div>
        </div>
      </nav>

      {/* Sección Principal (Hero) */}
      <section className="text-center py-5 bg-light my-5">
        <div className="container">
          <h1 className="display-4 fw-bold text-primary mb-4">El bienestar de tu mascota, en un solo lugar</h1>
          <p className="lead text-muted mb-5">Gestiona el expediente médico, agenda citas y encuentra comercios aliados.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-primary btn-lg px-4">Registrar Mascota</Link>
            <Link to="/login" className="btn btn-success btn-lg px-4">Solicitud de Comercio</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;