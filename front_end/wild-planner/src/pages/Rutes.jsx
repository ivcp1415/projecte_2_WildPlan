import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import PlanificarSidebar from '../components/PlanificarSidebar.jsx';
import LogisticaView from '../components/LogisticaView.jsx';
import FinancesView from '../components/FinancesView.jsx';
import ClimaView from '../components/ClimaView.jsx';
import AlertesView from '../components/AlertesView.jsx';
import AssistentIA from '../components/AssistentIA.jsx';

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
    const navigate = useNavigate();

    const [editantRutaId] = useState(() => localStorage.getItem('ruta_editant_id') || null);
    const [editantMeta] = useState(() => {
        const saved = localStorage.getItem('ruta_editant_meta');
        if (saved) try { return JSON.parse(saved); } catch {}
        return null;
    });
    const [editantPlanificacioId] = useState(() => {
        const id = localStorage.getItem('ruta_editant_planificacio_id');
        return id ? parseInt(id) : null;
    });
    const [editantMotxillaId, setEditantMotxillaId] = useState(() => {
        const id = localStorage.getItem('ruta_editant_motxilla_id');
        return id ? parseInt(id) : null;
    });

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

    const [initialBounds] = useState(() => {
        try {
            const savedNodes = JSON.parse(localStorage.getItem('ruta_esborrany_nodes') || '[]');
            if (savedNodes.length === 0) return null;
            const lats = savedNodes.map(n => parseFloat(n.latitud));
            const lngs = savedNodes.map(n => parseFloat(n.longitud));
            if (savedNodes.length === 1) {
                return [[lats[0] - 0.02, lngs[0] - 0.02], [lats[0] + 0.02, lngs[0] + 0.02]];
            }
            return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
        } catch { return null; }
    });
    const [carregantORS, setCarregantORS] = useState(false);
    const [urlImatge, setUrlImatge] = useState(() => editantMeta?.imatge_portada || '');
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
    const [activeTab, setActiveTab] = useState(() => {
        const tab = localStorage.getItem('ruta_editant_tab');
        if (tab) { localStorage.removeItem('ruta_editant_tab'); return tab; }
        return 'ruta';
    });

    // === ESBORRANY DE PLANIFICACIÓ (motxilla + planificacio + despeses) ===
    // Tot es manté com a esborrany local fins que es desa la ruta. La commit del
    // pla complet es fa en una sola tirada dins de processarIEnviarRuta.
    const [planDraft, setPlanDraft] = useState(() => {
        const saved = localStorage.getItem('plan_esborrany');
        if (saved) {
            try { return JSON.parse(saved); } catch { /* fallthrough */ }
        }
        return {
            motxilla: {
                nom: 'Motxilla principal',
                pes_base: 0,
                materials: [],
                menjars: []
            },
            planificacio: {
                titol: '',
                data_inici: '',
                data_fi: '',
                despeses: []
            }
        };
    });

    useEffect(() => {
        localStorage.setItem('ruta_esborrany_nom', nomRuta);
        localStorage.setItem('ruta_esborrany_nodes', JSON.stringify(nodes));
        localStorage.setItem('ruta_esborrany_trams', JSON.stringify(trams));
    }, [nomRuta, nodes, trams]);

    useEffect(() => {
        localStorage.setItem('plan_esborrany', JSON.stringify(planDraft));
    }, [planDraft]);

    // Auto-recalculate segments when nodes were loaded from DB (fork/edit) but have no geometry
    useEffect(() => {
        const initialNodes = nodes;
        const initialTrams = trams;
        if (initialNodes.length >= 2 && initialTrams.length === 0) {
            const recalcular = async () => {
                setCarregantORS(true);
                const nousTrams = [];
                for (let i = 0; i < initialNodes.length - 1; i++) {
                    const dadesTram = await calcularTramORS(initialNodes[i], initialNodes[i + 1]);
                    if (dadesTram) {
                        nousTrams.push({
                            origen_ordre: initialNodes[i].ordre,
                            desti_ordre: initialNodes[i + 1].ordre,
                            ...dadesTram
                        });
                    }
                }
                setTrams(nousTrams);
                setCarregantORS(false);
            };
            recalcular();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            if (!tram.geometria_segment) return acc;
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
            trams: trams.filter(t => t.geometria_segment).map(t => ({
                origen_ordre: t.origen_ordre,
                desti_ordre: t.desti_ordre,
                distancia: parseFloat(t.distancia.toFixed(2)),
                desnivell_positiu: t.desnivell_positiu,
                desnivell_negatiu: t.desnivell_negatiu,
                geometria_segment: t.geometria_segment
            }))
        };

        console.log("Sending payload to Django:", payloadRuta);

        try {
            const token = localStorage.getItem('token');
            const isEditing = !!editantRutaId;
            const url = isEditing
                ? `${API_URL}/planner/rutes/${editantRutaId}/editar/`
                : `${API_URL}/planner/rutes/crear/`;

            const response = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payloadRuta)
            });

            if (response.ok) {
                const rutaData = await response.json();
                const rutaId = isEditing ? parseInt(editantRutaId) : rutaData.ruta_id;

                // Capture before state is cleared
                const savedNodes = [...nodes];
                const savedTrams = [...trams];

                let planId = null;
                try {
                    planId = await commitPlanDraft(rutaId, payloadRuta.nom, token);
                } catch (planErr) {
                    console.error("Error desant la planificació associada:", planErr);
                    alert("La ruta s'ha desat però hi ha hagut un problema amb la planificació: " + planErr.message);
                }

                localStorage.removeItem('ruta_esborrany_nom');
                localStorage.removeItem('ruta_esborrany_nodes');
                localStorage.removeItem('ruta_esborrany_trams');
                localStorage.removeItem('plan_esborrany');
                localStorage.removeItem('ruta_editant_id');
                localStorage.removeItem('ruta_editant_meta');
                localStorage.removeItem('ruta_editant_planificacio_id');
                localStorage.removeItem('ruta_editant_motxilla_id');

                setNodes([]);
                setTrams([]);
                setNomRuta('La meva nova ruta');
                setUrlImatge('');
                setPlanDraft({
                    motxilla: { nom: 'Motxilla principal', pes_base: 0, materials: [], menjars: [] },
                    planificacio: { titol: '', data_inici: '', data_fi: '', despeses: [] }
                });

                if (isEditing) {
                    setMostrarGuardarModal(false);
                    navigate(`/rutes/${rutaId}`);
                } else {
                    const gpxString = generarGPX(payloadRuta.nom, savedTrams);
                    setDadesExportacio({ nom: payloadRuta.nom, gpxString, rutaId, planId, savedNodes, savedTrams });
                    setMostrarGuardarModal(false);
                    setMostrarExitModal(true);
                }
            } else {
                const errorData = await response.json();
                alert("Error desant la ruta: " + JSON.stringify(errorData));
            }
        } catch (err) {
            console.error("Connection error:", err);
        }
    };

    // === COMMIT BUNDLED PLAN DRAFT ===
    const commitPlanDraft = async (rutaId, nomRutaFinal, token) => {
        const { motxilla, planificacio } = planDraft;
        const hasItems = motxilla.materials.length > 0 || motxilla.menjars.length > 0;
        const hasPlan = !!planificacio.titol?.trim() || planificacio.data_inici || planificacio.data_fi || planificacio.despeses.length > 0;

        if (!hasItems && !hasPlan && !editantPlanificacioId) return null;

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // === MOTXILLA ===
        let motxillaId = null;

        if (editantMotxillaId) {
            motxillaId = editantMotxillaId;
            await fetch(`${API_URL}/planner/motxilles/${motxillaId}/editar/`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    nom: motxilla.nom || `Motxilla ${nomRutaFinal}`,
                    pes_base: parseFloat(motxilla.pes_base) || 0
                })
            });
            // Clear existing items before re-adding from draft
            const resMot = await fetch(`${API_URL}/planner/motxilles/${motxillaId}/`, { headers: authHeaders });
            if (resMot.ok) {
                const motData = await resMot.json();
                for (const m of motData.materials_detall || []) {
                    await fetch(`${API_URL}/planner/motxilles/${motxillaId}/materials/${m.material_id}/`, {
                        method: 'DELETE', headers: authHeaders
                    });
                }
                for (const m of motData.menjars_detall || []) {
                    await fetch(`${API_URL}/planner/motxilles/${motxillaId}/menjars/${m.menjar_id}/`, {
                        method: 'DELETE', headers: authHeaders
                    });
                }
            }
        } else if (hasItems) {
            const resMotxilla = await fetch(`${API_URL}/planner/motxilles/crear/`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    nom: motxilla.nom || `Motxilla ${nomRutaFinal}`,
                    pes_base: parseFloat(motxilla.pes_base) || 0
                })
            });
            if (!resMotxilla.ok) throw new Error("No s'ha pogut crear la motxilla");
            motxillaId = (await resMotxilla.json()).id;
        }

        // Add materials and menjars (common path for both create and update)
        if (motxillaId) {
            for (const m of motxilla.materials) {
                let materialId = m.ref_id;
                if (!materialId) {
                    const resMat = await fetch(`${API_URL}/planner/materials/crear/`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({ nom: m.nom, descripcio: m.descripcio || '', pes: m.pes || 0, preu: m.preu || 0, imatge_url: m.imatge_url || '' })
                    });
                    if (!resMat.ok) continue;
                    materialId = (await resMat.json()).id;
                }
                await fetch(`${API_URL}/planner/motxilles/${motxillaId}/materials/`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ material_id: materialId, quantitat: m.quantitat || 1 })
                });
            }

            for (const m of motxilla.menjars) {
                let menjarId = m.ref_id;
                if (!menjarId) {
                    const resMen = await fetch(`${API_URL}/planner/menjars/crear/`, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({ nom: m.nom, descripcio: m.descripcio || '', pes: m.pes || 0, preu: m.preu || 0, calories: m.calories || 0, imatge_url: m.imatge_url || '' })
                    });
                    if (!resMen.ok) continue;
                    menjarId = (await resMen.json()).id;
                }
                await fetch(`${API_URL}/planner/motxilles/${motxillaId}/menjars/`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ menjar_id: menjarId, quantitat: m.quantitat || 1 })
                });
            }
        }

        // === PLANIFICACIÓ ===
        if (editantPlanificacioId) {
            // Delete existing despeses before re-adding
            const resPlan = await fetch(`${API_URL}/planner/planificacions/${editantPlanificacioId}/`, { headers: authHeaders });
            if (resPlan.ok) {
                const planData = await resPlan.json();
                for (const d of planData.despeses || []) {
                    await fetch(`${API_URL}/planner/despeses/${d.id}/eliminar/`, {
                        method: 'DELETE', headers: authHeaders
                    });
                }
            }

            const planBody = {
                ruta: rutaId,
                titol: planificacio.titol?.trim() || `Planificació de ${nomRutaFinal}`,
            };
            if (motxillaId) planBody.motxilla = motxillaId;
            if (planificacio.data_inici) planBody.data_inici = planificacio.data_inici;
            if (planificacio.data_fi) planBody.data_fi = planificacio.data_fi;

            await fetch(`${API_URL}/planner/planificacions/${editantPlanificacioId}/editar/`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify(planBody)
            });

            for (const d of planificacio.despeses) {
                await fetch(`${API_URL}/planner/planificacions/${editantPlanificacioId}/despeses/`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ concepte: d.concepte, import_despesa: d.import_despesa || 0, divisa: d.divisa || 'EUR' })
                });
            }
            return editantPlanificacioId;
        } else if (motxillaId || hasPlan) {
            const planBody = {
                ruta: rutaId,
                motxilla: motxillaId,
                titol: planificacio.titol?.trim() || `Planificació de ${nomRutaFinal}`,
            };
            if (planificacio.data_inici) planBody.data_inici = planificacio.data_inici;
            if (planificacio.data_fi) planBody.data_fi = planificacio.data_fi;

            const resPlan = await fetch(`${API_URL}/planner/planificacions/crear/`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(planBody)
            });
            if (!resPlan.ok) {
                const err = await resPlan.json().catch(() => ({}));
                throw new Error('Planificació: ' + JSON.stringify(err));
            }
            const planId = (await resPlan.json()).id;

            for (const d of planificacio.despeses) {
                await fetch(`${API_URL}/planner/planificacions/${planId}/despeses/`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({ concepte: d.concepte, import_despesa: d.import_despesa || 0, divisa: d.divisa || 'EUR' })
                });
            }
            return planId;
        }
        return null;
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

    // === DRAFT MODE: IA afegeix ítems a l'esborrany local sense tocar la BD ===
    const handleAddDraftItem = (item) => {
        setPlanDraft(prev => {
            const motxilla = { ...prev.motxilla };
            const entry = {
                nom: item.nom,
                pes: item.pes || 0,
                preu: item.preu || 0,
                quantitat: item.quantitat || 1,
                ref_id: null,
                imatge_url: '',
                descripcio: '',
            };
            if (item.tipus === 'material') {
                motxilla.materials = [...motxilla.materials, entry];
            } else if (item.tipus === 'menjar') {
                motxilla.menjars = [...motxilla.menjars, { ...entry, calories: item.calories || 0 }];
            }
            return { ...prev, motxilla };
        });
    };

    // === REFRESC PLANIFICACIÓ DESPRÉS QUE LA IA AFEGEIXI ÍTEMS ===
    const handleInventariActualitzat = async () => {
        if (!editantPlanificacioId) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/planner/planificacions/${editantPlanificacioId}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const planDetail = await res.json();

            setPlanDraft(prev => ({
                ...prev,
                motxilla: {
                    ...prev.motxilla,
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
                }
            }));

            if (planDetail.motxilla?.id && !editantMotxillaId) {
                setEditantMotxillaId(planDetail.motxilla.id);
                localStorage.setItem('ruta_editant_motxilla_id', String(planDetail.motxilla.id));
            }
        } catch { /* silent — no blocking the chat */ }
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

            <div className="planificar-wrapper">
                {/* Tab Navigation Sidebar */}
                <PlanificarSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Main Content Area */}
                <div className="planificar-content-area">
                    {activeTab === 'ruta' && (
                        <div className="main-content">
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
                                initialBounds={initialBounds}
                            />
                        </div>
                    )}

                    {activeTab === 'planificacio' && (
                        <div className="planificacio-combined">
                            <LogisticaView
                                planDraft={planDraft}
                                setPlanDraft={setPlanDraft}
                                onGoToRuta={() => setActiveTab('ruta')}
                                hasRoute={nodes.length >= 2}
                                onSaveAll={() => setMostrarGuardarModal(true)}
                            />
                            <FinancesView
                                planDraft={planDraft}
                                setPlanDraft={setPlanDraft}
                                onGoToRuta={() => setActiveTab('ruta')}
                                onGoToLogistica={() => setActiveTab('planificacio')}
                                hasRoute={nodes.length >= 2}
                                onSaveAll={() => setMostrarGuardarModal(true)}
                            />
                        </div>
                    )}
                    {activeTab === 'clima' && <ClimaView nodes={nodes} />}
                    {activeTab === 'alertes' && <AlertesView />}
                    {activeTab === 'assistent' && (
                        <AssistentIA
                            rutaId={editantRutaId ? parseInt(editantRutaId) : null}
                            planificacioId={editantPlanificacioId}
                            stats={stats}
                            nomRuta={nomRuta}
                            nodes={nodes}
                            planDraft={planDraft}
                            onInventariActualitzat={handleInventariActualitzat}
                            onAddDraftItem={handleAddDraftItem}
                        />
                    )}
                </div>
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
                    defaultDescription={editantMeta?.descripcio || ''}
                    defaultModality={editantMeta?.modalitat || 'senderisme'}
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