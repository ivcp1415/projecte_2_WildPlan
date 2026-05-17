import React from 'react';

// Rebem 'perfil' que és l'array d'objectes {distance, elevation} guardat a la BDD
const RutaElevacio = ({ perfil }) => {

    // Si no hi ha dades de perfil, no renderitzem la secció
    if (!perfil || perfil.length === 0) return null;

    // Dimensions internes del sistema de coordenades del SVG
    const width   = 100;
    const height  = 100;
    const padding = 5;

    // 1. Busquem valors mínims i màxims per normalitzar la gràfica
    const altituds = perfil.map(p => p.elevation);
    const distancies = perfil.map(p => p.distance);

    const altMin = Math.min(...altituds);
    const altMax = Math.max(...altituds);
    const distMax = Math.max(...distancies);

    const rangeAlt = (altMax - altMin) || 1;
    const rangeDist = distMax || 1;

    // 2. Convertim cada punt del perfil a coordenades X, Y per al SVG
    const punts = perfil.map((p) => {
        // X depèn de la distància acumulada (proporcional al total)
        const x = padding + (p.distance / rangeDist) * (width - 2 * padding);
        // Y depèn de l'altitud (invertida perquè en SVG el 0 és a dalt)
        const y = padding + (1 - (p.elevation - altMin) / rangeAlt) * (height - 2 * padding);
        return { x, y };
    });

    // 3. Construïm els camins (paths) del SVG
    const liniaPath = punts
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(' ');

    const areaPath = `${liniaPath} L${punts[punts.length - 1].x},${height - padding} L${punts[0].x},${height - padding} Z`;

    return (
        <section className="elevacio-section">
            <h2 className="elevacio-title">
                <span className="material-symbols-outlined">area_chart</span> Perfil d'Elevació
            </h2>

            <div className="elevacio-labels">
                <span>Màx: {altMax} m</span>
                <span>Mín: {altMin} m</span>
            </div>

            <svg className="elevacio-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {/* Àrea sota la línia */}
                <path d={areaPath} fill="rgba(23, 49, 36, 0.1)" stroke="none" />
                {/* Línia del perfil */}
                <path d={liniaPath} fill="none" stroke="#173124" strokeWidth="1" strokeLinejoin="round" />
            </svg>

            <div className="elevacio-footer">
                <span>0 km</span>
                <span>{distMax.toFixed(2)} km</span>
            </div>
        </section>
    );
};

export default RutaElevacio;