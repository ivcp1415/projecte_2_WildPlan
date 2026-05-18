import React, { useState, useEffect, useMemo } from 'react';
import '../styles/AddItemModal.css';

/**
 * Modal per a triar (catàleg) o crear (nou) un Material o Menjar i
 * afegir-lo a la motxilla del DRAFT local. No fa cap POST a backend.
 *
 * Props:
 *  - kind: 'material' | 'menjar'
 *  - onClose(): tanca el modal
 *  - onAdd(item): rep l'objecte definit per a l'esborrany. Si l'item ve del
 *      catàleg, item.ref_id és el seu id; si és nou, ref_id és null.
 */
function AddItemModal({ kind, onClose, onAdd }) {
  const [mode, setMode] = useState('catalog'); // 'catalog' | 'create'
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantitat, setQuantitat] = useState(1);
  const [error, setError] = useState(null);

  const [newItem, setNewItem] = useState({
    nom: '',
    descripcio: '',
    pes: 0,
    preu: 0,
    calories: 0,
    imatge_url: ''
  });

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const isMenjar = kind === 'menjar';
  const label = isMenjar ? 'Menjar' : 'Material';
  const labelLower = isMenjar ? 'menjar' : 'material';

  useEffect(() => {
    const endpoint = isMenjar
      ? `${API_URL}/planner/menjars/`
      : `${API_URL}/planner/materials/`;
    fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCatalog(data))
      .catch((err) => console.error('Error loading catalog:', err))
      .finally(() => setLoading(false));
  }, [API_URL, token, isMenjar]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => c.nom?.toLowerCase().includes(q));
  }, [catalog, search]);

  const handleAddFromCatalog = () => {
    if (!selected) {
      setError('Selecciona un element del catàleg');
      return;
    }
    onAdd({
      ref_id: selected.id,
      nom: selected.nom,
      descripcio: selected.descripcio || '',
      pes: Number(selected.pes) || 0,
      preu: Number(selected.preu) || 0,
      calories: isMenjar ? Number(selected.calories) || 0 : 0,
      imatge_url: selected.imatge_url || '',
      quantitat
    });
  };

  const handleCreate = () => {
    if (!newItem.nom.trim()) {
      setError('El nom és obligatori');
      return;
    }
    onAdd({
      ref_id: null,
      nom: newItem.nom,
      descripcio: newItem.descripcio || '',
      pes: Number(newItem.pes) || 0,
      preu: Number(newItem.preu) || 0,
      calories: isMenjar ? Number(newItem.calories) || 0 : 0,
      imatge_url: newItem.imatge_url || '',
      quantitat
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>Afegir {label}</h2>
            <p>Tria un element del catàleg o crea'n un de nou. S'afegirà a l'esborrany.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${mode === 'catalog' ? 'active' : ''}`}
            onClick={() => { setMode('catalog'); setError(null); }}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            Catàleg
          </button>
          <button
            className={`modal-tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => { setMode('create'); setError(null); }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Crear nou
          </button>
        </div>

        <div className="modal-body">
          {mode === 'catalog' && (
            <>
              <div className="catalog-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder={`Cerca ${labelLower}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="catalog-list">
                {loading ? (
                  <div className="catalog-empty">Carregant catàleg…</div>
                ) : filtered.length === 0 ? (
                  <div className="catalog-empty">
                    {catalog.length === 0
                      ? `Encara no hi ha cap ${labelLower} al catàleg. Crea'n un de nou!`
                      : 'Cap resultat per a aquesta cerca.'}
                  </div>
                ) : (
                  filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`catalog-item ${selected?.id === item.id ? 'selected' : ''}`}
                      onClick={() => setSelected(item)}
                    >
                      <div className="catalog-item-icon">
                        <span className="material-symbols-outlined">
                          {isMenjar ? 'restaurant' : 'inventory_2'}
                        </span>
                      </div>
                      <div className="catalog-item-body">
                        <div className="catalog-item-name">{item.nom}</div>
                        {item.descripcio && (
                          <div className="catalog-item-desc">{item.descripcio}</div>
                        )}
                        <div className="catalog-item-meta">
                          {item.pes && <span>{item.pes} g</span>}
                          {item.preu && <span>{item.preu} €</span>}
                          {isMenjar && item.calories && <span>{item.calories} kcal</span>}
                        </div>
                      </div>
                      {selected?.id === item.id && (
                        <span className="material-symbols-outlined catalog-check">check_circle</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {mode === 'create' && (
            <div className="create-form">
              <div className="form-row">
                <label>Nom *</label>
                <input
                  type="text"
                  value={newItem.nom}
                  onChange={(e) => setNewItem({ ...newItem, nom: e.target.value })}
                  placeholder={`Ex. ${isMenjar ? 'Sopar liofilitzat' : 'Tenda ultralleugera'}`}
                />
              </div>
              <div className="form-row">
                <label>Descripció</label>
                <textarea
                  rows="2"
                  value={newItem.descripcio}
                  onChange={(e) => setNewItem({ ...newItem, descripcio: e.target.value })}
                  placeholder="Notes opcionals"
                />
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Pes (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.pes}
                    onChange={(e) => setNewItem({ ...newItem, pes: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-row">
                  <label>Preu (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.preu}
                    onChange={(e) => setNewItem({ ...newItem, preu: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {isMenjar && (
                  <div className="form-row">
                    <label>Calories</label>
                    <input
                      type="number"
                      min="0"
                      value={newItem.calories}
                      onChange={(e) => setNewItem({ ...newItem, calories: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
              <div className="form-row">
                <label>URL Imatge (opcional)</label>
                <input
                  type="url"
                  value={newItem.imatge_url}
                  onChange={(e) => setNewItem({ ...newItem, imatge_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
          )}
        </div>

        <footer className="modal-foot">
          <div className="modal-qty">
            <label>Quantitat</label>
            <input
              type="number"
              min="1"
              value={quantitat}
              onChange={(e) => setQuantitat(parseInt(e.target.value) || 1)}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button className="modal-btn-secondary" onClick={onClose}>
              Cancel·la
            </button>
            <button
              className="modal-btn-primary"
              onClick={mode === 'catalog' ? handleAddFromCatalog : handleCreate}
            >
              <span className="material-symbols-outlined">add</span>
              Afegir a l'esborrany
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AddItemModal;
