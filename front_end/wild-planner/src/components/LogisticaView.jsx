import React, { useState, useMemo } from 'react';
import AddItemModal from './AddItemModal';
import '../styles/PlanificacioView.css';

const CATEGORY_LABELS = {
  material: 'Material',
  menjar: 'Nutrició'
};

const CATEGORY_COLORS = {
  material: '#173124',
  menjar: '#944925'
};

const getStatusForWeight = (pesTotal) => {
  if (pesTotal === 0) return { label: 'Pendent', tone: 'pending' };
  if (pesTotal > 2000) return { label: 'Revisar Pes', tone: 'warning' };
  return { label: 'Preparat', tone: 'ready' };
};

const genLocalId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Tab "Logística" del Planificador.
 * Conté els camps del pla (títol + dates), la motxilla amb el seu inventari de
 * materials i menjars, i el donut de distribució de pes.
 *
 * Treballa exclusivament sobre el draft local (planDraft) compartit amb la
 * resta de pestanyes (Finances, IA, …). Cap canvi es persisteix fins que es
 * desa la ruta des de la pestanya Mapa.
 */
function LogisticaView({ planDraft, setPlanDraft, onGoToRuta, hasRoute, onSaveAll }) {
  const [addItemKind, setAddItemKind] = useState(null);

  const motxilla = planDraft.motxilla;
  const planif = planDraft.planificacio;

  // === MUTATORS ===
  const addItemToDraft = (kind, item) => {
    const key = kind === 'menjar' ? 'menjars' : 'materials';
    const newItem = {
      local_id: genLocalId(key),
      ref_id: item.ref_id ?? null,
      _local: !item.ref_id,
      nom: item.nom,
      descripcio: item.descripcio || '',
      pes: Number(item.pes) || 0,
      preu: Number(item.preu) || 0,
      ...(kind === 'menjar' ? { calories: Number(item.calories) || 0 } : {}),
      imatge_url: item.imatge_url || '',
      quantitat: Number(item.quantitat) || 1
    };
    setPlanDraft((prev) => ({
      ...prev,
      motxilla: { ...prev.motxilla, [key]: [...prev.motxilla[key], newItem] }
    }));
  };

  const updateItemQuantity = (kind, localId, quantitat) => {
    const key = kind === 'menjar' ? 'menjars' : 'materials';
    setPlanDraft((prev) => ({
      ...prev,
      motxilla: {
        ...prev.motxilla,
        [key]: prev.motxilla[key].map((it) =>
          it.local_id === localId ? { ...it, quantitat: Math.max(1, quantitat) } : it
        )
      }
    }));
  };

  const removeItem = (kind, localId) => {
    if (!confirm('Eliminar aquest element?')) return;
    const key = kind === 'menjar' ? 'menjars' : 'materials';
    setPlanDraft((prev) => ({
      ...prev,
      motxilla: {
        ...prev.motxilla,
        [key]: prev.motxilla[key].filter((it) => it.local_id !== localId)
      }
    }));
  };

  const updatePlanFields = (patch) => {
    setPlanDraft((prev) => ({
      ...prev,
      planificacio: { ...prev.planificacio, ...patch }
    }));
  };

  const updateMotxillaFields = (patch) => {
    setPlanDraft((prev) => ({
      ...prev,
      motxilla: { ...prev.motxilla, ...patch }
    }));
  };

  // === DERIVED ===
  const rows = useMemo(() => {
    const matRows = motxilla.materials.map((m) => ({ ...m, kind: 'material' }));
    const menRows = motxilla.menjars.map((m) => ({ ...m, kind: 'menjar' }));
    return [...matRows, ...menRows];
  }, [motxilla.materials, motxilla.menjars]);

  const pesItemsGrams = rows.reduce(
    (sum, r) => sum + (Number(r.pes) || 0) * (Number(r.quantitat) || 0),
    0
  );
  const pesBaseGrams = Number(motxilla.pes_base) || 0;
  const pesTotalGrams = pesItemsGrams + pesBaseGrams;
  const pesTotalKg = (pesTotalGrams / 1000).toFixed(2);

  const distribution = useMemo(() => {
    const byKind = { material: 0, menjar: 0 };
    rows.forEach((r) => {
      byKind[r.kind] += (Number(r.pes) || 0) * (Number(r.quantitat) || 0);
    });
    const total = Object.values(byKind).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(byKind)
      .filter(([, w]) => w > 0)
      .map(([kind, w]) => ({
        kind,
        label: CATEGORY_LABELS[kind],
        pes: w,
        pct: (w / total) * 100,
        color: CATEGORY_COLORS[kind]
      }))
      .sort((a, b) => b.pes - a.pes);
  }, [rows]);

  const donutGradient = useMemo(() => {
    if (distribution.length === 0) return '#e1e3e4';
    let acc = 0;
    const stops = distribution.map((d) => {
      const start = acc;
      acc += d.pct;
      return `${d.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [distribution]);

  return (
    <div className="planif-view">
      {/* === HEADER === */}
      <header className="planif-header">
        <div className="planif-header-text">
          <h1>Logística</h1>
          <p>Material tècnic, menjar i pes de la motxilla. Tot l'esborrany es desa amb la ruta.</p>
        </div>
        <div className="planif-header-actions">
          <div className="planif-draft-badge">
            <span className="material-symbols-outlined">edit_note</span>
            Esborrany local
          </div>
          <button
            className="planif-btn-primary"
            onClick={onSaveAll}
            disabled={!hasRoute}
            title={!hasRoute ? 'Cal una ruta amb almenys 2 nodes per a desar' : 'Desa ruta + planificació'}
          >
            <span className="material-symbols-outlined">save</span>
            Desa el pla complet
          </button>
        </div>
      </header>

      {!hasRoute && (
        <div className="planif-warning">
          <span className="material-symbols-outlined">info</span>
          <div>
            <strong>Necessites una ruta per a desar.</strong>
            <p>Afegeix almenys 2 nodes al mapa per a poder confirmar el pla.</p>
          </div>
          <button className="planif-btn-secondary" onClick={onGoToRuta}>
            <span className="material-symbols-outlined">map</span>
            Anar al mapa
          </button>
        </div>
      )}

      {/* === DADES DEL PLA === */}
      <section className="planif-card">
        <div className="planif-card-head">
          <div className="planif-card-title">
            <span className="material-symbols-outlined">edit_calendar</span>
            <h3>Dades del Pla</h3>
          </div>
        </div>
        <div className="planif-fields">
          <div className="planif-field planif-field-wide">
            <label>Títol</label>
            <input
              type="text"
              value={planif.titol}
              onChange={(e) => updatePlanFields({ titol: e.target.value })}
              placeholder="Ex. Travessa Pirineus 2026 (si es deixa buit, es generarà automàticament)"
            />
          </div>
          <div className="planif-field">
            <label>Data inici</label>
            <input
              type="date"
              value={planif.data_inici || ''}
              onChange={(e) => updatePlanFields({ data_inici: e.target.value })}
            />
          </div>
          <div className="planif-field">
            <label>Data fi</label>
            <input
              type="date"
              value={planif.data_fi || ''}
              onChange={(e) => updatePlanFields({ data_fi: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* === INVENTARI MOTXILLA === */}
      <section className="planif-card">
        <div className="planif-card-head">
          <div className="planif-card-title">
            <span className="material-symbols-outlined">backpack</span>
            <h3>Inventari de Motxilla</h3>
            <span className="planif-weight-badge">
              <strong>{pesTotalKg} kg</strong>
            </span>
          </div>
          <div className="planif-card-actions">
            <button
              className="planif-action-btn planif-action-material"
              onClick={() => setAddItemKind('material')}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              Afegir material
            </button>
            <button
              className="planif-action-btn planif-action-menjar"
              onClick={() => setAddItemKind('menjar')}
            >
              <span className="material-symbols-outlined">restaurant</span>
              Afegir menjar
            </button>
          </div>
        </div>

        <div className="planif-fields planif-motxilla-meta">
          <div className="planif-field">
            <label>Nom motxilla</label>
            <input
              type="text"
              value={motxilla.nom}
              onChange={(e) => updateMotxillaFields({ nom: e.target.value })}
            />
          </div>
          <div className="planif-field">
            <label>Pes base motxilla buida (g)</label>
            <input
              type="number"
              min="0"
              value={motxilla.pes_base}
              onChange={(e) =>
                updateMotxillaFields({ pes_base: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="excel-table-container">
          <table className="excel-table">
            <thead>
              <tr>
                <th className="col-idx">#</th>
                <th>Element</th>
                <th className="col-cat">Tipus</th>
                <th className="col-num">Pes unitari (g)</th>
                <th className="col-num">Quantitat</th>
                <th className="col-num">Pes total (g)</th>
                <th className="col-status">Estat</th>
                <th className="col-act"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="excel-empty">
                    Cap element a la motxilla encara. Afegeix material o menjar amb els botons de dalt.
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => {
                const pesRow = (Number(row.pes) || 0) * (Number(row.quantitat) || 0);
                const status = getStatusForWeight(pesRow);
                return (
                  <tr key={row.local_id}>
                    <td className="col-idx">{idx + 1}</td>
                    <td className="cell-name">
                      {row.nom}
                      {row._local && <span className="local-pill">nou</span>}
                    </td>
                    <td className="col-cat">
                      <span className={`kind-pill kind-${row.kind}`}>
                        <span className="material-symbols-outlined">
                          {row.kind === 'menjar' ? 'restaurant' : 'inventory_2'}
                        </span>
                        {CATEGORY_LABELS[row.kind]}
                      </span>
                    </td>
                    <td className="col-num cell-num-static">{row.pes}</td>
                    <td className="col-num">
                      <div className="qty-stepper">
                        <button
                          onClick={() => updateItemQuantity(row.kind, row.local_id, row.quantitat - 1)}
                          disabled={row.quantitat <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={row.quantitat}
                          onChange={(e) =>
                            updateItemQuantity(row.kind, row.local_id, parseInt(e.target.value) || 1)
                          }
                        />
                        <button onClick={() => updateItemQuantity(row.kind, row.local_id, row.quantitat + 1)}>
                          +
                        </button>
                      </div>
                    </td>
                    <td className="col-num cell-num-static cell-num-total">{pesRow}</td>
                    <td className="col-status">
                      <span className={`status-pill status-${status.tone}`}>
                        <span className="status-dot"></span>
                        {status.label}
                      </span>
                    </td>
                    <td className="col-act">
                      <button
                        className="cell-action-btn"
                        onClick={() => removeItem(row.kind, row.local_id)}
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list — hidden on desktop via CSS */}
        <div className="mobile-items-list">
          {rows.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#727973', fontSize: '14px' }}>
              Cap element. Afegeix material o menjar amb els botons de dalt.
            </div>
          ) : rows.map((row) => {
            const pesRow = (Number(row.pes) || 0) * (Number(row.quantitat) || 0);
            return (
              <div key={row.local_id} className="mobile-item-card">
                <div className="mobile-item-row">
                  <span className={`kind-pill kind-${row.kind}`}>
                    <span className="material-symbols-outlined">
                      {row.kind === 'menjar' ? 'restaurant' : 'inventory_2'}
                    </span>
                    {CATEGORY_LABELS[row.kind]}
                  </span>
                  <span className="mobile-item-name">
                    {row.nom}
                    {row._local && <span className="local-pill">nou</span>}
                  </span>
                  <button
                    className="cell-action-btn"
                    onClick={() => removeItem(row.kind, row.local_id)}
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="mobile-item-meta">
                  <span className="mobile-item-weight">{row.pes}g × u</span>
                  <div className="qty-stepper">
                    <button
                      onClick={() => updateItemQuantity(row.kind, row.local_id, row.quantitat - 1)}
                      disabled={row.quantitat <= 1}
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      value={row.quantitat}
                      onChange={(e) => updateItemQuantity(row.kind, row.local_id, parseInt(e.target.value) || 1)}
                    />
                    <button onClick={() => updateItemQuantity(row.kind, row.local_id, row.quantitat + 1)}>+</button>
                  </div>
                  <span className="mobile-item-total">{pesRow}g</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === DISTRIBUCIÓ DE PES === */}
      <section className="planif-card planif-donut-card">
        <h3>Distribució del Pes</h3>
        <div className="donut-wrap">
          <div className="donut-circle" style={{ background: donutGradient }}></div>
          <div className="donut-hole">
            <span className="donut-amount">{pesTotalKg}</span>
            <span className="donut-label">kg</span>
          </div>
        </div>
        <div className="donut-legend">
          {distribution.length === 0 ? (
            <span className="donut-empty">Afegeix elements per veure la distribució</span>
          ) : (
            distribution.map((d) => (
              <div key={d.kind} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: d.color }}></span>
                <span className="legend-label">{d.label}</span>
                <span className="legend-pct">{d.pct.toFixed(0)}%</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* === MODALS === */}
      {addItemKind && (
        <AddItemModal
          kind={addItemKind}
          onClose={() => setAddItemKind(null)}
          onAdd={(item) => {
            addItemToDraft(addItemKind, item);
            setAddItemKind(null);
          }}
        />
      )}
    </div>
  );
}

export default LogisticaView;
