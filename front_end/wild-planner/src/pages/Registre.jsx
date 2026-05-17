import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Registre.css';

const Registre = () => {

    //ESTADOS DE LOS CAMPOS
    //useState guarda datos que pueden cambiar
    //email: la variable que guarda el valor actual (empieza vacia)
    //setEmail: la funcion que uso para cambiar ese valor

    const [username, setUsername] = useState(''); //empiezan vacios
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); //no se envia al backend, solo existe en el front
    const [dataNaixement, setDataNaixement] = useState('');
    const [biografia, setBiografia] = useState('');
    const [urlFotoPerfil, setUrlFotoPerfil] = useState('');

    //Estado de los errores: si está vacio es que no hay error
    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        urlFotoPerfil: '',
        general: ''
    });

    //Estados auxiliares (controlar contraseña, etc)
    const [isLoading, setIsLoading]         = useState(false);
    const [showPassword, setShowPassword]   = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    //función para redirigir al usuario cuando se ha registrado
    const navigate = useNavigate();

    //FUNCIONES DE VALIDACIÓN
    //Cada una comprueba un campo con us respectiva expresión regular
    const validateUsername = (val) => {
        const pattern = /^[a-zA-Z0-9_.]{3,150}$/;
        if (pattern.test(val)) { //entra si cumple el patrón (true)
            setErrors(prev => ({ ...prev, username: '' })); //recibe el objeto de erroress, copia todos los campos y sobrescribe el de username a vacio
            return true;
        }
        setErrors(prev => ({ ...prev, username: "Mínim 3 caràcters. Només lletres, números, _ o ." }));
        return false;
    };

    const validateEmail = (val) => {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, email: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, email: "Ha de contenir '@', un domini i una extensió." }));
        return false;
    };

    const validatePassword = (val) => {
        const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, password: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, password: "8-16 caràcters, una majúscula, un número i un caràcter especial." }));
        return false;
    };

    const validatePassword2 = (val) => {
        if (val === password) {
            setErrors(prev => ({ ...prev, password2: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, password2: "Les contrasenyes no coincideixen." }));
        return false;
    };

    const validateUrlFotoPerfil = (val) => {
        //si está vacio es válido (campo opcional)
        if (val === '') {
            setErrors(prev => ({ ...prev, urlFotoPerfil: '' }));
            return true;
        }
        const pattern = /^https?:\/\/.+/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, urlFotoPerfil: '' }));
            return true;
        }
        setErrors(prev => ({ ...prev, urlFotoPerfil: "Ha de ser una URL vàlida (http:// o https://)" }));
        return false;
    };

    //estas funciones llaman a las funciones de validación con  sus respectivos campos
    //onBlur se llama cuando el usuario sale del campo
    const handleUsernameBlur = () => validateUsername(username);
    const handleEmailBlur = () => validateEmail(email);
    const handlePasswordBlur = () => validatePassword(password);
    const handlePassword2Blur = () => validatePassword2(password2);
    const handleUrlFotoPerfilBlur = () => validateUrlFotoPerfil(urlFotoPerfil);

    //ENVIO AL BACKEND
    //se ejecuta cuando se hace click en el botón de crear compte
    const handleSubmit = async (e) => {
        e.preventDefault(); //para evitar que se recargue la página
        setErrors(prev => ({ ...prev, general: '' }));

        //validamos los campos
        const isUsernameValid = validateUsername(username);
        const isEmailValid = validateEmail(email);
        const isPswdValid = validatePassword(password);
        const isPswd2Valid = validatePassword2(password2);
        const isUrlFotoPerfilValid = validateUrlFotoPerfil(urlFotoPerfil);
        //si hay algún error lo mostramos y no se envia nada
        if (!isUsernameValid || !isEmailValid || !isPswdValid || !isPswd2Valid || !isUrlFotoPerfilValid) {
            setErrors(prev => ({ ...prev, general: 'Revisa els camps abans de continuar.' }));
            return;
        }

        setIsLoading(true);

        console.log("URL de l'API:", process.env.REACT_APP_API_URL);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/rutes/registre/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    //los opcionales solo se envian si tienen valor
                    //si están vacios enviamos null porque el back acepta null=True
                    data_naixement: dataNaixement || null,
                    biografia: biografia || '',
                    url_foto_perfil: urlFotoPerfil || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                //el backend devuelve errores por campo { username: ['ja existeix'] }
                const errorMsg =
                    data.username?.[0] || //coge el primer error del campo username si existe (el ? evitaerrores si el campo no existe)
                    data.email?.[0] ||
                    data.password?.[0] ||
                    data.url_foto_perfil?.[0]||
                    'Error en el registre.';
                throw new Error(errorMsg);
            }

            //redirige al login si todo va bien
            navigate('/login');

        } catch (err) {
            setErrors(prev => ({ ...prev, general: err.message }));
        } finally {
            setIsLoading(false);
        }
    };

    //RENDERIZADO
    return (
        <div className="registre-page">
            <div className="bg-image"></div>
            <div className="bg-overlay"></div>

            <main className="registre-card-container">
                <div className="login-card">

                    {/* Capçalera — mateixa estructura que Login */}
                    <div className="header-container">
                        <div className="logo-group">
                            <img
                                src="/sendera-logo.svg"
                                alt="Sendera logo"
                                className="logo-img"
                            />
                        </div>
                        <p className="subtitle">Descobreix la natura</p>
                    </div>

                    {/* Títol del formulari — com al Stitch */}
                    <div className="registre-title-block">
                        <h2 className="registre-title">Crear Compte</h2>
                        <p className="registre-subtitle">Introdueix les teves dades per començar.</p>
                    </div>

                    {/* Error general — mateixa classe que Login */}
                    {errors.general && (
                        <div className="error-box">{errors.general}</div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* USERNAME */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Nom d'usuari *</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">person</span>
                                <input
                                    className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Ex: joan_garcia"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={handleUsernameBlur}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>

                        {/* EMAIL */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Correu electrònic *</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">mail</span>
                                <input
                                    className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="correu@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        {/* PASSWORD */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Contrasenya *</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">lock</span>
                                <input
                                    className={`form-input has-right-icon ${errors.password ? 'border-red-500' : ''}`}
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={handlePasswordBlur}
                                    disabled={isLoading}
                                />
                                <button
                                    className="btn-icon-right"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>

                        {/* CONFIRMAR PASSWORD */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password2">Confirmar contrasenya *</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">lock_reset</span>
                                <input
                                    className={`form-input has-right-icon ${errors.password2 ? 'border-red-500' : ''}`}
                                    id="password2"
                                    name="password2"
                                    type={showPassword2 ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    onBlur={handlePassword2Blur}
                                    disabled={isLoading}
                                />
                                <button
                                    className="btn-icon-right"
                                    type="button"
                                    onClick={() => setShowPassword2(!showPassword2)}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword2 ? "visibility" : "visibility_off"}
                                    </span>
                                </button>
                            </div>
                            {errors.password2 && <span className="error-message">{errors.password2}</span>}
                        </div>

                        {/* FECHA NACIMIENTO (opcional) */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="dataNaixement">Data de naixement</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">calendar_today</span>
                                <input
                                    className="form-input"
                                    id="dataNaixement"
                                    name="dataNaixement"
                                    type="date"
                                    value={dataNaixement}
                                    onChange={(e) => setDataNaixement(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* BIOGRAFIA (opcional) */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="biografia">Biografia</label>
                            <textarea
                                className="form-textarea"
                                id="biografia"
                                name="biografia"
                                placeholder="Explica't una mica..."
                                value={biografia}
                                onChange={(e) => setBiografia(e.target.value)}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        {/* URL FOTO PERFIL (opcional) */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="urlFotoPerfil">URL foto de perfil</label>
                            <div className="input-container">
                                <span className="material-symbols-outlined input-icon-left">image</span>
                                <input
                                    className={`form-input ${errors.urlFotoPerfil ? 'border-red-500' : ''}`}
                                    id="urlFotoPerfil"
                                    name="urlFotoPerfil"
                                    type="url"
                                    placeholder="https://exemple.com/foto.jpg"
                                    value={urlFotoPerfil}
                                    onChange={(e) => setUrlFotoPerfil(e.target.value)}
                                    onBlur={handleUrlFotoPerfilBlur}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.urlFotoPerfil && <span className="error-message">{errors.urlFotoPerfil}</span>}
                        </div>

                        {/* CHECKBOX TERMES (decorativo) */}
                        <div className="registre-checkbox-group">
                            <input className="registre-checkbox" id="terms" type="checkbox" />
                            <label className="registre-checkbox-label" htmlFor="terms">
                                Accepto els <a className="register-link" href="#">termes i condicions</a> i la política de privacitat.
                            </label>
                        </div>

                        {/* BOTÓN ENVIAR */}
                        <button className="btn-submit" type="submit" disabled={isLoading}>
                            {isLoading ? 'Creant compte...' : 'Crear Compte'}
                        </button>

                    </form>

                    {/* Footer — mateixa classe que Login */}
                    <div className="login-footer">
                        <p>Ja tens un compte? <a className="register-link" href="/login">Inicia sessió</a></p>
                    </div>

                </div>
            </main>

            {/* Footer de pàgina — com al Stitch */}
            <footer className="registre-footer">
                <div className="registre-footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Safety Protocols</a>
                </div>
                <p>© 2024 SummitPath Logistics. Precision in Every Peak.</p>
            </footer>

        </div>
    );
};

export default Registre;
