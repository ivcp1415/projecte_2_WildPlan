import React, { useState, useEffect } from 'react';
import '../styles/AlertesView.css';

function AlertesView() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock alertes data - connect to backend API
    setAlertes([
      {
        id: 1,
        titulo: 'Avís Allaus',
        nivel: 3,
        descripcio: 'Nivell 3 - Condicions inestables. Evita zones d\'allaus.',
        ubicacio: 'Pic de Casamanya',
        fecha: '2024-03-15'
      },
      {
        id: 2,
        titulo: 'Alerta de Vent',
        nivel: 2,
        descripcio: 'Vents de 50+ km/h a cims. Risc de caiguda.',
        ubicacio: 'Coma Pedrosa',
        fecha: '2024-03-15'
      }
    ]);
    setLoading(false);
  }, []);

  if (loading) return <div className="status-msg">Carregant alertes...</div>;

  return (
    <div className="alertes-view">
      <header className="view-header">
        <h1>Alertes i Riscos</h1>
        <p>Consulta les alertes actives per a les teves expedicions</p>
      </header>

      <div className="alertes-list">
        {alertes.length === 0 ? (
          <div className="status-msg">No hi ha alertes actives</div>
        ) : (
          alertes.map((alerta) => (
            <div key={alerta.id} className={`alerta-card nivel-${alerta.nivel}`}>
              <div className="alerta-header">
                <span className="material-symbols-outlined">warning</span>
                <div className="alerta-title-group">
                  <h3>{alerta.titulo}</h3>
                  <p className="alerta-ubicacio">{alerta.ubicacio}</p>
                </div>
              </div>
              <p className="alerta-descripcio">{alerta.descripcio}</p>
              <span className="alerta-fecha">{new Date(alerta.fecha).toLocaleDateString('ca-ES')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertesView;
