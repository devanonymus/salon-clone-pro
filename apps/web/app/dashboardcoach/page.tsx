"use client";

import { useMemo, useState } from "react";

type FixedCost = {
  id: string;
  name: string;
  amount: number;
};

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const INITIAL_COSTS: FixedCost[] = [
  { id: "1", name: "FITTO LOCALE", amount: 1250 },
  { id: "2", name: "COMMERCIALISTA / CONSULENZA", amount: 250 },
  { id: "3", name: "SOFTWARE ACQUAVIVA STRATEGIC", amount: 80 },
  { id: "4", name: "ENERGIA ELETTRICA", amount: 450 },
  { id: "5", name: "GAS / RISCALDAMENTO", amount: 150 },
  { id: "6", name: "ACQUA", amount: 60 },
  { id: "7", name: "INTERNET / TELEFONO", amount: 60 },
  { id: "8", name: "TARI / RIFIUTI", amount: 120 },
  { id: "9", name: "ASSICURAZIONE", amount: 70 },
  { id: "10", name: "PULIZIE / IGIENE", amount: 200 },
];

function euro(value: number) {
  return `€ ${value.toFixed(2)}`;
}

export default function DashboardCoachPage() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [ivaServizi, setIvaServizi] = useState("22");
  const [ivaRivendita, setIvaRivendita] = useState("22");
  const [oreProd, setOreProd] = useState("140");
  const [feePos, setFeePos] = useState("1.5");
  const [feePosFisso, setFeePosFisso] = useState("0");
  const [overhead, setOverhead] = useState("3");
  const [riservaTasse, setRiservaTasse] = useState("25");
  const [grigliaAgenda, setGrigliaAgenda] = useState("5");
  const [domain, setDomain] = useState("app.acquavivastrategic.it");
  const [cardCostIncluded, setCardCostIncluded] = useState(false);

  const [fishBase, setFishBase] = useState("");
  const [clientiPrevisti, setClientiPrevisti] = useState("");
  const [objective, setObjective] = useState("+10%");

  const [costName, setCostName] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(INITIAL_COSTS);

  const report = useMemo(() => {
    const fatturatoLordo = 155;
    const iva = 27.97;
    const netto = fatturatoLordo - iva;
    const commissioni = 0;
    const costoPersonale = 37.91;
    const costoProdotti = 5.5;
    const costiFissi = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
    const utileOperativo = netto - commissioni - costoPersonale - costoProdotti - costiFissi;
    const riserva = Math.max(0, utileOperativo * (Number(riservaTasse || 0) / 100));
    const utileReale = utileOperativo - riserva;
    const fishMedio = 25.83;
    const crescita = 3.3;

    return {
      fatturatoLordo,
      iva,
      netto,
      commissioni,
      costoPersonale,
      costoProdotti,
      costiFissi,
      utileOperativo,
      riserva,
      utileReale,
      fishMedio,
      crescita,
    };
  }, [fixedCosts, riservaTasse]);

  const baseline = Number(fishBase || 0) * Number(clientiPrevisti || 0);
  const multiplier = objective.includes("+20") ? 1.2 : objective.includes("+30") ? 1.3 : 1.1;
  const target = baseline * multiplier;

  function addFixedCost() {
    if (!costName.trim()) return;

    setFixedCosts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: costName.trim().toUpperCase(),
        amount: Number(String(costAmount || 0).replace(",", ".")),
      },
    ]);

    setCostName("");
    setCostAmount("");
  }

  function removeCost(id: string) {
    setFixedCosts((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1580 }}>
        <header style={pageHeader}>
          <div>
            <p style={eyebrow}>Dashboard Coach</p>
            <h1 className="sp-title">Controllo profitto reale</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Numeri, margine, fiscalità, obiettivi e azioni giornaliere per il salone.
            </p>
          </div>
        </header>

        <section style={statsGrid}>
          <StatCard label="Fatturato lordo" value={euro(report.fatturatoLordo)} />
          <StatCard label="Netto IVA" value={euro(report.netto)} />
          <StatCard label="Costi fissi" value={euro(report.costiFissi)} />
          <StatCard label="Utile reale" value={euro(report.utileReale)} danger={report.utileReale < 0} />
        </section>

        <section style={card}>
          <SectionTitle title="DASHBOARD STRATEGICA" />

          <div style={twoGrid}>
            <select style={input} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <select style={input} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div style={summaryBox}>
            <Metric label="Fatturato Lordo" value={euro(report.fatturatoLordo)} />
            <Metric label="IVA stimata" value={euro(report.iva)} />
            <Metric label="Fatturato Netto IVA" value={euro(report.netto)} />
            <Metric label="Commissioni POS" value={euro(report.commissioni)} />
            <Metric label="Costo personale mese" value={euro(report.costoPersonale)} />
            <Metric label="Costo prodotti mese" value={euro(report.costoProdotti)} />
            <Metric label="Costi fissi" value={euro(report.costiFissi)} />
            <Metric label="Utile operativo" value={euro(report.utileOperativo)} />
            <Metric label="Riserva tasse" value={euro(report.riserva)} />
            <Metric label="UTILE REALE" value={euro(report.utileReale)} highlight />
            <Metric label="Fish Media" value={euro(report.fishMedio)} />
            <Metric label="Crescita" value={`${report.crescita}%`} />
          </div>
        </section>

        <section style={coachSection}>
          <p style={quote}>"IL REPORT TI DICE COSA FARE OGGI"</p>
          <SectionTitle title="REPORT AI MOVIMENTI" />

          <div style={reportToolbar}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={primaryButton}>OGGI</button>
              <button style={smallButton}>ULTIMI 7 GIORNI</button>
              <button style={smallButton}>MESE SELEZIONATO</button>
            </div>

            <label style={checkLabel}>
              <input type="checkbox" defaultChecked /> Focus clienti CRM + WhatsApp
            </label>
          </div>

          <div style={coachBox}>
            Oggi il margine è sotto controllo solo se aumenti il valore medio per cliente.
            Spingi prebooking, trattamenti premium e card.
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="REPORT FISCALE / NON FISCALE" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={smallButton}>ESPORTA CSV — FISCALE</button>
            <button style={smallButton}>ESPORTA CSV — NON FISCALE</button>
            <button style={smallButton}>ESPORTA CSV — TUTTO</button>
          </div>
        </section>

        <section style={coachSection}>
          <p style={quote}>"LA MATTINA DECIDE IL FATTURATO"</p>
          <SectionTitle title="BRIEF MATTINA + PREBOOKING" />

          <div style={threeGrid}>
            <label style={label}>
              Fish Base €/cliente
              <input style={input} value={fishBase} onChange={(e) => setFishBase(e.target.value)} />
            </label>

            <label style={label}>
              Clienti previsti oggi
              <input
                style={input}
                value={clientiPrevisti}
                onChange={(e) => setClientiPrevisti(e.target.value)}
              />
            </label>

            <label style={label}>
              Obiettivo oggi
              <select style={input} value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option>+10%</option>
                <option>+20%</option>
                <option>+30%</option>
              </select>
            </label>
          </div>

          <div style={morningBox}>
            <strong>Oggi: {new Date().toLocaleDateString("it-IT")}</strong>
            <p>
              Clienti previsti: <Tag>{Number(clientiPrevisti || 0)}</Tag> · Obiettivo:{" "}
              <Tag>{objective}</Tag>
            </p>
            <p>
              Baseline: <strong>{euro(baseline)}</strong> → Target:{" "}
              <strong>{euro(target)}</strong>
            </p>
            <p>
              Serve + <strong>{euro(Math.max(0, target - baseline))}</strong> di incremento totale.
            </p>

            <hr style={hr} />

            <Tag>Piano semplice</Tag>
            <ul style={{ marginTop: 10 }}>
              <li>Proponi Plex add-on ai clienti colore.</li>
              <li>Proponi Bio anti-frizz su clienti styling.</li>
              <li>Chiudi ogni cliente con prebooking a 45 giorni.</li>
            </ul>

            <Tag>Frase chiusura</Tag>
            <p style={{ marginBottom: 0 }}>
              “Ti preparo il percorso così sei tranquilla per i prossimi 3 mesi?”
            </p>
          </div>

          <button style={primaryButtonFull}>PREBOOKING DEL GIORNO</button>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button style={smallButton}>STAMPA LISTA</button>
            <button style={primaryMini}>PULISCI</button>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="IMPOSTAZIONI PROFITTO REALE" />

          <div style={threeGrid}>
            <Field label="IVA Servizi %" value={ivaServizi} setValue={setIvaServizi} />
            <Field label="IVA Rivendita %" value={ivaRivendita} setValue={setIvaRivendita} />
            <Field label="Ore produttive/mese" value={oreProd} setValue={setOreProd} />
            <Field label="Fee POS %" value={feePos} setValue={setFeePos} />
            <Field label="Fee POS fisso €" value={feePosFisso} setValue={setFeePosFisso} />
            <Field label="Overhead variabile %" value={overhead} setValue={setOverhead} />
            <Field label="Riserva tasse %" value={riservaTasse} setValue={setRiservaTasse} />

            <label style={label}>
              Griglia Agenda minuti
              <select style={input} value={grigliaAgenda} onChange={(e) => setGrigliaAgenda(e.target.value)}>
                <option>5</option>
                <option>10</option>
                <option>15</option>
                <option>30</option>
              </select>
            </label>

            <label style={checkLabel}>
              <input
                type="checkbox"
                checked={cardCostIncluded}
                onChange={(e) => setCardCostIncluded(e.target.checked)}
              />
              Costo tecnico Card include kit omaggio
            </label>
          </div>

          <label style={{ ...label, display: "block", marginTop: 14 }}>
            Domini autorizzati
            <input style={input} value={domain} onChange={(e) => setDomain(e.target.value)} />
          </label>

          <button style={primaryMini}>BLOCCA DOMINIO CORRENTE</button>
        </section>

        <section style={card}>
          <SectionTitle title="COSTI FISSI MENSILI" />

          <div style={twoGrid}>
            <input
              style={input}
              placeholder="Nome costo"
              value={costName}
              onChange={(e) => setCostName(e.target.value)}
            />

            <input
              style={input}
              placeholder="€ al mese"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
            />
          </div>

          <button style={primaryButtonFull} onClick={addFixedCost}>
            AGGIUNGI COSTO
          </button>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Voce</Th>
                  <Th>€/mese</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {fixedCosts.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.name}</Td>
                    <Td>{euro(item.amount)}</Td>
                    <Td>
                      <button style={deleteButton} onClick={() => removeCost(item.id)}>
                        X
                      </button>
                    </Td>
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

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 style={sectionTitle}>
      <span style={purpleLine}>|</span> {title}
    </h2>
  );
}

