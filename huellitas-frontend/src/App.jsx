import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardAdmin from './pages/Admin/DashboardAdmin';
import PanelVeterinario from './pages/Veterinario/PanelVeterinario';
import DashboardCliente from './pages/Cliente/DashboardCliente';
import SolicitudComercio from './pages/SolicitudComercio/SolicitudComercio';
import Marketplace from './pages/Marketplace/Marketplace';
import Perfil from './pages/Perfil/Perfil';
import GestionServicios from './pages/Admin/GestionServicios';
import RutaProtegida from './routes/RutaProtegida';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/SolicitudComercio" element={<SolicitudComercio />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/perfil/:id" element={<Perfil />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route
          path="/admin/servicios"
          element={
            <RutaProtegida roles={["Administrador"]}>
              <GestionServicios />
            </RutaProtegida>
          }
        />
        <Route path="/veterinario" element={<PanelVeterinario />} />
        <Route path="/cliente" element={<DashboardCliente />} />
      </Routes>
    </Router>
  );
}

export default App;