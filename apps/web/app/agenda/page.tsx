"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const START_HOUR = 9;
const END_HOUR = 20;
const HOUR_HEIGHT = 88;

type ClientItem = {
  id: string;
  tenantId: string;
  clientGlobalId: string;
  createdAt: string;
  clientGlobal: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    createdAt: string;
  };
};

type StaffItem = {
  id: string;
  name: string;
  role?: string;
};

type AppointmentItem = {
  id: string;
  tenantId: string;
  clientTenantId: string;
  staffId?: string | null;
  date: string;
  duration: number;
  note: string | null;
  createdAt: string;
  clientTenant: ClientItem;
  staff?: StaffItem | null;
  sale?: any | null;
};

const FALLBACK_STAFF: StaffItem[] = [
  { id: "pamela", name: "Pamela" },
  { id: "katia", name: "Katia" },
  { id: "stefania", name: "Stefania" },
  { id: "sonia", name: "Sonia" },
  { id: "brian", name: "Brian Laddomada" },
];

const services = [
  { name: "Piega", duration: 35 },
  { name: "Piega Atelier Extra Styling", duration: 45 },
  { name: "Taglio Donna", duration: 35 },
  { name: "Taglio Donna + Piega", duration: 60 },
  { name: "Shampoo + Taglio Uomo", duration: 30 },
  { name: "Barba Rifinitura", duration: 10 },
  { name: "Colore Base", duration: 35 },
  { name: "Colore Base + Piega", duration: 80 },
  { name: "Colore Base + Taglio + Piega", duration: 105 },
  { name: "Tonalizzante/Gloss", duration: 25 },
  { name: "Tonalizzante + Piega", duration: 70 },
  { name: "Decapaggio Colore", duration: 45 },
  { name: "Decapaggio + Piega", duration: 140 },
  { name: "Schiariture Parziali Meches Light", duration: 90 },
  { name: "Colpi di Sole/Meches + Piega", duration: 120 },
];

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isToday(date: Date) {
  return toInputDate(new Date()) === toInputDate(date);
}

function getAppointmentColor(note: string | null, sold?: boolean) {
  if (sold) return "linear-gradient(135deg,#16a34a,#22c55e)";
  if (!note) return "linear-gradient(135deg,#d4af37,#facc15)";

  const value = note.toLowerCase();

  if (
    value.includes("colore") ||
    value.includes("tonalizzante") ||
    value.includes("gloss") ||
    value.includes("decapaggio") ||
    value.includes("schiariture") ||
    value.includes("meches")
  ) {
    return "linear-gradient(135deg,#f97316,#fb923c)";
  }

  if (value.includes("taglio") || value.includes("barba")) {
    return "linear-gradient(135deg,#3b82f6,#60a5fa)";
  }

  if (
    value.includes("ricostruzione") ||
    value.includes("trattamento") ||
    value.includes("plex")
  ) {
    return "linear-gradient(135deg,#10b981,#34d399)";
  }

  return "linear-gradient(135deg,#8b5cf6,#a78bfa)";
}

