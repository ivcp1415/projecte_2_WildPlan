import React, { useState, useEffect } from 'react';
import '../styles/ClimaView.css';

function ClimaView({ nodes = [] }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_APP_API_URL;

  const firstNode = nodes[0] || null;

  useEffect(() => {
    if (!firstNode) return;

    const fetchClima = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${API_URL}/planner/clima/?lat=${firstNode.latitud}&lon=${firstNode.longitud}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error desconegut');
        setWeather(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClima();
  }, [firstNode?.latitud, firstNode?.longitud]);

  if (!firstNode) {
    return (
      <div className="clima-view">
        <header className="view-header">
          <h1>Condicions Meteorològiques</h1>
          <p>Consulta el clima i els riscos per a la teva expedició</p>
        </header>
        <div className="status-msg">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#b0cdbb' }}>location_off</span>
          <p>Afegeix nodes a la ruta per veure el clima de la zona d'inici.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="clima-view">
        <header className="view-header">
          <h1>Condicions Meteorològiques</h1>
          <p>Consulta el clima i els riscos per a la teva expedició</p>
        </header>
        <div className="status-msg">Carregant dades meteorològiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clima-view">
        <header className="view-header">
          <h1>Condicions Meteorològiques</h1>
          <p>Consulta el clima i els riscos per a la teva expedició</p>
        </header>
        <div className="error-msg">
          <span className="material-symbols-outlined">cloud_off</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="clima-view">
      <header className="view-header">
        <h1>Condicions Meteorològiques</h1>
        <p>
          Clima al punt d'inici de la ruta —{' '}
          <strong>{parseFloat(firstNode.latitud).toFixed(4)}°N, {parseFloat(firstNode.longitud).toFixed(4)}°E</strong>
        </p>
      </header>

      <div className="clima-grid">
        {/* Main Weather Card */}
        <div className="weather-card main-weather">
          <div className="weather-content">
            <h3 className="weather-label">Actualment</h3>
            <div className="temp-display">
              <span className="temperatura">{weather.temperatura}°</span>
              <span className="sensacio">Sensació {weather.sensacio}°</span>
            </div>
            <p className="condicio">
              <span className="material-symbols-outlined">ac_unit</span>
              {weather.condicio}
            </p>
          </div>
          <div className="weather-icon">
            <span className="material-symbols-outlined">{weather.icon}</span>
          </div>
        </div>

        {/* Wind Card */}
        <div className="metric-card">
          <h3 className="metric-header">
            <span className="material-symbols-outlined">air</span> Vent
          </h3>
          <div className="metric-content">
            <span className="metric-value">
              {weather.vent.velocitat} <span className="unit">km/h</span>
            </span>
            <div className="metric-subinfo">
              <span className="material-symbols-outlined direction">navigation</span>
              <span>{weather.vent.direccio} (Ràfegues {weather.vent.rafegues} km/h)</span>
            </div>
          </div>
        </div>

        {/* Precipitation Card */}
        <div className="metric-card">
          <h3 className="metric-header">
            <span className="material-symbols-outlined">water_drop</span> Precipitació
          </h3>
          <div className="metric-content">
            <span className="metric-value">{weather.precipitacio}%</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${weather.precipitacio}%` }}></div>
            </div>
            <span className="metric-subinfo">{weather.mm} mm / 1h</span>
          </div>
        </div>

        {/* UV Index Card */}
        <div className="metric-card">
          <h3 className="metric-header">
            <span className="material-symbols-outlined">light_mode</span> Índex UV
          </h3>
          <div className="metric-content">
            <span className="metric-value">
              {weather.uvIndex !== null ? weather.uvIndex : '—'}
            </span>
            <span className="uv-level">{weather.uvNivel}</span>
          </div>
        </div>

        {/* Sunrise / Sunset Card */}
        <div className="metric-card">
          <h3 className="metric-header">
            <span className="material-symbols-outlined">routine</span> Sol
          </h3>
          <div className="metric-content sunrise-sunset">
            <div className="sun-item">
              <span className="material-symbols-outlined">wb_twilight</span>
              <div>
                <span className="label">Sortida</span>
                <span className="value">{weather.sortida}</span>
              </div>
            </div>
            <div className="sun-item">
              <span className="material-symbols-outlined" style={{ transform: 'scaleY(-1)' }}>wb_twilight</span>
              <div>
                <span className="label">Posta</span>
                <span className="value">{weather.posta}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="forecast-card">
          <h3>Previsió {weather.forecast.length} Dies</h3>
          <div className="forecast-list">
            {weather.forecast.map((day, idx) => (
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
  );
}

export default ClimaView;
