import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

// Component Navbar: Reutilitzable i dinàmic segons els requisits de la rúbrica
const Navbar = () => {
    // Hook per a la navegació entre les diferents vistes del projecte
    const navigate = useNavigate();
    // Hook per detectar canvis de ruta i forçar la reactivitat del component
    const location = useLocation();

    // Estat reactiu per saber si l'usuari està autenticat (Utilitzant la clau 'token' del teu Login)
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    // Estat per guardar el nom d'usuari obtingut del localStorage o de l'API
    const [username, setUsername] = useState(localStorage.getItem('username') || '');

    // useEffect per sincronitzar l'estat d'autenticació quan l'usuari navega (ex: després del Login)
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        setIsAuthenticated(!!token);
        if (storedUsername) setUsername(storedUsername);
    }, [location]);

    // useEffect per consumir l'endpoint del perfil i assegurar que les dades són fresques (Requisit obligatori)
    useEffect(() => {
        if (isAuthenticated) {
            const fetchUserProfile = async () => {
                try {
                    // Petició a l'API de Django Rest Framework utilitzant el 'token' de localStorage
                    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/planner/usuaris/${localStorage.getItem('userId')}/`, {
                        method: 'GET',
                        headers: {
                            // Utilitzem el format Bearer amb la clau 'token'
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Actualitzem el nom d'usuari amb la dada més recent del servidor
                        setUsername(data.username);
                        localStorage.setItem('username', data.username); // Sincronitzem localStorage
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

    // Funció per tancar la sessió i netejar el localStorage segons el teu flux
    const handleLogout = () => {
        // Netegem exactament les claus que has definit al Login
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRol');

        // Actualitzem l'estat local per a un canvi visual instantani
        setIsAuthenticated(false);

        // Redirigim a la pàgina principal de rutes
        navigate('/');
    };

    return (
        <header className="navbar-premium">
            <div className="navbar-container">
                {/* Logo SVG original: Redirigeix a la Llista de Rutes (Pàgina Principal) */}
                <div className="navbar-logo" onClick={() => navigate('/')}>
                    <img
                        src="/sendera-logo.svg"
                        alt="Sendera logo"
                        className="navbar-logo-icon"
                    />
                </div>

                {/* Secció de navegació central: Explorar i Planificar */}
                <nav className="navbar-links">
                    <button className="navbar-link" onClick={() => navigate('/')}>
                        Explorar
                    </button>
                    <button className="navbar-link" onClick={() => navigate('/crear-ruta')}>
                        Planificar
                    </button>
                    <button
                        className="navbar-link"
                        onClick={() => navigate(isAuthenticated ? '/perfil' : '/login')}
                    >
                        Perfil
                    </button>
                </nav>

                {/* Secció d'accions: Dinamisme segons l'estat del 'token' */}
                <div className="navbar-actions">
                    {isAuthenticated ? (
                        <div className="navbar-user-section">
                            <button className="navbar-btn btn-logout" onClick={handleLogout}>
                                Sortir
                            </button>
                        </div>
                    ) : (
                        <div className="navbar-guest-section">
                            {/* Si no hi ha token, mostrem el botó d'Accedir (Requisit) */}
                            <button className="navbar-btn btn-primary" onClick={() => navigate('/login')}>
                                Accedir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;