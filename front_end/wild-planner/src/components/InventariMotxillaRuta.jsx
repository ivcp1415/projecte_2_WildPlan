import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/InventariMotxillaRuta.css';

/**
 * Mostra les planificacions que l'usuari autenticat té associades a una ruta.
 * Per a cada planificació, llista materials, menjars i despeses.
 *
 * Props:
 *   - rutaId: id de la ruta
 */
function InventariMotxillaRuta({ rutaId }) {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const token = localStorage.getItem('token');

  const [planificacions, setPlanificacions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/planner/rutes/${rutaId}/planificacions/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setPlanificacions(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch((err) => {
        if (err === 401 || err === 403) setError('auth');
        else setError('load');
      })
      .finally(() => setLoading(false));
  }, [API_URL, rutaId, token]);

  // === ESTATS ESPECIALS ===
  if (!token) {
    return (
      <section className="inv-ruta-card">
        <header className="inv-ruta-head">
          <span className="material-symbols-outlined">backpack</span>
          <h3>La meva logística per a aquesta ruta</h3>
        </header>
        <div className="inv-ruta-empty">
          <p>Inicia sessió per a veure i gestionar la teva motxilla i pressupost.</p>
          <button className="inv-ruta-cta" onClick={() => navigate('/login')}>
            <span className="material-symbols-outlined">login</span>
            Iniciar sessió
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="inv-ruta-card">
        <div className="inv-ruta-empty">Carregant logística…</div>
      </section>
    );
  }

  if (error === 'load') {
    return (
      <section className="inv-ruta-card">
        <div className="inv-ruta-empty">No s'ha pogut carregar la logística.</div>
      </section>
    );
  }

  if (planificacions.length === 0) {
    return (
      <section className="inv-ruta-card">
        <header className="inv-ruta-head">
          <span className="material-symbols-outlined">backpack</span>
          <h3>La meva logística per a aquesta ruta</h3>
        </header>
        <div className="inv-ruta-empty">
          <p>Encara no tens cap planificació per a aquesta ruta.</p>
          <button className="inv-ruta-cta" onClick={() => navigate('/planificar')}>
            <span className="material-symbols-outlined">add</span>
            Crear-ne una
          </button>
        </div>
      </section>
    );
  }

  const selected = planificacions.find((p) => p.id === selectedId) || planificacions[0];
  const motxilla = selected?.motxilla || null;
  const materials = motxilla?.materials_detall || [];
  const menjars = motxilla?.menjars_detall || [];
  const despeses = selected?.despeses || [];
  const pesGrams = motxilla?.pes_total_grams || 0;
  const pesKg = (pesGrams / 1000).toFixed(2);
  const caloriesTotal = motxilla?.calories_totals || 0;
  const pressupostBack = parseFloat(selected?.pressupost_total || 0);

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('ca-ES', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  return (
    <section className="inv-ruta-card">
      <header className="inv-ruta-head">
        <div className="inv-ruta-head-title">
          <span className="material-symbols-outlined">backpack</span>
          <h3>La meva logística per a aquesta ruta</h3>
        </div>

        {planificacions.length > 1 && (
          <select
            className="inv-ruta-select"
            value={selectedId || ''}
            onChange={(e) => setSelectedId(parseInt(e.target.value))}
          >
            {planificacions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titol}
              </option>
            ))}
          </select>
        )}
      </header>

      {/* === META DE LA PLANIFICACIÓ === */}
      <div className="inv-ruta-meta">
        <div className="inv-meta-item">
          <span className="inv-meta-label">Títol</span>
          <span className="inv-meta-value">{selected.titol}</span>
        </div>
        <div className="inv-meta-item">
          <span className="inv-meta-label">Data inici</span>
          <span className="inv-meta-value">{formatDate(selected.data_inici)}</span>
        </div>
        <div className="inv-meta-item">
          <span className="inv-meta-label">Data fi</span>
          <span className="inv-meta-value">{formatDate(selected.data_fi)}</span>
        </div>
      </div>

      {/* === RESUM ESTADÍSTIC === */}
      <div className="inv-ruta-stats">
        <div className="inv-stat">
          <span className="material-symbols-outlined">scale</span>
          <div>
            <strong>{pesKg} kg</strong>
            <small>Pes total motxilla</small>
          </div>
        </div>
        <div className="inv-stat">
          <span className="material-symbols-outlined">local_fire_department</span>
          <div>
            <strong>{caloriesTotal} kcal</strong>
            <small>Calories totals</small>
          </div>
        </div>
        <div className="inv-stat">
          <span className="material-symbols-outlined">payments</span>
          <div>
            <strong>{pressupostBack.toFixed(2)} €</strong>
            <small>Despeses registrades</small>
          </div>
        </div>
      </div>

      {/* === MOTXILLA: MATERIALS === */}
      {motxilla ? (
        <>
          <h4 className="inv-ruta-section-title">
            <span className="material-symbols-outlined">inventory_2</span>
            Material ({materials.length})
          </h4>
          {materials.length === 0 ? (
            <div className="inv-ruta-emptyrow">Sense material registrat.</div>
          ) : (
            <table className="inv-ruta-table">
              <thead>
                <tr>
                  <th>Element</th>
                  <th className="num">Pes unitari</th>
                  <th className="num">Quantitat</th>
                  <th className="num">Pes total</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={`mat-${m.material_id}`}>
                    <td>{m.nom}</td>
                    <td className="num">{m.pes || 0} g</td>
                    <td className="num">×{m.quantitat}</td>
                    <td className="num">{m.pes_total || 0} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* === MOTXILLA: MENJARS === */}
          <h4 className="inv-ruta-section-title">
            <span className="material-symbols-outlined">restaurant</span>
            Nutrició ({menjars.length})
          </h4>
          {menjars.length === 0 ? (
            <div className="inv-ruta-emptyrow">Sense menjar registrat.</div>
          ) : (
            <table className="inv-ruta-table">
              <thead>
                <tr>
                  <th>Element</th>
                  <th className="num">Pes</th>
                  <th className="num">Quantitat</th>
                  <th className="num">Calories totals</th>
                </tr>
              </thead>
              <tbody>
                {menjars.map((m) => (
                  <tr key={`men-${m.menjar_id}`}>
                    <td>{m.nom}</td>
                    <td className="num">{m.pes || 0} g</td>
                    <td className="num">×{m.quantitat}</td>
                    <td className="num">{m.calories_total || 0} kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div className="inv-ruta-emptyrow">
          Aquesta planificació no té cap motxilla associada.
        </div>
      )}

      {/* === DESPESES === */}
      <h4 className="inv-ruta-section-title">
        <span className="material-symbols-outlined">account_balance_wallet</span>
        Pressupost ({despeses.length})
      </h4>
      {despeses.length === 0 ? (
        <div className="inv-ruta-emptyrow">Sense despeses registrades.</div>
      ) : (
        <table className="inv-ruta-table">
          <thead>
            <tr>
              <th>Concepte</th>
              <th className="num">Import</th>
              <th className="num">Divisa</th>
            </tr>
          </thead>
          <tbody>
            {despeses.map((d) => (
              <tr key={`d-${d.id}`}>
                <td>{d.concepte}</td>
                <td className="num">{parseFloat(d.import_despesa || 0).toFixed(2)}</td>
                <td className="num">{d.divisa}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="inv-total-row">
              <td>Total</td>
              <td className="num">{pressupostBack.toFixed(2)} €</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}

export default InventariMotxillaRuta;
