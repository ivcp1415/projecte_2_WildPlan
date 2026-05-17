import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import RutaHero from '../components/RutaHero.jsx';
import RutaSpecs from '../components/RutaSpecs.jsx';
import RutaMapa from '../components/RutaMapa.jsx';
import PerfilElevacio from '../components/PerfilElevacio.jsx';
import Comentaris from '../components/Comentaris.jsx';
import Valoracions from '../components/Valoracions.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/DetallRuta.css';

const DetallRuta = () => {

    //useParams coge el id de la URL: /rutes/5 → pk = "5"
    const { pk } = useParams();
    //URL base del backend, definifa en .env
    const API_URL = import.meta.env.VITE_APP_API_URL;

    //estados para guardar los datos que llegan del backend
    const [ruta, setRuta] = useState(null); //guarda el objero ruta ppal
    const [comentaris, setComentaris] = useState([]);
    const [valoracions, setValoracions] = useState([]);

    //estados auxiliares
    const [isLoading, setIsLoading] = useState(true); //controla si se cargan los datos (true porque cuando se abre la página estan cargados)
    const [error, setError] = useState('');

    //useEffect es el hook que se usa para hacer llamadas a la API.
    //dentro va el código que se ejecuta después de renderizar (o cuando cambia pk).
    //La primera parte () => { ... } es la función que se quiere ejecutar. La segunda parte [pk] se vuelve a ejecutar cuando cambia
    // DetallRuta.jsx optimitzat
    useEffect(() => {
        const fetchDades = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_URL}/planner/rutes/${pk}/`);
                if (!res.ok) throw new Error("No s'ha pogut carregar la ruta.");

                const data = await res.json();
                // 1. CORRECCIÓ: Guardem tots els estats que envia el backend
                setRuta(data.ruta);
                setComentaris(data.comentaris || []);
                setValoracions(data.valoracions || []);

            } catch (err) {
                setError(err.message || "Error de connexió");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDades();
    }, [pk, API_URL]);
    //RENDERIZADO
    //mientras carga mostramos un mensaje
    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="detall-loading">
                    <span className="material-symbols-outlined detall-loading-icon">hiking</span>
                    <p>Carregant ruta...</p>
                </div>
            </>
        );
    }

    //si hay error lo mostramos
    if (error) {
        return (
            <>
                <Navbar />
                <div className="detall-error">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                </div>
            </>
        );
    }

    return (
        <div className="detall-page">

            {/* Navbar */}
            <Navbar />

            {/* Hero: los datos básicos de la ruta (img, nombre, modalidad, etc)*/}
            <RutaHero ruta={ruta} />

            {/* Contenido principal: columna izquierda + columna derecha */}
            <main className="detall-main">

                {/* COLUMNA IZQUIERDA */}
                <div className="detall-col-left">

                    {/* Specs: distancia, desnivell, modalitat */}
                    {/* Le pasamos la ruta entera, el coge lo que necesita */}
                    <RutaSpecs ruta={ruta} />

                    {/* 1. Mapa: enviem el camp JSON 'track_geojson' */}
                    <RutaMapa geoData={ruta.track_complet} />

                    {/* 2. Perfil: enviem el camp JSON 'perfil_elevacio' */}
                    <PerfilElevacio perfilData={ruta.perfil_elevacio} />
                </div>

                {/* COLUMNA DERECHA */}
                <div className="detall-col-right">

                    {/* Valoraciones: rating y likes/dislikes */}
                    <Valoracions valoracions={valoracions} />

                    {/* Comentarios de la comunidad */}
                    <Comentaris comentaris={comentaris} />

                </div>

            </main>

            {/* Footer */}
            <Footer />

        </div>
    );
};

export default DetallRuta;
