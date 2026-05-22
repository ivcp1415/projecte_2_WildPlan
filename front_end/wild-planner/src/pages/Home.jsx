import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CreateCard from '../components/CreateCard.jsx';
import '../styles/Home.css';
import MevesRutes from '../components/MevesRutes.jsx';

const DIFICULTAT = {
    facil:        { label: 'Fàcil',       cls: 'badge--easy' },
    moderada:     { label: 'Moderat',     cls: 'badge--moderate' },
    dificil:      { label: 'Difícil',     cls: 'badge--hard' },
    molt_dificil: { label: 'Expert',      cls: 'badge--expert' },
    extrema:      { label: 'Extrem',      cls: 'badge--extreme' },
};

function formatTemps(hores) {
    if (!hores) return '—';
    const h = Math.floor(hores);
    const m = Math.round((hores - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function Home() {
    const navigate  = useNavigate();
    const API_URL   = import.meta.env.VITE_APP_API_URL;
    const userId    = localStorage.getItem('userId');
    const isAuth    = !!localStorage.getItem('token');

    const [rutesDestacades, setRutesDestacades] = useState([]);
    const [rutesMeves,      setRutesMeves]      = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [cerca,           setCerca]           = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res  = await fetch(`${API_URL}/planner/rutes/`);
                const data = await res.json();
                setRutesDestacades(data.slice(0, 3));
            } catch (_) {}

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

    const handleSearch = (e) => {
        e.preventDefault();
        navigate('/rutes');
    };

    return (
        <div className="home-page">
            <Navbar />

            {/* ── HERO ───────────────────────────────── */}
            <section className="home-hero">
                <div className="home-hero-bg">
                    <img
                        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
                        alt="Paisatge de muntanya"
                    />
                    <div className="home-hero-gradient" />
                </div>
                <div className="home-hero-content">
                    <h1 className="home-hero-title">
                        Descobreix la precisió<br />en l'exploració
                    </h1>
                    <p className="home-hero-subtitle">
                        Planifica rutes complexes, avalua riscos en temps real i gestiona<br />
                        la logística de les teves expedicions de muntanya.
                    </p>
                    <form className="home-search-bar" onSubmit={handleSearch}>
                        <span className="material-symbols-outlined home-search-icon">location_on</span>
                        <input
                            type="text"
                            className="home-search-input"
                            placeholder="Cerca cims, rutes, zones…"
                            value={cerca}
                            onChange={e => setCerca(e.target.value)}
                        />
                        <button type="submit" className="home-search-btn">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </form>
                </div>
            </section>

            {/* ── MAIN ───────────────────────────────── */}
            <div className="home-content">

                {/* Rutes Destacades */}
                <section className="home-section">
                    <div className="home-section-header">
                        <h2 className="home-section-title">Rutes Destacades</h2>
                        <button className="home-section-link" onClick={() => navigate('/rutes')}>
                            Veure totes
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>

                    <div className="home-routes-grid">
                        {loading && [1, 2, 3].map(i => (
                            <div key={i} className="route-card route-card--skeleton" />
                        ))}

                        {!loading && rutesDestacades.map(ruta => (
                            <RouteCard
                                key={ruta.id}
                                ruta={ruta}
                                onClick={() => navigate(`/rutes/${ruta.id}`)}
                            />
                        ))}

                        {!loading && rutesDestacades.length === 0 && (
                            <p className="home-empty-text">Encara no hi ha rutes publicades.</p>
                        )}
                    </div>
                </section>

                {/* Les meves Rutes */}
                <section className="home-section home-section--bordered">
                    <h2 className="home-section-title">Les meves Rutes</h2>

                    {!isAuth ? (
                        <div className="home-auth-cta">
                            <div className="home-auth-icon-wrap">
                                <span className="material-symbols-outlined">hiking</span>
                            </div>
                            <h3>Inicia sessió per veure les teves rutes</h3>
                            <p>Guarda, gestiona i planifica les teves expedicions des d'un sol lloc.</p>
                            <button className="home-btn-primary" onClick={() => navigate('/login')}>
                                Accedir
                            </button>
                        </div>
                    ) : (
                        <MevesRutes />
                    )}
                </section>

            </div>

            {/* ── FAB ────────────────────────────────── */}
            <CreateCard />

            <Footer />
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────── */

function RouteCard({ ruta, onClick }) {
    const diff  = DIFICULTAT[ruta.dificultat] || { label: ruta.dificultat, cls: 'badge--moderate' };
    const temps = formatTemps(ruta.temps_estimat);

    return (
        <article className="route-card" onClick={onClick}>
            <div className="route-card-img-wrap">
                {ruta.imatge_portada
                    ? <img src={ruta.imatge_portada} alt={ruta.nom} />
                    : (
                        <div className="route-card-img-placeholder">
                            <span className="material-symbols-outlined">landscape</span>
                        </div>
                    )
                }
                <span className={`route-badge ${diff.cls}`}>{diff.label}</span>
            </div>
            <div className="route-card-body">
                <h3 className="route-card-title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {ruta.nom}
                    {/* Icona de verificat per a rutes generals */}
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
                <p className="route-card-desc">{ruta.descripcio}</p>
                <div className="route-card-stats">
                    <span>
                        <span className="material-symbols-outlined">route</span>
                        {ruta.distancia} km
                    </span>
                    <span>
                        <span className="material-symbols-outlined">timer</span>
                        {temps}
                    </span>
                    <span>
                        <span className="material-symbols-outlined">elevation</span>
                        +{ruta.desnivell_positiu}m
                    </span>
                </div>
            </div>
        </article>
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
                        {/* Icona de verificat per a rutes desades */}
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
