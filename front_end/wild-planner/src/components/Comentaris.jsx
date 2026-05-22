import React, { useState } from 'react';

const Comentaris = ({ comentaris: propComentaris, rutaId, onNouComentari }) => {
    const API_URL = import.meta.env.VITE_APP_API_URL;
    const token   = localStorage.getItem('token');
    const isAuth  = !!token;
    const currentUsername = localStorage.getItem('username'); // Obtenim l'usuari actual
    const userRole = localStorage.getItem('userRol'); // Obtenim el rol de l'usuari actual

    // Form state
    const [hoverStar,    setHoverStar]    = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [text,         setText]         = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError,    setFormError]    = useState('');
    const [formSuccess,  setFormSuccess]  = useState('');

    const displayedComentaris = propComentaris || [];

    // Comprovem si l'usuari actiu ja té un comentari en aquesta ruta
    const userHasCommented = isAuth && currentUsername && displayedComentaris.some(
        (c) => c.username === currentUsername
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!selectedStar) {
            setFormError('Selecciona una puntuació d\'1 a 5 estrelles.');
            return;
        }
        if (!text.trim()) {
            setFormError('Escriu el teu comentari abans de publicar.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/planner/rutes/opinio/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ruta:      rutaId,
                    puntuacio: selectedStar,
                    like:      selectedStar >= 3,
                    descripcio: text.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg =
                    data.non_field_errors?.[0] ||
                    data.ruta?.[0] ||
                    data.detail ||
                    'Error en publicar el comentari.';
                if (res.status === 400 && (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('ja exists'))) {
                    setFormError('Ja has publicat una opinió per aquesta ruta.');
                } else {
                    setFormError(msg);
                }
                return;
            }

            setFormSuccess('Gràcies pel teu comentari!');
            setSelectedStar(0);
            setText('');
            if (onNouComentari) onNouComentari();
        } catch (_) {
            setFormError('Error de connexió. Torna-ho a intentar.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Nova funció per eliminar comentaris (Només Admin)
    const handleDelete = async (comentariId) => {
        if (!window.confirm("N'estàs segur que vols eliminar aquesta opinió? L'acció no es pot desfer.")) return;

        try {
            // Assegurat que la ruta encaixa amb la definida al teu urls.py (ex: /planner/opinions/...)
            const res = await fetch(`${API_URL}/planner/opinions/${comentariId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                if (onNouComentari) onNouComentari(); // Refresquem la llista de comentaris
            } else {
                const data = await res.json();
                alert(`Error: ${data.error || 'No s\'ha pogut eliminar l\'opinió.'}`);
            }
        } catch (error) {
            alert('Error de connexió al intentar eliminar.');
        }
    };

    return (
        <div className="comentaris-section">

            {/* ── Comment form ─────────────────────── */}
            <div className="comentari-form-block">
                <h4 className="comentaris-title">Comentaris de la comunitat</h4>

                {!isAuth ? (
                    <p className="comentari-guest-msg">
                        <a href="/login" className="comentari-guest-link">Inicia sessió</a> per deixar un comentari.
                    </p>
                ) : userHasCommented ? (
                    <div className="comentari-already-posted" style={{ padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '8px', color: '#2e7d32', textAlign: 'center' }}>
                        <p style={{ margin: 0 }}>✅ Ja has compartit la teva opinió sobre aquesta ruta. Gràcies per la teva aportació!</p>
                    </div>
                ) : (
                    <form className="comentari-form" onSubmit={handleSubmit} noValidate>
                        {/* Avatar + inputs */}
                        <div className="comentari-form-row">
                            <div className="comentari-avatar comentari-avatar--form">
                                {(currentUsername || 'U').charAt(0).toUpperCase()}
                            </div>

                            <div className="comentari-form-fields">
                                {/* Star picker */}
                                <div className="star-picker">
                                    <span className="star-picker-label">La teva puntuació:</span>
                                    <div className="star-picker-stars">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                className="star-btn"
                                                onMouseEnter={() => setHoverStar(n)}
                                                onMouseLeave={() => setHoverStar(0)}
                                                onClick={() => setSelectedStar(n)}
                                                aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                                            >
                                                <span
                                                    className="material-symbols-outlined star-icon"
                                                    style={{
                                                        fontVariationSettings:
                                                            n <= (hoverStar || selectedStar)
                                                                ? "'FILL' 1"
                                                                : "'FILL' 0",
                                                    }}
                                                >
                                                    star
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea */}
                                <textarea
                                    className="comentari-textarea"
                                    rows={3}
                                    placeholder="Escriu la teva experiència…"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    disabled={isSubmitting}
                                />

                                {formError   && <p className="comentari-form-error">{formError}</p>}
                                {formSuccess  && <p className="comentari-form-success">{formSuccess}</p>}

                                <div className="comentari-form-actions">
                                    <button
                                        type="submit"
                                        className="comentari-submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Publicant…' : 'Publicar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            <hr className="comentari-section-hr" />

            {/* ── Comments list ────────────────────── */}
            {displayedComentaris.length === 0 ? (
                <p className="comentaris-empty">Encara no hi ha comentaris. Sigues el primer!</p>
            ) : (
                <div className="comentaris-llista">
                    {displayedComentaris.map((comentari, index) => (
                        <React.Fragment key={comentari.id || index}>
                            <article className="comentari-article">
                                <div className="comentari-avatar">
                                    {(comentari.username || String(comentari.usuari)).charAt(0).toUpperCase()}
                                </div>
                                <div className="comentari-cos">
                                    {/* Capçalera modificada amb espai per al botó d'eliminar */}
                                    <div className="comentari-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span className="comentari-autor">
                                                {comentari.username || `Usuari ${comentari.usuari}`}
                                            </span>
                                            {comentari.puntuacio && (
                                                <span className="comentari-valoracio" style={{ marginLeft: '8px' }}>
                                                    {'★'.repeat(comentari.puntuacio)}
                                                    {'☆'.repeat(5 - comentari.puntuacio)}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Botó d'eliminar exclusiu per a l'Admin */}
                                        {userRole === 'admin' && (
                                            <button 
                                                onClick={() => handleDelete(comentari.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f', display: 'flex', alignItems: 'center' }}
                                                title="Eliminar comentari (Admin)"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        )}
                                    </div>

                                    <p className="comentari-text">{comentari.descripcio}</p>
                                    
                                    {comentari.like !== null && comentari.like !== undefined && (
                                        <span className={`comentari-badge ${comentari.like ? 'comentari-badge--like' : 'comentari-badge--dislike'}`}>
                                            <span className="material-symbols-outlined">
                                                {comentari.like ? 'thumb_up' : 'thumb_down'}
                                            </span>
                                            {comentari.like ? 'Recomana' : 'No recomana'}
                                        </span>
                                    )}
                                </div>
                            </article>
                            {index < displayedComentaris.length - 1 && <hr className="comentari-hr" />}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Comentaris;