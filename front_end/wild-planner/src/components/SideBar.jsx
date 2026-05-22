import React, { useState } from 'react';
import { getLletra } from '../utils/mapUtils';
import '../styles/SideBar.css';

export default function SideBar({
    nomRuta,
    setNomRuta,
    nodes,
    carregantORS,
    handleEliminarNode,
    stats,
    handleReorderNodes,
    handleAfegirNodeMapa,
    setMapFocus,
    onSaveClick
}) {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [opcionsCerca, setOpcionsCerca] = useState([]);

    const handleUbicacioActual = () => {
        if ("geolocation" in navigator) {
            setSearchText("Obtenint ubicació...");
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                if (handleAfegirNodeMapa) {
                    setMapFocus({lat: latitude, lng: longitude});

                    await handleAfegirNodeMapa({ lat: latitude, lng: longitude });

                } else {
                    alert(`Ubicació trobada: ${latitude}, ${longitude} (Falta connectar la funció)`);
                }
                setIsSearching(false);
                setSearchText("");
            });
        } else {
            alert("La geolocalització no està disponible en aquest navegador.");
        }
    };

    // == Search dynamically ==
    const handleCercaDinamica = async (query) => {
        setSearchText(query);
        // Només busquem si l'usuari ha escrit com a mínim 3 lletres
        if (query.length < 3) {
            setOpcionsCerca([]);
            return;
        }
        try {
            // Demanem 5 resultats a Photon en comptes d'1
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();

            if (data.features) {
                setOpcionsCerca(data.features);
            }
        } catch (error) {
            console.error("Error en la cerca dinàmica:", error);
        }
    }

    // 🔴 3. Funció per quan l'usuari fa CLIC a una opció del menú
    const handleSeleccionarOpcio = async (feature) => {
        const lon = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];

        if (handleAfegirNodeMapa) {
            setMapFocus({ lat: lat, lng: lon });
            await handleAfegirNodeMapa({ lat: lat, lng: lon });

            // Netegem i tanquem el cercador
            setSearchText("");
            setOpcionsCerca([]);
            setIsSearching(false);
        }
    };

    // === FUNCIÓ PER BUSCAR LLOCS I MUNTANYES (API PHOTON / KOMOOT) ===
    const handleCercarLloc = async (e) => {
        // S'activa només quan l'usuari prem "Enter" i hi ha text
        if (e.key === 'Enter' && searchText.trim() !== "") {
            const query = searchText;
            setSearchText("Buscant a la muntanya..."); // Feedback visual

            try {
                // Fem la crida a l'API de Photon (Komoot) limitant a 1 resultat
                const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    // Photon retorna les dades en format GeoJSON: coordinates[longitud, latitud]
                    const lon = data.features[0].geometry.coordinates[0];
                    const lat = data.features[0].geometry.coordinates[1];
                    const propietats = data.features[0].properties;

                    if (handleAfegirNodeMapa) {
                        setMapFocus({lat: lat, lng: lon});

                        // Afegim el node al mapa esperant que acabi (await)
                        await handleAfegirNodeMapa({ lat: lat, lng: lon });

                        // Netegem el cercador i tornem a la vista de rutes
                        setSearchText("");
                        setIsSearching(false);

                        // Opcional: Pots mostrar un missatge d'èxit a la consola
                        console.log(`Lloc afegit: ${propietats.name} (${propietats.osm_value})`);
                    }
                } else {
                    alert("No hem pogut trobar cap lloc o muntanya amb aquest nom.");
                    setSearchText(query); // Retornem el text original perquè pugui corregir-lo
                }
            } catch (error) {
                console.error("Error en la cerca:", error);
                alert("S'ha produït un error en connectar amb el cercador.");
                setSearchText(query);
            }
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        handleReorderNodes(draggedIndex, index);
        setDraggedIndex(null);
    };



    return (
        <aside className="sidebar">
            {isSearching ? (
                /* =========================================
                    VISTA DE CERCA
                ========================================= */
                <div className="search-panel" style={{ padding: '24px' }}>
                    <div className="search-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button onClick={() => { setIsSearching(false); setOpcionsCerca([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Cerca un lloc</h3>
                    </div>

                    <div className="search-input-wrapper" style={{ position: 'relative', marginBottom: '24px' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}>search</span>
                        <input
                            type="text"
                            className="pill-input"
                            placeholder="Cerca un pic, refugi o adreça..."
                            value={searchText}
                            onChange={(e) => handleCercaDinamica(e.target.value)} // 🔴 Ara cerca mentre escrius
                            autoFocus
                            style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="suggestions-list">
                        {/* 🔴 LÒGICA: Si hi ha resultats de l'API, mostrem el menú d'opcions */}
                        {opcionsCerca.length > 0 ? (
                            <>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px' }}>Resultats de la cerca</p>
                                {opcionsCerca.map((opcio, idx) => {
                                    const prop = opcio.properties;
                                    // Construïm un petit subtítol per diferenciar llocs amb el mateix nom (ex: "Montserrat, Catalunya")
                                    const subtitol = [prop.city, prop.state, prop.country].filter(Boolean).join(', ');

                                    return (
                                        <div key={idx} className="suggestion-item" onClick={() => handleSeleccionarOpcio(opcio)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #f1f3f4' }}>
                                            <div className="suggestion-icon" style={{ backgroundColor: '#f8f9fa', color: '#5f6368', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined">
                                                    {prop.osm_value === 'peak' ? 'landscape' : 'location_on'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '500' }}>{prop.name}</span>
                                                {subtitol && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitol}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            /* Si l'input està buit, mostrem els botons per defecte */
                            <>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '12px' }}>Suggeriments</p>

                                <div className="suggestion-item" onClick={handleUbicacioActual} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', cursor: 'pointer' }}>
                                    <div className="suggestion-icon" style={{ backgroundColor: '#e6f4ea', color: '#137333', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined">my_location</span>
                                    </div>
                                    <span style={{ fontWeight: '500' }}>Ubicació actual</span>
                                </div>

                                <div className="suggestion-item" onClick={() => { setIsSearching(false); setOpcionsCerca([]); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', cursor: 'pointer' }}>
                                    <div className="suggestion-icon" style={{ backgroundColor: '#f1f3f4', color: 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined">map</span>
                                    </div>
                                    <span style={{ fontWeight: '500' }}>Seleccionar al mapa</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* =========================================
                    VISTA PRINCIPAL
                ========================================= */
                <>
                    <div className="sidebar-header">
                        <input
                            type="text"
                            value={nomRuta}
                            onChange={(e) => setNomRuta(e.target.value)}
                            className="input-nom-ruta"
                            placeholder="Nom de la ruta"
                        />
                        <p className="sidebar-subtitle">Dissenya la teva propera aventura.</p>
                    </div>

                    <div className="sidebar-body custom-scrollbar">
                        <div className="route-controls-section">
                            <div className="route-header-flex">
                                <h2 className="section-subtitle">Punts de la ruta</h2>
                                <button className="sport-selector">
                                    <span className="material-symbols-outlined">hiking</span> Senderisme <span className="material-symbols-outlined">expand_more</span>
                                </button>
                            </div>

                            <div className="waypoints-container">
                                {nodes.length === 0 && (
                                    <>
                                        <div className="waypoint-row" onClick={() => setIsSearching(true)} style={{ cursor: 'pointer'}}>
                                            <div className="waypoint-icon-wrapper">
                                                <div className="waypoint-dot placeholder-dot" style={{ borderColor: '#34A853', color: '#34A853' }}>A</div>
                                                <div className="waypoint-connecting-line"></div>
                                            </div>
                                            <div className="waypoint-input-wrapper">
                                                <input type="text" className="waypoint-input pill-input empty-pill" placeholder="Indica el punt d'inici" readOnly style={{ cursor: 'pointer' }} />
                                            </div>
                                        </div>
                                        <div className="waypoint-row" onClick={() => setIsSearching(true)} style={{ cursor: 'pointer' }}>
                                            <div className="waypoint-icon-wrapper">
                                                <div className="waypoint-dot placeholder-dot" style={{ borderColor: '#EA4335', color: '#EA4335' }}>B</div>
                                            </div>
                                            <div className="waypoint-input-wrapper">
                                                <input type="text" className="waypoint-input pill-input empty-pill" placeholder="Indica la destinació" readOnly style={{ cursor: 'pointer' }} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {nodes.map((node, i) => (
                                    <div
                                        key={`node-${node.latitud}-${node.longitud}-${i}`}
                                        className="waypoint-row"
                                        onClick={() => setMapFocus({ lat: node.latitud, lng: node.longitud })}
                                        draggable={!carregantORS}
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, i)}
                                        style={{
                                            cursor: carregantORS ? 'not-allowed' : 'grab',
                                            opacity: draggedIndex === i ? 0.4 : 1,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <div className="waypoint-icon-wrapper">
                                            <div className="waypoint-dot" style={{ backgroundColor: i === 0 ? '#34A853' : (i === nodes.length - 1 ? '#EA4335' : '#FBBC04') }}>
                                                {getLletra(i)}
                                            </div>
                                            {i < nodes.length - 1 && <div className="waypoint-connecting-line"></div>}
                                        </div>
                                        <div className="waypoint-input-wrapper">
                                            <input
                                                type="text"
                                                className="waypoint-input pill-input"
                                                value={`Node ${node.ordre}: ${node.latitud}, ${node.longitud}`}
                                                readOnly
                                            />
                                            <button onClick={() => handleEliminarNode(i)} className="delete-node-btn">
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {nodes.length > 0 && (
                                    <div className="waypoint-row" onClick={() => setIsSearching(true)} style={{ cursor: 'pointer', marginTop: '8px' }}>
                                        <div className="waypoint-icon-wrapper">
                                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>add</span>
                                        </div>
                                        <div className="waypoint-input-wrapper">
                                            <div className="waypoint-input pill-input empty-pill" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                                                {carregantORS ? "Calculant..." : "Afegeix un punt de pas"}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="route-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '8px 0' }}>
                                    <div onClick={() => setIsSearching(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '500', fontSize: '0.9rem' }}>
                                        <span className="material-symbols-outlined">search</span>
                                        Cerca un lloc
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="divider" />

                        <div className="suggestions-section">
                            <h3 className="suggestions-title">Resum de l'Itinerari</h3>
                            <ul className="suggestions-list">
                                <li className="suggestion-item">
                                    <div className="suggestion-icon bg-blue"><span className="material-symbols-outlined">straighten</span></div>
                                    <span>Distància Total: <strong>{stats.distancia.toFixed(1)} km</strong></span>
                                </li>
                                <li className="suggestion-item">
                                    <div className="suggestion-icon bg-green"><span className="material-symbols-outlined">terrain</span></div>
                                    <span>Desnivell Positiu: <strong>+{stats.desnivell_positiu} m</strong></span>
                                </li>
                                <li className="suggestion-item">
                                    <div className="suggestion-icon bg-green"><span className="material-symbols-outlined">terrain</span></div>
                                    <span>Desnivell Negatiu: <strong>-{stats.desnivell_negatiu} m</strong></span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <button
                            className={`btn-save ${nodes.length < 2 || carregantORS ? 'btn-disabled' : 'btn-active'}`}
                            onClick={onSaveClick}
                            disabled={nodes.length < 2 || carregantORS}
                        >
                            <span className="material-symbols-outlined">save</span> Save Route
                        </button>

                    </div>
                </>
            )}
        </aside>
    );
}