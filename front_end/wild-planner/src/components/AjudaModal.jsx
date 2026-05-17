import React, { useState } from 'react';
import '../styles/AjudaModal.css';

export default function AjudaModal({ onClose }) {
    const [faqOberta, setFaqOberta] = useState(null);

    const toggleFaq = (index) => {
        setFaqOberta(faqOberta === index ? null : index);
    };

    return (
        <div className="ajuda-overlay" onClick={onClose}>
            <div className="ajuda-modal" onClick={(e) => e.stopPropagation()}>

                <div className="ajuda-header">
                    <div>
                        <h2>Centre d'Ajuda</h2>
                        <p>Troba respostes ràpides per planificar la teva propera expedició amb seguretat.</p>
                    </div>
                    <button className="btn-close-modal" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="ajuda-search">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input type="text" placeholder="Cerca temes d'ajuda, marcadors de mapa o consells..." />
                    <button className="btn-cercar">Cercar</button>
                </div>

                <div className="ajuda-grid-top">
                    {/* Targeta: Guia de Navegació */}
                    <div className="ajuda-card">
                        <div className="card-title">
                            <span className="material-symbols-outlined icon-green">explore</span>
                            <h3>Guia de Navegació</h3>
                        </div>
                        <ul className="guide-list">
                            <li>
                                <div className="step-number">1</div>
                                <div>
                                    <strong>Defineix el Punt d'Inici</strong>
                                    <p>Fes clic al mapa o utilitza el cercador per marcar el punt de partida de la teva ruta.</p>
                                </div>
                            </li>
                            <li>
                                <div className="step-number">2</div>
                                <div>
                                    <strong>Afegeix Waypoints</strong>
                                    <p>Fes clic al mapa per afegir punts de control clau per on vols que passi la teva expedició.</p>
                                </div>
                            </li>
                            <li>
                                <div className="step-number">3</div>
                                <div>
                                    <strong>Revisa el Perfil d'Elevació</strong>
                                    <p>Abans de desar, consulta el gràfic inferior per entendre el desnivell acumulat i planificar l'esforç.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Targeta: Accessibilitat */}
                    <div className="ajuda-card card-dark">
                        <div className="card-title text-white">
                            <span className="material-symbols-outlined">accessibility_new</span>
                            <h3>Accessibilitat</h3>
                        </div>
                        <ul className="access-list">
                            <li><span className="material-symbols-outlined">check_circle</span> Filtra rutes per amplada de camí.</li>
                            <li><span className="material-symbols-outlined">check_circle</span> Indicadors de pendent màxima.</li>
                            <li><span className="material-symbols-outlined">check_circle</span> Mode d'alt contrast pel mapa.</li>
                        </ul>
                    </div>
                </div>

                {/* Secció: Llegenda del Mapa */}
                <div className="ajuda-section">
                    <h3>Llegenda del Mapa</h3>
                    <div className="legend-grid">
                        <div className="legend-item">
                            <div className="legend-icon bg-blue"><span className="material-symbols-outlined text-blue">water_drop</span></div>
                            <strong>Font d'Aigua</strong>
                            <p>Punt verificat de recollida d'aigua potable.</p>
                        </div>
                        <div className="legend-item">
                            <div className="legend-icon bg-orange"><span className="material-symbols-outlined text-orange">landscape</span></div>
                            <strong>Terreny Difícil</strong>
                            <p>Zones amb roques soltes o pendent pronunciada.</p>
                        </div>
                        <div className="legend-item">
                            <div className="legend-icon bg-yellow"><span className="material-symbols-outlined text-yellow">flag</span></div>
                            <strong>Checkpoint</strong>
                            <p>Punt de control de seguretat o refugi.</p>
                        </div>
                        <div className="legend-item">
                            <div className="legend-icon bg-red"><span className="material-symbols-outlined text-red">warning</span></div>
                            <strong>Perill Temporal</strong>
                            <p>Allaus recents o camí tallat. Evitar la zona.</p>
                        </div>
                    </div>
                </div>

                {/* Secció: FAQs */}
                <div className="ajuda-section">
                    <h3>Preguntes Freqüents</h3>
                    <div className="faq-container">
                        <div className="faq-item" onClick={() => toggleFaq(0)}>
                            <div className="faq-question">
                                <span>Com puc descarregar els mapes per a ús offline?</span>
                                <span className="material-symbols-outlined">{faqOberta === 0 ? 'expand_less' : 'expand_more'}</span>
                            </div>
                            {faqOberta === 0 && <div className="faq-answer">Actualment, pots exportar la ruta en format GPX un cop guardada per obrir-la a la teva app GPS preferida.</div>}
                        </div>
                        <div className="faq-item" onClick={() => toggleFaq(1)}>
                            <div className="faq-question">
                                <span>Quina precisió té el radar meteorològic integrat?</span>
                                <span className="material-symbols-outlined">{faqOberta === 1 ? 'expand_less' : 'expand_more'}</span>
                            </div>
                            {faqOberta === 1 && <div className="faq-answer">Utilitzem dades en temps real de les estacions meteorològiques més properes, amb una precisió de 15 minuts.</div>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}