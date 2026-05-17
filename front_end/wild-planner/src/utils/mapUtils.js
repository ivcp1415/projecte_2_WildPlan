import L from 'leaflet';

// Funció per obtenir la lletra (0 = A, 1 = B...)
export const getLletra = (index) => String.fromCharCode(65 + index);

// Icona per als Nodes amb Lletres (A, B, C...)
export const crearIconaNode = (lletra, color) => L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${lletra}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});