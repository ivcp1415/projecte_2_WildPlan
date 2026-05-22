import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/perfil.css";
import "../styles/editar-perfil.css";

function EditarPerfil() {

    const API_URL = import.meta.env.VITE_APP_API_URL;
    // Cogemos el id del usuario del localStorage
    const usuariId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    //ESTADOS DE LOS CAMPOS DEL FORMULARIO
    //empiezan vacíos y se rellenan con los datos actuales del usuario
    //cuando llegan del backend (igual que en el Registre)
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [dataNaixement, setDataNaixement] = useState('');
    const [biografia, setBiografia] = useState('');
    const [urlFotoPerfil, setUrlFotoPerfil] = useState('');

    //ESTADOS DE ERRORES
    const [errors, setErrors] = useState({
        username:      '',
        email:         '',
        urlFotoPerfil: '',
        general:       ''
    });

    //ESTADOS AUXILIARES
    const [isLoading, setIsLoading] = useState(true); // true porque al entrar hacemos fetch
    const [isSaving, setIsSaving] = useState(false); // true mientras guarda los cambios
    const [success, setSuccess] = useState(''); // mensaje de éxito al guardar

    const navigate = useNavigate();

    //FETCH INICIAL
    //Cuando la página se monta, cargamos los datos actuales del usuario
    //para rellenar el formulario con sus datos reales, no dejarlo vacío
    useEffect(() => {
        if (!usuariId || !token) {
            // Si no hay id en el localStorage el usuario no está logueado
            navigate('/login');
            return;
        }

        fetch(`${API_URL}/planner/usuaris/${usuariId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then((res) => {
                if (!res.ok) throw new Error('Usuari no trobat');
                return res.json();
            })
            .then((data) => {
                //rellenamos cada estado con el valor actual del usuario
                //si el campo es null usamos '' para que el input no se rompa
                setUsername(data.username || '');
                setEmail(data.email || '');
                setDataNaixement(data.data_naixement || '');
                setBiografia(data.biografia || '');
                setUrlFotoPerfil(data.url_foto_perfil || '');
                setIsLoading(false);
            })
            .catch((err) => {
                setErrors(prev => ({ ...prev, general: err.message }));
                setIsLoading(false);
            });
    }, [usuariId, token, navigate, API_URL]);

    //FUNCIONES DE VALIDACIÓN
    //igual que en el Registre, cada campo se valida con onBlur

    const validateUsername = (val) => {
        const pattern = /^[a-zA-Z0-9_.]{3,150}$/;
        if (pattern.test(val)) {
            setErrors(prev => ({ ...prev, username: '' }));
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

    const validateUrlFotoPerfil = (val) => {
        // Campo opcional — si está vacío es válido
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

    // onBlur: se llama cuando el usuario sale del campo
    const handleUsernameBlur = () => validateUsername(username);
    const handleEmailBlur = () => validateEmail(email);
    const handleUrlFotoPerfilBlur = () => validateUrlFotoPerfil(urlFotoPerfil);

    //ENVIIO AL BACKEND
    //Cuando el usuario hace clic en "Guardar canvis" usamos PUT porque el views del backend espera PUT (no POST)
    const handleSubmit = async (e) => {
        e.preventDefault(); // evita que se recargue la página
        setErrors(prev => ({ ...prev, general: '' }));
        setSuccess('');

        //validamos todos los campos antes de enviar
        const isUsernameValid = validateUsername(username);
        const isEmailValid = validateEmail(email);
        const isUrlFotoPerfilValid = validateUrlFotoPerfil(urlFotoPerfil);

        if (!isUsernameValid || !isEmailValid || !isUrlFotoPerfilValid) {
            setErrors(prev => ({ ...prev, general: 'Revisa els camps abans de continuar.' }));
            return;
        }
        setIsSaving(true);

        try {
            // PUT a /planner/usuaris/<id>/editar/ con los datos nuevos
            //la url incluye el id del usuario para que Django sepa cuál actualizar
            const response = await fetch(`${API_URL}/planner/usuaris/${usuariId}/editar/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    email,
                    //los opcionales se envían aunque estén vacíos
                    //porque el backend necesita todos los campos en un PUT
                    data_naixement:  dataNaixement  || null,
                    biografia:       biografia       || '',
                    url_foto_perfil: urlFotoPerfil  || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                //el backend devuelve errores por campo { username: ['ja existeix'] }
                const errorMsg =
                    data.username?.[0]        ||
                    data.email?.[0]           ||
                    data.url_foto_perfil?.[0] ||
                    'Error al guardar els canvis.';
                throw new Error(errorMsg);
            }

            //si todo ha ido bien mostramos mensaje de éxito y redirigimos al perfil después de 1.5 segundos
            setSuccess('Perfil actualitzat correctament!');
            setTimeout(() => navigate('/perfil'), 1500);

        } catch (err) {
            setErrors(prev => ({ ...prev, general: err.message }));
        } finally {
            setIsSaving(false);
        }
    };

    //RENDERIZADO

    //mientras carga los datos del usuario
    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <main className="perfil-main">
                    <p className="status-msg">Carregant perfil...</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main className="perfil-main">

                {/* Cabecera de la página */}
                <div className="editar-header">
                    {/* Botón para volver al perfil sin guardar */}
                    <button
                        className="editar-btn-back"
                        onClick={() => navigate('/perfil')}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Tornar al perfil
                    </button>
                    <h1 className="editar-title">Editar perfil</h1>
                </div>

                {/* Mensaje de error general */}
                {errors.general && (
                    <div className="editar-error-box">{errors.general}</div>
                )}

                {/* Mensaje de éxito */}
                {success && (
                    <div className="editar-success-box">{success}</div>
                )}

                {/* FORMULARIO: misma estructura visual que el perfil */}
                <div className="info-card">
                    <h2>Informació del compte</h2>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="editar-grid">

                            {/* USERNAME */}
                            <div className="editar-field">
                                <label className="editar-label" htmlFor="username">
                                    Nom d'usuari *
                                </label>
                                <input
                                    className={`editar-input ${errors.username ? 'editar-input--error' : ''}`}
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={handleUsernameBlur}
                                    disabled={isSaving}
                                />
                                {errors.username && (
                                    <span className="editar-error-msg">{errors.username}</span>
                                )}
                            </div>

                            {/* EMAIL */}
                            <div className="editar-field">
                                <label className="editar-label" htmlFor="email">
                                    Correu electrònic *
                                </label>
                                <input
                                    className={`editar-input ${errors.email ? 'editar-input--error' : ''}`}
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={handleEmailBlur}
                                    disabled={isSaving}
                                />
                                {errors.email && (
                                    <span className="editar-error-msg">{errors.email}</span>
                                )}
                            </div>

                            {/* DATA NAIXEMENT */}
                            <div className="editar-field">
                                <label className="editar-label" htmlFor="dataNaixement">
                                    Data de naixement
                                </label>
                                <input
                                    className="editar-input"
                                    id="dataNaixement"
                                    type="date"
                                    value={dataNaixement}
                                    onChange={(e) => setDataNaixement(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>

                            {/* URL FOTO PERFIL */}
                            <div className="editar-field">
                                <label className="editar-label" htmlFor="urlFotoPerfil">
                                    URL foto de perfil
                                </label>
                                <input
                                    className={`editar-input ${errors.urlFotoPerfil ? 'editar-input--error' : ''}`}
                                    id="urlFotoPerfil"
                                    type="url"
                                    placeholder="https://exemple.com/foto.jpg"
                                    value={urlFotoPerfil}
                                    onChange={(e) => setUrlFotoPerfil(e.target.value)}
                                    onBlur={handleUrlFotoPerfilBlur}
                                    disabled={isSaving}
                                />
                                {errors.urlFotoPerfil && (
                                    <span className="editar-error-msg">{errors.urlFotoPerfil}</span>
                                )}
                            </div>

                        </div>

                        {/* BIOGRAFIA */}
                        <div className="editar-field editar-field--full">
                            <label className="editar-label" htmlFor="biografia">
                                Biografia
                            </label>
                            <textarea
                                className="editar-textarea"
                                id="biografia"
                                placeholder="Explica't una mica..."
                                value={biografia}
                                onChange={(e) => setBiografia(e.target.value)}
                                disabled={isSaving}
                                rows={4}
                            />
                        </div>

                        {/* BOTONES */}
                        <div className="editar-actions">
                            {/* Cancelar: vuelve al perfil sin guardar */}
                            <button
                                className="editar-btn-cancel"
                                type="button"
                                onClick={() => navigate('/perfil')}
                                disabled={isSaving}
                            >
                                Cancel·lar
                            </button>

                            {/* Guardar: envia el PUT al backend */}
                            <button
                                className="editar-btn-save"
                                type="submit"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Guardant...' : 'Guardar canvis'}
                            </button>
                        </div>

                    </form>
                </div>

            </main>

            <Footer />
        </div>
    );
}

export default EditarPerfil;
