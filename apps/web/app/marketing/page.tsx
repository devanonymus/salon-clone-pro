'use client';

import { useMemo, useState } from 'react';

type SessionItem = {
  paidService: string;
  paidProduct: string;
  giftService: string;
  giftProduct: string;
};

type ActiveCard = {
  client: string;
  card: string;
  whatsapp: string;
  used: number;
  total: number;
};

const services = [
  'Piega',
  'Taglio Donna',
  'Colore Base',
  'Colore Base + Piega',
  'Balayage + Piega',
  'Tonalizzante/Gloss',
  'Ricostruzione Intensiva',
  'Trattamento Idratazione Express',
  'Plex Forte Repair Ricostruzione',
];

const catalogCards = [
  { name: 'Percorso Tre Mesi Colore Blindato', price: 238 },
  { name: 'Colore Blindato', price: 183 },
  { name: 'Katìa Brigante', price: 50 },
  { name: 'Brian Prima Percorso', price: 121 },
];

const defaultActiveCards: ActiveCard[] = [
  {
    client: 'Antonella Rossano',
    card: 'Percorso Tre Mesi Colore Blindato',
    whatsapp: '3759401867',
    used: 1,
    total: 4,
  },
  {
    client: 'Acquaviva Michela',
    card: 'Katìa Brigante',
    whatsapp: '3201532246',
    used: 0,
    total: 4,
  },
];