function Field(props: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label style={label}>
      {props.label}
      <input
        style={input}
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
      />
    </label>
  );
}

function StatCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div style={statCard}>
      <p>{label}</p>
      <strong style={{ color: danger ? "#fca5a5" : "#fff" }}>{value}</strong>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={metricRow}>
      <span>{label}</span>
      <strong style={{ color: highlight ? "#d4af37" : "#fff" }}>{value}</strong>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={th}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={td}>{children}</td>;
}

const pageHeader: React.CSSProperties = {
  marginBottom: 24,
};

const eyebrow: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  margin: 0,
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 22,
  padding: 20,
  background:
    "radial-gradient(circle at top right, rgba(212,175,55,0.16), transparent 38%), rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.24)",
  borderRadius: 26,
  padding: 24,
  marginBottom: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
  color: "#fff",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const coachSection: React.CSSProperties = {
  ...card,
  background:
    "radial-gradient(circle at top right, rgba(139,92,246,0.22), transparent 36%), rgba(255,255,255,0.055)",
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 20,
  color: "#d4af37",
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const purpleLine: React.CSSProperties = {
  color: "#8b5cf6",
  fontWeight: 900,
  marginRight: 10,
};

const quote: React.CSSProperties = {
  color: "#a78bfa",
  fontWeight: 900,
  letterSpacing: 2,
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.28)",
  background: "rgba(0,0,0,0.48)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 15,
  outline: "none",
};

