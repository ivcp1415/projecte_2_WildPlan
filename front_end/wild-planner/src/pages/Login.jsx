import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ username: '', password: '', general: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const validateUsername = (val) => {
        const pattern = /^[a-zA-Z0-9_.]{3,150}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, username: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, username: "Mínim 3 caràcters. Només lletres, números, _ o ." }));
        return false;
    };

    const validatePassword = (val) => {
        const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, password: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, password: "La contrasenya ha de ser més robusta (8-16 caràcters, majúscula, número i símbol)." }));
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ username: '', password: '', general: '' });

        if (!validateUsername(username) || !validatePassword(password)) return;

        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/planner/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Credencials incorrectes.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('accessToken', data.token);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userRol', data.rol);
            localStorage.removeItem('isGuest');
            navigate('/rutes');

        } catch (err) {
            setErrors(prev => ({ ...prev, general: err.message }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestLogin = () => {
        localStorage.clear();
        localStorage.setItem('isGuest', 'true');
        navigate('/crear-ruta');
    };

    return (
        <div className="login-page">
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>

            <div className="login-card-container">
                <main className="login-card">

                    {/* Logo */}
                    <div className="login-header">
                        <div className="login-logo-group">
                            <span className="material-symbols-outlined login-logo-icon">landscape</span>
                            <span className="login-logo-title">Sendera</span>
                        </div>
                        <p className="login-subtitle">Precisió en cada cim. Accedeix al teu portal logístic.</p>
                    </div>

                    {errors.general && <p className="error-box">{errors.general}</p>}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* USERNAME */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Nom d'usuari</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">person</span>
                                <input
                                    className={`form-input ${errors.username ? 'input-error' : ''}`}
                                    type="text"
                                    id="username"
                                    placeholder="nom_usuari"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={() => validateUsername(username)}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>

                        {/* PASSWORD */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Contrasenya</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">lock</span>
                                <input
                                    className={`form-input has-right-icon ${errors.password ? 'input-error' : ''}`}
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => validatePassword(password)}
                                    disabled={isLoading}
                                />
                                <button className="btn-icon-right" type="button" onClick={() => setShowPassword(!showPassword)}>
                                    <span className="material-symbols-outlined">
                                        {showPassword ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? 'Connectant...' : 'Accedir'}
                        </button>

                    </form>

                    {/* Divider */}
                    <div className="login-divider">
                        <div className="login-divider-line"></div>
                        <span className="login-divider-text">o continua com a</span>
                        <div className="login-divider-line"></div>
                    </div>

                    {/* Guest access */}
                    <button onClick={handleGuestLogin} className="btn-social">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_outline</span>
                        Entrar com a Convidat
                    </button>

                    {/* Register link */}
                    <div className="login-footer">
                        <p>Encara no tens compte? <a className="register-link" href="/registre">Registra't</a></p>
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Login;
