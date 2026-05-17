import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import RutaHero from '../components/RutaHero.jsx';
import RutaSpecs from '../components/RutaSpecs.jsx';
import RutaMapa from '../components/RutaMapa.jsx';
import PerfilElevacio from '../components/PerfilElevacio.jsx';
import Comentaris from '../components/Comentaris.jsx';
import Valoracions from '../components/Valoracions.jsx';
import Footer from '../components/Footer.jsx';
import ShareCard from '../components/ShareCard.jsx';
import '../styles/DetallRuta.css';

const DetallRuta = () => {

    // useParams gets the id from the URL: /rutes/5 → pk = "5"
    const { pk } = useParams();
    
    // Backend base URL, defined in .env
    const API_URL = import.meta.env.VITE_APP_API_URL;
    
    // Auth & Role
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRol'); // Recorda que vas fer servir 'userRol'

    const [ruta,       setRuta]       = useState(null);
    const [comentaris, setComentaris] = useState([]);
    const [valoracions, setValoracions] = useState([]);
    const [isLoading,  setIsLoading]  = useState(true);
    const [error,      setError]      = useState('');
    
    // State to toggle the share card visibility
    const [showShareCard, setShowShareCard] = useState(false);
    
    // State for Modal Admin Validation
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchDades = async () => {
        try {
            const res = await fetch(`${API_URL}/planner/rutes/${pk}/`);
            if (!res.ok) throw new Error("No s'ha pogut carregar la ruta.");
            const data = await res.json();
            setRuta(data.ruta);
            setComentaris(data.comentaris || []);
            setValoracions(data.valoracions || []);
        } catch (err) {
            setError(err.message || "Error de connexió");
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchDades().finally(() => setIsLoading(false));
    }, [pk, API_URL]);

    // Funció per verificar/desverificar la ruta
    const handleVerifyRoute = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch(`${API_URL}/planner/rutes/${pk}/verificar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                // Actualitzem l'estat local perquè es vegi el canvi immediatament
                setRuta({ ...ruta, es_verificada: data.es_verificada });
                setShowVerifyModal(false);
            } else {
                alert(`Error: ${data.error || 'No s\'ha pogut verificar la ruta.'}`);
            }
        } catch (error) {
            alert('Error de connexió al intentar verificar.');
        } finally {
            setIsVerifying(false);
        }
    };


    // --- RENDER ---
    
    // Show loading state
    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="detall-loading">
                    <span className="material-symbols-outlined detall-loading-icon">hiking</span>
                    <p>Carregant ruta...</p>
                </div>
            </>
        );
    }

    // Show error state
    if (error) {
        return (
            <>
                <Navbar />
                <div className="detall-error">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                </div>
            </>
        );
    }

    return (
        <div className="detall-page">

            <Navbar />

            {/* AFEGIT: Mostrem una barra d'administrador si l'usuari és admin */}
            {userRole === 'admin' && (
                <div className="admin-toolbar" style={{ backgroundColor: '#fff3cd', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ffeeba' }}>
                    <span style={{ fontWeight: 'bold', color: '#856404' }}>🔧 Panell d'Administrador</span>
                    <button 
                        onClick={() => setShowVerifyModal(true)}
                        style={{ 
                            backgroundColor: ruta?.es_verificada ? '#dc3545' : '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            padding: '8px 16px', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        <span className="material-symbols-outlined">
                            {ruta?.es_verificada ? 'cancel' : 'verified'}
                        </span>
                        {ruta?.es_verificada ? 'Treure Verificació' : 'Verificar Ruta'}
                    </button>
                </div>
            )}

            {/* AFEGIT: Modal de Confirmació per l'Admin */}
            {showVerifyModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
                        <h3>{ruta?.es_verificada ? 'Treure verificació?' : 'Verificar aquesta ruta?'}</h3>
                        <p style={{ margin: '1rem 0' }}>
                            {ruta?.es_verificada 
                                ? "Si confirmes, aquesta ruta perdrà l'etiqueta de qualitat verificada per l'equip." 
                                : "En verificar aquesta ruta, atestes que les dades són correctes, segures i de qualitat per als usuaris."}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button 
                                onClick={() => setShowVerifyModal(false)}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
                                disabled={isVerifying}
                            >
                                Cancel·lar
                            </button>
                            <button 
                                onClick={handleVerifyRoute}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer' }}
                                disabled={isVerifying}
                            >
                                {isVerifying ? 'Processant...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero: Aquí hauries de passar l'estat de verificació. Si el component RutaHero no el mostra, caldrà modificar RutaHero.jsx també. */}
            <RutaHero ruta={ruta} />

            {/* Rest of main content */}
            <main className="detall-main">
                {/* LEFT COLUMN */}
                <div className="detall-col-left">
                    {/* AFEGIM UNA ETIQUETA VISUAL AL COSTAT DE LES SPECS */}
                    {ruta?.es_verificada && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#e6f4ea', color: '#137333', padding: '5px 12px', borderRadius: '16px', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', marginRight: '5px' }}>verified</span>
                            Ruta Verificada Oficialment
                        </div>
                    )}
                    <RutaSpecs ruta={ruta} />
                    <RutaMapa geoData={ruta.track_complet} />
                    <PerfilElevacio perfilData={ruta.perfil_elevacio} />
                </div>

                {/* RIGHT COLUMN */}
                <div className="detall-col-right" style={{ position: 'relative' }}>
                    <div className="share-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button 
                            className="btn-share-toggle" 
                            onClick={() => setShowShareCard(!showShareCard)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '8px' }}
                        >
                            <span className="material-symbols-outlined">share</span>
                            Compartir
                        </button>
                    </div>

                    {showShareCard && (
                        <ShareCard 
                            ruta={ruta} 
                            onClose={() => setShowShareCard(false)} 
                        />
                    )}

                    <div className="social-panel">
                        <Valoracions valoracions={valoracions} />
                        <Comentaris
                            comentaris={comentaris}
                            rutaId={Number(pk)}
                            onNouComentari={fetchDades}
                        />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default DetallRuta;