import React, { useEffect, useState } from 'react';
import '../styles/Home.css'
import { useNavigate } from 'react-router-dom';
import EmptyCard from './EmptyCard';

const DIFICULTAT = {
    facil:        { label: 'Fàcil',       cls: 'badge--easy' },
    moderada:     { label: 'Moderat',     cls: 'badge--moderate' },
    dificil:      { label: 'Difícil',     cls: 'badge--hard' },
    molt_dificil: { label: 'Expert',      cls: 'badge--expert' },
    extrema:      { label: 'Extrem',      cls: 'badge--extreme' },
};

export default function MevesRutes(){
    const navigate = useNavigate();
    const API_URL   = import.meta.env.VITE_APP_API_URL;
    const userId    = localStorage.getItem('userId');
    const isAuth    = !!localStorage.getItem('token');
    const [rutesMeves,      setRutesMeves]      = useState([]);
    const [loading,         setLoading]         = useState(true);

    useEffect(() => {
        const load = async () => {
            if (isAuth && userId) {
                try {
                    const res  = await fetch(`${API_URL}/planner/usuaris/${userId}/rutes/`);
                    const data = await res.json();
                    setRutesMeves(data.slice(0, 2));
                } catch (_) {}
            }
            setLoading(false);
        };
        load();
    }, [API_URL, isAuth, userId]);

    return (
        <div className="home-routes-grid">
            {rutesMeves.map(ruta => (
                <SavedRouteCard
                    key={ruta.id}
                    ruta={ruta}
                    onClick={() => navigate(`/rutes/${ruta.id}`)}
                />
            ))}
            <EmptyCard onClick={() => navigate('/rutes/meves')} />
        </div>
    );
}

function SavedRouteCard({ ruta, onClick }) {
    const diff = DIFICULTAT[ruta.dificultat] || { label: ruta.dificultat, cls: 'badge--moderate' };

    return (
        <article className="saved-card" onClick={onClick}>
            <div className="saved-card-img-wrap">
                {ruta.imatge_portada
                    ? <img src={ruta.imatge_portada} alt={ruta.nom} />
                    : (
                        <div className="saved-card-img-placeholder">
                            <span className="material-symbols-outlined">landscape</span>
                        </div>
                    )
                }
                <div className="saved-bookmark">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        bookmark
                    </span>
                </div>
            </div>
            <div className="saved-card-body">
                <div className="saved-card-header">
                    <h3 className="saved-card-title" style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0 }}>
                        {ruta.nom}
                        {ruta.es_verificada && (
                            <span
                                className="material-symbols-outlined"
                                style={{ color: '#28a745', fontSize: '1.2em' }}
                                title="Ruta verificada per l'equip"
                            >
                                verified
                            </span>
                        )}
                    </h3>
                    <span className={`route-badge ${diff.cls}`}>{diff.label}</span>
                </div>
                <p className="saved-card-desc">{ruta.descripcio}</p>
                <div className="saved-card-footer">
                    <span>
                        <span className="material-symbols-outlined">calendar_today</span>
                        {ruta.data_creacio}
                    </span>
                    <span>
                        <span className="material-symbols-outlined">route</span>
                        {ruta.distancia} km
                    </span>
                </div>
            </div>
        </article>
    );
}