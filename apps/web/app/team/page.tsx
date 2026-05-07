"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../src/lib/api";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  color?: string;
  active?: boolean;
  monthlyCost?: number;
  productiveHours?: number;
  monthlyTarget?: number;
};

type ShiftDay = {
  day: string;
  open1: string;
  close1: string;
  open2: string;
  close2: string;
  closed: boolean;
};

type SaleItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  cost?: number;
  quantity: number;
};

type SaleRecord = {
  id: string;
  total: number;
  createdAt: string;
  items: SaleItem[];
  appointment?: {
    id: string;
    staffId?: string | null;
  } | null;
};

const DEFAULT_SHIFTS: ShiftDay[] = [
  { day: "LUN", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "MAR", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "MER", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "GIO", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "VEN", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "SAB", open1: "09:00", close1: "13:00", open2: "15:00", close2: "19:30", closed: false },
  { day: "DOM", open1: "", close1: "", open2: "", close2: "", closed: true },
];

function euro(value: number) {
  return `€ ${value.toFixed(2)}`;
}

function normalizeRole(role: string) {
  if (!role) return "COLLABORATORE";
  return role.toUpperCase();
}

function displayRole(role: string) {
  return role === "TITOLARE" ? "Titolare" : role === "RECEPTION" ? "Reception" : role === "MANAGER" ? "Manager" : "Collaboratore";
}