export default function AgendaPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>(FALLBACK_STAFF);

  const [viewMode, setViewMode] = useState<"all" | "staff">("all");
  const [selectedStaffId, setSelectedStaffId] = useState(FALLBACK_STAFF[0].id);

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [modalOpen, setModalOpen] = useState(false);

  const [clientTenantId, setClientTenantId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentStaffId, setAppointmentStaffId] = useState(FALLBACK_STAFF[0].id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) list.push(h);
    return list;
  }, []);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, serviceName) => {
      const service = services.find((item) => item.name === serviceName);
      return sum + (service?.duration || 30);
    }, 0);
  }, [selectedServices]);

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token = localStorage.getItem("salonpro_token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      throw new Error("Token mancante");
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.message || text || "Errore richiesta");
    }

    return data;
  }

  async function loadData() {
    try {
      setError("");

      const [clientsData, appointmentsData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
      ]);

      setClients(clientsData || []);
      setAppointments(appointmentsData || []);

      if (clientsData?.length && !clientTenantId) {
        setClientTenantId(clientsData[0].id);
      }

      try {
        const staffData = await fetchWithAuth("/staff");
        if (staffData?.length) {
          setStaff(staffData);
          setSelectedStaffId((prev) => prev || staffData[0].id);
          setAppointmentStaffId((prev) => prev || staffData[0].id);
        }
      } catch {
        setStaff(FALLBACK_STAFF);
      }
    } catch (err: any) {
      setError(err.message || "Errore caricamento agenda");
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function staffMatchesAppointment(appointment: AppointmentItem) {
    if (appointment.staffId) return appointment.staffId === selectedStaffId;

    const staffName = staff.find((s) => s.id === selectedStaffId)?.name.toLowerCase();
    const appointmentStaffName = appointment.staff?.name?.toLowerCase();

    return staffName && appointmentStaffName === staffName;
  }

  function appointmentsOfDay(day: Date) {
    const key = toInputDate(day);

    return appointments.filter((appointment) => {
      const sameDay = toInputDate(new Date(appointment.date)) === key;
      if (!sameDay) return false;

      if (viewMode === "staff") {
        return staffMatchesAppointment(appointment);
      }

      return true;
    });
  }

  function topFromDate(date: string) {
    const d = new Date(date);
    return (d.getHours() - START_HOUR) * HOUR_HEIGHT + (d.getMinutes() / 60) * HOUR_HEIGHT;
  }

  function heightFromDuration(duration: number) {
    return Math.max(38, (duration / 60) * HOUR_HEIGHT);
  }

  function moveWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }

  function openSlot(day: Date, hour: number) {
    setAppointmentDate(toInputDate(day));
    setAppointmentTime(`${String(hour).padStart(2, "0")}:00`);
    setSelectedServices([]);
    setAppointmentStaffId(viewMode === "staff" ? selectedStaffId : staff[0]?.id || "");
    setModalOpen(true);
  }

  function toggleService(serviceName: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((item) => item !== serviceName)
        : [...prev, serviceName],
    );
  }

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!clientTenantId) throw new Error("Seleziona un cliente");
      if (!appointmentDate) throw new Error("Seleziona data");
      if (!appointmentTime) throw new Error("Seleziona ora");
      if (selectedServices.length === 0) throw new Error("Seleziona almeno un trattamento");

      const dateIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

      await fetchWithAuth("/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientTenantId,
          date: dateIso,
          services: selectedServices,
          staffId: appointmentStaffId || null,
        }),
      });

      setModalOpen(false);
      setSelectedServices([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore creazione appuntamento");
    } finally {
      setLoading(false);
    }
  }

  const visibleTitle =
    viewMode === "all"
      ? "Agenda principale"
      : `Agenda ${staff.find((s) => s.id === selectedStaffId)?.name || "dipendente"}`;

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1540 }}>
        <header style={pageHeader}>
          <div>
            <div style={eyebrow}>Agenda Appuntamenti</div>
            <h1 className="sp-title">{visibleTitle}</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Vista principale con tutti i dipendenti oppure agenda filtrata per collaboratore.
            </p>
          </div>

          <div style={topActions}>
            <button
              style={viewMode === "all" ? activeButton : ghostButton}
              onClick={() => setViewMode("all")}
            >
              Agenda principale
            </button>

            <button
              style={viewMode === "staff" ? activeButton : ghostButton}
              onClick={() => setViewMode("staff")}
            >
              Per dipendente
            </button>

            <select
              style={selectDark}
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setAppointmentStaffId(e.target.value);
                setViewMode("staff");
              }}
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <button style={purpleButton} onClick={() => moveWeek(-1)}>
              ←
            </button>

            <div style={weekBadge}>
              {formatDay(days[0])} - {formatDay(days[6])}
            </div>

            <button style={purpleButton} onClick={() => moveWeek(1)}>
              →
            </button>
          </div>
        </header>

        {error ? <div style={errorBox}>⚠️ {error}</div> : null}

        <section style={calendarWrap}>
          <div style={calendarHeader}>
            <div style={headerCell}>ORA</div>
            {days.map((day) => (
              <div key={day.toISOString()} style={headerCell}>
                <div style={{ color: isToday(day) ? "#d4af37" : "#fff", fontWeight: 900 }}>
                  {day.toLocaleDateString("it-IT", { weekday: "short" }).toUpperCase()}
                </div>
                <div style={{ marginTop: 4, color: "#b8bfd0" }}>{formatDay(day)}</div>
              </div>
            ))}
          </div>

          <div style={calendarBody}>
            <div style={timeColumn}>
              {hours.map((hour) => (
                <div key={hour} style={timeHourCell}>
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div key={day.toISOString()} style={dayColumn}>
                {hours.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    style={{
                      ...hourCell,
                      background: isToday(day)
                        ? "rgba(212,175,55,0.045)"
                        : "rgba(255,255,255,0.02)",
                    }}
                    onClick={() => openSlot(day, hour)}
                  >
                    <div style={{ color: "rgba(255,255,255,0.12)", fontWeight: 900 }}>
                      +
                    </div>
                  </div>
                ))}

                {appointmentsOfDay(day).map((appointment) => {
                  const top = topFromDate(appointment.date);
                  const height = heightFromDuration(appointment.duration);
                  const staffName =
                    appointment.staff?.name ||
                    staff.find((s) => s.id === appointment.staffId)?.name ||
                    "Non assegnato";

                  return (
                    <div
                      key={appointment.id}
                      style={{
                        ...appointmentCard,
                        top,
                        height,
                        background: getAppointmentColor(appointment.note, !!appointment.sale),
                      }}
                    >
                      <strong style={{ fontSize: 13, fontWeight: 900 }}>
                        {appointment.clientTenant?.clientGlobal?.name || "Cliente"}
                      </strong>

                      <small>
                        🕒{" "}
                        {new Date(appointment.date).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {appointment.duration} min
                      </small>

                      <small>👤 {staffName}</small>

                      <div style={appointmentTags}>
                        {(appointment.note?.split(" + ") || ["Appuntamento"]).map((service, index) => (
                          <span key={index} style={appointmentTag}>
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div style={modalBackdrop}>
          <form style={modalCard} onSubmit={createAppointment}>
            <h2 style={{ marginTop: 0, color: "#0f172a", fontWeight: 900 }}>
              Nuovo appuntamento
            </h2>

            <div style={modalGrid}>
              <select
                style={inputLight}
                value={clientTenantId}
                onChange={(e) => setClientTenantId(e.target.value)}
              >
                <option value="">Cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.clientGlobal.name} - {client.clientGlobal.phone}
                  </option>
                ))}
              </select>

              <select
                style={inputLight}
                value={appointmentStaffId}
                onChange={(e) => setAppointmentStaffId(e.target.value)}
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>

              <input
                style={inputLight}
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />

              <input
                style={inputLight}
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>

            <div style={servicesBox}>
              <strong style={{ color: "#0f172a" }}>Trattamenti</strong>

              <div style={servicesList}>
                {services.map((service) => {
                  const active = selectedServices.includes(service.name);

                  return (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => toggleService(service.name)}
                      style={{
                        ...serviceButton,
                        background: active
                          ? "linear-gradient(135deg,#8b5cf6,#a78bfa)"
                          : "#f8fafc",
                        color: active ? "#fff" : "#0f172a",
                      }}
                    >
                      {service.name} · {service.duration}m
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 14, color: "#0f172a", fontWeight: 900 }}>
                Durata totale: {totalDuration} min
              </div>
            </div>

            <button style={confirmButton} disabled={loading} type="submit">
              {loading ? "SALVATAGGIO..." : "CONFERMA DATA IN AGENDA"}
            </button>

            <button type="button" style={cancelButton} onClick={() => setModalOpen(false)}>
              Annulla
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

const pageHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  marginBottom: 22,
  flexWrap: "wrap",
};

const eyebrow: CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const topActions: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const purpleButton: CSSProperties = {
  padding: "11px 16px",
  borderRadius: 14,
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  border: 0,
  fontWeight: 900,
};

const activeButton: CSSProperties = {
  ...purpleButton,
  background: "linear-gradient(135deg,#d4af37,#facc15)",
  color: "#111827",
};

const ghostButton: CSSProperties = {
  padding: "11px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(212,175,55,0.24)",
  color: "#fff",
  fontWeight: 900,
};

const selectDark: CSSProperties = {
  padding: "11px 16px",
  borderRadius: 14,
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(212,175,55,0.28)",
  color: "#fff",
  fontWeight: 900,
};

const weekBadge: CSSProperties = {
  padding: "11px 15px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(212,175,55,0.24)",
  fontWeight: 800,
  color: "#fff",
};

const errorBox: CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontWeight: 900,
};

const calendarWrap: CSSProperties = {
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 24,
  overflow: "auto",
  background: "rgba(255,255,255,0.035)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  maxHeight: "calc(100vh - 230px)",
};

const calendarHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px repeat(7, minmax(138px, 1fr))",
  minWidth: 1036,
  background: "rgba(0,0,0,0.72)",
  borderBottom: "1px solid rgba(212,175,55,0.22)",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const calendarBody: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px repeat(7, minmax(138px, 1fr))",
  minWidth: 1036,
};

const headerCell: CSSProperties = {
  padding: 11,
  textAlign: "center",
  borderLeft: "1px solid rgba(255,255,255,0.07)",
  fontSize: 12,
  color: "#fff",
};

const timeColumn: CSSProperties = {
  background: "rgba(0,0,0,0.42)",
};

const timeHourCell: CSSProperties = {
  height: HOUR_HEIGHT,
  padding: 9,
  color: "#d4af37",
  fontWeight: 900,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: 12,
};

const dayColumn: CSSProperties = {
  position: "relative",
  minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
  borderLeft: "1px solid rgba(255,255,255,0.08)",
};

const hourCell: CSSProperties = {
  height: HOUR_HEIGHT,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  padding: 7,
  cursor: "pointer",
};

const appointmentCard: CSSProperties = {
  position: "absolute",
  left: 7,
  right: 7,
  minHeight: 40,
  padding: 9,
  borderRadius: 14,
  color: "#fff",
  boxShadow: "0 10px 22px rgba(0,0,0,0.28)",
  zIndex: 4,
  overflow: "hidden",
  display: "grid",
  gap: 4,
  fontSize: 12,
};

const appointmentTags: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const appointmentTag: CSSProperties = {
  background: "rgba(255,255,255,0.18)",
  padding: "2px 7px",
  borderRadius: 999,
  fontWeight: 700,
};

const modalBackdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.62)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 100,
};

const modalCard: CSSProperties = {
  width: "100%",
  maxWidth: 1120,
  background: "#fff",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 30px 90px rgba(15,23,42,0.35)",
};

const modalGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr 0.8fr 0.7fr",
  gap: 12,
};

const inputLight: CSSProperties = {
  width: "100%",
  padding: "15px 17px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  fontSize: 16,
  color: "#0f172a",
  background: "#fff",
};

const servicesBox: CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 14,
  border: "1px solid #dbe3ef",
  background: "#fff",
};

const servicesList: CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const serviceButton: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  fontWeight: 900,
};

const confirmButton: CSSProperties = {
  width: "100%",
  marginTop: 16,
  padding: 17,
  borderRadius: 12,
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  border: 0,
  fontSize: 17,
  fontWeight: 900,
};

const cancelButton: CSSProperties = {
  width: "100%",
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  background: "#f1f5f9",
  color: "#0f172a",
  border: 0,
  fontWeight: 800,
};