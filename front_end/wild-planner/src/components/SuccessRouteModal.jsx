// src/components/SuccessRouteModal.jsx
import React from 'react';
import '../styles/SaveRouteModal.css'; // Reusing the same stylesheet

export default function SuccessRouteModal({ onClose, gpxData }) {

    // Logic to download the GPX string as a file
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

    // Logic to navigate to 'My Routes'
    const handleGoToMyRoutes = () => {
        window.location.href = '/rutes/meves';
    };

    return (
        <div className="save-route-modal-overlay">
            {/* Note: Combining the standard content class with the new center-aligned success class */}
            <div className="save-route-modal-content success-modal-content">

                <div className="success-icon-container">
                    <span className="material-symbols-outlined success-icon">check_circle</span>
                </div>

                <h2 className="save-route-modal-title success-title">Route Saved Successfully!</h2>
                <p className="success-subtitle">What would you like to do next?</p>

                <div className="success-button-group">

                    {/* OPTION 1: Go to My Routes */}
                    <button
                        onClick={handleGoToMyRoutes}
                        className="save-route-btn save-route-btn-save success-btn-layout"
                    >
                        <span className="material-symbols-outlined">map</span>
                        Go to My Routes
                    </button>

                    {/* OPTION 2: Export GPX */}
                    <button
                        onClick={handleExportGPX}
                        className="save-route-btn success-btn-export success-btn-layout"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Export GPX File
                    </button>

                    {/* OPTION 3: Continue Creating */}
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