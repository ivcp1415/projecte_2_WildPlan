import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Registre from './pages/Registre.jsx';
import LlistatRutes from './pages/LlistatRutes.jsx';
import LlistatRutesPropies from './pages/LlistatRutesPropies.jsx';
import DetallRuta from './pages/DetallRuta.jsx';
import Rutes from './pages/Rutes.jsx';
import PerfilUsuari from './pages/PerfilUsuari.jsx';
import EditarPerfil from './pages/EditarPerfil.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/registre"      element={<Registre />} />
        <Route path="/rutes"         element={<LlistatRutes />} />
        <Route path="/rutes/meves"   element={<LlistatRutesPropies />} />
        <Route path="/rutes/:pk"     element={<DetallRuta />} />
        <Route path="/crear-ruta"    element={<Rutes />} />
        <Route path="/perfil"        element={<PerfilUsuari />} />
        <Route path="/perfil/editar" element={<EditarPerfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
