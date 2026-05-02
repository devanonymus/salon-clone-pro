'use client';

import { useEffect, useState } from 'react';

type Message = {
  id: string;
  direction: 'IN' | 'OUT' | string;
  text: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  phone: string;
  name?: string | null;
  lastMessage?: string | null;
  messages: Message[];
};

export default function WhatsappChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const selected = conversations.find((c) => c.id === selectedId);

  async function fetchWithAuth(url: string, options?: RequestInit) {
    const token = localStorage.getItem('salonpro_token');
    if (!token) return null;

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

      throw new Error(msg || 'Errore WhatsApp');
    }

    return data;
  }

  async function load() {
    try {
      setError('');

      const data = await fetchWithAuth('http://localhost:3001/whatsapp/conversations');
      if (!data) return;

      setConversations(data);

      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Errore caricamento chat');
    }
  }

  async function send() {
    if (!selected || !text.trim()) return;

    setSending(true);
    setError('');

    try {
      await fetchWithAuth(
        `http://localhost:3001/whatsapp/conversations/${selected.id}/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() }),
        },
      );

      setText('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Errore invio messaggio');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    load();

    const interval = setInterval(load, 7000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {open ? (
        <div style={box}>
          <div style={header}>
            <div>
              <strong>WhatsApp CRM</strong>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Chat clienti</div>
            </div>

            <button onClick={() => setOpen(false)} style={closeBtn}>
              ×
            </button>
          </div>

          {error ? <div style={errorBox}>⚠️ {error}</div> : null}

          <div style={body}>
            <aside style={list}>
              {conversations.length === 0 ? (
                <div style={empty}>Nessuna chat.</div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      ...row,
                      background:
                        c.id === selectedId
                          ? 'rgba(212,175,55,0.16)'
                          : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <strong>{c.name || c.phone}</strong>
                    <span>{c.lastMessage || 'Nuova conversazione'}</span>
                  </button>
                ))
              )}
            </aside>

            <section style={chat}>
              {selected ? (
                <>
                  <div style={chatTitle}>
                    <strong>{selected.name || selected.phone}</strong>
                    <span>{selected.phone}</span>
                  </div>

                  <div style={messages}>
                    {selected.messages.map((m) => {
                      const mine = m.direction === 'OUT';

                      return (
                        <div
                          key={m.id}
                          style={{
                            display: 'flex',
                            justifyContent: mine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              ...bubble,
                              background: mine
                                ? 'linear-gradient(135deg,#8b5cf6,#d4af37)'
                                : 'rgba(255,255,255,0.09)',
                            }}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={inputWrap}>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Scrivi..."
                      style={input}
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                    />

                    <button onClick={send} disabled={sending} style={sendBtn}>
                      {sending ? '...' : 'Invia'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={empty}>Seleziona una chat.</div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      <button onClick={() => setOpen(true)} style={floatingBtn}>
        ☎
        {conversations.length > 0 ? <span style={badge}>{conversations.length}</span> : null}
      </button>
    </>
  );
}

const floatingBtn: React.CSSProperties = {
  position: 'fixed',
  right: 24,
  bottom: 24,
  width: 64,
  height: 64,
  borderRadius: '50%',
  border: 0,
  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
  color: '#fff',
  fontSize: 28,
  fontWeight: 900,
  boxShadow: '0 18px 45px rgba(0,0,0,0.35)',
  zIndex: 9999,
  cursor: 'pointer',
};

const badge: React.CSSProperties = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 22,
  height: 22,
  borderRadius: 999,
  background: '#d4af37',
  color: '#050505',
  fontSize: 12,
  display: 'grid',
  placeItems: 'center',
};

const box: React.CSSProperties = {
  position: 'fixed',
  right: 24,
  bottom: 100,
  width: 760,
  height: 560,
  borderRadius: 26,
  overflow: 'hidden',
  background: '#090909',
  border: '1px solid rgba(212,175,55,0.28)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
  zIndex: 9999,
};

const header: React.CSSProperties = {
  height: 66,
  padding: '0 18px',
  background: 'linear-gradient(135deg,#111,#1d1238)',
  borderBottom: '1px solid rgba(212,175,55,0.22)',
  color: '#d4af37',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const closeBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 22,
  cursor: 'pointer',
};

const body: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '260px 1fr',
  height: 'calc(100% - 66px)',
};

const list: React.CSSProperties = {
  borderRight: '1px solid rgba(255,255,255,0.08)',
  padding: 10,
  overflowY: 'auto',
};

const row: React.CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: 12,
  color: '#fff',
  textAlign: 'left',
  display: 'grid',
  gap: 5,
  marginBottom: 8,
  cursor: 'pointer',
};

const chat: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const chatTitle: React.CSSProperties = {
  padding: 14,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  display: 'grid',
  gap: 4,
};

const messages: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const bubble: React.CSSProperties = {
  maxWidth: '78%',
  padding: '10px 12px',
  borderRadius: 16,
  color: '#fff',
  fontWeight: 700,
  lineHeight: 1.4,
};

const inputWrap: React.CSSProperties = {
  padding: 12,
  borderTop: '1px solid rgba(255,255,255,0.08)',
  display: 'grid',
  gridTemplateColumns: '1fr 86px',
  gap: 10,
};

const input: React.CSSProperties = {
  resize: 'none',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  padding: 12,
  outline: 'none',
};

const sendBtn: React.CSSProperties = {
  borderRadius: 14,
  border: 0,
  background: 'linear-gradient(135deg,#8b5cf6,#d4af37)',
  color: '#fff',
  fontWeight: 900,
};

const empty: React.CSSProperties = {
  color: '#b8bfd0',
  padding: 16,
};

const errorBox: React.CSSProperties = {
  padding: 10,
  background: 'rgba(239,68,68,0.16)',
  color: '#fecaca',
  fontWeight: 900,
};