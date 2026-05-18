import React from 'react';
import ClimaView from './ClimaView';
import AlertesView from './AlertesView';
import '../styles/PlanificacioView.css';

/**
 * Tab "Informació" del Planificador.
 * Agrupa la previsió meteorològica i les alertes de seguretat per a la zona
 * de la ruta. Substitueix les pestanyes separades "Clima" i "Alertes" per
 * alinear-se amb el diagrama de navegació.
 */
function InformacioView(props) {
  return (
    <div className="planif-view informacio-view">
      <header className="planif-header">
        <div className="planif-header-text">
          <h1>Informació</h1>
          <p>Previsió meteorològica i alertes de seguretat vigents per a la zona escollida.</p>
        </div>
      </header>

      <section className="informacio-section">
        <div className="informacio-section-title">
          <span className="material-symbols-outlined">cloud</span>
          <h2>Meteorologia</h2>
        </div>
        <ClimaView {...props} />
      </section>

      <section className="informacio-section">
        <div className="informacio-section-title">
          <span className="material-symbols-outlined">warning</span>
          <h2>Alertes de seguretat</h2>
        </div>
        <AlertesView {...props} />
      </section>
    </div>
  );
}

export default InformacioView;
