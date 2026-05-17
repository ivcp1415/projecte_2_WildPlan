import React from 'react';

//RutaSpecs recibe la ruta y muestra los datos técnicos en tarjetas
const RutaSpecs = ({ ruta }) => {

    //definimos las tarjetas como un array para poder hacer map() (en vez de escribir cada tarjeta manual una por una)
    //Cada tarjeta tiene: icono, etiqueta y valor
    const specs = [
        {
            icon:  'route',
            label: 'Distància',
            value: `${ruta.distancia} km`,
        },
        {
            icon:  'trending_up',
            label: 'Desnivell positiu',
            value: `+${ruta.desnivell_positiu} m`,
        },

        {
            icon:  'trending_down',
            label: 'Desnivell negatiu',
            value: `+${ruta.desnivell_negatiu} m`},
        {
            icon:  'landscape',
            label: 'Modalitat',
            value: ruta.modalitat,
        }
    ];

    return (
        <section className="specs-grid">
            {/* map() itera el array y crea una tarjeta por cada spec */}
            {specs.map((spec, index) => (
                // key es obligatorio cuando haces map() en React
                // sirve para que React identifique cada elemento de la lista
                <div key={index} className="spec-card">
                    <span className="material-symbols-outlined spec-icon">{spec.icon}</span>
                    <div>
                        <p className="spec-label">{spec.label}</p>
                        <p className="spec-value">{spec.value}</p>
                    </div>
                </div>
            ))}
        </section>
    );
};

export default RutaSpecs;
