import React from 'react';
import '../styles/PlanificarSidebar.css';

function PlanificarSidebar({ activeTab, setActiveTab, setMostrarAjuda, setMostrarAjustos }) {
  const tabs = [
    { id: 'ruta',         label: 'Ruta',         icon: 'map' },
    { id: 'planificacio', label: 'Planificació', icon: 'event_note' },
    { id: 'clima',        label: 'Clima',        icon: 'cloud' },
    { id: 'alertes',      label: 'Alertes',      icon: 'warning' },
    { id: 'assistent',    label: 'Assistent IA', icon: 'psychology' },
  ];

  return (
    <aside className="planificar-sidebar">
      <div className="sidebar-header">
        <h2>Planificador</h2>
        <p>Mou-te lliurement entre pestanyes</p>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop footer — hidden on mobile (bottom nav handles it) */}
      <div className="sidebar-footer-actions">
        <button className="sidebar-util-btn" onClick={() => setMostrarAjuda(true)}>
          <span className="material-symbols-outlined">help</span>
          <span className="label">Ajuda</span>
        </button>
        <button className="sidebar-util-btn" onClick={() => setMostrarAjustos(true)}>
          <span className="material-symbols-outlined">settings</span>
          <span className="label">Ajustos</span>
        </button>
      </div>

      {/* Mobile: icon-only buttons appended to bottom nav bar */}
      <div className="sidebar-mobile-utils">
        <button className="sidebar-item" onClick={() => setMostrarAjuda(true)} title="Ajuda">
          <span className="material-symbols-outlined">help</span>
          <span className="label">Ajuda</span>
        </button>
        <button className="sidebar-item" onClick={() => setMostrarAjustos(true)} title="Ajustos">
          <span className="material-symbols-outlined">settings</span>
          <span className="label">Ajustos</span>
        </button>
      </div>
    </aside>
  );
}

export default PlanificarSidebar;
