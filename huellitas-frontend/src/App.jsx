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
import Carrito from './pages/Carrito/Carrito';
import { CarritoProvider } from './context/CarritoProvider';

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
        </Routes>
      </CarritoProvider>
    </Router>
  );
}

export default App;