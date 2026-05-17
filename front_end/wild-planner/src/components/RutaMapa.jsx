// /front/src/components/RutaMapa.jsx
import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* Comentari: Utilitzem el component GeoJSON de Leaflet per carregar
   tot el mapa des d'un sol fitxer/registre JSON.
*/
const RutaMapa = ({ geoData }) => {
    // Validació de seguretat
    if (!geoData) return <div className="map-placeholder">Carregant mapa...</div>;

    // Estil de la línia del mapa (Sostenibilitat: colors d'alt contrast)
    const estilRuta = {
        color: "#173124",
        weight: 5,
        opacity: 0.8
    };

    return (
        <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer
                bounds={L.geoJSON(geoData).getBounds()} // Ajusta el zoom automàticament a la ruta
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {/* Pintem tota la ruta d'un cop des del JSON */}
                <GeoJSON data={geoData} style={estilRuta} />
            </MapContainer>
        </div>
    );
};

export default RutaMapa;