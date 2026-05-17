import React, { useState, useEffect } from 'react';
// Hem afegit LayersControl i ScaleControl a les importacions
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Rutes.css';
import Footer from '../components/Footer.jsx'
import MapaRuta from '../components/MapaRuta.jsx'
import SideBar from '../components/SideBar.jsx'
import Navbar from '../components/Navbar.jsx'
import AjudaModal from '../components/AjudaModal.jsx'
import AjustosModal from '../components/AjustosModal.jsx'
import SaveRouteModal from '../components/SaveRouteModal.jsx';
import SuccessRouteModal from '../components/SuccessRouteModal.jsx';

// Funció per traduir el pendent a text humà
const getTextSteepnessORS = (level) => {
    const textos = {
        5: "Pujada molt forta (>15%)",
        4: "Pujada forta (12-15%)",
        3: "Pujada moderada (7-11%)",
        2: "Pujada suau (4-6%)",
        1: "Pujada molt suau (1-3%)",
        0: "Pla (0%)",
        "-1": "Baixada molt suau (1-3%)",
        "-2": "Baixada suau (4-6%)",
        "-3": "Baixada moderada (7-11%)",
        "-4": "Baixada forta (12-15%)",
        "-5": "Baixada molt forta (>15%)"
    };
    return textos[level] || "Pendent desconegut";
};

// Icona per als Nodes amb Lletres (A, B, C...)
const crearIconaNode = (lletra, color) => L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${lletra}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Funció per obtenir la lletra (0 = A, 1 = B...)
const getLletra = (index) => String.fromCharCode(65 + index);

