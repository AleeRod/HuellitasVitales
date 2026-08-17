import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardAdmin from './pages/Admin/DashboardAdmin';
import PanelVeterinario from './pages/Veterinario/PanelVeterinario';
import DashboardCliente from './pages/Cliente/DashboardCliente';
import MisCitas from './pages/Cliente/MisCitas';
import MisMascotas from './pages/Cliente/MisMascotas';
import HistorialClinico from './pages/Cliente/HistorialClinico';
import Vacunas from './pages/Cliente/Vacunas';
import Reportes from './pages/Cliente/Reportes';
import Configuracion from './pages/Cliente/Configuracion';
import SolicitudComercio from './pages/SolicitudComercio/SolicitudComercio';
import Marketplace from './pages/Marketplace/Marketplace';
import Perfil from './pages/Perfil/Perfil';
import Carrito from './pages/Carrito/Carrito';
import { CarritoProvider } from './context/CarritoProvider';
import DashboardFuncionario from './pages/Funcionario/DashboardFuncionario';

function App() {
  return (
    <Router>
      <CarritoProvider>
        <Routes>
          <Route path="/SolicitudComercio" element={<SolicitudComercio />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:id" element={<Perfil />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<DashboardAdmin />} />
          <Route path="/veterinario" element={<PanelVeterinario />} />
          <Route path="/cliente" element={<DashboardCliente />} />
          <Route path="/cliente/mis-citas" element={<MisCitas />} />
          <Route path="/cliente/mis-mascotas" element={<MisMascotas />} />
          <Route path="/cliente/historial-clinico" element={<HistorialClinico />} />
          <Route path="/cliente/vacunas" element={<Vacunas />} />
          <Route path="/cliente/reportes" element={<Reportes />} />
          <Route path="/cliente/configuracion" element={<Configuracion />} />
          <Route path="/funcionario" element={<DashboardFuncionario />} />
        </Routes>
      </CarritoProvider>
    </Router>
  );
}

export default App;