// /front/src/components/PerfilElevacio.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* Comentari: Aquest component rep 'perfilData', que és el camp JSON
   emmagatzemat a la base de dades (perfil_elevacio).
*/
export default function PerfilElevacio({ perfilData }) {
    // Si no hi ha dades, no renderitzem per evitar errors de JS
    if (!perfilData || perfilData.length === 0) return null;

    return (
        <div className="perfil-container" style={{ width: '100%', height: '250px', marginTop: '20px' }}>
            <h4 style={{ color: '#173124', marginBottom: '10px' }}>Detall d'Elevació</h4>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfilData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#173124" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#173124" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    {/* Utilitzem expressions regulars o formatat simple per a la distància */}
                    <XAxis
                        dataKey="distance"
                        unit=" km"
                        tick={{ fontSize: 12 }}
                        minTickGap={30}
                    />
                    <YAxis tick={{ fontSize: 12 }} unit="m" />
                    <Tooltip
                        labelFormatter={(val) => `${val} km`}
                        formatter={(val) => [`${val} m`, 'Altitud']}
                    />
                    <Area
                        type="monotone"
                        dataKey="elevation"
                        stroke="#173124"
                        fillOpacity={1}
                        fill="url(#colorElev)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}