const label: React.CSSProperties = {
  color: "#fff",
  fontWeight: 900,
};

const twoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const threeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const summaryBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 8,
};

const metricRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "#d7d7de",
  fontWeight: 800,
};

const reportToolbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const checkLabel: React.CSSProperties = {
  fontWeight: 900,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
};

const primaryButtonFull: React.CSSProperties = {
  width: "100%",
  margin: "14px 0 0",
  border: 0,
  borderRadius: 16,
  padding: "15px 20px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
};

const primaryMini: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
  marginTop: 10,
};

const smallButton: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.28)",
  borderRadius: 14,
  padding: "10px 16px",
  background: "rgba(212,175,55,0.10)",
  color: "#f5d76e",
  fontWeight: 900,
};

const coachBox: React.CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 18,
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  color: "#fff",
  fontWeight: 800,
  lineHeight: 1.5,
};

const morningBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  borderRadius: 18,
  padding: 18,
  marginTop: 10,
  color: "#fff",
  fontWeight: 800,
};

const tag: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.28)",
  color: "#f5d76e",
  borderRadius: 999,
  fontWeight: 900,
};

const hr: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid rgba(255,255,255,0.10)",
  margin: "12px 0",
};

const tableWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  marginTop: 18,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: 900,
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#d4af37",
  fontWeight: 900,
  borderBottom: "1px solid rgba(212,175,55,0.18)",
  background: "rgba(0,0,0,0.35)",
};

const td: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
  color: "#fff",
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
  fontWeight: 900,
};