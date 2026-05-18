import React from 'react';

const ShareCard = ({ ruta, onClose }) => {
    // --- SHARE FUNCTIONS ---
    const getShareUrl = () => window.location.href;
    const getShareText = () => `Dona un cop d'ull a aquesta ruta: ${ruta?.nom || ''}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            alert("Enllaç copiat al porta-retalls!");
            onClose(); // Close the card after copying
        } catch (err) {
            console.error("Error en copiar l'enllaç: ", err);
        }
    };

    const shareWhatsApp = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText() + " " + getShareUrl())}`;
        window.open(url, '_blank');
    };

    const shareTwitter = () => {
        const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareText())}`;
        window.open(url, '_blank');
    };

    const shareFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank');
    };

    const shareEmail = () => {
        const url = `mailto:?subject=${encodeURIComponent(ruta?.nom || 'Ruta genial')}&body=${encodeURIComponent(getShareText() + "\n\n" + getShareUrl())}`;
        window.location.href = url;
    };

    return (
        <div className="share-card">
            <div className="share-card-header">
                <h4>Comparteix la ruta</h4>
                <button className="close-share" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="share-card-body">
                <button onClick={shareWhatsApp} className="share-option wa">
                    WhatsApp
                </button>
                <button onClick={shareTwitter} className="share-option x">
                    X (Twitter)
                </button>
                <button onClick={shareFacebook} className="share-option fb">
                    Facebook
                </button>
                <button onClick={shareEmail} className="share-option email">
                    Correu electrònic
                </button>
                <div className="share-divider"></div>
                <button onClick={handleCopyLink} className="share-option copy">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
                    Copiar enllaç
                </button>
            </div>
        </div>
    );
};

export default ShareCard;