export default function MarketingPage() {
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [operator, setOperator] = useState('');
  const [frequency, setFrequency] = useState('Mensile (30 gg)');
  const [manualCardName, setManualCardName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [sessionsCount, setSessionsCount] = useState(4);
  const [sessions, setSessions] = useState<SessionItem[]>(
    Array.from({ length: 4 }).map(() => ({
      paidService: '',
      paidProduct: '',
      giftService: '',
      giftProduct: '',
    })),
  );
  const [activeCards, setActiveCards] = useState<ActiveCard[]>(defaultActiveCards);
  const [message, setMessage] = useState('');

  const selectedCatalog = catalogCards.find((card) => card.name === selectedCard);

  const cardName = selectedCatalog?.name || manualCardName || 'Nuova Card';
  const cardPrice = selectedCatalog?.price || Number(manualPrice || 0);

  const valueListino = useMemo(() => {
    return sessions.reduce((sum, session) => {
      let subtotal = 0;
      if (session.paidService) subtotal += serviceValue(session.paidService);
      if (session.giftService) subtotal += serviceValue(session.giftService);
      if (session.paidProduct) subtotal += 15;
      if (session.giftProduct) subtotal += 15;
      return sum + subtotal;
    }, 0);
  }, [sessions]);

  const convenience = Math.max(0, valueListino - cardPrice);

  function setSessionCount(value: number) {
    setSessionsCount(value);
    setSessions((prev) => {
      const next = [...prev];

      while (next.length < value) {
        next.push({
          paidService: '',
          paidProduct: '',
          giftService: '',
          giftProduct: '',
        });
      }

      return next.slice(0, value);
    });
  }

  function updateSession(index: number, key: keyof SessionItem, value: string) {
    setSessions((prev) =>
      prev.map((session, i) =>
        i === index
          ? {
              ...session,
              [key]: value,
            }
          : session,
      ),
    );
  }

  function autoDates() {
    const today = new Date();
    const gap = frequency.includes('15') ? 15 : frequency.includes('45') ? 45 : 30;

    return Array.from({ length: 4 }).map((_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() + index * gap);
      return d.toISOString().slice(0, 10);
    });
  }

  const dates = autoDates();

  function activateCard() {
    if (!clientName.trim()) {
      setMessage('Inserisci il nome cliente.');
      return;
    }

    const newCard: ActiveCard = {
      client: clientName.trim(),
      card: cardName,
      whatsapp: whatsapp.trim() || 'Non inserito',
      used: 0,
      total: sessionsCount,
    };

    setActiveCards((prev) => [newCard, ...prev]);
    setMessage('✅ Card attivata. Ora puoi stamparla o usarla dal salone.');
  }

  function useCard(index: number) {
    setActiveCards((prev) =>
      prev.map((card, i) =>
        i === index
          ? {
              ...card,
              used: Math.min(card.used + 1, card.total),
            }
          : card,
      ),
    );
  }

  function removeCard(index: number) {
    setActiveCards((prev) => prev.filter((_, i) => i !== index));
  }

  function resetCart() {
    setSessions(
      Array.from({ length: sessionsCount }).map(() => ({
        paidService: '',
        paidProduct: '',
        giftService: '',
        giftProduct: '',
      })),
    );
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Marketing & Card</div>
            <h1 className="sp-title">Percorsi fedeltà che vendono valore</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Crea card, sedute, omaggi e messaggi WhatsApp pronti per far tornare il cliente.
            </p>
          </div>

          <button className="sp-button-purple">+ Crea/modifica catalogo card</button>
        </header>

        {message ? <div style={successBox}>{message}</div> : null}

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Fissa appuntamenti card</div>
              <h2 style={sectionTitle}>Protocollo della fedeltà</h2>
            </div>
            <div style={goldBadge}>Percorso consigliato</div>
          </div>

          <div style={infoBox}>
            <strong>Procedura strategica:</strong> quando vendi una card, fissa subito le date
            delle sedute. Così il percorso resta nella mente del cliente e nel calendario del salone.
          </div>

          <div style={grid4}>
            <input
              className="sp-input"
              placeholder="Nome Cliente"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <input
              className="sp-input"
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <select
              className="sp-input"
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
            >
              <option value="">Scegli Card catalogo...</option>
              {catalogCards.map((card) => (
                <option key={card.name} value={card.name}>
                  {card.name} — € {card.price}
                </option>
              ))}
            </select>
            <select
              className="sp-input"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value="">Operatore percorso</option>
              <option>Brian</option>
              <option>Katia</option>
              <option>Pamela</option>
              <option>Sonia</option>
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={label}>Frequenza percorso</label>
            <select
              className="sp-input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option>Mensile (30 gg)</option>
              <option>Quindicinale (15 gg)</option>
              <option>Ogni 45 giorni</option>
            </select>
          </div>

          <div style={grid2}>
            <input
              className="sp-input"
              placeholder="Nuova Card: nome"
              value={manualCardName}
              onChange={(e) => setManualCardName(e.target.value)}
            />
            <input
              className="sp-input"
              placeholder="Prezzo Card €"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
            />
          </div>

          <div style={datesGrid}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <label style={label}>{i + 1}ª Data</label>
                <input className="sp-input" type="date" defaultValue={dates[i]} />
                <input className="sp-input" type="time" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Carrello percorso</div>
              <h2 style={sectionTitle}>{sessionsCount} sedute</h2>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="sp-muted">Sedute:</span>
              <select
                className="sp-input"
                style={{ width: 90 }}
                value={sessionsCount}
                onChange={(e) => setSessionCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <div style={priceBadge}>Prezzo Card: € {cardPrice.toFixed(2)}</div>
              <button style={smallPurple} onClick={resetCart}>Reset</button>
            </div>
          </div>

          <div style={sessionsGrid}>
            {sessions.map((session, index) => (
              <div key={index} style={sessionCard}>
                <h3 style={{ color: '#d4af37', marginTop: 0 }}>Seduta {index + 1}</h3>

                <select
                  className="sp-input"
                  value={session.paidService}
                  onChange={(e) => updateSession(index, 'paidService', e.target.value)}
                >
                  <option value="">+ Servizio a pagamento...</option>
                  {services.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value={session.paidProduct}
                  onChange={(e) => updateSession(index, 'paidProduct', e.target.value)}
                >
                  <option value="">+ Prodotto a pagamento...</option>
                  <option>Shampoo specifico</option>
                  <option>Maschera nutriente</option>
                  <option>Siero gloss</option>
                </select>

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value={session.giftService}
                  onChange={(e) => updateSession(index, 'giftService', e.target.value)}
                >
                  <option value="">+ Servizio in omaggio...</option>
                  {services.map((service) => (
                    <option key={service}>{service}</option>
                  ))}
                </select>

                <select
                  className="sp-input"
                  style={{ marginTop: 10 }}
                  value={session.giftProduct}
                  onChange={(e) => updateSession(index, 'giftProduct', e.target.value)}
                >
                  <option value="">+ Prodotto omaggio...</option>
                  <option>Mini shampoo</option>
                  <option>Fiala trattamento</option>
                  <option>Campione premium</option>
                </select>
              </div>
            ))}
          </div>

          <div style={summaryGrid}>
            <Summary label="Valore a listino" value={`€ ${valueListino.toFixed(2)}`} />
            <Summary label="Prezzo Card" value={`€ ${cardPrice.toFixed(2)}`} />
            <Summary label="Convenienza Cliente" value={`€ ${convenience.toFixed(2)}`} />
            <Summary label="Sedute" value={String(sessionsCount)} />
          </div>

          {valueListino === 0 ? (
            <div style={warningBox}>
              💡 Aggiungi almeno un servizio a pagamento per calcolare il valore del percorso.
            </div>
          ) : null}

          <button className="sp-button-purple" style={{ width: '100%', marginTop: 18 }} onClick={activateCard}>
            Attiva asset card salva percorso + stampa ✅
          </button>
        </section>

        <section className="sp-card" style={cardPad}>
          <div style={sectionHeader}>
            <div>
              <div style={greenKicker}>Card attive clienti</div>
              <h2 style={sectionTitle}>Percorsi già venduti</h2>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Cliente</th>
                  <th style={th}>Card</th>
                  <th style={th}>WhatsApp</th>
                  <th style={th}>Avanzamento</th>
                  <th style={th}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {activeCards.map((card, index) => (
                  <tr key={`${card.client}-${index}`}>
                    <td style={td}>{card.client}</td>
                    <td style={td}>{card.card}</td>
                    <td style={td}>{card.whatsapp}</td>
                    <td style={td}>
                      <div style={progressWrap}>
                        <div
                          style={{
                            ...progressBar,
                            width: `${(card.used / card.total) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="sp-muted" style={{ marginTop: 5 }}>
                        {card.used}/{card.total} usate
                      </div>
                    </td>
                    <td style={td}>
                      <button style={miniBtn}>👁 Stampa</button>{' '}
                      <button style={miniPurple} onClick={() => useCard(index)}>✅ Usa</button>{' '}
                      <button style={miniDanger} onClick={() => removeCard(index)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function serviceValue(service: string) {
  if (service.includes('Balayage')) return 80;
  if (service.includes('Colore')) return 42;
  if (service.includes('Taglio')) return 25;
  if (service.includes('Ricostruzione')) return 35;
  if (service.includes('Trattamento')) return 25;
  if (service.includes('Piega')) return 20;
  return 20;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="sp-muted">{label}</div>
      <div style={{ color: '#8b5cf6', fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
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

const cardPad: React.CSSProperties = {
  padding: 24,
  marginBottom: 22,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'center',
  marginBottom: 18,
  flexWrap: 'wrap',
};

const greenKicker: React.CSSProperties = {
  color: '#22c55e',
  fontWeight: 900,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
};

const sectionTitle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#d4af37',
};

const goldBadge: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.14)',
  border: '1px solid rgba(212,175,55,0.28)',
  color: '#d4af37',
  fontWeight: 900,
};

const successBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(34,197,94,0.32)',
  color: '#86efac',
  fontWeight: 900,
};

const infoBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 16,
};

const grid4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.8fr 1fr 1fr',
  gap: 14,
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 0.45fr',
  gap: 14,
  marginTop: 14,
};

const datesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
  marginTop: 16,
};

const label: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  color: '#fff',
  fontWeight: 900,
};

const priceBadge: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(212,175,55,0.22)',
  color: '#d4af37',
  fontWeight: 900,
};

const smallPurple: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 0,
  background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  color: '#fff',
  fontWeight: 900,
};

const sessionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 14,
};

const sessionCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
};

const summaryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginTop: 22,
};

const warningBox: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(212,175,55,0.10)',
  border: '1px solid rgba(212,175,55,0.25)',
  color: '#f5d76e',
  fontWeight: 800,
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const th: React.CSSProperties = {
  padding: 14,
  textAlign: 'left',
  color: '#22c55e',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const td: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  fontWeight: 800,
};

const progressWrap: React.CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.10)',
  overflow: 'hidden',
};

const progressBar: React.CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
};

const miniBtn: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 10,
  border: 0,
  background: '#e8eef8',
  color: '#0f172a',
  fontWeight: 900,
};

const miniPurple: React.CSSProperties = {
  ...miniBtn,
  background: '#8b5cf6',
  color: '#fff',
};

const miniDanger: React.CSSProperties = {
  ...miniBtn,
  background: '#ef4444',
  color: '#fff',
};