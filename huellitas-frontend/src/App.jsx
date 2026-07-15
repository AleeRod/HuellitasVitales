import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Importamos Bootstrap para que esté disponible en toda la aplicación
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Ruta de Login */}
        <Route path="/login" element={<Login />} />

        {/* Ruta de Registro */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;