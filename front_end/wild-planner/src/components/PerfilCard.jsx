// src/components/PerfilCard.js
import { useNavigate } from 'react-router-dom';

function PerfilCard({ usuari }) {
  const navigate = useNavigate();
  return (
    <div className="perfil-card">
      <img
        className="perfil-avatar"
        src={usuari.url_foto_perfil || "https://via.placeholder.com/120"}
        alt={`Foto de ${usuari.username}`}
      />
      <div className="perfil-info">
        <h1 className="perfil-username">{usuari.username}</h1>
        <p className="perfil-email">{usuari.email}</p>
        {usuari.data_naixement && (
          <p className="perfil-data">Nascut el: {usuari.data_naixement}</p>
        )}
        {usuari.biografia && (
          <p className="perfil-bio">{usuari.biografia}</p>
        )}
        {/* BOTÓN EDITAR: lleva a la página de modificar el usuario */}
                <button
                    className="perfil-btn-editar"
                    onClick={() => navigate('/perfil/editar')}
                >
                    Editar perfil
                </button>
      </div>
    </div>
  );
}

export default PerfilCard;