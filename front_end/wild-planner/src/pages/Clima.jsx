import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Clima.css';

function Clima() {
  const navigate = useNavigate();
  const [ruta, setRuta] = useState(null);
  const [riscos, setRiscos] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // In a real scenario, you'd get rutaId from URL params or context
    // For now, we'll show a general weather view
    setLoading(false);
  }, [token]);

  const currentWeather = {
    temperatura: -4,
    sensacio: -8,
    condicio: 'Neu lleugera i boira',
    icon: 'weather_snowy',
    vent: {
      velocitat: 35,
      direccio: 'NO',
      rafegues: 55
    },
    precipitacio: 80,
    mm: 15,
    uvIndex: 2,
    uvNivel: 'Baix',
    sortida: '07:45',
    posta: '18:15'
  };

  const forecast = [
    { dia: 'Avui', icon: 'weather_snowy', max: -4, min: -10 },
    { dia: 'Dm', icon: 'partly_cloudy_day', max: -2, min: -8 },
    { dia: 'Dc', icon: 'clear_day', max: 0, min: -5 },
    { dia: 'Dj', icon: 'cloud', max: -1, min: -4 },
    { dia: 'Dv', icon: 'weather_mix', max: -3, min: -6 },
    { dia: 'Ds', icon: 'cloud', max: -2, min: -7 },
    { dia: 'Dg', icon: 'partly_cloudy_day', max: 1, min: -4 }
  ];

  return (
    <>
      <Navbar />
      <div className="clima-container">
        <header className="clima-header">
          <h1>Condicions Meteorològiques</h1>
          <p>Consulta el clima i els riscos per a la teva expedició</p>
        </header>

        <div className="clima-grid">
          {/* Main Weather Card */}
          <div className="weather-card main-weather">
            <div className="weather-content">
              <h3 className="weather-label">Actualment</h3>
              <div className="temp-display">
                <span className="temperatura">{currentWeather.temperatura}°</span>
                <span className="sensacio">Sensació {currentWeather.sensacio}°</span>
              </div>
              <p className="condicio">
                <span className="material-symbols-outlined">ac_unit</span>
                {currentWeather.condicio}
              </p>
            </div>
            <div className="weather-icon">
              <span className="material-symbols-outlined">{currentWeather.icon}</span>
            </div>
          </div>

          {/* Alert Card */}
          <div className="alert-card">
            <div className="alert-header">
              <span className="material-symbols-outlined alert-icon">warning</span>
              <span className="alert-title">Avís Risc Allaus</span>
            </div>
            <div className="alert-body">
              <h4>Nivell 3 (Cidable)</h4>
              <p>S'esperen acumulacions recents inestables per sobre dels 2.000m en vessants nord.</p>
            </div>
          </div>

          {/* Wind Card */}
          <div className="metric-card">
            <h3 className="metric-header">
              <span className="material-symbols-outlined">air</span> Vent
            </h3>
            <div className="metric-content">
              <span className="metric-value">{currentWeather.vent.velocitat} <span className="unit">km/h</span></span>
              <div className="metric-subinfo">
                <span className="material-symbols-outlined direction">navigation</span>
                <span>{currentWeather.vent.direccio} (Ràfegues {currentWeather.vent.rafegues} km/h)</span>
              </div>
            </div>
          </div>

          {/* Precipitation Card */}
          <div className="metric-card">
            <h3 className="metric-header">
              <span className="material-symbols-outlined">water_drop</span> Precipitació
            </h3>
            <div className="metric-content">
              <span className="metric-value">{currentWeather.precipitacio}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${currentWeather.precipitacio}%` }}></div>
              </div>
              <span className="metric-subinfo">{currentWeather.mm}mm / 24h</span>
            </div>
          </div>

          {/* UV Index Card */}
          <div className="metric-card">
            <h3 className="metric-header">
              <span className="material-symbols-outlined">light_mode</span> Índex UV
            </h3>
            <div className="metric-content">
              <span className="metric-value">{currentWeather.uvIndex}</span>
              <span className="uv-level">{currentWeather.uvNivel}</span>
            </div>
          </div>

          {/* Sunrise/Sunset Card */}
          <div className="metric-card">
            <h3 className="metric-header">
              <span className="material-symbols-outlined">routine</span> Sol
            </h3>
            <div className="metric-content sunrise-sunset">
              <div className="sun-item">
                <span className="material-symbols-outlined">wb_twilight</span>
                <div>
                  <span className="label">Sortida</span>
                  <span className="value">{currentWeather.sortida}</span>
                </div>
              </div>
              <div className="sun-item">
                <span className="material-symbols-outlined" style={{ transform: 'scaleY(-1)' }}>wb_twilight</span>
                <div>
                  <span className="label">Posta</span>
                  <span className="value">{currentWeather.posta}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7 Day Forecast */}
          <div className="forecast-card">
            <h3>Previsió 7 Dies</h3>
            <div className="forecast-list">
              {forecast.map((day, idx) => (
                <div key={idx} className="forecast-item">
                  <span className="forecast-day">{day.dia}</span>
                  <span className="material-symbols-outlined forecast-icon">{day.icon}</span>
                  <div className="forecast-temps">
                    <span className="forecast-max">{day.max}°</span>
                    <div className="forecast-bar"></div>
                    <span className="forecast-min">{day.min}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Clima;
