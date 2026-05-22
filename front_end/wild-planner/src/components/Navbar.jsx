import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        setIsAuthenticated(!!token);
        if (storedUsername) setUsername(storedUsername);
        setMenuOpen(false);
    }, [location]);

    useEffect(() => {
        if (isAuthenticated) {
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/planner/usuaris/${localStorage.getItem('userId')}/`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUsername(data.username);
                        localStorage.setItem('username', data.username);
                    }
                } catch (error) {
                    console.error("Error de connexió amb el servidor:", error);
                }
            };

            fetchUserProfile();
        } else {
            setUsername('');
        }
    }, [isAuthenticated]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRol');
        setIsAuthenticated(false);
        setMenuOpen(false);
        navigate('/');
    };

    return (
        <header className="navbar-premium">
            <div className="navbar-container">
                <div className="navbar-logo" onClick={() => navigate('/')}>
                    <img
                        src="/sendera-logo.svg"
                        alt="Sendera logo"
                        className="navbar-logo-icon"
                    />
                </div>

                <nav className="navbar-links">
                    <button className="navbar-link" onClick={() => navigate('/')}>Explorar</button>
                    <button className="navbar-link" onClick={() => navigate('/planificar')}>Planificar</button>
                    <button className="navbar-link" onClick={() => navigate(isAuthenticated ? '/perfil' : '/login')}>Perfil</button>
                </nav>

                <div className="navbar-actions">
                    {isAuthenticated ? (
                        <div className="navbar-user-section">
                            <button className="navbar-btn btn-logout" onClick={handleLogout}>Sortir</button>
                        </div>
                    ) : (
                        <div className="navbar-guest-section">
                            <button className="navbar-btn btn-primary" onClick={() => navigate('/login')}>Accedir</button>
                        </div>
                    )}
                </div>

                <button
                    className="navbar-hamburger"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label={menuOpen ? 'Tancar menú' : 'Obrir menú'}
                    aria-expanded={menuOpen}
                >
                    <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
                </button>
            </div>

            {menuOpen && (
                <nav className="navbar-mobile-menu" aria-label="Menú mòbil">
                    <button className="navbar-mobile-link" onClick={() => navigate('/')}>
                        <span className="material-symbols-outlined">explore</span>
                        Explorar
                    </button>
                    <button className="navbar-mobile-link" onClick={() => navigate('/planificar')}>
                        <span className="material-symbols-outlined">map</span>
                        Planificar
                    </button>
                    <button className="navbar-mobile-link" onClick={() => navigate(isAuthenticated ? '/perfil' : '/login')}>
                        <span className="material-symbols-outlined">person</span>
                        Perfil
                    </button>
                    <div className="navbar-mobile-divider" />
                    {isAuthenticated ? (
                        <button className="navbar-mobile-link navbar-mobile-logout" onClick={handleLogout}>
                            <span className="material-symbols-outlined">logout</span>
                            Sortir
                        </button>
                    ) : (
                        <button className="navbar-mobile-link navbar-mobile-primary" onClick={() => navigate('/login')}>
                            <span className="material-symbols-outlined">login</span>
                            Accedir
                        </button>
                    )}
                </nav>
            )}
        </header>
    );
};

export default Navbar;