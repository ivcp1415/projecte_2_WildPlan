import React, { useState, useMemo } from 'react';
import AddDespesaModal from './AddDespesaModal';
import '../styles/PlanificacioView.css';

const genLocalId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Tab "Finances" del Planificador.
 * Mostra el pressupost dinàmic: una part automàtica derivada del preu × quantitat
 * dels items de la motxilla (read-only, vinculat a la Logística) i una part de
 * despeses manuals que l'usuari pot afegir/eliminar.
 *
 * El cost total reacciona en temps real als canvis del draft de motxilla.
 */
function FinancesView({ planDraft, setPlanDraft, onGoToRuta, hasRoute, onSaveAll, onGoToLogistica }) {
  const [addDespesaOpen, setAddDespesaOpen] = useState(false);

  const motxilla = planDraft.motxilla;
  const planif = planDraft.planificacio;

  // === MUTATORS ===
  const addDespesa = (despesa) => {
    setPlanDraft((prev) => ({
      ...prev,
      planificacio: {
        ...prev.planificacio,
        despeses: [
          ...prev.planificacio.despeses,
          { local_id: genLocalId('d'), ...despesa }
        ]
      }
    }));
  };

  const updateDespesa = (localId, patch) => {
    setPlanDraft((prev) => ({
      ...prev,
      planificacio: {
        ...prev.planificacio,
        despeses: prev.planificacio.despeses.map((d) =>
          d.local_id === localId ? { ...d, ...patch } : d
        )
      }
    }));
  };

  const removeDespesa = (localId) => {
    if (!confirm('Eliminar aquesta despesa?')) return;
    setPlanDraft((prev) => ({
      ...prev,
      planificacio: {
        ...prev.planificacio,
        despeses: prev.planificacio.despeses.filter((d) => d.local_id !== localId)
      }
    }));
  };

  // Permet editar el preu d'un item de la motxilla directament des de Finances
  // (per a satisfer la "edició bidireccional" del pressupost ↔ items)
  const updateItemPrice = (kind, localId, preu) => {
    const key = kind === 'menjar' ? 'menjars' : 'materials';
    setPlanDraft((prev) => ({
      ...prev,
      motxilla: {
        ...prev.motxilla,
        [key]: prev.motxilla[key].map((it) =>
          it.local_id === localId ? { ...it, preu: Math.max(0, Number(preu) || 0) } : it
        )
      }
    }));
  };

  // === DERIVED ===
  const rows = useMemo(() => {
    const matRows = motxilla.materials.map((m) => ({ ...m, kind: 'material' }));
    const menRows = motxilla.menjars.map((m) => ({ ...m, kind: 'menjar' }));
    return [...matRows, ...menRows];
  }, [motxilla.materials, motxilla.menjars]);

  const itemCostRows = useMemo(() => {
    return rows.map((r) => ({
      key: `item-${r.local_id}`,
      local_id: r.local_id,
      kind: r.kind,
      nom: r.nom,
      quantitat: r.quantitat,
      preuUnitari: Number(r.preu) || 0,
      import_despesa: (Number(r.preu) || 0) * (Number(r.quantitat) || 0)
    }));
  }, [rows]);

  const totalItems = itemCostRows.reduce((s, r) => s + r.import_despesa, 0);
  const totalDespesesManuals = planif.despeses.reduce(
    (s, d) => s + (Number(d.import_despesa) || 0),
    0
  );
  const totalEstimat = totalItems + totalDespesesManuals;

  const itemsWithoutPrice = itemCostRows.filter((r) => r.preuUnitari === 0).length;

  return (
    <div className="planif-view">
      {/* === HEADER === */}
      <header className="planif-header">
        <div className="planif-header-text">
          <h1>Finances</h1>
          <p>Pressupost dinàmic. Els preus dels items s'editen directament aquí o a Logística.</p>
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

      {/* === RESUM TOTAL === */}
      <section className="planif-card finances-summary">
        <div className="finances-totals">
          <div className="finances-total-item finances-total-main">
            <span className="finances-total-label">Total estimat</span>
            <span className="finances-total-value">{totalEstimat.toFixed(2)} €</span>
          </div>
          <div className="finances-total-item">
            <span className="finances-total-label">Items motxilla</span>
            <span className="finances-total-value">{totalItems.toFixed(2)} €</span>
          </div>
          <div className="finances-total-item">
            <span className="finances-total-label">Despeses manuals</span>
            <span className="finances-total-value">{totalDespesesManuals.toFixed(2)} €</span>
          </div>
        </div>
        {itemsWithoutPrice > 0 && (
          <div className="finances-hint">
            <span className="material-symbols-outlined">priority_high</span>
            <span>
              {itemsWithoutPrice} {itemsWithoutPrice === 1 ? 'item té' : 'items tenen'} preu 0 €. Edita'ls a la taula de baix o a Logística.
            </span>
          </div>
        )}
      </section>

      {/* === COSTOS DERIVATS DELS ITEMS === */}
      <section className="planif-card">
        <div className="planif-card-head">
          <div className="planif-card-title">
            <span className="material-symbols-outlined">inventory_2</span>
            <h3>Costos d'inventari</h3>
            <span className="planif-weight-badge">
              <strong>{totalItems.toFixed(2)} €</strong>
            </span>
          </div>
          {rows.length === 0 && (
            <div className="planif-card-actions">
              <button className="planif-btn-secondary" onClick={onGoToLogistica}>
                <span className="material-symbols-outlined">backpack</span>
                Afegir items
              </button>
            </div>
          )}
        </div>

        <div className="excel-table-container">
          <table className="excel-table">
            <thead>
              <tr>
                <th>Element</th>
                <th className="col-cat">Tipus</th>
                <th className="col-num">Preu unitari (€)</th>
                <th className="col-num">Quantitat</th>
                <th className="col-num">Cost total (€)</th>
              </tr>
            </thead>
            <tbody>
              {itemCostRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="excel-empty">
                    Cap item a la motxilla. Afegeix material o menjar des de la pestanya Logística.
                  </td>
                </tr>
              )}
              {itemCostRows.map((r) => (
                <tr key={r.key}>
                  <td className="cell-name">{r.nom}</td>
                  <td className="col-cat">
                    <span className={`kind-pill kind-${r.kind}`}>
                      <span className="material-symbols-outlined">
                        {r.kind === 'menjar' ? 'restaurant' : 'inventory_2'}
                      </span>
                      {r.kind === 'menjar' ? 'Nutrició' : 'Material'}
                    </span>
                  </td>
                  <td className="col-num">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="finances-price-input"
                      value={r.preuUnitari}
                      onChange={(e) => updateItemPrice(r.kind, r.local_id, e.target.value)}
                    />
                  </td>
                  <td className="col-num cell-num-static">× {r.quantitat}</td>
                  <td className="col-num cell-num-static cell-num-total">
                    {r.import_despesa.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {itemCostRows.length > 0 && (
              <tfoot>
                <tr className="subtotal-row">
                  <td colSpan="4">Subtotal items motxilla</td>
                  <td className="col-num">{totalItems.toFixed(2)} €</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* === DESPESES MANUALS === */}
      <section className="planif-card">
        <div className="planif-card-head">
          <div className="planif-card-title">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <h3>Despeses Manuals</h3>
            <span className="planif-weight-badge">
              <strong>{totalDespesesManuals.toFixed(2)} €</strong>
            </span>
          </div>
          <div className="planif-card-actions">
            <button
              className="planif-action-btn planif-action-despesa"
              onClick={() => setAddDespesaOpen(true)}
            >
              <span className="material-symbols-outlined">add</span>
              Afegir despesa
            </button>
          </div>
        </div>

        <div className="excel-table-container">
          <table className="excel-table">
            <thead>
              <tr>
                <th>Concepte</th>
                <th className="col-num">Import (€)</th>
                <th className="col-cat">Divisa</th>
                <th className="col-act"></th>
              </tr>
            </thead>
            <tbody>
              {planif.despeses.length === 0 && (
                <tr>
                  <td colSpan="4" className="excel-empty">
                    Encara no hi ha despeses manuals (permisos, lloguers, transport, etc.).
                  </td>
                </tr>
              )}
              {planif.despeses.map((d) => (
                <tr key={d.local_id}>
                  <td className="cell-name">{d.concepte}</td>
                  <td className="col-num">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="finances-price-input"
                      value={d.import_despesa}
                      onChange={(e) =>
                        updateDespesa(d.local_id, { import_despesa: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="col-cat">
                    <span className="kind-pill kind-despesa">{d.divisa}</span>
                  </td>
                  <td className="col-act">
                    <button
                      className="cell-action-btn"
                      onClick={() => removeDespesa(d.local_id)}
                      title="Eliminar despesa"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>Total general</td>
                <td className="col-num">{totalEstimat.toFixed(2)} €</td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {addDespesaOpen && (
        <AddDespesaModal
          onClose={() => setAddDespesaOpen(false)}
          onAdd={(despesa) => {
            addDespesa(despesa);
            setAddDespesaOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default FinancesView;
