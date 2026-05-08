'use client';

import { useEffect, useMemo, useState } from 'react';

type Prize = {
  label: string;
  type: string;
};

type Win = {
  client: string;
  prize: string;
  date: string;
};

type ClientItem = {
  id: string;
  name: string;
  phone: string;
};

function normalizeClient(client: any): ClientItem {
  return {
    id: String(client.clientGlobal?.id ?? client.id),
    name: client.clientGlobal?.name ?? client.name ?? "Senza nome",
    phone: client.clientGlobal?.phone ?? client.phone ?? "",
  };
}

const defaultPrizes: Prize[] = [
  { label: 'Piega -20%', type: 'Sconto' },
  { label: 'Trattamento Omaggio', type: 'Omaggio' },
  { label: 'Gloss €15', type: 'Promo' },
  { label: 'Mini Shampoo', type: 'Prodotto' },
  { label: 'Riprova', type: 'Neutro' },
  { label: 'VIP Bonus', type: 'Fedeltà' },
  { label: 'Maschera -30%', type: 'Sconto' },
  { label: 'Consulenza Free', type: 'Omaggio' },
];

export default function RuotaFortunaPage() {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>(defaultPrizes);
  const [newPrize, setNewPrize] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [sending, setSending] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [wins, setWins] = useState<Win[]>([]);
  const [message, setMessage] = useState('');
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientGlobalId, setSelectedClientGlobalId] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [awardPopupOpen, setAwardPopupOpen] = useState(false);
  const [savingAward, setSavingAward] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentService, setAppointmentService] = useState('Piega');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  function getToken() {
    return localStorage.getItem('salonpro_token') || localStorage.getItem('token');
  }

  async function apiFetch(path: string, options?: RequestInit) {
    const token = getToken();

    if (!token) {
      throw new Error('Token mancante. Rifai login.');
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg =
        typeof data?.message === 'object'
          ? JSON.stringify(data.message)
          : data?.message;

      throw new Error(msg || text || 'Errore richiesta');
    }

    return data;
  }

  async function loadClients() {
    try {
      const data = await apiFetch('/clients');

      const list = Array.isArray(data)
        ? data.map(normalizeClient)
        : Array.isArray(data.clients)
          ? data.clients.map(normalizeClient)
          : [];

      setClients(list);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients
    .filter((client) => {
      const q = clientName.toLowerCase().trim();

      if (!q) return false;

      return (
        client.name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  function selectClient(client: ClientItem) {
    setSelectedClientGlobalId(client.id);
    setClientName(client.name);
    setPhone(client.phone);
    setShowClientSuggestions(false);
  }

  const wheelGradient = useMemo(() => {
    const colors = [
      '#8b5cf6',
      '#d4af37',
      '#22c55e',
      '#f97316',
      '#3b82f6',
      '#ec4899',
      '#14b8a6',
      '#facc15',
    ];

    const step = 360 / prizes.length;

    return `conic-gradient(${prizes
      .map((_, index) => {
        const start = index * step;
        const end = (index + 1) * step;
        return `${colors[index % colors.length]} ${start}deg ${end}deg`;
      })
      .join(', ')})`;
  }, [prizes]);

  function spin() {
    if (spinning) return;

    if (!clientName.trim()) {
      setMessage('⚠️ Inserisci nome cliente.');
      return;
    }

    setMessage('');
    setSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * prizes.length);
    const extraTurns = 360 * 6;
    const slice = 360 / prizes.length;
    const targetAngle = 360 - winnerIndex * slice - slice / 2;
    const finalRotation = rotation + extraTurns + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      const prize = prizes[winnerIndex];

      setWinner(prize);
      setWins((prev) => [
        {
          client: clientName.trim(),
          prize: prize.label,
          date: new Date().toLocaleString('it-IT'),
        },
        ...prev,
      ]);

      setMessage(`🎁 Premio vinto: ${prize.label}`);
      setAwardPopupOpen(true);
      setSpinning(false);
    }, 4200);
  }

  function addPrize() {
    if (!newPrize.trim()) return;

    setPrizes((prev) => [
      ...prev,
      {
        label: newPrize.trim(),
        type: 'Personalizzato',
      },
    ]);

    setNewPrize('');
  }

  function removePrize(index: number) {
    if (prizes.length <= 2) {
      setMessage('⚠️ Devi lasciare almeno 2 premi nella ruota.');
      return;
    }

    setPrizes((prev) => prev.filter((_, i) => i !== index));
  }

  function whatsappMessage() {
    if (!winner) return '';

    return `Ciao ${clientName}! 💛

Hai vinto alla Ruota della Fortuna Salon Pro:

🎁 ${winner.label}

Il premio è stato salvato nella tua scheda cliente.

Puoi usarlo al prossimo appuntamento in salone.
Ti aspettiamo!`;
  }

  async function sendWhatsappInsideSoftware() {
    if (!winner) {
      setMessage('⚠️ Prima fai girare la ruota.');
      return;
    }

    if (!phone.trim()) {
      setMessage('⚠️ Inserisci numero WhatsApp cliente.');
      return;
    }

    const token = localStorage.getItem('salonpro_token');

    if (!token) {
      setMessage('⚠️ Token mancante. Rifai login.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: phone,
          message: whatsappMessage(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const metaError =
          typeof data?.message === 'object'
            ? JSON.stringify(data.message)
            : data?.message;

        throw new Error(metaError || 'Errore invio WhatsApp');
      }

      setMessage('✅ WhatsApp inviato automaticamente dal software.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore WhatsApp'}`);
    } finally {
      setSending(false);
    }
  }

  function awardExpiresAt() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  async function saveAwardToClient(options?: {
    whatsappSent?: boolean;
    status?: string;
    appointmentId?: string | null;
    notes?: string;
  }) {
    if (!winner) {
      setMessage('⚠️ Prima fai girare la ruota.');
      return null;
    }

    if (!selectedClientGlobalId) {
      setMessage('⚠️ Seleziona un cliente dal CRM prima di salvare la vincita.');
      return null;
    }

    return apiFetch('/client-awards', {
      method: 'POST',
      body: JSON.stringify({
        clientGlobalId: selectedClientGlobalId,
        prizeName: winner.label,
        prizeType: winner.type || 'WHEEL_PRIZE',
        value: 0,
        source: 'WHEEL',
        status: options?.status || 'ACTIVE',
        expiresAt: awardExpiresAt(),
        appointmentId: options?.appointmentId || null,
        whatsappSent: Boolean(options?.whatsappSent || false),
        notes: options?.notes || 'Premio generato dalla Ruota della Fortuna.',
      }),
    });
  }

  async function saveAwardOnly() {
    try {
      setSavingAward(true);
      await saveAwardToClient();
      setAwardPopupOpen(false);
      setMessage('✅ Premio salvato nello storico cliente.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore salvataggio premio'}`);
    } finally {
      setSavingAward(false);
    }
  }

  async function saveAwardAndWhatsapp() {
    try {
      setSavingAward(true);

      await saveAwardToClient({
        whatsappSent: true,
      });

      await sendWhatsappInsideSoftware();

      setAwardPopupOpen(false);
      setMessage('✅ Premio salvato nello storico cliente e WhatsApp inviato.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore salvataggio premio/WhatsApp'}`);
    } finally {
      setSavingAward(false);
    }
  }

  async function prepareAppointmentWithAward() {
    if (!winner) return;

    if (!selectedClientGlobalId) {
      setMessage('⚠️ Seleziona un cliente dal CRM prima di creare appuntamento.');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      setMessage('⚠️ Inserisci data e ora appuntamento nel popup.');
      return;
    }

    setMessage('✅ Ora colleghiamo la vincita all’appuntamento. Mi serve confermare il formato API appuntamenti.');
  }

  function copyMessage() {
    if (!winner) return;
    navigator.clipboard.writeText(whatsappMessage());
    setMessage('✅ Messaggio copiato.');
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Ruota della fortuna</div>
            <h1 className="sp-title">Regala emozione, crea ritorno</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Sorprendi il cliente con un premio e invialo automaticamente via WhatsApp.
            </p>
          </div>

          <div style={goldBadge}>Premi attivi: {prizes.length}</div>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        {awardPopupOpen && winner ? (
          <div style={awardPopupBackdrop}>
            <div style={awardPopup}>
              <div style={awardPopupHeader}>
                <div>
                  <div style={eyebrow}>Premio vinto</div>
                  <h2 style={{ margin: '6px 0', color: '#d4af37' }}>
                    🎉 {clientName} ha vinto
                  </h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)' }}>
                    Usa questa vincita come scusa per far tornare il cliente.
                  </p>
                </div>

                <button style={popupCloseButton} onClick={() => setAwardPopupOpen(false)}>
                  X
                </button>
              </div>

              <div style={awardPrizeBox}>
                <span>Premio</span>
                <strong>{winner.label}</strong>
              </div>

              <div style={appointmentMiniGrid}>
                <input
                  className="sp-input"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />

                <input
                  className="sp-input"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />

                <input
                  className="sp-input"
                  placeholder="Servizio principale es. Piega"
                  value={appointmentService}
                  onChange={(e) => setAppointmentService(e.target.value)}
                />
              </div>

              <button
                style={popupPrimaryButton}
                onClick={prepareAppointmentWithAward}
                disabled={savingAward}
              >
                Crea appuntamento con questa vincita
              </button>

              <button
                style={popupWhatsappButton}
                onClick={saveAwardAndWhatsapp}
                disabled={savingAward}
              >
                Salva nello storico + invia WhatsApp
              </button>

              <button
                style={popupSecondaryButton}
                onClick={saveAwardOnly}
                disabled={savingAward}
              >
                Solo salva nello storico cliente
              </button>
            </div>
          </div>
        ) : null}

        <section style={mainGrid}>
          <div className="sp-card" style={wheelCard}>
            <div style={wheelStage}>
              <div style={pointer}>▼</div>

              <div
                style={{
                  ...wheel,
                  background: wheelGradient,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning
                    ? 'transform 4.2s cubic-bezier(.12,.8,.18,1)'
                    : 'none',
                }}
              >
                <div style={wheelCenter}>
                  <strong style={{ fontSize: 34 }}>SP</strong>
                  <span style={{ fontSize: 12 }}>Salon Pro</span>
                </div>
              </div>
            </div>

            <div style={winnerBox}>
              {winner ? (
                <>
                  <div className="sp-muted">Premio vinto</div>
                  <h2 style={{ margin: '6px 0', color: '#d4af37' }}>
                    🎁 {winner.label}
                  </h2>
                  <p style={{ margin: 0 }}>{winner.type}</p>
                </>
              ) : (
                <>
                  <div className="sp-muted">Pronto per giocare</div>
                  <h2 style={{ margin: '6px 0', color: '#d4af37' }}>
                    Fai girare la ruota
                  </h2>
                  <p style={{ margin: 0 }}>Il premio apparirà qui.</p>
                </>
              )}
            </div>
          </div>

          <aside className="sp-card" style={controlCard}>
            <h2 style={sectionTitle}>Cliente</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={clientAutocompleteWrap}>
                <input
                  className="sp-input"
                  placeholder="Digita nome cliente dal CRM..."
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setSelectedClientGlobalId('');
                    setShowClientSuggestions(true);
                  }}
                  onFocus={() => setShowClientSuggestions(true)}
                />

                {showClientSuggestions && filteredClients.length > 0 ? (
                  <div style={clientSuggestionsBox}>
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        style={clientSuggestionItem}
                        onClick={() => selectClient(client)}
                      >
                        <strong>{client.name}</strong>
                        <span>{client.phone}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <input
                className="sp-input"
                placeholder="WhatsApp cliente es. 3201234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <button
                onClick={spin}
                disabled={spinning}
                className="sp-button-purple"
                style={{ fontSize: 18, padding: 18 }}
              >
                {spinning ? 'La ruota gira...' : 'Gira la ruota'}
              </button>

              <button
                onClick={sendWhatsappInsideSoftware}
                disabled={!winner || sending}
                style={{
                  ...whatsappButton,
                  opacity: winner && !sending ? 1 : 0.45,
                }}
              >
                {sending ? 'Invio WhatsApp...' : 'Invia WhatsApp automatico'}
              </button>

              <button
                onClick={copyMessage}
                disabled={!winner}
                style={{
                  ...copyButton,
                  opacity: winner ? 1 : 0.45,
                }}
              >
                Copia messaggio
              </button>
            </div>

            {winner ? (
              <textarea
                className="sp-input"
                rows={7}
                readOnly
                value={whatsappMessage()}
                style={{ marginTop: 14 }}
              />
            ) : null}
          </aside>
        </section>

        <section style={bottomGrid}>
          <div className="sp-card" style={panel}>
            <div style={panelHeader}>
              <div>
                <div style={greenKicker}>Configurazione premi</div>
                <h2 style={sectionTitle}>Premi della ruota</h2>
              </div>
            </div>

            <div style={addPrizeRow}>
              <input
                className="sp-input"
                placeholder="Nuovo premio es. Shampoo omaggio"
                value={newPrize}
                onChange={(e) => setNewPrize(e.target.value)}
              />
              <button className="sp-button-purple" onClick={addPrize}>
                Aggiungi
              </button>
            </div>

            <div style={prizeGrid}>
              {prizes.map((prize, index) => (
                <div key={`${prize.label}-${index}`} style={prizeCard}>
                  <div>
                    <strong>{prize.label}</strong>
                    <div className="sp-muted" style={{ marginTop: 4 }}>
                      {prize.type}
                    </div>
                  </div>

                  <button style={miniDanger} onClick={() => removePrize(index)}>
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sp-card" style={panel}>
            <div style={panelHeader}>
              <div>
                <div style={greenKicker}>Storico vincite</div>
                <h2 style={sectionTitle}>Premi assegnati oggi</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {wins.length === 0 ? (
                <div style={emptyBox}>Nessuna vincita ancora registrata.</div>
              ) : (
                wins.map((win, index) => (
                  <div key={`${win.client}-${index}`} style={winRow}>
                    <div>
                      <strong>{win.client}</strong>
                      <div className="sp-muted">{win.date}</div>
                    </div>

                    <div style={prizePill}>{win.prize}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  marginBottom: 24,
  flexWrap: 'wrap',
};

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: 'uppercase',
};

const goldBadge: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.14)',
  border: '1px solid rgba(212,175,55,0.28)',
  color: '#d4af37',
  fontWeight: 900,
};

const messageBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(139,92,246,0.14)',
  border: '1px solid rgba(139,92,246,0.32)',
  color: '#fff',
  fontWeight: 900,
};

const mainGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.25fr 0.75fr',
  gap: 22,
  alignItems: 'stretch',
};

const wheelCard: React.CSSProperties = {
  padding: 28,
  minHeight: 620,
  display: 'grid',
  placeItems: 'center',
  background:
    'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.22), transparent 34%), rgba(255,255,255,0.05)',
};

const wheelStage: React.CSSProperties = {
  position: 'relative',
  width: 460,
  height: 460,
  display: 'grid',
  placeItems: 'center',
};

const pointer: React.CSSProperties = {
  position: 'absolute',
  top: -6,
  zIndex: 5,
  color: '#d4af37',
  fontSize: 38,
  textShadow: '0 8px 20px rgba(0,0,0,0.5)',
};

const wheel: React.CSSProperties = {
  width: 420,
  height: 420,
  borderRadius: '50%',
  border: '8px solid rgba(212,175,55,0.85)',
  boxShadow:
    '0 30px 80px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.25)',
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
};

const wheelCenter: React.CSSProperties = {
  width: 132,
  height: 132,
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#080808,#161616)',
  border: '3px solid rgba(212,175,55,0.85)',
  color: '#d4af37',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
};

const winnerBox: React.CSSProperties = {
  width: '100%',
  marginTop: 18,
  padding: 20,
  borderRadius: 22,
  background: 'rgba(0,0,0,0.22)',
  border: '1px solid rgba(212,175,55,0.18)',
};

const controlCard: React.CSSProperties = {
  padding: 24,
  background:
    'radial-gradient(circle at top right, rgba(212,175,55,0.15), transparent 32%), rgba(255,255,255,0.05)',
};

const sectionTitle: React.CSSProperties = {
  margin: '6px 0 16px',
  color: '#d4af37',
};

const whatsappButton: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: 0,
  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
  color: '#fff',
  fontWeight: 900,
};

const copyButton: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 900,
};

const bottomGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 22,
  marginTop: 22,
};

const panel: React.CSSProperties = {
  padding: 24,
};

const panelHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 16,
};

const greenKicker: React.CSSProperties = {
  color: '#22c55e',
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
};

const addPrizeRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 170px',
  gap: 12,
  marginBottom: 16,
};

const prizeGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};

const prizeCard: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: 14,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const miniDanger: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: 0,
  background: '#ef4444',
  color: '#fff',
  fontWeight: 900,
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#b8bfd0',
};

const winRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: 14,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const prizePill: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.14)',
  border: '1px solid rgba(212,175,55,0.25)',
  color: '#d4af37',
  fontWeight: 900,
  whiteSpace: 'nowrap',
};


const clientAutocompleteWrap: React.CSSProperties = {
  position: 'relative',
  width: '100%',
};

const clientSuggestionsBox: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  zIndex: 40,
  display: 'grid',
  gap: 8,
  padding: 10,
  borderRadius: 16,
  background: 'rgba(10,10,10,0.98)',
  border: '1px solid rgba(212,175,55,0.28)',
  boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
};

const clientSuggestionItem: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  textAlign: 'left',
  display: 'grid',
  gap: 4,
  cursor: 'pointer',
  fontWeight: 850,
};

const awardPopupBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(0,0,0,0.72)',
  display: 'grid',
  placeItems: 'center',
  padding: 20,
};

const awardPopup: React.CSSProperties = {
  width: 'min(680px, 100%)',
  borderRadius: 28,
  padding: 24,
  background: 'linear-gradient(180deg,rgba(20,14,30,0.98),rgba(8,6,12,0.98))',
  border: '1px solid rgba(212,175,55,0.30)',
  boxShadow: '0 32px 90px rgba(0,0,0,0.55)',
  color: '#fff',
};

const awardPopupHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'flex-start',
  marginBottom: 18,
};

const popupCloseButton: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: '10px 13px',
  background: 'rgba(255,255,255,0.10)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};

const awardPrizeBox: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 18,
  borderRadius: 20,
  background: 'rgba(212,175,55,0.12)',
  border: '1px solid rgba(212,175,55,0.22)',
  marginBottom: 16,
};

const appointmentMiniGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1.4fr',
  gap: 10,
  marginBottom: 14,
};

const popupPrimaryButton: React.CSSProperties = {
  width: '100%',
  border: 0,
  borderRadius: 16,
  padding: '15px 18px',
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
  marginBottom: 10,
};

const popupWhatsappButton: React.CSSProperties = {
  width: '100%',
  border: 0,
  borderRadius: 16,
  padding: '15px 18px',
  background: '#22c55e',
  color: '#04130a',
  fontWeight: 950,
  cursor: 'pointer',
  marginBottom: 10,
};

const popupSecondaryButton: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 16,
  padding: '15px 18px',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
};
