'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type WhatsappMessage = {
  id: string;
  direction: 'IN' | 'OUT' | string;
  phone: string;
  text: string;
  providerId?: string | null;
  createdAt: string;
};

type WhatsappConversation = {
  id: string;
  phone: string;
  name?: string | null;
  lastMessage?: string | null;
  lastAt: string;
  messages: WhatsappMessage[];
};

export default function ChatPage() {
  const router = useRouter();

  const [conversations, setConversations] = useState<WhatsappConversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const filteredConversations = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return conversations;

    return conversations.filter((conversation) => {
      return (
        conversation.phone.toLowerCase().includes(q) ||
        (conversation.name || '').toLowerCase().includes(q) ||
        (conversation.lastMessage || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, search]);

  async function fetchWithAuth(url: string, options?: RequestInit) {
    const token = localStorage.getItem('salonpro_token');

    if (!token) {
      router.push('/login');
      throw new Error('Token mancante');
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const msg =
        typeof data?.message === 'object'
          ? JSON.stringify(data.message)
          : data?.message;

      throw new Error(msg || 'Errore richiesta');
    }

    return data;
  }

  async function loadConversations() {
    try {
      setMessage('');

      const data = await fetchWithAuth('http://localhost:3001/whatsapp/conversations');

      setConversations(data);

      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore caricamento chat'}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedConversation) return;
    if (!text.trim()) return;

    setSending(true);
    setMessage('');

    try {
      await fetchWithAuth(
        `http://localhost:3001/whatsapp/conversations/${selectedConversation.id}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
          }),
        },
      );

      setText('');
      await loadConversations();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore invio messaggio'}`);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadConversations();

    const interval = setInterval(() => {
      loadConversations();
    }, 6000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="sp-page">
        <div className="sp-shell">Caricamento chat WhatsApp...</div>
      </main>
    );
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>WhatsApp CRM</div>
            <h1 className="sp-title">Chat clienti</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Ricevi, leggi e rispondi ai messaggi WhatsApp direttamente da Salon Pro.
            </p>
          </div>

          <button className="sp-button-purple" onClick={loadConversations}>
            Aggiorna
          </button>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section className="sp-card" style={chatLayout}>
          <aside style={sidebar}>
            <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                className="sp-input"
                placeholder="Cerca cliente o numero..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={conversationList}>
              {filteredConversations.length === 0 ? (
                <div style={emptyBox}>
                  Nessuna conversazione ancora. Scrivi al numero WhatsApp collegato per crearne una.
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const active = conversation.id === selectedId;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedId(conversation.id)}
                      style={{
                        ...conversationRow,
                        background: active
                          ? 'linear-gradient(135deg,rgba(139,92,246,0.24),rgba(212,175,55,0.12))'
                          : 'transparent',
                        borderColor: active
                          ? 'rgba(212,175,55,0.32)'
                          : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={avatar}>
                        {(conversation.name || conversation.phone).slice(0, 1).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={conversationTop}>
                          <strong style={{ color: '#fff' }}>
                            {conversation.name || conversation.phone}
                          </strong>
                          <span className="sp-muted" style={{ fontSize: 11 }}>
                            {formatTime(conversation.lastAt)}
                          </span>
                        </div>

                        <div style={lastMessage}>
                          {conversation.lastMessage || 'Nuova conversazione'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div style={chatPanel}>
            {selectedConversation ? (
              <>
                <div style={chatHeader}>
                  <div style={avatarLarge}>
                    {(selectedConversation.name || selectedConversation.phone)
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h2 style={{ margin: 0, color: '#d4af37' }}>
                      {selectedConversation.name || selectedConversation.phone}
                    </h2>
                    <div className="sp-muted" style={{ marginTop: 4 }}>
                      {selectedConversation.phone}
                    </div>
                  </div>
                </div>

                <div style={messagesArea}>
                  {selectedConversation.messages.length === 0 ? (
                    <div style={emptyBox}>Nessun messaggio in questa conversazione.</div>
                  ) : (
                    selectedConversation.messages.map((msg) => {
                      const mine = msg.direction === 'OUT';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            ...bubbleWrap,
                            justifyContent: mine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              ...bubble,
                              background: mine
                                ? 'linear-gradient(135deg,#8b5cf6,#d4af37)'
                                : 'rgba(255,255,255,0.075)',
                              border: mine
                                ? '1px solid rgba(212,175,55,0.28)'
                                : '1px solid rgba(255,255,255,0.10)',
                            }}
                          >
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 11,
                                opacity: 0.75,
                                textAlign: mine ? 'right' : 'left',
                              }}
                            >
                              {formatDateTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={inputBar}>
                  <textarea
                    className="sp-input"
                    rows={2}
                    placeholder="Scrivi una risposta..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />

                  <button
                    className="sp-button-purple"
                    disabled={sending || !text.trim()}
                    onClick={sendMessage}
                    style={{ minWidth: 150 }}
                  >
                    {sending ? 'Invio...' : 'Invia'}
                  </button>
                </div>
              </>
            ) : (
              <div style={noSelection}>
                <h2 style={{ color: '#d4af37' }}>Seleziona una chat</h2>
                <p className="sp-muted">
                  Le conversazioni appariranno qui quando un cliente scrive al numero WhatsApp del salone.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatTime(value: string) {
  const d = new Date(value);

  return d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value: string) {
  const d = new Date(value);

  return d.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 22,
  flexWrap: 'wrap',
};

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: 'uppercase',
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

const chatLayout: React.CSSProperties = {
  padding: 0,
  height: 'calc(100vh - 230px)',
  minHeight: 620,
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: '360px 1fr',
};

const sidebar: React.CSSProperties = {
  borderRight: '1px solid rgba(255,255,255,0.08)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const conversationList: React.CSSProperties = {
  overflowY: 'auto',
  padding: 12,
  display: 'grid',
  gap: 10,
};

const conversationRow: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  textAlign: 'left',
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  cursor: 'pointer',
};

const avatar: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  fontWeight: 900,
  flexShrink: 0,
};

const avatarLarge: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  fontWeight: 900,
  fontSize: 22,
};

const conversationTop: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
};

const lastMessage: React.CSSProperties = {
  marginTop: 5,
  color: '#b8bfd0',
  fontSize: 13,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const chatPanel: React.CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
};

const chatHeader: React.CSSProperties = {
  padding: 18,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  background:
    'radial-gradient(circle at top right, rgba(212,175,55,0.12), transparent 32%), rgba(0,0,0,0.18)',
};

const messagesArea: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background:
    'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.08), transparent 28%), rgba(0,0,0,0.14)',
};

const bubbleWrap: React.CSSProperties = {
  display: 'flex',
};

const bubble: React.CSSProperties = {
  maxWidth: '68%',
  padding: '12px 14px',
  borderRadius: 18,
  color: '#fff',
  fontWeight: 700,
  lineHeight: 1.45,
};

const inputBar: React.CSSProperties = {
  padding: 16,
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
  borderTop: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(0,0,0,0.2)',
};

const noSelection: React.CSSProperties = {
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: 40,
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#b8bfd0',
};