import React, { useState, useRef, useEffect } from 'react';
import '../styles/AssistentIA.css';

const SUGGERIMENTS = [
    "Analitza l'equipament necessari per a la meva ruta",
    "Quins aliments hauria de portar?",
    "La ruta és apta per a principiants?",
];

export default function AssistentIA({ rutaId, planificacioId, stats, nomRuta, nodes = [], planDraft, onInventariActualitzat, onAddDraftItem }) {
    const isDraft = !rutaId || !planificacioId;

    const [missatges, setMissatges] = useState([
        {
            rol: 'ia',
            text: isDraft
                ? "Hola! Soc el teu assistent de WildPlan. Puc analitzar l'esborrany de la teva ruta i recomanar-te equipament. Un cop desis la ruta, podré afegir ítems directament a la teva motxilla. Pregunta'm el que necessitis!"
                : "Hola! Soc el teu assistent de WildPlan. Analitzo les dades de la teva ruta i puc afegir equipament recomanat a la teva motxilla de forma automàtica. Pregunta'm el que necessitis.",
        },
    ]);
    const [input, setInput] = useState('');
    const [carregant, setCarregant] = useState(false);
    const [inventariActualitzat, setInventariActualitzat] = useState(false);
    const [draftActualitzat, setDraftActualitzat] = useState(false);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);
    const API_URL = import.meta.env.VITE_APP_API_URL;

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [missatges, carregant]);

    const buildDraftContext = () => ({
        nom: nomRuta,
        distancia_km: parseFloat(stats.distancia.toFixed(2)),
        desnivell_positiu_m: stats.desnivell_positiu,
        desnivell_negatiu_m: stats.desnivell_negatiu,
        num_nodes: nodes.length,
        motxilla_draft: {
            materials: (planDraft?.motxilla?.materials || []).map(m => m.nom),
            menjars: (planDraft?.motxilla?.menjars || []).map(m => m.nom),
        },
    });

    const enviarMissatge = async (textDirect) => {
        const text = (textDirect || input).trim();
        if (!text || carregant) return;

        setInput('');
        setMissatges(prev => [...prev, { rol: 'usuari', text }]);
        setCarregant(true);

        try {
            const token = localStorage.getItem('token');
            const body = isDraft
                ? { draft_context: buildDraftContext(), missatge: text }
                : { ruta_id: rutaId, planificacio_id: planificacioId, missatge: text };
            const res = await fetch(`${API_URL}/planner/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setMissatges(prev => [...prev, { rol: 'ia', text: data.resposta }]);
                if (data.inventari_actualitzat) {
                    setInventariActualitzat(true);
                    if (onInventariActualitzat) onInventariActualitzat();
                }
                if (data.draft_items?.length && onAddDraftItem) {
                    data.draft_items.forEach(item => onAddDraftItem(item));
                    setDraftActualitzat(true);
                }
            } else {
                setMissatges(prev => [...prev, { rol: 'ia', text: `Error: ${data.error || "No s'ha pogut obtenir resposta."}` }]);
            }
        } catch {
            setMissatges(prev => [...prev, { rol: 'ia', text: 'Error de connexió. Torna-ho a provar.' }]);
        } finally {
            setCarregant(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMissatge();
        }
    };

    return (
        <div className="ia-layout">
            {/* ---- Columna de Chat ---- */}
            <div className="ia-chat-col">
                <div className="ia-chat-header">
                    <div>
                        <h2>Assistent Sendera</h2>
                        <p>Anàlisi intel·ligent per a {nomRuta}</p>
                    </div>
                    {inventariActualitzat && (
                        <div className="ia-badge-actualitzat">
                            <span className="material-symbols-outlined">inventory_2</span>
                            Motxilla actualitzada
                        </div>
                    )}
                    {draftActualitzat && (
                        <div className="ia-badge-actualitzat ia-badge-draft">
                            <span className="material-symbols-outlined">edit_note</span>
                            Esborrany actualitzat
                        </div>
                    )}
                </div>

                {isDraft && (
                    <div className="ia-draft-banner">
                        <span className="material-symbols-outlined">edit_note</span>
                        <span>
                            <strong>Ruta en esborrany</strong> — Puc recomanar equipament, però no puc afegir-lo a la motxilla fins que desis la ruta.
                        </span>
                    </div>
                )}

                <div className="ia-chat-history" ref={chatRef}>
                    {missatges.map((m, i) =>
                        m.rol === 'ia' ? (
                            <div key={i} className="ia-msg-ia">
                                <div className="ia-avatar">
                                    <span className="material-symbols-outlined">psychology</span>
                                </div>
                                <div className="ia-bubble-ia">{m.text}</div>
                            </div>
                        ) : (
                            <div key={i} className="ia-msg-usuari">
                                <div className="ia-avatar ia-avatar-user">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div className="ia-bubble-usuari">{m.text}</div>
                            </div>
                        )
                    )}
                    {carregant && (
                        <div className="ia-msg-ia">
                            <div className="ia-avatar">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <div className="ia-bubble-ia ia-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                </div>

                <div className="ia-input-area">
                    <div className="ia-input-box">
                        <textarea
                            ref={textareaRef}
                            className="ia-textarea"
                            placeholder="Pregunta sobre la ruta, equipament, risc..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={carregant}
                        />
                        <button
                            className="ia-send-btn"
                            onClick={() => enviarMissatge()}
                            disabled={carregant || !input.trim()}
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ---- Panell de Context (dreta) ---- */}
            <div className="ia-context-col">
                <div className="ia-context-section">
                    <h3>Context de la Ruta</h3>
                    <div className="ia-context-card">
                        <div className="ia-context-card-row">
                            <span className="material-symbols-outlined">landscape</span>
                            <span className="ia-context-nom">{nomRuta}</span>
                        </div>
                        <div className="ia-context-stats">
                            {stats.distancia > 0 && (
                                <span><strong>{stats.distancia.toFixed(1)} km</strong> de distància</span>
                            )}
                            {stats.desnivell_positiu > 0 && (
                                <span><strong>+{stats.desnivell_positiu} m</strong> de desnivell</span>
                            )}
                            {stats.distancia === 0 && (
                                <span className="ia-context-no-stats">La ruta no té trams calculats.</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="ia-context-section">
                    <h3>Suggeriments</h3>
                    <div className="ia-suggestions">
                        {SUGGERIMENTS.map((s, i) => (
                            <button
                                key={i}
                                className="ia-suggestion-btn"
                                onClick={() => enviarMissatge(s)}
                                disabled={carregant}
                            >
                                {s}
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        ))}
                    </div>
                </div>

                {isDraft && (
                    <div className="ia-context-section">
                        <div className="ia-draft-notice">
                            <span className="material-symbols-outlined">info</span>
                            <span>Mode esborrany: pots fer preguntes i rebre recomanacions. L'afegit automàtic a la motxilla s'activarà un cop desis la ruta.</span>
                        </div>
                    </div>
                )}

                <div className="ia-context-section">
                    <h3>Com funciona</h3>
                    <div className="ia-how-it-works">
                        <div className="ia-how-step">
                            <span className="material-symbols-outlined">search</span>
                            <span>Analitza les dades tècniques de la ruta</span>
                        </div>
                        <div className="ia-how-step">
                            <span className="material-symbols-outlined">add_box</span>
                            <span>Afegeix equipament a la motxilla automàticament</span>
                        </div>
                        <div className="ia-how-step">
                            <span className="material-symbols-outlined">chat</span>
                            <span>Respon les teves preguntes sobre la preparació</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
