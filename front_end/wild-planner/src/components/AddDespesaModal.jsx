import React, { useState } from 'react';
import '../styles/AddItemModal.css';

/**
 * Modal per a registrar una nova despesa al DRAFT local.
 * No fa cap POST a backend; la despesa es desa quan es confirma el pla complet.
 *
 * Props:
 *  - onClose(): tanca el modal
 *  - onAdd(despesa): rep { concepte, import_despesa, divisa }
 */
function AddDespesaModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    concepte: '',
    import_despesa: '',
    divisa: 'EUR'
  });
  const [error, setError] = useState(null);

  const handleAdd = () => {
    if (!form.concepte.trim()) {
      setError('El concepte és obligatori');
      return;
    }
    onAdd({
      concepte: form.concepte.trim(),
      import_despesa: Number(form.import_despesa) || 0,
      divisa: form.divisa
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-narrow" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>Afegir Despesa</h2>
            <p>Registra una nova partida del pressupost a l'esborrany.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="modal-body">
          <div className="create-form">
            <div className="form-row">
              <label>Concepte *</label>
              <input
                type="text"
                value={form.concepte}
                onChange={(e) => setForm({ ...form, concepte: e.target.value })}
                placeholder="Ex. Permís d'accés, Lloguer cordes…"
              />
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label>Import</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.import_despesa}
                  onChange={(e) =>
                    setForm({ ...form, import_despesa: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <label>Divisa</label>
                <select
                  value={form.divisa}
                  onChange={(e) => setForm({ ...form, divisa: e.target.value })}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button className="modal-btn-secondary" onClick={onClose}>
              Cancel·la
            </button>
            <button className="modal-btn-primary" onClick={handleAdd}>
              <span className="material-symbols-outlined">add</span>
              Afegir despesa
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AddDespesaModal;
