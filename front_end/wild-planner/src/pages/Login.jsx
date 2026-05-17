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
        } else {
            setErrors(prev => ({ ...prev, username: "Mínim 3 caràcters. Només lletres, números, _ o ." }));
            return false;
        }
    };

    const validatePassword = (val) => {
        const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, password: '' }));
            return true;
        } else {
            setErrors(prev => ({ ...prev, password: "La contrasenya ha de ser més robusta (8-16 caràcters, majúscula, número i símbol)." }));
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ username: '', password: '', general: '' });

        if (!validateUsername(username) || !validatePassword(password)) return;

        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/rutes/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Credencials incorrectes.');
            }

            // Guardem totes les dades de l'usuari al localStorage
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
            <main className="login-card">
                <h1>Accés al Projecte</h1>

                {errors.general && <p className="error-box">{errors.general}</p>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="username">Nom d'usuari</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onBlur={() => validateUsername(username)}
                            disabled={isLoading}
                        />
                        {errors.username && <span className="error-msg">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contrasenya</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => validatePassword(password)}
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Amagar" : "Mostrar"}
                        </button>
                        {errors.password && <span className="error-msg">{errors.password}</span>}
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Connectant...' : 'Iniciar Sessió'}
                    </button>
                </form>

                <button onClick={handleGuestLogin} className="btn-secondary">
                    Entrar com a Convidat
                </button>
            </main>
        </div>
    );
};

export default Login;