'use client';

import { useMemo, useState } from 'react';

type SessionItem = {
  paidServices: string[];
  paidProducts: string[];
  giftServices: string[];
  giftProducts: string[];
};

type ActiveCard = {
  client: string;
  card: string;
  whatsapp: string;
  used: number;
  total: number;
};

type CatalogCard = {
  name: string;
  price: number;
  sessionsCount: number;
  sessions: SessionItem[];
  increaseTotal: number;
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

const defaultCatalogCards: CatalogCard[] = [];

const defaultActiveCards: ActiveCard[] = [];

export default function MarketingPage() {
  const [clientName, setClientName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>(defaultCatalogCards);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingCatalogIndex, setEditingCatalogIndex] = useState<number | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogPrice, setCatalogPrice] = useState('');
  const [catalogSessionsCount, setCatalogSessionsCount] = useState(4);
  const [catalogSessions, setCatalogSessions] = useState<SessionItem[]>(
    Array.from({ length: 4 }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    })),
  );
  const [catalogIncreaseInput, setCatalogIncreaseInput] = useState('');
  const [catalogIncreaseTotal, setCatalogIncreaseTotal] = useState(0);
  const [operator, setOperator] = useState('');
  const [frequency, setFrequency] = useState('Mensile (30 gg)');
  const [manualCardName, setManualCardName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [cardIncreaseInput, setCardIncreaseInput] = useState('');
  const [cardIncreaseTotal, setCardIncreaseTotal] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [sessions, setSessions] = useState<SessionItem[]>(
    Array.from({ length: 4 }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    })),
  );
  const [activeCards, setActiveCards] = useState<ActiveCard[]>(defaultActiveCards);
  const [message, setMessage] = useState('');

  const selectedCatalog = catalogCards.find((card) => card.name === selectedCard);

  const cardName = selectedCatalog?.name || manualCardName || 'Nuova Card';

  const valueListino = useMemo(() => {
    return sessions.reduce((sum, session) => {
      let subtotal = 0;

      subtotal += session.paidServices.reduce((total, item) => total + serviceValue(item), 0);
      subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);

      subtotal += session.giftServices.reduce((total, item) => total + serviceValue(item), 0);
      subtotal += session.giftProducts.reduce((total, item) => total + productValue(item), 0);

      return sum + subtotal;
    }, 0);
  }, [sessions]);

  const calculatedCardPrice = useMemo(() => {
    return sessions.reduce((sum, session) => {
      let subtotal = 0;

      subtotal += session.paidServices.reduce((total, item) => total + serviceValue(item), 0);
      subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);

      subtotal += session.giftServices.reduce((total, item) => total + serviceCost(item), 0);
      subtotal += session.giftProducts.reduce((total, item) => total + productCost(item), 0);

      return sum + subtotal;
    }, 0);
  }, [sessions]);

  const cardPrice = calculatedCardPrice + cardIncreaseTotal;
  const convenience = Math.max(0, valueListino - cardPrice);


  function addCardIncrease() {
    const amount = Number(String(cardIncreaseInput || 0).replace(',', '.'));

    if (!amount || amount <= 0) {
      setMessage('Inserisci un valore valido per aumentare il prezzo card.');
      return;
    }

    setCardIncreaseTotal((prev) => prev + amount);
    setCardIncreaseInput('');
    setMessage(`✅ Prezzo card aumentato di € ${amount.toFixed(2)}.`);
  }


  function emptyCatalogSessions(count = 4) {
    return Array.from({ length: count }).map(() => ({
      paidServices: [],
      paidProducts: [],
      giftServices: [],
      giftProducts: [],
    }));
  }

  function openCreateCatalogCard() {
    const cleanSessions = emptyCatalogSessions(4);

    setEditingCatalogIndex(null);
    setCatalogName('');
    setCatalogPrice('');
    setCatalogSessionsCount(4);
    setCatalogSessions(cleanSessions);
    setCatalogIncreaseInput('');
    setCatalogIncreaseTotal(0);
    setCatalogOpen(true);
  }

  function openEditCatalogCard(index: number) {
    const card = catalogCards[index];
    const savedSessions = card.sessions?.length ? card.sessions : emptyCatalogSessions(card.sessionsCount || 4);

    setEditingCatalogIndex(index);
    setCatalogName(card.name);
    setCatalogPrice(String(card.price));
    setCatalogSessionsCount(card.sessionsCount || savedSessions.length || 4);
    setCatalogSessions(savedSessions);
    setCatalogIncreaseInput('');
    setCatalogIncreaseTotal(card.increaseTotal || 0);
    setCatalogOpen(true);
  }

  function setCatalogSessionCount(value: number) {
    setCatalogSessionsCount(value);
    setCatalogSessions((prev) => {
      const next = [...prev];

      while (next.length < value) {
        next.push({
          paidServices: [],
          paidProducts: [],
          giftServices: [],
          giftProducts: [],
        });
      }

      return next.slice(0, value);
    });
  }


  function copyCatalogSessionToAll(index: number) {
    setCatalogSessions((prev) => {
      const source = prev[index];

      if (!source) return prev;

      return prev.map(() => ({
        paidServices: [...source.paidServices],
        paidProducts: [...source.paidProducts],
        giftServices: [...source.giftServices],
        giftProducts: [...source.giftProducts],
      }));
    });

    setMessage(`✅ Seduta catalogo ${index + 1} copiata su tutte.`);
  }


  function addCatalogSessionValue(index: number, key: keyof SessionItem, value: string) {
    if (!value) return;

    setCatalogSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = session[key] as string[];

        return {
          ...session,
          [key]: current.includes(value) ? current : [...current, value],
        };
      }),
    );
  }

  function removeCatalogSessionValue(index: number, key: keyof SessionItem, value: string) {
    setCatalogSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = session[key] as string[];

        return {
          ...session,
          [key]: current.filter((item) => item !== value),
        };
      }),
    );
  }

  function updateCatalogSession(index: number, key: keyof SessionItem, value: string[]) {
    setCatalogSessions((prev) =>
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

  const catalogValueListino = catalogSessions.reduce((sum, session) => {
    let subtotal = 0;

    subtotal += session.paidServices.reduce((total, item) => total + serviceValue(item), 0);
    subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);
    subtotal += session.giftServices.reduce((total, item) => total + serviceValue(item), 0);
    subtotal += session.giftProducts.reduce((total, item) => total + productValue(item), 0);

    return sum + subtotal;
  }, 0);

  const catalogCalculatedPrice = catalogSessions.reduce((sum, session) => {
    let subtotal = 0;

    subtotal += session.paidServices.reduce((total, item) => total + serviceValue(item), 0);
    subtotal += session.paidProducts.reduce((total, item) => total + productValue(item), 0);
    subtotal += session.giftServices.reduce((total, item) => total + serviceCost(item), 0);
    subtotal += session.giftProducts.reduce((total, item) => total + productCost(item), 0);

    return sum + subtotal;
  }, 0);

  const catalogFinalPrice = catalogCalculatedPrice + catalogIncreaseTotal;
  const catalogConvenience = Math.max(0, catalogValueListino - Number(String(catalogPrice || catalogFinalPrice || 0).replace(',', '.')));

  function addCatalogIncrease() {
    const amount = Number(String(catalogIncreaseInput || 0).replace(',', '.'));

    if (!amount || amount <= 0) {
      setMessage('Inserisci un valore valido per aumentare il prezzo della card catalogo.');
      return;
    }

    setCatalogIncreaseTotal((prev) => prev + amount);
    setCatalogIncreaseInput('');
  }

  function useCalculatedCatalogPrice() {
    setCatalogPrice(String(catalogFinalPrice.toFixed(2)));
  }

  function saveCatalogCard() {
    const name = catalogName.trim();
    const price = Number(String(catalogPrice || catalogFinalPrice || 0).replace(',', '.'));

    if (!name) {
      setMessage('Inserisci il nome della card.');
      return;
    }

    if (!price || price <= 0) {
      setMessage('Inserisci un prezzo valido oppure calcolalo dal carrello.');
      return;
    }

    const nextCard: CatalogCard = {
      name,
      price,
      sessionsCount: catalogSessionsCount,
      sessions: catalogSessions,
      increaseTotal: catalogIncreaseTotal,
    };

    setCatalogCards((prev) => {
      if (editingCatalogIndex === null) {
        return [...prev, nextCard];
      }

      return prev.map((card, index) => (index === editingCatalogIndex ? nextCard : card));
    });

    setSelectedCard(name);
    setManualCardName('');
    setManualPrice('');
    setCatalogOpen(false);
    setEditingCatalogIndex(null);
    setCatalogName('');
    setCatalogPrice('');
    setCatalogSessionsCount(4);
    setCatalogSessions(emptyCatalogSessions(4));
    setCatalogIncreaseInput('');
    setCatalogIncreaseTotal(0);
    setMessage(editingCatalogIndex === null ? '✅ Card catalogo creata con carrello.' : '✅ Card catalogo aggiornata con carrello.');
  }

  function deleteCatalogCard(index: number) {
    const card = catalogCards[index];
    const ok = confirm(`Vuoi eliminare "${card.name}" dal catalogo card?`);
    if (!ok) return;

    setCatalogCards((prev) => prev.filter((_, i) => i !== index));

    if (selectedCard === card.name) {
      setSelectedCard('');
    }

    setMessage('✅ Card catalogo eliminata.');
  }

  function setSessionCount(value: number) {
    setSessionsCount(value);
    setSessions((prev) => {
      const next = [...prev];

      while (next.length < value) {
        next.push({
          paidServices: [],
          paidProducts: [],
          giftServices: [],
          giftProducts: [],
        });
      }

      return next.slice(0, value);
    });
  }


  function copySessionToAll(index: number) {
    setSessions((prev) => {
      const source = prev[index];

      if (!source) return prev;

      return prev.map(() => ({
        paidServices: [...source.paidServices],
        paidProducts: [...source.paidProducts],
        giftServices: [...source.giftServices],
        giftProducts: [...source.giftProducts],
      }));
    });

    setMessage(`✅ Seduta ${index + 1} copiata su tutte le sedute.`);
  }


  function addSessionValue(index: number, key: keyof SessionItem, value: string) {
    if (!value) return;

    setSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = session[key] as string[];

        return {
          ...session,
          [key]: current.includes(value) ? current : [...current, value],
        };
      }),
    );
  }

  function removeSessionValue(index: number, key: keyof SessionItem, value: string) {
    setSessions((prev) =>
      prev.map((session, i) => {
        if (i !== index) return session;

        const current = session[key] as string[];

        return {
          ...session,
          [key]: current.filter((item) => item !== value),
        };
      }),
    );
  }

  function updateSession(index: number, key: keyof SessionItem, value: string[]) {
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
        paidServices: [],
        paidProducts: [],
        giftServices: [],
        giftProducts: [],
      })),
    );
    setCardIncreaseInput('');
    setCardIncreaseTotal(0);
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

          <button className="sp-button-purple" onClick={openCreateCatalogCard}>
            + Crea/modifica catalogo card
          </button>
        </header>

        {message ? <div style={successBox}>{message}</div> : null}

        {catalogOpen ? (
          <div style={modalBackdrop}>
            <div style={catalogModal}>
              <div style={catalogModalHeader}>
                <div>
                  <div style={greenKicker}>Catalogo card predefinite</div>
                  <h2 style={sectionTitle}>
                    {editingCatalogIndex === null ? 'Crea card predefinita' : 'Modifica card predefinita'}
                  </h2>
                </div>

                <button style={closeButton} onClick={() => setCatalogOpen(false)}>
                  ×
                </button>
              </div>

              <div style={infoBox}>
                Qui crei le card standard che vuoi riutilizzare dal menu “Scegli Card catalogo”.
                Non è il carrello del percorso: è solo il catalogo delle card predefinite.
              </div>

              <div style={catalogFormGrid}>
                <input
                  className="sp-input"
                  placeholder="Nome card es. Colore Blindato"
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                />

                <input
                  className="sp-input"
                  placeholder="Prezzo card €"
                  value={catalogPrice}
                  onChange={(e) => setCatalogPrice(e.target.value)}
                />

                <button style={smallPurple} onClick={saveCatalogCard}>
                  {editingCatalogIndex === null ? 'Crea card' : 'Salva modifica'}
                </button>
              </div>

              <div style={catalogBuilderBox}>
                <div style={sectionHeader}>
                  <div>
                    <div style={greenKicker}>Carrello della card</div>
                    <h2 style={sectionTitle}>{catalogSessionsCount} sedute</h2>
                    <p className="sp-muted" style={{ marginTop: 6 }}>Aggiungi più servizi e prodotti scegliendoli uno alla volta.</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="sp-muted">Sedute:</span>
                    <select
                        className="sp-input" style={{ marginTop: 10 }}
                        value=""
                        onChange={(e) => addCatalogSessionValue(index, 'giftProducts', e.target.value)}
                      >
                        <option value="">+ Prodotto omaggio...</option>
                        <option>Mini shampoo</option>
                        <option>Fiala trattamento</option>
                        <option>Campione premium</option>
                      </select>

                      <SelectedItems
                        items={session.giftProducts}
                        onRemove={(item) => removeCatalogSessionValue(index, 'giftProducts', item)}
                      />
              </div>
            ))}
          </div>

          <div style={increaseBox}>
            <div>
              <div style={greenKicker}>Aumento prezzo card</div>
              <div className="sp-muted" style={{ marginTop: 4 }}>
                Usa questo campo per alzare manualmente il prezzo finale della card.
              </div>
            </div>

            <input
              className="sp-input"
              placeholder="Valore aumento €"
              value={cardIncreaseInput}
              onChange={(e) => setCardIncreaseInput(e.target.value)}
            />

            <button style={smallPurple} onClick={addCardIncrease}>
              Aggiungi al prezzo card
            </button>

            <button
              style={miniBtn}
              onClick={() => {
                setCardIncreaseTotal(0);
                setCardIncreaseInput('');
              }}
            >
              Azzera aumento
            </button>
          </div>

          <div style={summaryGrid}>
            <Summary label="Valore a listino" value={`€ ${valueListino.toFixed(2)}`} />
            <Summary label="Prezzo Card" value={`€ ${cardPrice.toFixed(2)}`} />
            <Summary label="Convenienza Cliente" value={`€ ${convenience.toFixed(2)}`} />
            <Summary label="Sedute" value={String(sessionsCount)} />
          </div>

          {valueListino === 0 ? (
            <div style={warningBox}>
              💡 Aggiungi almeno un servizio o prodotto per calcolare il valore del percorso.
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

function serviceCost(service: string) {
  return Math.round(serviceValue(service) * 0.35 * 100) / 100;
}

function productValue(product: string) {
  if (product.includes('Maschera')) return 22;
  if (product.includes('Siero')) return 20;
  if (product.includes('Shampoo')) return 18;
  if (product.includes('Fiala')) return 12;
  if (product.includes('Mini')) return 8;
  if (product.includes('Campione')) return 6;
  return 15;
}

function productCost(product: string) {
  if (product.includes('Maschera')) return 8;
  if (product.includes('Siero')) return 7;
  if (product.includes('Shampoo')) return 6;
  if (product.includes('Fiala')) return 4;
  if (product.includes('Mini')) return 3;
  if (product.includes('Campione')) return 2;
  return 5;
}


function SelectedItems({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div style={selectedItemsWrap}>
      {items.map((item) => (
        <span key={item} style={selectedItemChip}>
          {item}
          <button type="button" style={selectedItemRemove} onClick={() => onRemove(item)}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="sp-muted">{label}</div>
      <div style={{ color: '#8b5cf6', fontSize: 22, fontWeight: 900 }}>{value}</div>
    </div>
  );
}


const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: 24,
  background: 'rgba(0,0,0,0.72)',
  backdropFilter: 'blur(8px)',
};

const catalogModal: React.CSSProperties = {
  width: 'min(1500px, 96vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 28,
  padding: 24,
  background: 'linear-gradient(180deg, rgba(25,25,25,0.98), rgba(8,8,8,0.98))',
  border: '1px solid rgba(212,175,55,0.28)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
};

const catalogModalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
};

const closeButton: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 26,
  fontWeight: 900,
  cursor: 'pointer',
};

const catalogFormGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 0.6fr auto',
  gap: 12,
  alignItems: 'center',
};

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



const selectedItemsWrap: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
  marginBottom: 4,
};

const selectedItemChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.13)',
  border: '1px solid rgba(212,175,55,0.30)',
  color: '#f5d76e',
  fontSize: 12,
  fontWeight: 900,
};

const selectedItemRemove: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: 16,
  fontWeight: 900,
  cursor: 'pointer',
  lineHeight: 1,
};

const sessionTitleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
};

const copySessionButton: React.CSSProperties = {
  border: '1px solid rgba(212,175,55,0.28)',
  borderRadius: 999,
  padding: '7px 10px',
  background: 'rgba(212,175,55,0.12)',
  color: '#f5d76e',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const sessionCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.09)',
};


const increaseBox: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.55fr auto auto',
  gap: 12,
  alignItems: 'center',
  marginTop: 22,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.22)',
};


const catalogBuilderBox: React.CSSProperties = {
  marginTop: 22,
  padding: 18,
  borderRadius: 22,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(212,175,55,0.22)',
};

const catalogSessionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))',
  gap: 14,
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