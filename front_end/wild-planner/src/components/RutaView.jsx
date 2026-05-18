import React, { useState, useEffect } from 'react';
import '../styles/RutaView.css';

function RutaView() {
  const [rutes, setRutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRutes = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}/planner/rutes/`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setRutes(data);
        }
      } catch (err) {
        console.error('Error carregant rutes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchRutes();
  }, [token]);

  if (loading) return <div className="status-msg">Carregant rutes...</div>;

  return (
    <div className="ruta-view">
      <header className="view-header">
        <h1>Selecciona una Ruta</h1>
        <p>Tria la ruta que vols planificar</p>
      </header>

      <div className="rutes-list">
        {rutes.length === 0 ? (
          <div className="status-msg">No hi ha rutes disponibles</div>
        ) : (
          rutes.map((ruta) => (
            <div key={ruta.id} className="ruta-item">
              <h3>{ruta.nom}</h3>
              <div className="ruta-specs">
                <span>📏 {ruta.distancia} km</span>
                <span>⬆️ {ruta.desnivell_positiu}m</span>
                <span>⏱️ {ruta.temps_estimat}h</span>
              </div>
              <p className="ruta-descripcio">{ruta.descripcio}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RutaView;
