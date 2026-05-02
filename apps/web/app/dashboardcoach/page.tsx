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
  { id: "1", name: "FITTO LOCALE (CORSO UMBERTO ~120MQ)", amount: 1250 },
  { id: "2", name: "COMMERCIALISTA / CONSULENZA", amount: 250 },
  { id: "3", name: "SOFTWARE ACQUAVIVA STRATEGIC", amount: 80 },
  { id: "4", name: "ENERGIA ELETTRICA", amount: 450 },
  { id: "5", name: "GAS / RISCALDAMENTO", amount: 150 },
  { id: "6", name: "ACQUA", amount: 60 },
  { id: "7", name: "INTERNET / TELEFONO", amount: 60 },
  { id: "8", name: "TARI / RIFIUTI", amount: 120 },
  { id: "9", name: "ASSICURAZIONE (RC/INCENDIO)", amount: 70 },
  { id: "10", name: "PULIZIE / IGIENE", amount: 200 },
  { id: "11", name: "LAVANDERIA ASCIUGAMANI", amount: 140 },
  { id: "12", name: "SMALTIMENTO RIFIUTI SPECIALI", amount: 80 },
  { id: "13", name: "MANUTENZIONE ATTREZZATURE", amount: 100 },
  { id: "14", name: "CONDOMINIO / SPESE COMUNI", amount: 60 },
  { id: "15", name: "ALLARME / SICUREZZA", amount: 45 },
  { id: "16", name: "POS NOLEGGIO / CANONI", amount: 20 },
  { id: "17", name: "MARKETING / PUBBLICITÀ", amount: 250 },
  { id: "18", name: "CANCELLERIA / CONSUMI NON TECNICI", amount: 70 },
  { id: "19", name: "CANONI MUSICA/SCF-SIAE (SE APPLICABILI)", amount: 40 },
  { id: "20", name: "AMMORTAMENTO / LEASING ATTREZZATURE (STIMA)", amount: 200 },
];

