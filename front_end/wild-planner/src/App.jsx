import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Rutes from './pages/Rutes.jsx';
import DetallRuta from './pages/DetallRuta.jsx';
import Registre from './pages/Registre.jsx';
import LlistatRutes from './pages/LlistatRutes.jsx';
import PerfilUsuari from './pages/PerfilUsuari.jsx';
import EditarPerfil from './pages/EditarPerfil.jsx';
import LlistatRutesPropies from './pages/LlistatRutesPropies.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/rutes" element={<LlistatRutes />} />
        <Route path="/rutes/meves" element={<LlistatRutesPropies />} />

        {/* Quan l'usuari entri a http://localhost:3000/ veurà directament el Login */}
        <Route path="/" element={<LlistatRutes   />} />

        {/* També podem definir la ruta /login explícitament */}
        <Route path="/login" element={<Login />} />
        {/* Pots afegir aquí la ruta de rutes: <Route path="/rutes" element={<VeureRutes />} /> */}
        <Route path="/crear-ruta" element={<Rutes />} />
        {/* Cada Route conecta una URL con su componente */}
        {/* path: la URL | element: el componente que se muestra */}
        {/* :pk es un parámetro dinámico — /rutes/5 → pk = "5" */}
        <Route path="/rutes/:pk"   element={<DetallRuta />} />
        <Route path="/registre" element={<Registre />} />
        <Route path="/perfil/editar" element={<EditarPerfil />} />
        <Route path="/perfil" element={<PerfilUsuari />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
