import React, { useState } from 'react';
import '../styles/AddItemModal.css';

const MODALITATS = [
  ['senderisme', 'Senderisme'],
  ['alpinisme', 'Alpinisme'],
  ['btt', 'Bicicleta BTT'],
  ['trail_running', 'Trail Running'],
  ['escalada', 'Escalada'],
  ['esqui', 'Esquí'],
  ['altra', 'Altra']
];

const DIFICULTATS = [
  ['facil', 'Fàcil'],
  ['moderada', 'Moderada'],
  ['dificil', 'Difícil'],
  ['molt_dificil', 'Molt difícil'],
  ['extrema', 'Extrema']
];

/**
 * Modal d'edició ràpida de metadades d'una ruta pròpia. No afecta nodes/trams.
 *
 * Props:
 *  - ruta: objecte ruta complet
 *  - onClose(): tanca el modal
 *  - onSaved(rutaActualitzada): callback amb la ruta després del PATCH
 */
function EditRutaMetaModal({ ruta, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: ruta.nom || '',
    descripcio: ruta.descripcio || '',
    modalitat: ruta.modalitat || 'senderisme',
    dificultat: ruta.dificultat || 'moderada',
    imatge_portada: ruta.imatge_portada || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_APP_API_URL;
  const token = localStorage.getItem('token');

  const handleSave = async () => {
    if (!form.nom.trim()) {
      setError('El nom és obligatori');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/planner/rutes/${ruta.id}/editar-meta/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || JSON.stringify(data) || "No s'ha pogut desar");
      }
      const data = await res.json();
      onSaved?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-narrow" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <h2>Editar ruta</h2>
            <p>Canvia el nom, descripció o classificació. Els nodes del mapa no s'alteren.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="modal-body">
          <div className="create-form">
            <div className="form-row">
              <label>Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Descripció</label>
              <textarea
                rows="3"
                value={form.descripcio}
                onChange={(e) => setForm({ ...form, descripcio: e.target.value })}
                placeholder="Punts d'interès, dificultats tècniques, recomanacions…"
              />
            </div>
            <div className="form-grid">
              <div className="form-row">
                <label>Modalitat</label>
                <select
                  value={form.modalitat}
                  onChange={(e) => setForm({ ...form, modalitat: e.target.value })}
                >
                  {MODALITATS.map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Dificultat</label>
                <select
                  value={form.dificultat}
                  onChange={(e) => setForm({ ...form, dificultat: e.target.value })}
                >
                  {DIFICULTATS.map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <label>URL imatge portada</label>
              <input
                type="url"
                value={form.imatge_portada}
                onChange={(e) => setForm({ ...form, imatge_portada: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-actions">
            <button className="modal-btn-secondary" onClick={onClose} disabled={saving}>
              Cancel·la
            </button>
            <button className="modal-btn-primary" onClick={handleSave} disabled={saving}>
              <span className="material-symbols-outlined">save</span>
              {saving ? 'Desant…' : 'Desa canvis'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default EditRutaMetaModal;
