import React from 'react';

//RutaHero recibe el objeto ruta entero
//y muestra la imagen de portada, el nombre y la modalidad
const RutaHero = ({ ruta }) => {
    return (
        <header className="hero">

            {/* Imagen de fondo: si la ruta tiene url_imatges la usamos,
                si no ponemos una imagen de montaña por defecto */}
            <img
                className="hero-img"
                src={ruta.url_imatges || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070'}
                alt={ruta.nom}
            />

            {/* Gradiente para que el texto sea legible sobre la imagen */}
            <div className="hero-overlay"></div>

            {/* Contenido encima de la imagen */}
            <div className="hero-content">

                {/* Badge con la modalidad de la ruta */}
                <div className="hero-badges">
                    <span className="hero-badge">{ruta.modalitat}</span>
                    {/* AFEGIT: També podem posar un badge extra si està verificada (opcional) */}
                    {/* {ruta.es_verificada && <span className="hero-badge" style={{ backgroundColor: '#28a745' }}>Oficial</span>} */}
                </div>

                {/* Nombre de la ruta amb el logo de verificat si cal */}
                <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {ruta.nom}
                    {/* AFEGIT: Icona de verificat */}
                    {ruta.es_verificada && (
                        <span 
                            className="material-symbols-outlined" 
                            style={{ color: '#28a745', fontSize: '1.2em' }} 
                            title="Ruta verificada per l'equip"
                        >
                            verified
                        </span>
                    )}
                </h1>

                {/* Descripción corta: mostramos los primeros 100 caracteres.
                    Primero comprobamos que existe descripcion (&& -> si...haz...), despues slice coge los 100 primeros caracteres
                    y si es más larga añadimos '...' al final*/}
                {ruta.descripcio && (
                    <p className="hero-desc">
                        <span className="material-symbols-outlined">location_on</span>
                        {ruta.descripcio.slice(0, 100)}{ruta.descripcio.length > 100 ? '...' : ''}
                    </p>
                )}
            </div>
        </header>
    );
};

export default RutaHero;