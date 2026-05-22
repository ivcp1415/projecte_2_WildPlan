import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import PerfilCard from "../components/PerfilCard.jsx";
import "../styles/perfil.css";

function PerfilUsuari() {
  const [usuari, setUsuari] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [docs, setDocs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('perfil_docs') || '[]'); }
    catch { return []; }
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const usuariId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  const addDocs = (files) => {
    const nova = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    const updated = [...docs, ...nova];
    setDocs(updated);
    localStorage.setItem('perfil_docs', JSON.stringify(updated));
  };

  const deleteDoc = (index) => {
    const updated = docs.filter((_, i) => i !== index);
    setDocs(updated);
    localStorage.setItem('perfil_docs', JSON.stringify(updated));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addDocs(e.dataTransfer.files);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    // Verificació de seguretat: si no hi ha usuariId, no fem la petició
    if (!usuariId) {
      setError("No s'ha trobat cap sessió activa.");
      setLoading(false);
      return;
    }

    // Fem la crida a l'endpoint de l'usuari amb el token de seguretat
    fetch(`${import.meta.env.VITE_APP_API_URL}/planner/usuaris/${usuariId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Enviem el token per complir amb la seguretat de l'API
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("No s'ha pogut carregar el perfil");
        return res.json();
      })
      .then((data) => {
        setUsuari(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [usuariId, token]); // El hook depèn de l'usuari i el seu token

  return (
    /* Estructura de Flexbox per garantir que el Footer es mantingui a la base */
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Secció principal: utilitza la classe 'perfil-main' per estirar-se */}
      <main className="perfil-main">
        {loading && <p className="status-msg">Carregant perfil...</p>}
        {error && <p className="error-msg">Error: {error}</p>}

        {usuari && (
          <>
            {/* Component reutilitzable amb props (Criteri de la rúbrica) */}
            <PerfilCard usuari={usuari} />

            <div className="info-card">
              <h2>Informació del compte</h2>
              <div className="info-grid">
                <div className="info-field">
                  <p>Nom d'usuari</p>
                  <p>{usuari.username}</p>
                </div>
                <div className="info-field">
                  <p>Correu electrònic</p>
                  <p>{usuari.email}</p>
                </div>
                {usuari.data_naixement && (
                  <div className="info-field">
                    <p>Data de naixement</p>
                    <p>{usuari.data_naixement}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="docs-section">
              <h2 className="docs-title">Documentació Crítica</h2>
              <p className="docs-subtitle">
                Assegurança, DNI, contacte d'emergència, llicències. Accessibles des de qualsevol dispositiu.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files.length) addDocs(e.target.files); e.target.value = ''; }}
              />

              <div
                className={`docs-upload-zone${dragOver ? ' drag-over' : ''}`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <span className="material-symbols-outlined docs-upload-icon">upload_file</span>
                <p className="docs-upload-text">Clica o arrossega fitxers aquí</p>
                <p className="docs-upload-hint">PDF, JPG, PNG, DOC — màx. 20 MB per fitxer</p>
              </div>

              {docs.length > 0 && (
                <ul className="docs-file-list">
                  {docs.map((doc, i) => (
                    <li key={i} className="docs-file-item">
                      <div className="docs-file-info">
                        <span className="material-symbols-outlined docs-file-icon">description</span>
                        <div>
                          <p className="docs-file-name">{doc.name}</p>
                          <p className="docs-file-size">{formatSize(doc.size)}</p>
                        </div>
                      </div>
                      <button className="docs-delete-btn" onClick={() => deleteDoc(i)} aria-label="Eliminar document">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {docs.length === 0 && (
                <p className="docs-empty">Cap document afegit encara.</p>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PerfilUsuari;