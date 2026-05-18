// src/components/SuccessRouteModal.jsx
import React, { useState } from 'react';
import '../styles/SaveRouteModal.css';

export default function SuccessRouteModal({ onClose, gpxData }) {
    const [confirmingPlan, setConfirmingPlan] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const API_URL = import.meta.env.VITE_APP_API_URL;

    const handleExportGPX = () => {
        if (!gpxData) return;
        const blob = new Blob([gpxData.gpxString], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${gpxData.nom.replace(/\s+/g, '_')}.gpx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGoToMyRoutes = () => {
        window.location.href = '/rutes/meves';
    };

    const applyAndReload = (planId) => {
        localStorage.setItem('ruta_editant_id', String(gpxData.rutaId));
        if (planId) localStorage.setItem('ruta_editant_planificacio_id', String(planId));
        localStorage.setItem('ruta_esborrany_nodes', JSON.stringify(gpxData.savedNodes || []));
        localStorage.setItem('ruta_esborrany_trams', JSON.stringify(gpxData.savedTrams || []));
        localStorage.setItem('ruta_editant_tab', 'assistent');
        window.location.reload();
    };

    const handleContinueWithAI = () => {
        if (!gpxData?.rutaId) return;
        if (!gpxData.planId) {
            // No planification exists — ask before creating one
            setConfirmingPlan(true);
            return;
        }
        applyAndReload(gpxData.planId);
    };

    const handleCreatePlanAndContinue = async () => {
        setCreatingPlan(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/planner/planificacions/crear/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ruta: gpxData.rutaId,
                    titol: `Planificació de ${gpxData.nom}`,
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            applyAndReload(data.id);
        } catch {
            setCreatingPlan(false);
            setConfirmingPlan(false);
        }
    };

    if (confirmingPlan) {
        return (
            <div className="save-route-modal-overlay">
                <div className="save-route-modal-content success-modal-content">
                    <div className="success-icon-container">
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#2d5a3d' }}>psychology</span>
                    </div>
                    <h2 className="save-route-modal-title success-title">Crear planificació?</h2>
                    <p className="success-subtitle">
                        No tens cap planificació per a aquesta ruta. L'assistent necessita una per poder afegir equipament automàticament a la motxilla.<br /><br />
                        Vols crear-ne una ara?
                    </p>
                    <div className="success-button-group">
                        <button
                            onClick={handleCreatePlanAndContinue}
                            disabled={creatingPlan}
                            className="save-route-btn save-route-btn-ai success-btn-layout"
                        >
                            <span className="material-symbols-outlined">add_task</span>
                            {creatingPlan ? 'Creant...' : 'Sí, crea la planificació'}
                        </button>
                        <button
                            onClick={() => applyAndReload(null)}
                            disabled={creatingPlan}
                            className="save-route-btn save-route-btn-cancel success-btn-layout"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            Continuar sense planificació
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="save-route-modal-overlay">
            <div className="save-route-modal-content success-modal-content">

                <div className="success-icon-container">
                    <span className="material-symbols-outlined success-icon">check_circle</span>
                </div>

                <h2 className="save-route-modal-title success-title">Route Saved Successfully!</h2>
                <p className="success-subtitle">What would you like to do next?</p>

                <div className="success-button-group">

                    <button
                        onClick={handleContinueWithAI}
                        className="save-route-btn save-route-btn-ai success-btn-layout"
                    >
                        <span className="material-symbols-outlined">psychology</span>
                        Continue with AI Assistant
                    </button>

                    <button
                        onClick={handleGoToMyRoutes}
                        className="save-route-btn save-route-btn-save success-btn-layout"
                    >
                        <span className="material-symbols-outlined">map</span>
                        Go to My Routes
                    </button>

                    <button
                        onClick={handleExportGPX}
                        className="save-route-btn success-btn-export success-btn-layout"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Export GPX File
                    </button>

                    <button
                        onClick={onClose}
                        className="save-route-btn save-route-btn-cancel success-btn-layout"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Create Another Route
                    </button>

                </div>
            </div>
        </div>
    );
}