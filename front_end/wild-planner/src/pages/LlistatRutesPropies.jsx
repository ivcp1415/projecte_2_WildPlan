import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/llistat.css';

const LlistatRutesPropies = () => {
    const [rutes, setRutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rutaAEliminar, setRutaAEliminar] = useState(null); // ruta que vol eliminar
    const navigate = useNavigate();

    const usuariId = localStorage.getItem('userId');

    useEffect(() => {
        if (!usuariId) {
            navigate('/login');
            return;
        }
        fetch(`${import.meta.env.VITE_APP_API_URL}/planner/usuaris/${usuariId}/rutes/`)
            .then((res) => {
                if (!res.ok) throw new Error('Error carregant les rutes');
                return res.json();
            })
            .then((data) => {
                setRutes(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [usuariId, navigate]);

    // Crida al endpoint DELETE del backend
    const handleEliminar = () => {
        fetch(`${import.meta.env.VITE_APP_API_URL}/planner/rutes/${rutaAEliminar.id}/eliminar/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error('Error eliminant la ruta');
                // Traiem la ruta eliminada de la llista sense recarregar
                setRutes(rutes.filter(r => r.id !== rutaAEliminar.id));
                setRutaAEliminar(null); // tanquem el modal
            })
            .catch((err) => {
                alert('Error: ' + err.message);
                setRutaAEliminar(null);
            });
    };

    return (
        <div className="llistat-page">
            <Navbar />
            <main className="llistat-main">
                <div className="llistat-header">
                    <h1 className="llistat-title">Les meves rutes</h1>
                    <p className="llistat-subtitle">Totes les rutes que has creat</p>
                </div>

                {loading && <p className="llistat-status">Carregant rutes...</p>}
                {error && <p className="llistat-error">Error: {error}</p>}
                {!loading && !error && rutes.length === 0 && (
                    <p className="llistat-status">Encara no has creat cap ruta.</p>
                )}

                <div className="rutes-grid">
                    {rutes.map((ruta) => (
                        <div key={ruta.id} className="ruta-card" onClick={() => navigate(`/rutes/${ruta.id}`)}>
                            <div className="ruta-card-img">
                                {ruta.imatge_portada ? (
                                    <img src={ruta.imatge_portada} alt={ruta.nom} />
                                ) : (
                                    <div className="ruta-card-img-placeholder"><span>🏔</span></div>
                                )}
                            </div>
                            <div className="ruta-card-body">
                                <span className={`ruta-badge ruta-badge--${ruta.modalitat}`}>{ruta.modalitat}</span>
                                <h2 className="ruta-card-nom">{ruta.nom}</h2>
                                <p className="ruta-card-desc">{ruta.descripcio}</p>
                                <div className="ruta-card-stats">
                                    <span>📏 {ruta.distancia} km</span>
                                    <span>⛰ +{ruta.desnivell_positiu} m</span>
                                    <span>📅 {ruta.data_creacio}</span>
                                </div>
                                {/* Botó eliminar — atura la propagació per no navegar a la ruta */}
                                <button
                                    className="ruta-card-btn-delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRutaAEliminar(ruta);
                                    }}
                                >
                                    🗑 Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            <Footer />

            {/* Modal de confirmació */}
            {rutaAEliminar && (
                <div className="modal-overlay" onClick={() => setRutaAEliminar(null)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <h3>Eliminar ruta</h3>
                        <p>Segur que vols eliminar <strong>{rutaAEliminar.nom}</strong>? Aquesta acció no es pot desfer.</p>
                        <div className="modal-actions">
                            <button className="modal-btn-cancel" onClick={() => setRutaAEliminar(null)}>
                                Cancel·lar
                            </button>
                            <button className="modal-btn-confirm" onClick={handleEliminar}>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LlistatRutesPropies;