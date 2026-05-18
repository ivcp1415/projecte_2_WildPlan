import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Planificacio.css';

function Planificacio() {
  const navigate = useNavigate();
  const [planificacions, setPlanificacions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchPlanificacions = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}/planner/usuaris/${userId}/planificacions/`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setPlanificacions(data);
        } else {
          setError('Error carregant planificacions');
        }
      } catch (err) {
        setError('Error de connexió');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanificacions();
  }, [token, userId, navigate]);

  return (
    <>
      <Navbar />
      <div className="planificacio-container">
        <header className="planificacio-header">
          <h1>Planificació d'Expedició</h1>
          <p>Gestiona el teu material, menjar i pressupost per a les teves rutes</p>
        </header>

        {loading && <div className="status-msg">Carregant planificacions...</div>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && planificacions.length === 0 && (
          <div className="empty-state">
            <p>No tens planificacions ainda. Comença per crear una nova!</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/crear-planificacio')}
            >
              Crear Planificació
            </button>
          </div>
        )}

        {!loading && planificacions.length > 0 && (
          <div className="planificacio-grid">
            {planificacions.map((plan) => (
              <div key={plan.id} className="planificacio-card">
                <div className="plan-header">
                  <h3>{plan.titol}</h3>
                  <span className="plan-dates">
                    {new Date(plan.data_inici).toLocaleDateString('ca-ES')} - {new Date(plan.data_fi).toLocaleDateString('ca-ES')}
                  </span>
                </div>
                <div className="plan-details">
                  <div className="detail-item">
                    <span className="label">Ruta</span>
                    <span className="value">{plan.ruta?.nom || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Motxilla</span>
                    <span className="value">{plan.motxilla?.nom || 'Sense assignar'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Pressupost</span>
                    <span className="value pressupost-total">{plan.pressupost_total || 0}€</span>
                  </div>
                </div>
                <div className="plan-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/planificacio/${plan.id}`)}
                  >
                    Veure Detalls
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Planificacio;
