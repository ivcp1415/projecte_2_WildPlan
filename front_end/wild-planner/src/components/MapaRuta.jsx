import React, { useEffect } from 'react';
import {
    MapContainer,
    LayersControl,
    TileLayer,
    ScaleControl,
    Marker,
    Polyline,
    Tooltip,
    useMapEvents,
    useMap
} from 'react-leaflet';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts';
import '../styles/MapaRuta.css';


// ==========================================
// CONTROLADOR DE CÀMERA (Independent)
// ==========================================
function MapController({ mapFocus, initialBounds }) {
    const map = useMap();

    useEffect(() => {
        if (initialBounds) {
            map.fitBounds(initialBounds, { padding: [50, 50], animate: false });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (mapFocus && mapFocus.lat && mapFocus.lng) {
            const lat = parseFloat(mapFocus.lat);
            const lng = parseFloat(mapFocus.lng);
            map.flyTo([lat, lng], 14, { duration: 1.5 });
        }
    }, [mapFocus, map]);

    return null;
}

// CONTROLADOR DE CLICS
const ClickHandler = ({carregantORS, handleAfegirNodeMapa}) => {
    useMapEvents({
        click(e) {
            if (!carregantORS) {
                handleAfegirNodeMapa(e.latlng);
            }
        }
    });
    return null;
};

// Traductor dels nivells natius de pendent d'ORS a Colors
const getColorSteepnessORS = (level) => {
    if (level >= 4) return '#EA4335';  // Vermell: Pujada forta (> 12%)
    if (level === 3) return '#FBBC04'; // Groc: Pujada moderada (7% - 11%)
    if (level <= -4) return '#9C27B0'; // Lila: Baixada forta (< -12%)
    return '#4285F4';                  // Blau: Pla / Suau
};

// ==========================================
// COMPONENT PRINCIPAL
// ==========================================
export default function MapaRuta({
    nodes,
    trams,
    crearIconaNode,
    getLletra,
    handleAfegirNodeMapa,
    carregantORS,
    mapFocus,
    stats,
    dadesElevacio,
    mostrarPerfil,
    setMostrarPerfil,
    altContrast,
    indicadorPendent,
    getTextSteepnessORS,
    initialBounds
}) {
    return (
        <main className="map-area" style={{ position: 'relative' }}>
            <MapContainer
                center={[41.3851, 2.1734]}
                zoom={14}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
            >
                <MapController mapFocus={mapFocus} initialBounds={initialBounds} />
                <ClickHandler carregantORS={carregantORS} handleAfegirNodeMapa={handleAfegirNodeMapa} />

                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Estàndard (OSM)">
                        {/* 🔴 Aquí va la condició per l'alt contrast */}
                        {altContrast ? (
                            <TileLayer
                                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                            />
                        ) : (
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                        )}
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Topogràfic (OpenTopoMap)">
                        <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution='&copy; OpenTopoMap' />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satèl·lit (Esri)">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri' />
                    </LayersControl.BaseLayer>

                </LayersControl>

                <ScaleControl position="bottomright" imperial={false} />

                {nodes.map((node, i) => (
                    <Marker
                        key={`marker-${i}`}
                        position={[node.latitud, node.longitud]}
                        icon={crearIconaNode(getLletra(i), i === 0 ? '#34A853' : (i === nodes.length - 1 ? '#EA4335' : '#FBBC04'))}
                    />
                ))}

                {trams.map((tram, i) => {
                    if (!tram.geometria_segment) return null;

                    const coords = tram.geometria_segment.coordinates; //

                    // OPCIÓ A: Interruptor APAGAT (Línia blava amb resum)
                    if (!indicadorPendent) {
                        const posicionsLina = coords.map(c => [c[1], c[0]]);
                        return (
                            <Polyline key={`tram-${i}`} positions={posicionsLina} color="#4285F4" weight={5} opacity={0.9}>
                                <Tooltip sticky>
                                    <strong>Tram {getLletra(tram.origen_ordre - 1)} → {getLletra(tram.desti_ordre - 1)}</strong><br/>
                                    Distància: {tram.distancia} km<br/>
                                    Desnivell: +{tram.desnivell_positiu} m / -{tram.desnivell_negatiu} m
                                </Tooltip>
                            </Polyline>
                        );
                    }

                    // OPCIÓ B: Interruptor ENCÈS (Trossegem i combinem info al Tooltip)
                    const segmentsColorits = [];
                    const dadesPendent = tram.steepness || []; //

                    dadesPendent.forEach((segmentInfo, idx) => {
                        const puntInici = segmentInfo[0];
                        const puntFinal = segmentInfo[1];
                        const nivell = segmentInfo[2];

                        const trosCoords = coords.slice(puntInici, puntFinal + 1).map(c => [c[1], c[0]]);

                        segmentsColorits.push(
                            <Polyline
                                key={`tram-${i}-sub-${idx}`}
                                positions={trosCoords}
                                color={getColorSteepnessORS(nivell)}
                                weight={8}
                                opacity={1}
                            >
                                {/* 🔴 Combinem el pendent específic amb el resum del tram sencer */}
                                <Tooltip sticky>
                                    <div style={{ marginBottom: '4px' }}>
                                        <strong>Tram {getLletra(tram.origen_ordre - 1)} → {getLletra(tram.desti_ordre - 1)}</strong>
                                    </div>
                                    <div style={{ color: getColorSteepnessORS(nivell), fontWeight: 'bold', marginBottom: '4px' }}>
                                        {getTextSteepnessORS(nivell)}
                                    </div>
                                    <div style={{ borderTop: '1px solid #ccc', paddingTop: '4px', fontSize: '0.9em', color: '#666' }}>
                                        Distància total: {tram.distancia} km<br/>
                                        Desnivell total: +{tram.desnivell_positiu}m / -{tram.desnivell_negatiu}m
                                    </div>
                                </Tooltip>
                            </Polyline>
                        );
                    });

                    return (
                        <React.Fragment key={`tram-fragment-${i}`}>
                            {segmentsColorits}
                        </React.Fragment>
                    );
                })}

            </MapContainer>

            {/* ==========================================
                PANELL INFERIOR ESTIL KOMOOT
            ========================================== */}
            {trams.length > 0 && stats && (
                <div className="komoot-panel"> {/* 🔴 ARA SÍ TÉ LA CLASSE CORRECTA! */}

                    {/* --- CAPÇALERA D'ESTADÍSTIQUES --- */}
                    <div className="komoot-stats-header">
                        <div className="stats-group">
                            <div className="stat-block">
                                <span className="stat-value">{stats.distancia.toFixed(2)} km</span>
                                <span className="stat-label">Distància</span>
                            </div>

                            <div className="stat-block">
                                <span className="stat-value">{stats.desnivell_positiu} m</span>
                                <span className="stat-label">Desnivell positiu</span>
                            </div>

                            <div className="stat-block">
                                <span className="stat-value">{stats.desnivell_negatiu} m</span>
                                <span className="stat-label">Desnivell negatiu</span>
                            </div>
                        </div>

                        <div className="controls-group">
                            {/* Mostrem el mini-gràfic NOMÉS si el panell gran està tancat */}
                            {!mostrarPerfil && (
                                <div className="mini-profile-container" style={{ width: '80px', height: '25px', borderBottom: '2px solid #e0e0e0', marginRight: '8px' }}>
                                    {dadesElevacio && dadesElevacio.length > 0 && (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dadesElevacio}>
                                                <Area type="monotone" dataKey="elevation" stroke="#85C743" fill="#85C743" fillOpacity={0.3} strokeWidth={2} isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            )}

                            <button
                                className="btn-desnivel"
                                onClick={() => setMostrarPerfil(!mostrarPerfil)}
                            >
                                Desnivell <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {mostrarPerfil ? 'expand_more' : 'expand_less'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* --- GRÀFIC DESPLEGABLE (DINS DEL PANELL) --- */}
                    {mostrarPerfil && (
                        <div className="komoot-chart-area">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dadesElevacio} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />

                                    <XAxis
                                        dataKey="distance"
                                        tickFormatter={(val) => `${val} km`}
                                        tick={{ fontSize: 11, fill: '#666' }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tickFormatter={(val) => `${val} m`}
                                        tick={{ fontSize: 11, fill: '#666' }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={['dataMin', 'dataMax']}
                                    />
                                    <ChartTooltip
                                        labelFormatter={(val) => `${val} km`}
                                        formatter={(value, name, props) => {
                                            if (name === 'Altitud') {
                                                return [`${value} m (${props.payload.slopeText})`, 'Altitud']; // 🔴 Mostra altitud + pendent
                                            }
                                            return [value, name];
                                        }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="elevation"
                                        stroke="#85C743"
                                        strokeWidth={2}
                                        fill="#85C743"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}