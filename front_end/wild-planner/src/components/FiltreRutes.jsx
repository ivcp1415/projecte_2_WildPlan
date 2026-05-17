import React, { useState, useEffect } from 'react';
import '../styles/FiltreRutes.css';

const FiltreRutes = ({ onFiltreAplicat }) => {
    const [cercaText, setCercaText] = useState('');
    const [errorText, setErrorText] = useState('');
    const [distancia, setDistancia] = useState(50);
    const [modalitat, setModalitat] = useState('');

    // REQUISIT: Utilitzem useEffect per escoltar canvis en directe
    // Cada cop que l'usuari teclegi, mogui l'slider o canviï el select, s'executarà això:
    useEffect(() => {
        // Només enviem si no hi ha error de validació
        if (!errorText) {
            onFiltreAplicat({
                cerca: cercaText,
                distancia_max: distancia,
                modalitat: modalitat
            });
        }
    }, [cercaText, distancia, modalitat, errorText, onFiltreAplicat]);

    const gestionarCanviText = (e) => {
        const text = e.target.value; // Agafem l'esdeveniment directament
        const regexValidacio = /^[a-zA-Z0-9\s]*$/;

        if (regexValidacio.test(text)) {
            setCercaText(text);
            setErrorText('');
        } else {
            setErrorText('Només es permeten lletres i números.');
        }
    };

    return (
        <div className="filtre-container">
            <h3>Cerca Avançada (En temps real)</h3>

            {/* Ja no necessitem un <form> ni un botó de submit */}
            <div className="filtre-form">

                <div className="filtre-grup">
                    <label htmlFor="cerca">Nom de la ruta:</label>
                    <input
                        id="cerca"
                        type="text"
                        value={cercaText}
                        onChange={gestionarCanviText} // Passem l'esdeveniment e directament
                        placeholder="Ex: Camí de Ronda"
                        className="filtre-input"
                    />
                    {errorText && <p className="error-text">{errorText}</p>}
                </div>

                <div className="filtre-grup">
                    <label htmlFor="modalitat">Modalitat:</label>
                    <select
                        id="modalitat"
                        value={modalitat}
                        onChange={(e) => setModalitat(e.target.value)}
                        className="filtre-select"
                    >
                        <option value="">Totes</option>
                        <option value="senderisme">Senderisme</option>
                        <option value="btt">BTT</option>
                        <option value="escalada">Escalada</option>
                        <option value="esqui">Esquí</option>
                        <option value="altra">Altra</option>
                    </select>
                </div>

                <div className="filtre-grup">
                    <label htmlFor="distancia">
                        Distància màxima: <strong>{distancia} km</strong>
                    </label>
                    <input
                        id="distancia"
                        type="range"
                        min="0"
                        max="50"
                        value={distancia}
                        onChange={(e) => setDistancia(e.target.value)}
                        className="range-input"
                    />
                </div>
            </div>
        </div>
    );
};

export default FiltreRutes;