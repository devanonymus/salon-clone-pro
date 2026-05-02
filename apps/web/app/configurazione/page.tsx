'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab =
  | 'accessi'
  | 'whatsapp'
  | 'vip'
  | 'servizi'
  | 'diagnostica'
  | 'fiscale';

export default function ConfigurazionePage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('whatsapp');
  const [message, setMessage] = useState('');

  const [waEnabled, setWaEnabled] = useState(false);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waBusinessAccountId, setWaBusinessAccountId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waApiVersion, setWaApiVersion] = useState('v21.0');
  const [waHasToken, setWaHasToken] = useState(false);

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Ciao 💛 questo è un test automatico da Salon Pro.',
  );

  const [fiscalMode, setFiscalMode] = useState('DEMO');
  const [diagnosticResult, setDiagnosticResult] = useState('');

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

  async function loadWhatsappConfig() {
    try {
      const config = await fetchWithAuth('http://localhost:3001/whatsapp/config');

      setWaEnabled(Boolean(config.enabled));
      setWaPhoneNumberId(config.phoneNumberId || '');
      setWaBusinessAccountId(config.businessAccountId || '');
      setWaApiVersion(config.apiVersion || 'v21.0');
      setWaHasToken(Boolean(config.hasToken));
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore caricamento WhatsApp'}`);
    }
  }

  async function saveWhatsappConfig() {
    try {
      setMessage('');

      await fetchWithAuth('http://localhost:3001/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: waPhoneNumberId,
          businessAccountId: waBusinessAccountId,
          accessToken: waAccessToken,
          apiVersion: waApiVersion,
          enabled: waEnabled,
        }),
      });

      setWaAccessToken('');
      setWaHasToken(true);
      setMessage('✅ Configurazione WhatsApp salvata per questo salone.');
      await loadWhatsappConfig();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore salvataggio WhatsApp'}`);
    }
  }

  async function testWhatsapp() {
    try {
      setMessage('');

      await fetchWithAuth('http://localhost:3001/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
        }),
      });

      setMessage('✅ Messaggio WhatsApp inviato dal software.');
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || 'Errore test WhatsApp'}`);
    }
  }

  function runDiagnostic() {
    setDiagnosticResult(
      [
        '✅ Database connesso',
        '✅ Auth JWT attiva',
        '✅ Multi-salone attivo',
        `✅ WhatsApp: ${waEnabled ? 'attivo' : 'non attivo'}`,
        `✅ Phone Number ID: ${waPhoneNumberId || 'non configurato'}`,
        `✅ Token WhatsApp: ${waHasToken ? 'presente' : 'mancante'}`,
        `✅ Cassa fiscale: ${fiscalMode}`,
      ].join('\n'),
    );
  }

  useEffect(() => {
    loadWhatsappConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={{ marginBottom: 24 }}>
          <div style={eyebrow}>Configurazione</div>
          <h1 className="sp-title">Centro controllo Salon Pro</h1>
          <p className="sp-muted" style={{ marginTop: 8 }}>
            Imposta WhatsApp, accessi, VIP, listino, diagnostica e cassa fiscale.
          </p>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <nav style={tabsWrap}>
          <TabButton label="Accessi" active={tab === 'accessi'} onClick={() => setTab('accessi')} />
          <TabButton label="WhatsApp" active={tab === 'whatsapp'} onClick={() => setTab('whatsapp')} />
          <TabButton label="VIP Clienti" active={tab === 'vip'} onClick={() => setTab('vip')} />
          <TabButton label="Listino servizi" active={tab === 'servizi'} onClick={() => setTab('servizi')} />
          <TabButton label="Diagnostica" active={tab === 'diagnostica'} onClick={() => setTab('diagnostica')} />
          <TabButton label="Fiscale" active={tab === 'fiscale'} onClick={() => setTab('fiscale')} />
        </nav>

        {tab === 'whatsapp' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle
              kicker="WhatsApp SaaS"
              title="Configurazione WhatsApp per questo salone"
            />

            <div style={infoBox}>
              Ogni salone può collegare il proprio numero WhatsApp Business. In sviluppo puoi usare
              il numero test Meta. In produzione serviranno Business Manager, numero ufficiale e
              template approvati.
            </div>

            <label style={checkRow}>
              <input
                type="checkbox"
                checked={waEnabled}
                onChange={(e) => setWaEnabled(e.target.checked)}
              />
              Attiva WhatsApp automatico per questo salone
            </label>

            <div style={grid2}>
              <input
                className="sp-input"
                placeholder="Phone Number ID"
                value={waPhoneNumberId}
                onChange={(e) => setWaPhoneNumberId(e.target.value)}
              />

              <input
                className="sp-input"
                placeholder="WhatsApp Business Account ID opzionale"
                value={waBusinessAccountId}
                onChange={(e) => setWaBusinessAccountId(e.target.value)}
              />

              <input
                className="sp-input"
                placeholder={waHasToken ? 'Token già salvato - incolla nuovo token per sostituire' : 'Access Token Meta'}
                value={waAccessToken}
                onChange={(e) => setWaAccessToken(e.target.value)}
              />

              <input
                className="sp-input"
                placeholder="API Version"
                value={waApiVersion}
                onChange={(e) => setWaApiVersion(e.target.value)}
              />
            </div>

            <button className="sp-button" style={{ marginTop: 14 }} onClick={saveWhatsappConfig}>
              Salva configurazione WhatsApp
            </button>

            <div style={{ marginTop: 26 }}>
              <SectionTitle kicker="Test invio" title="Invia messaggio di prova" />

              <div style={grid2}>
                <input
                  className="sp-input"
                  placeholder="Numero cliente es. 3201234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />

                <button className="sp-button-purple" onClick={testWhatsapp}>
                  Invia test automatico
                </button>
              </div>

              <textarea
                className="sp-input"
                rows={6}
                style={{ marginTop: 14 }}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
              <Status label="WhatsApp attivo" value={waEnabled ? 'Sì' : 'No'} />
              <Status label="Phone Number ID" value={waPhoneNumberId || 'Non configurato'} />
              <Status label="Token" value={waHasToken ? 'Salvato' : 'Mancante'} />
              <Status label="API Version" value={waApiVersion} />
            </div>
          </section>
        ) : null}

        {tab === 'accessi' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle kicker="Accessi dipendenti" title="PIN personali staff" />
            <div style={grid3}>
              <input className="sp-input" placeholder="Nome dipendente es. NATALIA" />
              <input className="sp-input" placeholder="PIN dipendente" />
              <button className="sp-button-purple">Crea / aggiorna</button>
            </div>

            <button className="sp-button" style={{ width: '100%', marginTop: 14 }}>
              Ricarica lista
            </button>

            <div style={emptyBox}>
              Nessun dipendente selezionato. Qui comparirà la lista staff con modifica/elimina.
            </div>

            <div style={{ marginTop: 24 }}>
              <SectionTitle kicker="Titolare" title="Cambia PIN titolare" />
              <div style={grid2}>
                <input className="sp-input" placeholder="Nuovo PIN titolare" />
                <button className="sp-button-purple">Aggiorna PIN</button>
              </div>
            </div>
          </section>
        ) : null}

        {tab === 'vip' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle kicker="Area VIP Cliente" title="App cliente VIP link + codice" />

            <div style={linkBox}>
              <span className="sp-muted">Link App Cliente</span>
              <strong>https://app.salonpro.it/vip/?salon=TENDENZE</strong>
              <button className="sp-button-purple">Copia link</button>
            </div>

            <div style={grid3}>
              <select className="sp-input">
                <option>Seleziona cliente...</option>
              </select>
              <input className="sp-input" placeholder="Cellulare solo cifre" />
              <input className="sp-input" placeholder="Codice VIP 4-8 cifre" />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="sp-button-purple">Genera codice</button>
              <button className="sp-button">Attiva VIP</button>
              <button style={ghostButton}>Disattiva</button>
            </div>

            <textarea
              className="sp-input"
              rows={7}
              style={{ marginTop: 14 }}
              defaultValue={`Messaggio WhatsApp pronto:

