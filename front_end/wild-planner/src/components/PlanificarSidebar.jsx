import React from 'react';
import '../styles/PlanificarSidebar.css';

function PlanificarSidebar({ activeTab, setActiveTab }) {
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
    </aside>
  );
}

export default PlanificarSidebar;
