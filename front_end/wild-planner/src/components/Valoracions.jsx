import React from 'react';

//Valoracions recibe el array de valoraciones y calcula el rating
const Valoracions = ({ valoracions }) => {

    const total = valoracions.length;
    const likes = valoracions.filter(v => v.like === true).length; //construimos un nuevo array de likes y los contamos
    const dislikes = valoracions.filter(v => v.like === false).length;

    //si hay valoraciones calculamos el rating (de 0 a 5) basado en el porcentaje de likes y lo redondeamos a 1 decimal.
    const rating = total > 0 ? ((likes / total) * 5).toFixed(1) : '—'; //si no hay valoraciones mostramos -

    // Generamos las estrellas: 5 en total, llenas, medias o vacías
    //Array.from({ length: 5 }) crea un array de 5 elements. El segon argument és una funció que rep l'índex (i)
    //de cada element i retorna el nom de l'icona corresponent
    const estrelles = Array.from({ length: 5 }, (_, i) => { //_ : este parámetro existe pero no lo voy a usar
        const valor = parseFloat(rating);
        if (i < Math.floor(valor)) return 'star'; // estrella llena
        if (i < valor) return 'star_half'; // media estrella
        return 'star_border'; // estrella vacía
    });

    return (
        <section className="valoracions-section">

            <div className="valoracions-header">
                <div>
                    <div className="valoracions-rating-row">
                        {/* Número del rating */}
                        <span className="valoracions-num">{rating}</span>
                        {/* Estrellas — map() sobre el array de 5 elementos */}
                        <div className="valoracions-stars">
                            {estrelles.map((icon, i) => (
                                <span
                                    key={i}
                                    className="material-symbols-outlined valoracions-star"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    {icon}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="valoracions-total">Basat en {total} exploradors</p>
                </div>

                {/* Botones de like y dislike */}
                <div className="valoracions-actions">
                    <button className="valoracions-btn valoracions-btn--like" title="M'agrada">
                        <span className="material-symbols-outlined">thumb_up</span>
                        <span>{likes}</span>
                    </button>
                    <button className="valoracions-btn valoracions-btn--dislike" title="No m'agrada">
                        <span className="material-symbols-outlined">thumb_down</span>
                        <span>{dislikes}</span>
                    </button>
                </div>
            </div>

        </section>
    );
};

export default Valoracions;