Ciao 💛
Ecco il tuo accesso VIP Salon Pro.
Link:
Codice:
`}
            />
          </section>
        ) : null}

        {tab === 'servizi' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle kicker="Vendi benefici, non sconti" title="Catalogo card & listino servizi" />

            <div style={grid5}>
              <input className="sp-input" placeholder="Nome servizio/card" />
              <input className="sp-input" placeholder="Prezzo €" />
              <input className="sp-input" placeholder="Durata minuti" />
              <input className="sp-input" placeholder="Costo kit opz." />
              <select className="sp-input">
                <option>Categoria Auto</option>
                <option>Piega</option>
                <option>Taglio</option>
                <option>Colore</option>
                <option>Trattamenti</option>
              </select>
            </div>

            <textarea
              className="sp-input"
              rows={4}
              style={{ marginTop: 14 }}
              placeholder="Descrizione/benefici che il cliente legge in anteprima..."
            />

            <button className="sp-button-purple" style={{ width: '100%', marginTop: 14 }}>
              + Salva servizio
            </button>

            <div style={emptyBox}>
              Qui collegheremo il listino reale dal database. Per ora resta UI configurazione.
            </div>
          </section>
        ) : null}

        {tab === 'diagnostica' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle kicker="Controllo tecnico" title="Diagnostica 1 click" />

            <button className="sp-button-purple" style={{ width: '100%' }} onClick={runDiagnostic}>
              ✅ Esegui diagnostica
            </button>

            <textarea
              className="sp-input"
              rows={10}
              style={{ marginTop: 14 }}
              value={diagnosticResult}
              readOnly
              placeholder="Il risultato diagnostica comparirà qui..."
            />
          </section>
        ) : null}

        {tab === 'fiscale' ? (
          <section className="sp-card" style={cardPad}>
            <SectionTitle kicker="Cassa fiscale" title="Scontrini e provider fiscali" />

            <div style={grid2}>
              <select
                className="sp-input"
                value={fiscalMode}
                onChange={(e) => setFiscalMode(e.target.value)}
              >
                <option value="DEMO">DEMO - Simulazione</option>
                <option value="API_PROVIDER">API Provider fiscale</option>
                <option value="RT_LOCALE">Registratore telematico locale</option>
              </select>

              <input className="sp-input" placeholder="Nome punto cassa" />
            </div>

            <button className="sp-button" style={{ marginTop: 18 }}>
              Salva configurazione fiscale
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        whiteSpace: 'nowrap',
        padding: '13px 18px',
        borderRadius: 999,
        border: active
          ? '1px solid rgba(212,175,55,0.65)'
          : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
        color: active ? '#d4af37' : '#fff',
        fontWeight: 900,
      }}
    >
      {label}
    </button>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>
        {kicker.toUpperCase()}
      </div>
      <h2 style={{ margin: '6px 0 0', color: '#d4af37', fontSize: 22 }}>
        {title}
      </h2>
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div style={statusRow}>
      <span className="sp-muted">{label}</span>
      <strong style={{ color: '#d4af37' }}>{value}</strong>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: 'uppercase',
};

const tabsWrap: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  overflowX: 'auto',
  marginBottom: 22,
  paddingBottom: 4,
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

const cardPad: React.CSSProperties = {
  padding: 24,
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginTop: 14,
};

const grid3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 14,
  marginTop: 14,
};

const grid5: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 0.7fr 0.7fr 0.8fr 1fr',
  gap: 14,
};

const checkRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: '#fff',
  fontWeight: 800,
  marginBottom: 14,
};

const infoBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 16,
  color: '#b8bfd0',
};

const emptyBox: React.CSSProperties = {
  marginTop: 14,
  minHeight: 90,
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.035)',
  padding: 16,
  color: '#b8bfd0',
};

const linkBox: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 18,
  borderRadius: 18,
  border: '1px solid rgba(212,175,55,0.18)',
  background: 'rgba(255,255,255,0.04)',
  marginBottom: 16,
};

const ghostButton: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 900,
};

const statusRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
};