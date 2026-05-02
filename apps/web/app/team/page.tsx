"use client";

import { useMemo, useState } from "react";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  monthlyCost: number;
  productiveHours: number;
  monthlyTarget: number;
};

type ShiftDay = {
  day: string;
  open1: string;
  close1: string;
  open2: string;
  close2: string;
  closed: boolean;
};

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "1",
    name: "PAMELA",
    role: "Collaboratore",
    monthlyCost: 1150,
    productiveHours: 140,
    monthlyTarget: 3500,
  },
  {
    id: "2",
    name: "KATIA",
    role: "Collaboratore",
    monthlyCost: 1000,
    productiveHours: 140,
    monthlyTarget: 3000,
  },
  {
    id: "3",
    name: "STEFANIA",
    role: "Collaboratore",
    monthlyCost: 700,
    productiveHours: 140,
    monthlyTarget: 2500,
  },
  {
    id: "4",
    name: "SONIA",
    role: "Titolare",
    monthlyCost: 1500,
    productiveHours: 140,
    monthlyTarget: 4000,
  },
  {
    id: "5",
    name: "BRIAN LADDOMADA",
    role: "Collaboratore",
    monthlyCost: 0,
    productiveHours: 140,
    monthlyTarget: 0,
  },
];

const DEFAULT_SHIFTS: ShiftDay[] = [
  { day: "LUN", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "MAR", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "MER", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "GIO", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "VEN", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "SAB", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "DOM", open1: "", close1: "", open2: "", close2: "", closed: true },
];

const SALES = [
  { name: "PAMELA", services: 115, resale: 0 },
  { name: "KATIA", services: 0, resale: 0 },
  { name: "STEFANIA", services: 20, resale: 0 },
  { name: "SONIA", services: 20, resale: 0 },
  { name: "BRIAN LADDOMADA", services: 0, resale: 0 },
];

