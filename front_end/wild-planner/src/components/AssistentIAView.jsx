import React, { useState } from 'react';
import '../styles/AssistentIAView.css';

function AssistentIAView() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hola! Sóc l\'assistent IA de Sendera. Puc ajudar-te amb suggeriments de rutes, material necessari, condicions meteorològiques i molt més. Com puc ajudar-te avui?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      text: input
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    // Mock response - replace with real API call to your LLM
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        text: 'Gràcies per la teva pregunta! Actualment sóc en mode demostració. En breus, podré processar les teves preguntes amb IA real.'
      };
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="ia-view">
      <header className="view-header">
        <h1>Assistent IA</h1>
        <p>Fes preguntes sobre les teves expedicions, material i condicions</p>
      </header>

      <div className="ia-container">
        <div className="messages-box">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-bubble">
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-bubble">
                <p className="typing">Escrivint...</p>
              </div>
            </div>
          )}
        </div>

        <div className="input-box">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escriu la teva pregunta..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssistentIAView;
