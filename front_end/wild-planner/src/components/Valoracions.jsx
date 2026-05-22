import React from 'react';

const Valoracions = ({ valoracions }) => {
    const total    = valoracions.length;
    const likes    = valoracions.filter(v => v.like === true).length;
    const dislikes = valoracions.filter(v => v.like === false).length;

    // Rating 0-5 based on % of likes
    const ratingNum = total > 0 ? (likes / total) * 5 : 0;
    const ratingDisplay = total > 0 ? ratingNum.toFixed(1) : '—';

    const estrelles = Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(ratingNum)) return 'star';
        if (i < ratingNum)             return 'star_half';
        return 'star_border';
    });

    return (
        <div className="valoracions-header-block">
            <div className="valoracions-rating-row">
                <div className="valoracions-rating-left">
                    <div className="valoracions-num-stars">
                        <span className="valoracions-num">{ratingDisplay}</span>
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
                    <p className="valoracions-total">
                        Basat en {total} explorador{total !== 1 ? 's' : ''}
                    </p>
                </div>

                <div className="valoracions-actions">
                    <div className="val-count val-count--like">
                        <span className="material-symbols-outlined">thumb_up</span>
                        <span>{likes}</span>
                    </div>
                    <div className="val-count val-count--dislike">
                        <span className="material-symbols-outlined">thumb_down</span>
                        <span>{dislikes}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Valoracions;