function euro(value: number) {
  return `€ ${value.toFixed(2)}`;
}

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || "");

  const [name, setName] = useState("");
  const [role, setRole] = useState("Collaboratore");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [productiveHours, setProductiveHours] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");

  const [shifts, setShifts] = useState<Record<string, ShiftDay[]>>(() => {
    const base: Record<string, ShiftDay[]> = {};
    INITIAL_STAFF.forEach((member) => {
      base[member.id] = DEFAULT_SHIFTS.map((s) => ({ ...s }));
    });
    return base;
  });

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const kpiRows = useMemo(() => {
    const totalSales = SALES.reduce((sum, item) => sum + item.services + item.resale, 0);

    return staff.map((member) => {
      const sale = SALES.find((s) => s.name === member.name);
      const services = sale?.services || 0;
      const resale = sale?.resale || 0;
      const total = services + resale;
      const fish = total > 0 ? total / Math.max(1, member.productiveHours / 35) : 0;
      const weight = totalSales > 0 ? (total / totalSales) * 100 : 0;
      const productivity = member.monthlyTarget > 0 ? (total / member.monthlyTarget) * 100 : 0;

      return {
        ...member,
        services,
        resale,
        total,
        fish,
        weight,
        productivity,
      };
    });
  }, [staff]);

  const totals = useMemo(() => {
    return kpiRows.reduce(
      (acc, row) => {
        acc.services += row.services;
        acc.resale += row.resale;
        acc.total += row.total;
        acc.costs += row.monthlyCost;
        acc.target += row.monthlyTarget;
        return acc;
      },
      { services: 0, resale: 0, total: 0, costs: 0, target: 0 },
    );
  }, [kpiRows]);

  function saveStaff() {
    if (!name.trim()) return;

    const newMember: StaffMember = {
      id: crypto.randomUUID(),
      name: name.trim().toUpperCase(),
      role,
      monthlyCost: Number(monthlyCost || 0),
      productiveHours: Number(productiveHours || 140),
      monthlyTarget: Number(monthlyTarget || 0),
    };

    setStaff((prev) => [...prev, newMember]);
    setShifts((prev) => ({
      ...prev,
      [newMember.id]: DEFAULT_SHIFTS.map((s) => ({ ...s })),
    }));

    setSelectedStaffId(newMember.id);
    setName("");
    setRole("Collaboratore");
    setMonthlyCost("");
    setProductiveHours("");
    setMonthlyTarget("");
  }

  function deleteStaff(id: string) {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setSelectedStaffId((prev) => {
      if (prev !== id) return prev;
      return staff.find((s) => s.id !== id)?.id || "";
    });
  }

  function updateShift(index: number, field: keyof ShiftDay, value: string | boolean) {
    if (!selectedStaffId) return;

    setShifts((prev) => {
      const list = prev[selectedStaffId] || DEFAULT_SHIFTS;
      const next = list.map((row, i) => (i === index ? { ...row, [field]: value } : row));

      return {
        ...prev,
        [selectedStaffId]: next,
      };
    });
  }

  function copySalonHours() {
    if (!selectedStaffId) return;
    setShifts((prev) => ({
      ...prev,
      [selectedStaffId]: DEFAULT_SHIFTS.map((s) => ({ ...s })),
    }));
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1580 }}>
        <header style={pageHeader}>
          <div>
            <p style={eyebrow}>Team KPI</p>
            <h1 className="sp-title">Performance collaboratori</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Controlla produzione, peso sul fatturato, turni e obiettivi del team.
            </p>
          </div>
        </header>

        <section style={statsGrid}>
          <StatCard label="Totale servizi" value={euro(totals.services)} />
          <StatCard label="Totale rivendita" value={euro(totals.resale)} />
          <StatCard label="Totale mese" value={euro(totals.total)} />
          <StatCard label="Costo staff" value={euro(totals.costs)} />
        </section>

        <section style={card}>
          <SectionTitle title="KPI TEAM" />

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Servizi</Th>
                  <Th>Rivendita</Th>
                  <Th>Totale</Th>
                  <Th>Fish</Th>
                  <Th>Peso %</Th>
                  <Th>Target</Th>
                </tr>
              </thead>
              <tbody>
                {kpiRows.map((row) => (
                  <tr key={row.id}>
                    <Td>{row.name}</Td>
                    <Td>{euro(row.services)}</Td>
                    <Td>{euro(row.resale)}</Td>
                    <Td>{euro(row.total)}</Td>
                    <Td>{euro(row.fish)}</Td>
                    <Td>{row.weight.toFixed(1)}%</Td>
                    <Td>{row.productivity.toFixed(0)}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="GESTIONE STAFF" />

          <div style={formGrid}>
            <input style={input} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />

            <select style={input} value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Collaboratore</option>
              <option>Titolare</option>
              <option>Reception</option>
              <option>Manager</option>
            </select>

            <input
              style={input}
              placeholder="Costo mensile €"
              value={monthlyCost}
              onChange={(e) => setMonthlyCost(e.target.value)}
            />

            <input
              style={input}
              placeholder="Ore prod/mese"
              value={productiveHours}
              onChange={(e) => setProductiveHours(e.target.value)}
            />

            <input
              style={input}
              placeholder="Target €/mese opz."
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
            />
          </div>

          <button style={saveButton} onClick={saveStaff}>
            SALVA COLLABORATORE
          </button>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Ruolo</Th>
                  <Th>Costo mese</Th>
                  <Th>Ore prod</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <Td>{member.name}</Td>
                    <Td>{member.role}</Td>
                    <Td>{euro(member.monthlyCost)}</Td>
                    <Td>{member.productiveHours}</Td>
                    <Td>
                      <button style={deleteButton} onClick={() => deleteStaff(member.id)}>
                        X
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="TURNI COLLABORATORI" />

          <div style={turnHeader}>
            <select
              style={input}
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <button style={smallButton} onClick={copySalonHours}>
              COPIA ORARI SALONE
            </button>
          </div>

          <button style={saveButton}>SALVA TURNI</button>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Giorno</Th>
                  <Th>Apertura 1</Th>
                  <Th>Chiusura 1</Th>
                  <Th>Apertura 2</Th>
                  <Th>Chiusura 2</Th>
                  <Th>Chiuso</Th>
                </tr>
              </thead>
              <tbody>
                {(shifts[selectedStaffId] || DEFAULT_SHIFTS).map((row, index) => (
                  <tr key={row.day}>
                    <Td>{row.day}</Td>
                    <Td>
                      <input
                        type="time"
                        style={timeInput}
                        value={row.open1}
                        disabled={row.closed}
                        onChange={(e) => updateShift(index, "open1", e.target.value)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="time"
                        style={timeInput}
                        value={row.close1}
                        disabled={row.closed}
                        onChange={(e) => updateShift(index, "close1", e.target.value)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="time"
                        style={timeInput}
                        value={row.open2}
                        disabled={row.closed}
                        onChange={(e) => updateShift(index, "open2", e.target.value)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="time"
                        style={timeInput}
                        value={row.close2}
                        disabled={row.closed}
                        onChange={(e) => updateShift(index, "close2", e.target.value)}
                      />
                    </Td>
                    <Td>
                      <input
                        type="checkbox"
                        checked={row.closed}
                        onChange={(e) => updateShift(index, "closed", e.target.checked)}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedStaff ? (
            <div style={summaryBox}>
              <strong>{selectedStaff.name}</strong>
              <span>Ruolo: {selectedStaff.role}</span>
              <span>Costo mese: {euro(selectedStaff.monthlyCost)}</span>
              <span>Target: {euro(selectedStaff.monthlyTarget)}</span>
            </div>
          ) : null}
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCard}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
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

const tableWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 900,
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

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: 12,
  marginBottom: 12,
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

const timeInput: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.28)",
  background: "rgba(0,0,0,0.48)",
  color: "#fff",
  fontWeight: 800,
};

const saveButton: React.CSSProperties = {
  width: "100%",
  margin: "12px 0 18px",
  padding: 16,
  border: 0,
  borderRadius: 16,
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 16,
};

const smallButton: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.28)",
  borderRadius: 14,
  padding: "12px 16px",
  background: "rgba(212,175,55,0.10)",
  color: "#f5d76e",
  fontWeight: 900,
  fontSize: 12,
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
  fontWeight: 900,
};

const summaryBox: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  fontWeight: 800,
  color: "#fff",
};

const turnHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  marginBottom: 12,
};