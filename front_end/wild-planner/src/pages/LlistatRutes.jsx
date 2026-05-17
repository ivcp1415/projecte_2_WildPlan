import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import FiltreRutes from '../components/FiltreRutes.jsx';
import CreateCard from '../components/CreateCard.jsx';
import '../styles/llistat.css';

const LlistatRutes = () => {
    const [rutesOriginals, setRutesOriginals] = useState([]);
    const [rutesFiltrades, setRutesFiltrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rutaAEliminar, setRutaAEliminar] = useState(null);
    const navigate = useNavigate();

    // Comprovem si l'usuari és admin
    const isAdmin = localStorage.getItem('userRol') === 'admin';

    console.log(isAdmin)

    const [paramsFiltre, setParamsFiltre] = useState({
        cerca: '',
        distancia_max: 50,
        modalitat: ''
    });

    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_APP_API_URL}/planner/rutes/`)
            .then((res) => {
                if (!res.ok) throw new Error('Error carregant les rutes');
                return res.json();
            })
            .then((data) => {
                setRutesOriginals(data);
                setRutesFiltrades(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let resultat = [...rutesOriginals];
        if (paramsFiltre.cerca) {
            const cercaMinuscules = paramsFiltre.cerca.toLowerCase();
            resultat = resultat.filter((ruta) =>
                ruta.nom.toLowerCase().includes(cercaMinuscules)
            );
        }
        if (paramsFiltre.modalitat) {
            resultat = resultat.filter((ruta) =>
                ruta.modalitat === paramsFiltre.modalitat
            );
        }
        if (paramsFiltre.distancia_max < 50) {
            resultat = resultat.filter((ruta) =>
                parseFloat(ruta.distancia) <= parseFloat(paramsFiltre.distancia_max)
            );
        }
        setRutesFiltrades(resultat);
    }, [paramsFiltre, rutesOriginals]);

    const gestionarActualitzacioFiltres = useCallback((nousFiltres) => {
        setParamsFiltre(nousFiltres);
    }, []);

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
                setRutesOriginals(rutesOriginals.filter(r => r.id !== rutaAEliminar.id));
                setRutaAEliminar(null);
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
                    <h1 className="llistat-title">Explora les rutes</h1>
                    <p className="llistat-subtitle">Descobreix els millors camins de natura</p>
                </div>

                <FiltreRutes onFiltreAplicat={gestionarActualitzacioFiltres} />

                {loading && <p className="llistat-status">Carregant rutes...</p>}
                {error && <p className="llistat-error">Error: {error}</p>}
                {!loading && !error && rutesFiltrades.length === 0 && (
                    <p className="llistat-status">No s'han trobat rutes amb aquests criteris.</p>
                )}

                <div className="rutes-grid">
                    {rutesFiltrades.map((ruta) => (
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
                                {/* Botó eliminar — només visible per admins */}
                                {isAdmin && (
                                    <button
                                        className="ruta-card-btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRutaAEliminar(ruta);
                                        }}
                                    >
                                        🗑 Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <CreateCard />
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

export default LlistatRutes;