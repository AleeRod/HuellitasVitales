import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import PanelVeterinario from './pages/veterinario/PanelVeterinario';
import DashboardCliente from './pages/cliente/DashboardCliente';
import SolicitudComercio from './pages/SolicitudComercio/SolicitudComercio';

function App() { 

  return (
    <Router>
      <Routes>
        <Route path="/SolicitudComercio" element={<SolicitudComercio />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/veterinario" element={<PanelVeterinario />} />
        <Route path="/cliente" element={<DashboardCliente />} />
      </Routes>
    </Router>
  );
}

export default App;