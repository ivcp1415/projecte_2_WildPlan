import '../styles/TopNav.css'

export default function TopNav(){
        {/* --- NAVEGACIÓ SUPERIOR --- */}
        return (
            <nav className="top-nav">
                <div className="nav-left">
                    <div className="brand-title">SummitLogistics</div>
                    <div className="nav-links">
                        <a href="#explorar" className="nav-link">Explorar</a>
                        <a href="#planificar" className="nav-link active-link">Planificar</a>
                    </div>
                </div>
            </nav>
        );
    }