function euro(value: number) {
  return `€${value.toFixed(2)}`;
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
  const [objective, setObjective] = useState("+10% (upgrade facile)");

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
    const utileOperativo =
      netto - commissioni - costoPersonale - costoProdotti - costiFissi;
    const riserva = 0;
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
  }, [fixedCosts]);

  const baseline = Number(fishBase || 0) * Number(clientiPrevisti || 0);
  const multiplier =
    objective.includes("+20") ? 1.2 : objective.includes("+30") ? 1.3 : 1.1;
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
            <strong>Fatturato Lordo: {euro(report.fatturatoLordo)}</strong>
            <strong>IVA stimata: {euro(report.iva)}</strong>
            <strong>Fatturato Netto IVA: {euro(report.netto)}</strong>
            <strong>Commissioni POS: {euro(report.commissioni)}</strong>
            <strong>Costo personale (mese): {euro(report.costoPersonale)}</strong>
            <strong>Costo prodotti (mese): {euro(report.costoProdotti)}</strong>
            <strong>Costi fissi: {euro(report.costiFissi)}</strong>
            <strong>Utile operativo: {euro(report.utileOperativo)}</strong>
            <strong>Card (mese) — Incassato: €0.00 | Costo tecnico previsto: €0.00 | Utile Card: €0.00</strong>
            <strong>Riserva tasse: {euro(report.riserva)}</strong>
            <strong>UTILE REALE: {euro(report.utileReale)}</strong>
            <strong>Fish Media: {euro(report.fishMedio)}</strong>
            <strong>Crescita: {report.crescita}%</strong>
          </div>
        </section>

        <section style={coachSection}>
          <div style={quote}>"IL REPORT TI DICE COSA FARE OGGI"</div>
          <SectionTitle title="🤖 REPORT AI MOVIMENTI (VERIFICABILE)" />

          <div style={reportToolbar}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={primaryButton}>📌 OGGI</button>
              <button style={smallButton}>📊 ULTIMI 7 GIORNI</button>
              <button style={smallButton}>🗓️ MESE SELEZIONATO</button>
            </div>

            <label style={checkLabel}>
              <input type="checkbox" defaultChecked /> Focus clienti (CRM + WhatsApp)
            </label>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="📄 REPORT FISCALE / NON FISCALE" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={smallButton}>⬇️ ESPORTA CSV — FISCALE</button>
            <button style={smallButton}>⬇️ ESPORTA CSV — NON FISCALE</button>
            <button style={smallButton}>⬇️ ESPORTA CSV — TUTTO</button>
          </div>
        </section>

        <section style={coachSection}>
          <div style={quote}>"LA MATTINA DECIDE IL FATTURATO"</div>
          <SectionTitle title="💌 BRIEF MATTINA + PREBOOKING DEL GIORNO" />

          <div style={threeGrid}>
            <label>
              Fish Base (€/cliente) 💛
              <input style={input} value={fishBase} onChange={(e) => setFishBase(e.target.value)} />
            </label>

            <label>
              Clienti previsti oggi 💕
              <input
                style={input}
                value={clientiPrevisti}
                onChange={(e) => setClientiPrevisti(e.target.value)}
              />
            </label>

            <label>
              Obiettivo oggi 💛
              <select style={input} value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option>+10% (upgrade facile)</option>
                <option>+20%</option>
                <option>+30%</option>
              </select>
            </label>
          </div>

          <div style={morningBox}>
            <strong>📌 Oggi: {new Date().toISOString().slice(0, 10)}</strong>
            <br />
            <em>
              Clienti previsti: <Tag>{Number(clientiPrevisti || 0)}</Tag> · Obiettivo:{" "}
              <Tag>{objective.replace(" (upgrade facile)", "")}</Tag>
            </em>
            <br />
            <em>
              Baseline: <strong>{euro(baseline)}</strong> → Target:{" "}
              <strong>{euro(target)}</strong>
            </em>
            <br />
            <em>
              Serve + <strong>{euro(Math.max(0, target - baseline))}</strong> a cliente 💕
            </em>

            <hr style={hr} />

            <Tag>Piano semplice</Tag>
            <ul style={{ marginTop: 8 }}>
              <li>Solo Plex add-on 24€: punta a 0 card oggi 🪪</li>
              <li>Solo Bio add-on 36€: punta a 0 card oggi 🪪</li>
              <li>Mix smart: Bio 36€ + 1–2 Plex 24€ = giornata in sicurezza 🥰</li>
            </ul>

            <Tag>Frase chiusura</Tag>
            <em> “Amore, ti preparo il percorso così sei tranquilla per 3 mesi?” 💕</em>
          </div>

          <button style={primaryButtonFull}>📅 PREBOOKING DEL GIORNO</button>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button style={smallButton}>🖨️ STAMPA LISTA</button>
            <button style={primaryMini}>PULISCI</button>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="IMPOSTAZIONI PROFITTO REALE" />

          <div style={threeGrid}>
            <Field label="IVA Servizi %" value={ivaServizi} setValue={setIvaServizi} />
            <Field label="IVA Rivendita %" value={ivaRivendita} setValue={setIvaRivendita} />
            <Field label="Ore produttive/mese (per staff)" value={oreProd} setValue={setOreProd} />
            <Field label="Fee POS %" value={feePos} setValue={setFeePos} />
            <Field label="Fee POS fisso €" value={feePosFisso} setValue={setFeePosFisso} />
            <Field label="Overhead variabile % (consumi)" value={overhead} setValue={setOverhead} />
            <Field label="Riserva tasse % (stima)" value={riservaTasse} setValue={setRiservaTasse} />

            <label>
              Griglia Agenda (minuti)
              <select style={input} value={grigliaAgenda} onChange={(e) => setGrigliaAgenda(e.target.value)}>
                <option>5</option>
                <option>10</option>
                <option>15</option>
                <option>30</option>
              </select>
            </label>

            <label style={{ fontWeight: 900, display: "flex", alignItems: "end", gap: 8 }}>
              <input
                type="checkbox"
                checked={cardCostIncluded}
                onChange={(e) => setCardCostIncluded(e.target.checked)}
              />
              Costo tecnico Card include già Kit omaggio
            </label>
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            Anti-furto Cloud: domini autorizzati (host separati da virgola)
            <input style={input} value={domain} onChange={(e) => setDomain(e.target.value)} />
          </label>

          <button style={primaryMini}>BLOCCA DOMINIO CORRENTE</button>
        </section>

        <section style={card}>
          <SectionTitle title="COSTI FISSI MENSILI" />

          <input
            style={input}
            placeholder="Nome (Affitto, Bollette, Marketing...)"
            value={costName}
            onChange={(e) => setCostName(e.target.value)}
          />

          <input
            style={{ ...input, marginTop: 12 }}
            placeholder="€ al mese"
            value={costAmount}
            onChange={(e) => setCostAmount(e.target.value)}
          />

          <button style={primaryButtonFull} onClick={addFixedCost}>
            +
          </button>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Voce</Th>
                  <Th>€/mese</Th>
                  <Th>X</Th>
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
      <span style={greenLine}>|</span> {title}
    </h2>
  );
}

function Field(props: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label>
      {props.label}
      <input
        style={input}
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
      />
    </label>
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

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  borderRadius: 18,
  padding: 28,
  marginBottom: 28,
  boxShadow: "0 24px 70px rgba(0,0,0,0.18)",
};

const coachSection: React.CSSProperties = {
  ...card,
  background: "linear-gradient(135deg,#eef8f7,#eef3f7)",
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 20,
  color: "#22c55e",
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 2,
};

const greenLine: React.CSSProperties = {
  color: "#22c55e",
  fontWeight: 900,
  marginRight: 10,
};

const quote: React.CSSProperties = {
  color: "#8b5cf6",
  fontWeight: 900,
  letterSpacing: 2,
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 15,
  marginTop: 7,
};

const twoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const threeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const summaryBox: React.CSSProperties = {
  background: "#eaf6f4",
  border: "1px solid #b9d9d4",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 2,
  lineHeight: 1.15,
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
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "14px 20px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};

const primaryButtonFull: React.CSSProperties = {
  width: "100%",
  margin: "14px 0 0",
  border: 0,
  borderRadius: 8,
  padding: "14px 20px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};

const primaryMini: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "8px 12px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
  marginTop: 10,
};

const smallButton: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 16px",
  background: "#e8eef8",
  color: "#0f172a",
  fontWeight: 900,
};

const morningBox: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: 18,
  marginTop: 10,
};

const tag: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  background: "#eef2f7",
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  fontWeight: 900,
};

const hr: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid #e2e8f0",
  margin: "12px 0",
};

const tableWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  marginTop: 18,
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: 900,
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#22c55e",
  fontWeight: 900,
  borderBottom: "1px solid #e5e7eb",
};

const td: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 700,
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "7px 12px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};