export default function TeamPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [role, setRole] = useState("COLLABORATORE");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [productiveHours, setProductiveHours] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");

  const [shifts, setShifts] = useState<Record<string, ShiftDay[]>>({});

  async function loadStaff() {
    try {
      setLoading(true);
      setMessage("");

      const [staffData, salesData] = await Promise.all([
        apiFetch("/staff"),
        apiFetch("/sales"),
      ]);

      const list = Array.isArray(staffData) ? staffData : [];
      const salesList = Array.isArray(salesData) ? salesData : [];

      setStaff(list);
      setSales(salesList);
      setSelectedStaffId((prev) => prev || list[0]?.id || "");

      setShifts((prev) => {
        const next = { ...prev };
        list.forEach((member: StaffMember) => {
          if (!next[member.id]) {
            next[member.id] = DEFAULT_SHIFTS.map((s) => ({ ...s }));
          }
        });
        return next;
      });
    } catch (error: any) {
      setMessage(error.message || "Errore caricamento KPI team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);


  function isCurrentMonthSale(sale: SaleRecord) {
    const date = new Date(sale.createdAt);
    const now = new Date();

    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }


  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const kpiRows = useMemo(() => {
    const monthSales = sales.filter(isCurrentMonthSale);

    const baseRows = staff.map((member) => {
      const monthlyCostValue = Number(member.monthlyCost || 0);
      const productiveHoursValue = Number(member.productiveHours || 140);
      const monthlyTargetValue = Number(member.monthlyTarget || 0);

      const memberSales = monthSales.filter((sale) => {
        return sale.appointment?.staffId === member.id;
      });

      const services = memberSales.reduce((sum, sale) => {
        return (
          sum +
          (sale.items || [])
            .filter((item) => item.type !== "product")
            .reduce((itemSum, item) => itemSum + Number(item.price || 0) * Number(item.quantity || 1), 0)
        );
      }, 0);

      const resale = memberSales.reduce((sum, sale) => {
        return (
          sum +
          (sale.items || [])
            .filter((item) => item.type === "product")
            .reduce((itemSum, item) => itemSum + Number(item.price || 0) * Number(item.quantity || 1), 0)
        );
      }, 0);

      const total = services + resale;
      const fish = memberSales.length > 0 ? total / memberSales.length : 0;
      const productivity = monthlyTargetValue > 0 ? (total / monthlyTargetValue) * 100 : 0;

      return {
        ...member,
        monthlyCost: monthlyCostValue,
        productiveHours: productiveHoursValue,
        monthlyTarget: monthlyTargetValue,
        services,
        resale,
        total,
        fish,
        weight: 0,
        productivity,
        salesCount: memberSales.length,
      };
    });

    const teamTotal = baseRows.reduce((sum, row) => sum + row.total, 0);

    return baseRows.map((row) => ({
      ...row,
      weight: teamTotal > 0 ? (row.total / teamTotal) * 100 : 0,
    }));
  }, [staff, sales]);

  const totals = useMemo(() => {
    return kpiRows.reduce(
      (acc, row) => {
        acc.services += row.services;
        acc.resale += row.resale;
        acc.total += row.total;
        acc.costs += Number(row.monthlyCost || 0);
        acc.target += Number(row.monthlyTarget || 0);
        return acc;
      },
      { services: 0, resale: 0, total: 0, costs: 0, target: 0 },
    );
  }, [kpiRows]);

  async function saveStaff() {
    if (!name.trim()) return;

    try {
      setMessage("");

      const created = await apiFetch("/staff", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          role: normalizeRole(role),
          color: "#8b5cf6",
          active: true,
        }),
      });

      const newMember: StaffMember = {
        ...created,
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
      setRole("COLLABORATORE");
      setMonthlyCost("");
      setProductiveHours("");
      setMonthlyTarget("");
      setMessage("Collaboratore creato correttamente.");
    } catch (error: any) {
      setMessage(error.message || "Errore creazione collaboratore");
    }
  }

  async function deleteStaff(id: string) {
    try {
      setMessage("");

      await apiFetch(`/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: false }),
      });

      setStaff((prev) => prev.filter((s) => s.id !== id));
      setSelectedStaffId((prev) => {
        if (prev !== id) return prev;
        return staff.find((s) => s.id !== id)?.id || "";
      });
    } catch (error: any) {
      setMessage(error.message || "Errore eliminazione collaboratore");
    }
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

        {message ? <div style={messageBox}>{message}</div> : null}

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
                  <Th>Vendite</Th>
                  <Th>Peso %</Th>
                  <Th>Target</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <Td>Caricamento staff...</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                  </tr>
                ) : kpiRows.length === 0 ? (
                  <tr>
                    <Td>Nessun collaboratore presente.</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                  </tr>
                ) : (
                  kpiRows.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.name}</Td>
                      <Td>{euro(row.services)}</Td>
                      <Td>{euro(row.resale)}</Td>
                      <Td>{euro(row.total)}</Td>
                      <Td>{euro(row.fish)}</Td>
                      <Td>{row.salesCount || 0}</Td>
                      <Td>{row.weight.toFixed(1)}%</Td>
                      <Td>{row.productivity.toFixed(0)}%</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="GESTIONE STAFF" />

          <div style={formGrid}>
            <input style={input} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />

            <select style={input} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="COLLABORATORE">Collaboratore</option>
              <option value="TITOLARE">Titolare</option>
              <option value="RECEPTION">Reception</option>
              <option value="MANAGER">Manager</option>
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
                {staff.length === 0 ? (
                  <tr>
                    <Td>Nessun collaboratore presente.</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                    <Td>-</Td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id}>
                      <Td>{member.name}</Td>
                      <Td>{displayRole(member.role)}</Td>
                      <Td>{euro(Number(member.monthlyCost || 0))}</Td>
                      <Td>{Number(member.productiveHours || 140)}</Td>
                      <Td>
                        <button style={deleteButton} onClick={() => deleteStaff(member.id)}>
                          X
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
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
              {staff.length === 0 ? <option value="">Nessun collaboratore</option> : null}
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
              <span>Ruolo: {displayRole(selectedStaff.role)}</span>
              <span>Costo mese: {euro(Number(selectedStaff.monthlyCost || 0))}</span>
              <span>Target: {euro(Number(selectedStaff.monthlyTarget || 0))}</span>
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

const messageBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(139,92,246,0.14)",
  border: "1px solid rgba(139,92,246,0.32)",
  color: "#fff",
  fontWeight: 900,
};

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
