import React, { useState } from 'react';
import '../styles/SaveRouteModal.css'; // Make sure the path matches your structure

export default function SaveRouteModal({ onClose, onSave, stats, defaultName, urlImatge, setUrlImatge }) {
    const [name, setName] = useState(defaultName);
    const [description, setDescription] = useState('');
    const [modality, setModality] = useState('senderisme');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            nom: name,
            descripcio: description,
            modalitat: modality
        });
    };

    return (
        <div className="save-route-modal-overlay">
            <div className="save-route-modal-content">
                <h2 className="save-route-modal-title">Save Route</h2>

                <form onSubmit={handleSubmit} className="save-route-form">
                            {/* --- SECCIÓ D'IMATGE ÚNICA --- */}
                    <div className="image-section" style={{ marginBottom: '24px' }}>
                        {urlImatge ? (
                            <img
                                src={urlImatge}
                                alt="Previsualització de la ruta"
                                style={{
                                    width: '100%',
                                    height: '160px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    marginBottom: '12px',
                                    backgroundColor: 'var(--border-color)'
                                }}
                                onError={(e) => {
                                    // Si la URL que enganxen no és vàlida, mostrem això perquè no quedi trencat
                                    e.target.src = "https://via.placeholder.com/400x160?text=Imatge+no+disponible";
                                }}
                            />
                        ) : (
                            <div className="img-box main-img" style={{ width: '100%', height: '160px', marginBottom: '12px', backgroundColor: 'var(--input-bg)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined img-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>landscape</span>
                                <p style={{ textAlign: 'center', fontSize: '0.8rem', margin: 0 }}>La imatge de la ruta<br/>apareixerà aquí</p>
                            </div>
                        )}

                        {/* Input on enganxar l'enllaç */}
                        <div className="waypoint-input-wrapper" style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)', fontSize: '20px' }}>link</span>
                            <input
                                type="text"
                                className="pill-input"
                                placeholder="Enganxa la URL de la imatge..."
                                value={urlImatge}
                                onChange={(e) => setUrlImatge(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div className="save-route-form-group">
                        <label className="save-route-label">Route Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="save-route-input"
                        />
                    </div>

                    <div className="save-route-form-group">
                        <label className="save-route-label">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows="4"
                            className="save-route-input save-route-textarea"
                            placeholder="Briefly explain the route..."
                        />
                    </div>

                    <div className="save-route-form-group">
                        <label className="save-route-label">Activity Type</label>
                        <select
                            value={modality}
                            onChange={(e) => setModality(e.target.value)}
                            className="save-route-input"
                        >
                            <option value="senderisme">Hiking</option>
                            <option value="btt">Mountain Biking (MTB)</option>
                            <option value="escalada">Climbing</option>
                            <option value="esqui">Skiing</option>
                            <option value="altra">Other</option>
                        </select>
                    </div>

                    <div className="save-route-stats-container">
                        <div className="save-route-stats-row">
                            <span><strong>Distància:</strong> {stats.distancia.toFixed(2)} km</span>
                            <span><strong>Desnivell Positiu:</strong> +{stats.desnivell_positiu}m</span>
                            <span><strong>Desnivell Negatiu:</strong> +{stats.desnivell_negatiu}m</span>
                        </div>
                    </div>

                    <div className="save-route-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="save-route-btn save-route-btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="save-route-btn save-route-btn-save"
                        >
                            Save to Database
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}