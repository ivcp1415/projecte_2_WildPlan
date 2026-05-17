import React from 'react';
import '../styles/AjustosModal.css';

export default function AjustosModal({
    onClose,
    altContrast, setAltContrast,
    indicadorPendent, setIndicadorPendent,
}) {
    return (
        <div className="ajuda-overlay" onClick={onClose}>
            {/* Utilitzem la mateixa classe base del modal d'ajuda, però més estret */}
            <div className="ajuda-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>

                <div className="ajuda-header" style={{ marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined">settings</span>
                            Ajustos
                        </h2>
                        <p>Configura les opcions d'accessibilitat i visualització.</p>
                    </div>
                    <button className="btn-close-modal" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Targeta d'Accessibilitat (Ara funcional) */}
                <div className="ajuda-card card-dark" style={{ padding: '24px' }}>
                    <div className="card-title text-white" style={{ marginBottom: '24px' }}>
                        <span className="material-symbols-outlined">accessibility_new</span>
                        <h3>Accessibilitat</h3>
                    </div>

                    <div className="settings-list">
                        {/* Toggle 2: Pendent */}
                        <div className="setting-item">
                            <div className="setting-info">
                                <strong>Indicadors de pendent</strong>
                                <p>Ressalta les zones amb molt desnivell.</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={indicadorPendent} onChange={(e) => setIndicadorPendent(e.target.checked)} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* Toggle 3: Alt Contrast */}
                        <div className="setting-item">
                            <div className="setting-info">
                                <strong>Mode d'alt contrast</strong>
                                <p>Millora la visibilitat del mapa.</p>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={altContrast} onChange={(e) => setAltContrast(e.target.checked)} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}