export default function Rutes() {
    const API_URL = import.meta.env.VITE_APP_API_URL;
    const [nomRuta, setNomRuta] = useState(() => {
        return localStorage.getItem('ruta_esborrany_nom') || 'La meva nova ruta';
    });

    const [nodes, setNodes] = useState(() => {
        const savedNodes = localStorage.getItem('ruta_esborrany_nodes');
        return savedNodes ? JSON.parse(savedNodes) : [];
    });

    const [trams, setTrams] = useState(() => {
        const savedTrams = localStorage.getItem('ruta_esborrany_trams');
        return savedTrams ? JSON.parse(savedTrams) : [];
    });
    const [carregantORS, setCarregantORS] = useState(false);
    const [urlImatge, setUrlImatge] = useState('');
    const [mapFocus, setMapFocus] = useState(null);
    const [mostrarPerfil, setMostrarPerfil] = useState(false);
    const [mostrarAjuda, setMostrarAjuda] = useState(false);
    const [mostrarAjustos, setMostrarAjustos] = useState(false);
    const [mostrarGuardarModal, setMostrarGuardarModal] = useState(false);


    // Estats globals d'accessibilitat
    const [altContrast, setAltContrast] = useState(false);
    const [indicadorPendent, setIndicadorPendent] = useState(false);

    const [mostrarExitModal, setMostrarExitModal] = useState(false);
    const [dadesExportacio, setDadesExportacio] = useState(null); // Stores the GPX string

    useEffect(() => {
        localStorage.setItem('ruta_esborrany_nom', nomRuta);
        localStorage.setItem('ruta_esborrany_nodes', JSON.stringify(nodes));
        localStorage.setItem('ruta_esborrany_trams', JSON.stringify(trams));
    }, [nomRuta, nodes, trams]);

    // 3. ADD THIS HELPER FUNCTION (put it right before your `return` statement)
    const getDadesElevacio = () => {
        let chartData = [];
        let currentDistance = 0;

        trams.forEach(tram => {
            if (!tram.geometria_segment || !tram.geometria_segment.coordinates) return;
            const coords = tram.geometria_segment.coordinates;
            const distPerPoint = tram.distancia / coords.length;
            const steepnessData = tram.steepness || [];

            coords.forEach((coord, idx) => {
                // Busquem quin és el pendent en aquest punt exacte (idx)
                const infoPendent = steepnessData.find(s => idx >= s[0] && idx <= s[1]);
                const nivellPendent = infoPendent ? infoPendent[2] : 0;

                chartData.push({
                    distance: parseFloat(currentDistance.toFixed(2)),
                    elevation: Math.round(coord[2] || 0),
                    slopeText: getTextSteepnessORS(nivellPendent) // 🔴 Guardem el text per al gràfic
                });
                currentDistance += distPerPoint;
            });
        });
        return chartData;
    };

    const dadesElevacio = getDadesElevacio();

    // A function to build a standard GPX XML string from your trams data
    const generarGPX = (nom, tramsInfo) => {
        let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        gpx += `<gpx version="1.1" creator="YourApp">\n`;
        gpx += `  <trk>\n`;
        gpx += `    <name>${nom}</name>\n`;
        gpx += `    <trkseg>\n`;

        tramsInfo.forEach(tram => {
            if (tram.geometria_segment && tram.geometria_segment.coordinates) {
                tram.geometria_segment.coordinates.forEach(coord => {
                    // OpenRouteService coords are [longitude, latitude, altitude]
                    gpx += `      <trkpt lat="${coord[1]}" lon="${coord[0]}">\n`;
                    gpx += `        <ele>${coord[2] || 0}</ele>\n`;
                    gpx += `      </trkpt>\n`;
                });
            }
        });

        gpx += `    </trkseg>\n`;
        gpx += `  </trk>\n`;
        gpx += `</gpx>`;

        return gpx;
    };

    const processarIEnviarRuta = async (dadesFormulari) => {
        // 1. Generate the unified GeoJSON line for track_complet
        const totesLesCoordenades = trams.reduce((acc, tram) => {
            return acc.concat(tram.geometria_segment.coordinates);
        }, []);

        const jsonbTrack = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: totesLesCoordenades // [lng, lat, alt]
            },
            properties: {
                stats_generals: stats // Just basic stats here now
            }
        };

        // 2. Build the final payload matching your updated models.py
        const payloadRuta = {
            nom: dadesFormulari.nom,
            descripcio: dadesFormulari.descripcio,
            modalitat: dadesFormulari.modalitat,
            imatge_portada: urlImatge || null,
            distancia: parseFloat(stats.distancia.toFixed(2)),
            desnivell_positiu: stats.desnivell_positiu,
            desnivell_negatiu: stats.desnivell_negatiu,

            // Both JSON fields are now populated properly
            track_complet: jsonbTrack,
            perfil_elevacio: dadesElevacio,

            // Individual Nodes (ItinerariNode)
            nodes: nodes.map(n => ({
                ordre: n.ordre,
                latitud: parseFloat(n.latitud),
                longitud: parseFloat(n.longitud),
                altitud: dadesElevacio.find(d => d.distance === 0)?.elevation || 0
            })),

            // Individual Segments (Tram)
            trams: trams.map(t => ({
                origen_ordre: t.origen_ordre,
                desti_ordre: t.desti_ordre,
                distancia: parseFloat(t.distancia.toFixed(2)),
                desnivell_positiu: t.desnivell_positiu,
                desnivell_negatiu: t.desnivell_negatiu
            }))
        };

        console.log("Sending payload to Django:", payloadRuta);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/planner/rutes/crear/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payloadRuta)
            });

            if (response.ok) {
                const gpxString = generarGPX(payloadRuta.nom, trams);
                setDadesExportacio({ nom: payloadRuta.nom, gpxString: gpxString });

                alert("Route saved successfully!");

                setMostrarGuardarModal(false);
                setMostrarExitModal(true);

                localStorage.removeItem('ruta_esborrany_nom');
                localStorage.removeItem('ruta_esborrany_nodes');
                localStorage.removeItem('ruta_esborrany_trams')

                setNodes([]);
                setTrams([]);
                setNomRuta('La meva nova ruta');
                setUrlImatge('');
            } else {
                const errorData = await response.json();
                alert("Error saving route: " + JSON.stringify(errorData));
            }
        } catch (err) {
            console.error("Connection error:", err);
        }
    };


    // === CRIDA A L'API D'OPENROUTESERVICE (ORS) ===
    const calcularTramORS = async (origen, desti) => {
        // definir api keys OPENROUTESERVICE
        const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU4ZTk2MjBlODk1YTQzNzdiMjdkZmFiYjcxMTM5MjRlIiwiaCI6Im11cm11cjY0In0="; // <-- Posa la teva API Key aquí
        const perfilRuta = 'foot-hiking';
        const url = `https://api.openrouteservice.org/v2/directions/${perfilRuta}/geojson`;

        // dades dels nodes
        const bodyDades = {
            coordinates: [
                [parseFloat(origen.longitud), parseFloat(origen.latitud)],
                [parseFloat(desti.longitud), parseFloat(desti.latitud)]
            ],
            elevation: true,
            extra_info: ["steepness"]
        };

        try {

            // fetch to db
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, application/geo+json',
                    'Content-Type': 'application/json',
                    'Authorization': API_KEY
                },
                body: JSON.stringify(bodyDades)
            });

            if (!response.ok) throw new Error("Error d'ORS");
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const propietats = data.features[0].properties;
                const geometria = data.features[0].geometry;

                // agafem el desnivell del resum
                let desnivellPositiu = Math.round(propietats.summary.ascent || 0);
                let desnivellNegatiu = Math.round(propietats.summary.descent || 0)

                // en cas de no obtenir calculem amb distància latitud
                if (desnivellPositiu === 0 && desnivellNegatiu === 0 && geometria.coordinates.length > 0 && geometria.coordinates[0].length === 3) {
                    let sumatoriPos = 0;
                    let sumatoriNeg = 0;

                    // iterar sobre coordenades
                    for (let i = 1; i < geometria.coordinates.length; i++) {
                        // get altituds
                        const altitudActual = geometria.coordinates[i][2];
                        const altitudAnterior = geometria.coordinates[i - 1][2];

                        // si pugem sumem la diferència
                        if (altitudActual > altitudAnterior) {
                            sumatoriPos += (altitudActual - altitudAnterior)
                        } else if (altitudActual < altitudAnterior) {
                            sumatoriNeg += (altitudAnterior - altitudActual)
                        }
                    }

                    desnivellPositiu = Math.round(sumatoriPos);
                    desnivellNegatiu = Math.round(sumatoriNeg);
                }
                return {
                    distancia: parseFloat((data.features[0].properties.summary.distance / 1000).toFixed(2)),
                    desnivell_positiu: desnivellPositiu,
                    desnivell_negatiu: desnivellNegatiu,
                    geometria_segment: data.features[0].geometry,
                    steepness: propietats.extras?.steepness?.values || []
                };
            }
            return null;
        } catch (error) {
            console.error("Error connectant amb ORS:", error);
            return null;
        }
    };

    // === AFEGIR NODE ===
    const handleAfegirNodeMapa = async (latlng) => {
        const nouOrdre = nodes.length + 1;
        const nouNode = {
            ordre: nouOrdre,
            latitud: latlng.lat.toFixed(6),
            longitud: latlng.lng.toFixed(6),
        };

        if (nouOrdre === 1) {
             setNodes([nouNode]);
             return;
        }

        setCarregantORS(true);
        const nodeAnterior = nodes[nouOrdre - 2];
        const dadesTram = await calcularTramORS(nodeAnterior, nouNode);

        if (dadesTram) {
            const nouTram = {
                origen_ordre: nodeAnterior.ordre,
                desti_ordre: nouNode.ordre,
                ...dadesTram
            };
            setNodes([...nodes, nouNode]);
            setTrams([...trams, nouTram]);
        }
        setCarregantORS(false);
    };

    // === ELIMINAR NODE ===
    const handleEliminarNode = async (indexAEliminar) => {
        const nousNodes = nodes
            .filter((_, idx) => idx !== indexAEliminar)
            .map((n, idx) => ({ ...n, ordre: idx + 1 }));

        setNodes(nousNodes);

        if (nousNodes.length < 2) {
            setTrams([]);
            return;
        }

        setCarregantORS(true);
        const nousTrams = [];
        for (let i = 0; i < nousNodes.length - 1; i++) {
            const dadesTram = await calcularTramORS(nousNodes[i], nousNodes[i + 1]);
            if (dadesTram) {
                nousTrams.push({
                    origen_ordre: nousNodes[i].ordre,
                    desti_ordre: nousNodes[i + 1].ordre,
                    ...dadesTram
                });
            }
        }
        setTrams(nousTrams);
        setCarregantORS(false);
    };

    // HANDLE REORDERING (Drag & drop function)
    const handleReorderNodes = async (startIndex, endIndex) => {
        if (startIndex === endIndex) return;

        // take new array from nodes and extract the node that we want to reorder into new position
        const nousNodes = Array.from(nodes)
        const [nodeMogut] = nousNodes.splice(startIndex, 1)
        nousNodes.splice(endIndex, 0, nodeMogut); // put in a new destination

        // restablish index
        const nodesActualitzats = nousNodes.map((n, idx) => ({
            ...n,
            ordre: idx + 1
            }));

        setNodes(nodesActualitzats);

        // recalculate trams
        if (nodesActualitzats.length < 2) {
            setTrams([])
            return;
            }

        // load ORS
        setCarregantORS(true);
        const nousTrams = [];
        for (let i = 0; i < nodesActualitzats.length - 1; i++) {
            const dadesTram = await calcularTramORS(nodesActualitzats[i], nodesActualitzats[i+1]);
            if (dadesTram) {
                nousTrams.push({
                    origen_ordre: nodesActualitzats[i].ordre,
                    desti_ordre: nodesActualitzats[i + 1].ordre,
                    ...dadesTram
                });
            }
        }
        setTrams(nousTrams)
        setCarregantORS(false);

        };

    // === ESTADÍSTIQUES TOTALS ===
    const stats = trams.reduce((acc, tram) => ({
        distancia: acc.distancia + parseFloat(tram.distancia || 0),
        desnivell_positiu: acc.desnivell_positiu + parseInt(tram.desnivell_positiu || 0),
        desnivell_negatiu: acc.desnivell_negatiu + parseInt(tram.desnivell_negatiu || 0)
    }), { distancia: 0, desnivell_positiu: 0, desnivell_negatiu: 0 });

    return (
        <div className="app-container">
            <Navbar />

            <div className="main-content">
                {/* --- BARRA LATERAL FIXA --- */}
                <SideBar
                    nomRuta={nomRuta}
                    setNomRuta={setNomRuta}
                    nodes={nodes}
                    carregantORS={carregantORS}
                    handleEliminarNode={handleEliminarNode}
                    stats={stats}
                    handleReorderNodes={handleReorderNodes}
                    handleAfegirNodeMapa={handleAfegirNodeMapa}
                    setMapFocus={setMapFocus}
                    setMostrarAjuda={setMostrarAjuda}
                    setMostrarAjustos={setMostrarAjustos}
                    onSaveClick={() => setMostrarGuardarModal(true)}
                />

                <MapaRuta
                    nodes={nodes}
                    trams={trams}
                    crearIconaNode={crearIconaNode}
                    getLletra={getLletra}
                    handleAfegirNodeMapa={handleAfegirNodeMapa}
                    carregantORS={carregantORS}
                    mapFocus={mapFocus}
                    stats={stats}
                    mostrarPerfil={mostrarPerfil}
                    setMostrarPerfil={setMostrarPerfil}
                    dadesElevacio={dadesElevacio}
                    altContrast={altContrast}
                    indicadorPendent={indicadorPendent}
                    getTextSteepnessORS={getTextSteepnessORS}
                />
            </div>
            <Footer />
            {mostrarAjuda && <AjudaModal onClose={() => setMostrarAjuda(false)} />}

            {mostrarAjustos && (
                <AjustosModal
                    onClose={() => setMostrarAjustos(false)}
                    altContrast={altContrast} setAltContrast={setAltContrast}
                    indicadorPendent={indicadorPendent} setIndicadorPendent={setIndicadorPendent}
                />
            )}

            {mostrarGuardarModal && (
                <SaveRouteModal
                    onClose={() => setMostrarGuardarModal(false)}
                    onSave={processarIEnviarRuta}
                    stats={stats}
                    defaultName={nomRuta}
                    urlImatge={urlImatge}
                    setUrlImatge={setUrlImatge}
                />
            )}

            {/* 🔴 NEW: The Success Modal */}
            {mostrarExitModal && (
                <SuccessRouteModal
                    onClose={() => setMostrarExitModal(false)}
                    gpxData={dadesExportacio}
                />
            )}
        </div>
    );
}