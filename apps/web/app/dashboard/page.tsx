'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ClientItem = {
  id: string;
  clientGlobal: {
    id: string;
    name: string;
    phone: string;
  };
};

type AppointmentItem = {
  id: string;
  date: string;
  duration: number;
  note: string | null;
  sale?: { id: string } | null;
  clientTenant: {
    clientGlobal: {
      name: string;
      phone: string;
    };
  };
};

type SaleItem = {
  id: string;
  total: number;
  paymentMethod: string | null;
  fiscalStatus?: string;
  createdAt: string;
  clientGlobal: {
    name: string;
    phone: string;
  };
  items?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchWithAuth(url: string) {
    const token = localStorage.getItem('salonpro_token');

    if (!token) {
      router.push('/login');
      throw new Error('Token mancante');
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Errore richiesta');

    return data;
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const [clientsData, appointmentsData, salesData] = await Promise.all([
        fetchWithAuth('http://localhost:3001/clients'),
        fetchWithAuth('http://localhost:3001/appointments'),
        fetchWithAuth('http://localhost:3001/sales'),
      ]);

      setClients(clientsData);
      setAppointments(appointmentsData);
      setSales(salesData);
    } catch (err: any) {
      setError(err.message || 'Errore caricamento dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date();

  function isSameDay(value: string) {
    const d = new Date(value);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }

  function isSameMonth(value: string) {
    const d = new Date(value);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  const fatturatoOggi = useMemo(() => {
    return sales
      .filter((sale) => isSameDay(sale.createdAt))
      .reduce((sum, sale) => sum + sale.total, 0);
  }, [sales]);

  const fatturatoMese = useMemo(() => {
    return sales
      .filter((sale) => isSameMonth(sale.createdAt))
      .reduce((sum, sale) => sum + sale.total, 0);
  }, [sales]);

  const appuntamentiOggi = useMemo(() => {
    return appointments.filter((appointment) => isSameDay(appointment.date)).length;
  }, [appointments]);

  const appuntamentiConvertiti = useMemo(() => {
    return appointments.filter((appointment) => appointment.sale).length;
  }, [appointments]);

  const conversionRate = useMemo(() => {
    if (appointments.length === 0) return 0;
    return (appuntamentiConvertiti / appointments.length) * 100;
  }, [appointments.length, appuntamentiConvertiti]);

  const scontriniDaEmettere = useMemo(() => {
    return sales.filter((sale) => sale.fiscalStatus !== 'ISSUED').length;
  }, [sales]);

  const scontrinoMedio = useMemo(() => {
    if (sales.length === 0) return 0;
    return sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length;
  }, [sales]);

  const prossimiAppuntamenti = useMemo(() => {
    return [...appointments]
      .filter((appointment) => new Date(appointment.date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, [appointments]);

  const ultimeVendite = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [sales]);

  const coachMessage = useMemo(() => {
    if (fatturatoOggi === 0 && appuntamentiOggi > 0) {
      return 'Hai appuntamenti oggi: trasforma ogni servizio in una vendita completa.';
    }

    if (conversionRate < 50 && appointments.length > 0) {
      return 'La conversione appuntamenti → vendite può salire: collega sempre la vendita all’appuntamento.';
    }

    if (scontriniDaEmettere > 0) {
      return 'Ci sono vendite senza scontrino: completa la parte fiscale prima della chiusura.';
    }

    return 'Il salone è sotto controllo. Mantieni ritmo, esperienza e qualità.';
  }, [fatturatoOggi, appuntamentiOggi, conversionRate, appointments.length, scontriniDaEmettere]);

  if (loading) {
    return <main className="sp-page">Caricamento Dashboard Coach...</main>;
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={{ marginBottom: 24 }}>
          <div style={eyebrow}>Dashboard Coach</div>
          <h1 className="sp-title">La regia del tuo salone</h1>
          <p className="sp-muted" style={{ marginTop: 8 }}>
            Numeri, alert e azioni per guidare incassi, appuntamenti e clienti.
          </p>
        </header>

        {error ? (
          <div style={errorBox}>⚠️ {error}</div>
        ) : null}

        <section style={heroGrid}>
          <div className="sp-card" style={heroCard}>
            <div style={{ color: '#8b5cf6', fontWeight: 900, letterSpacing: 2, fontSize: 12 }}>
              COACH DEL GIORNO
            </div>

            <h2 style={{ margin: '10px 0', fontSize: 32, color: '#d4af37' }}>
              {coachMessage}
            </h2>

            <p className="sp-muted" style={{ lineHeight: 1.6 }}>
              Salon Pro ti aiuta a guardare non solo cosa è successo, ma cosa fare adesso.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <a href="/agenda" style={goldAction}>Apri agenda</a>
              <a href="/vendite" style={purpleAction}>Vai alla cassa</a>
            </div>
          </div>

          <div className="sp-card" style={sideCoachCard}>
            <div className="sp-muted">Scontrino medio</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#d4af37', marginTop: 8 }}>
              € {scontrinoMedio.toFixed(2)}
            </div>
            <div className="sp-muted" style={{ marginTop: 10 }}>
              Aumentarlo anche di pochi euro cambia il mese.
            </div>
          </div>
        </section>

        <section style={kpiGrid}>
          <Kpi title="Fatturato oggi" value={`€ ${fatturatoOggi.toFixed(2)}`} sub="Incasso giornaliero" />
          <Kpi title="Fatturato mese" value={`€ ${fatturatoMese.toFixed(2)}`} sub="Visione mensile" />
          <Kpi title="Appuntamenti oggi" value={String(appuntamentiOggi)} sub="Movimento salone" />
          <Kpi title="Clienti totali" value={String(clients.length)} sub="Base clienti" />
          <Kpi title="Conversione" value={`${conversionRate.toFixed(0)}%`} sub="Appuntamenti → vendite" />
          <Kpi title="Scontrini da emettere" value={String(scontriniDaEmettere)} sub="Controllo fiscale" danger={scontriniDaEmettere > 0} />
        </section>

        <section style={mainGrid}>
          <div className="sp-card" style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>Prossimi appuntamenti</h2>
                <p className="sp-muted" style={{ margin: 0 }}>Il ritmo operativo delle prossime ore</p>
              </div>
              <a href="/agenda" style={miniLink}>Agenda</a>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {prossimiAppuntamenti.length === 0 ? (
                <Empty text="Nessun appuntamento imminente." />
              ) : (
                prossimiAppuntamenti.map((appointment) => (
                  <div key={appointment.id} style={appointmentRow}>
                    <div>
                      <strong>{appointment.clientTenant.clientGlobal.name}</strong>
                      <div className="sp-muted" style={{ marginTop: 4 }}>
                        {appointment.note || 'Appuntamento'}
                      </div>
                      <div style={{ color: '#d4af37', marginTop: 6, fontWeight: 900 }}>
                        {new Date(appointment.date).toLocaleString('it-IT', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div style={statusPill}>
                      {appointment.sale ? 'Venduto' : `${appointment.duration} min`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sp-card" style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={sectionTitle}>Ultime vendite</h2>
                <p className="sp-muted" style={{ margin: 0 }}>Movimenti recenti in cassa</p>
              </div>
              <a href="/vendite" style={miniLink}>Cassa</a>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {ultimeVendite.length === 0 ? (
                <Empty text="Nessuna vendita registrata." />
              ) : (
                ultimeVendite.map((sale) => (
                  <div key={sale.id} style={saleRow}>
                    <div>
                      <strong>{sale.clientGlobal.name}</strong>
                      <div className="sp-muted" style={{ marginTop: 4 }}>
                        {new Date(sale.createdAt).toLocaleString('it-IT')}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          color: sale.fiscalStatus === 'ISSUED' ? '#65e696' : '#fbbf24',
                          fontWeight: 900,
                        }}
                      >
                        {sale.fiscalStatus === 'ISSUED' ? 'Scontrino emesso' : 'Da emettere'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, color: '#d4af37', fontWeight: 900 }}>
                        € {sale.total.toFixed(2)}
                      </div>
                      <div className="sp-muted">{paymentLabel(sale.paymentMethod)}</div>
                    </div>
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

function Kpi({
  title,
  value,
  sub,
  danger,
}: {
  title: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div
      className="sp-card"
      style={{
        padding: 20,
        borderColor: danger ? 'rgba(239,68,68,0.45)' : 'rgba(212,175,55,0.22)',
      }}
    >
      <div className="sp-muted">{title}</div>
      <div
        style={{
          marginTop: 10,
          fontSize: 32,
          fontWeight: 900,
          color: danger ? '#f87171' : '#d4af37',
        }}
      >
        {value}
      </div>
      <div className="sp-muted" style={{ marginTop: 8, fontSize: 13 }}>
        {sub}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 18,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#b8bfd0',
      }}
    >
      {text}
    </div>
  );
}

function paymentLabel(value?: string | null) {
  if (value === 'card') return 'Carta';
  if (value === 'cash') return 'Contanti';
  if (value === 'mixed') return 'Misto';
  if (value === 'bank') return 'Bonifico';
  return 'Pagamento';
}

const eyebrow: React.CSSProperties = {
  color: '#d4af37',
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
  textTransform: 'uppercase',
};

const errorBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(239,68,68,0.14)',
  border: '1px solid rgba(239,68,68,0.35)',
  color: '#fecaca',
  fontWeight: 900,
};

const heroGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 0.8fr',
  gap: 20,
  marginBottom: 20,
};

const heroCard: React.CSSProperties = {
  padding: 28,
  background:
    'radial-gradient(circle at top left, rgba(139,92,246,0.22), transparent 40%), rgba(255,255,255,0.055)',
};

const sideCoachCard: React.CSSProperties = {
  padding: 28,
  background:
    'radial-gradient(circle at top right, rgba(212,175,55,0.18), transparent 36%), rgba(255,255,255,0.055)',
};

const goldAction: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 16,
  background: 'linear-gradient(135deg,#d4af37,#f5d76e)',
  color: '#050505',
  fontWeight: 900,
};

const purpleAction: React.CSSProperties = {
  padding: '14px 18px',
  borderRadius: 16,
  background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  color: '#fff',
  fontWeight: 900,
};

const kpiGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 20,
};

const mainGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
};

const panel: React.CSSProperties = {
  padding: 22,
};

const panelHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  color: '#d4af37',
};

const miniLink: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  background: 'rgba(139,92,246,0.16)',
  border: '1px solid rgba(139,92,246,0.28)',
  color: '#d8c8ff',
  fontWeight: 900,
};

const appointmentRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const saleRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const statusPill: React.CSSProperties = {
  alignSelf: 'start',
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(212,175,55,0.14)',
  border: '1px solid rgba(212,175,55,0.24)',
  color: '#d4af37',
  fontWeight: 900,
  whiteSpace: 'nowrap',
};