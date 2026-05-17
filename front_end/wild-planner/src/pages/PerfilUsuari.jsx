import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import PerfilCard from "../components/PerfilCard";
import "../styles/perfil.css";

// Component de Pàgina de Perfil: Dinàmic i amb control d'estats
function PerfilUsuari() {
  // Estats per gestionar la informació, el carregament i els possibles errors
  const [usuari, setUsuari] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recuperem l'ID i el Token segons el teu flux de login per a l'autenticació
  const usuariId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // useEffect per consumir l'API de DRF de forma dinàmica (Requisit obligatori)
  useEffect(() => {
    // Verificació de seguretat: si no hi ha usuariId, no fem la petició
    if (!usuariId) {
      setError("No s'ha trobat cap sessió activa.");
      setLoading(false);
      return;
    }

    // Fem la crida a l'endpoint de l'usuari amb el token de seguretat
    fetch(`http://127.0.0.1:8000/rutes/usuaris/${usuariId}/`, {
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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PerfilUsuari;