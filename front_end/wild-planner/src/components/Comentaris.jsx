import React from 'react';

//Comentaris recibe el array de comentarios y los muestra en lista
const Comentaris = ({ comentaris }) => {
    return (
        <section className="comentaris-section">

            <h4 className="comentaris-title">Comentaris de la comunitat</h4>

            {/* Si no hay comentarios mostramos un mensaje */}
            {comentaris.length === 0 ? (
                <p className="comentaris-empty">Encara no hi ha comentaris. Sigues el primer!</p>
            ) : (
                <div className="comentaris-llista">
                    {/* map() para renderizar cada comentario como un artículo */}
                    {comentaris.map((comentari, index) => (
                        <article key={comentari.id} className="comentari-article">

                            {/* Avatar con la inicial del nombre de usuario */}
                            <div className="comentari-avatar">
                                {String(comentari.usuari).charAt(0).toUpperCase()}
                            </div>

                            <div className="comentari-cos">
                                <div className="comentari-header">
                                    <span className="comentari-autor">
                                        Usuari {comentari.usuari}
                                    </span>
                                    {/* Mostramos la valoración numérica si existe */}
                                    {comentari.valoracio && (
                                        <span className="comentari-valoracio">
                                            {'★'.repeat(comentari.valoracio)}
                                        </span>
                                    )}
                                </div>

                                {/* Texto del comentario */}
                                <p className="comentari-text">{comentari.descripcio}</p>

                                {/* Badge que indica si recomienda o no la ruta */}
                                {/* like_dislike: true = recomienda, false = no recomienda */}
                                <span className={`comentari-badge ${comentari.like_dislike ? 'comentari-badge--like' : 'comentari-badge--dislike'}`}>
                                    <span className="material-symbols-outlined">
                                        {comentari.like_dislike ? 'thumb_up' : 'thumb_down'}
                                    </span>
                                    {comentari.like_dislike ? 'Recomana' : 'No recomana'}
                                </span>
                            </div>

                            {/* Separador entre comentarios (excepto el último) */}
                            {index < comentaris.length - 1 && <hr className="comentari-hr" />}

                        </article>
                    ))}
                </div>
            )}

        </section>
    );
};

export default Comentaris;
