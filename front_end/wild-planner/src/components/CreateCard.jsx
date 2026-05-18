import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'

export default function CreateCard() {
    const navigate = useNavigate()
    return (
        <button className="home-fab" onClick={() => navigate('/crear-ruta')}>
            <span className="material-symbols-outlined">add</span>
            Crear Nova Ruta
        </button>
    )
}