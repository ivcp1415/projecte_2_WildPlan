import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/llistat.css';

const LlistatRutesPropies = () => {
    const [rutes, setRutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rutaAEliminar, setRutaAEliminar] = useState(null);
    const [editantRuta, setEditantRuta] = useState(null);
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

    const handleEditarRutaCompleta = async (ruta, e) => {
        e.stopPropagation();
        setEditantRuta(ruta.id);
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_APP_API_URL;

            const [resRuta, resPlanificacions] = await Promise.all([
                fetch(`${apiUrl}/planner/rutes/${ruta.id}/editar-dades/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${apiUrl}/planner/rutes/${ruta.id}/planificacions/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!resRuta.ok) throw new Error("No s'ha pogut carregar la ruta.");
            const data = await resRuta.json();

            localStorage.setItem('ruta_esborrany_nom', data.nom);
            localStorage.setItem('ruta_esborrany_nodes', JSON.stringify(data.nodes));
            localStorage.setItem('ruta_esborrany_trams', JSON.stringify(data.trams));
            localStorage.setItem('ruta_editant_id', String(ruta.id));
            localStorage.setItem('ruta_editant_meta', JSON.stringify({
                descripcio: data.descripcio,
                modalitat: data.modalitat,
                imatge_portada: data.imatge_portada,
            }));

            // Load existing planificació if available
            let planificacionsData = [];
            if (resPlanificacions.ok) {
                planificacionsData = await resPlanificacions.json();
            }

            if (planificacionsData.length > 0) {
                const resDetail = await fetch(
                    `${apiUrl}/planner/planificacions/${planificacionsData[0].id}/`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (resDetail.ok) {
                    const planDetail = await resDetail.json();
                    const planDraft = {
                        motxilla: {
                            nom: planDetail.motxilla?.nom || 'Motxilla principal',
                            pes_base: parseFloat(planDetail.motxilla?.pes_base) || 0,
                            materials: (planDetail.motxilla?.materials_detall || []).map(m => ({
                                nom: m.nom,
                                pes: parseFloat(m.pes) || 0,
                                preu: 0,
                                quantitat: m.quantitat,
                                ref_id: m.material_id,
                                imatge_url: '',
                                descripcio: ''
                            })),
                            menjars: (planDetail.motxilla?.menjars_detall || []).map(m => ({
                                nom: m.nom,
                                pes: parseFloat(m.pes) || 0,
                                preu: 0,
                                calories: m.calories || 0,
                                quantitat: m.quantitat,
                                ref_id: m.menjar_id,
                                imatge_url: '',
                                descripcio: ''
                            }))
                        },
                        planificacio: {
                            titol: planDetail.titol || '',
                            data_inici: planDetail.data_inici || '',
                            data_fi: planDetail.data_fi || '',
                            despeses: (planDetail.despeses || []).map(d => ({
                                concepte: d.concepte,
                                import_despesa: parseFloat(d.import_despesa) || 0,
                                divisa: d.divisa || 'EUR'
                            }))
                        }
                    };
                    localStorage.setItem('plan_esborrany', JSON.stringify(planDraft));
                    localStorage.setItem('ruta_editant_planificacio_id', String(planDetail.id));
                    if (planDetail.motxilla) {
                        localStorage.setItem('ruta_editant_motxilla_id', String(planDetail.motxilla.id));
                    } else {
                        localStorage.removeItem('ruta_editant_motxilla_id');
                    }
                } else {
                    localStorage.removeItem('plan_esborrany');
                    localStorage.removeItem('ruta_editant_planificacio_id');
                    localStorage.removeItem('ruta_editant_motxilla_id');
                }
            } else {
                localStorage.removeItem('plan_esborrany');
                localStorage.removeItem('ruta_editant_planificacio_id');
                localStorage.removeItem('ruta_editant_motxilla_id');
            }

            localStorage.setItem('ruta_editant_tab', 'planificacio');
            navigate('/planificar');
        } catch (err) {
            alert("Error carregant la ruta per a editar.");
        } finally {
            setEditantRuta(null);
        }
    };

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
                                {/* Accions sobre la ruta — aturen la propagació per no navegar a la ruta */}
                                <div className="ruta-card-actions">
                                    <button
                                        className="ruta-card-btn-edit"
                                        onClick={(e) => handleEditarRutaCompleta(ruta, e)}
                                        disabled={editantRuta === ruta.id}
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                        {editantRuta === ruta.id ? 'Carregant...' : 'Editar'}
                                    </button>
                                    <button
                                        className="ruta-card-btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRutaAEliminar(ruta);
                                        }}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                        Eliminar
                                    </button>
                                </div>
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