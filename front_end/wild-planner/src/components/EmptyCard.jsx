import '../styles/Home.css';

export default function EmptyCard({ onClick }) {
    return (
        <div className="empty-card" onClick={onClick}>
            <div className="empty-card-icon">
                <span className="material-symbols-outlined">map</span>
            </div>
            <h3>Veure totes les meves rutes</h3>
            <p>Accedeix al teu espai personal i gestiona les teves expedicions.</p>
            <span className="empty-card-link">
                Anar a les meves rutes
                <span className="material-symbols-outlined">arrow_forward</span>
            </span>
        </div>
    );
}