"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties, DragEvent, FormEvent, MouseEvent } from "react";

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

type AppointmentItem = {
  id: string;
  tenantId: string;
  clientTenantId: string;
  date: string;
  duration: number;
  note: string | null;
  createdAt: string;
  staffId?: string | null;
  clientTenant: ClientItem;
  sale?: any | null;
};

type Staff = {
  id: string;
  name: string;
};

const services = [
  { name: "Piega", duration: 35 },
  { name: "Taglio Donna", duration: 35 },
  { name: "Taglio Uomo", duration: 30 },
  { name: "Colore Base", duration: 35 },
  { name: "Colore + Piega", duration: 80 },
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
  return date.toISOString().slice(0, 10);
}

function formatDay(date: Date) {
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AgendaPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [viewMode, setViewMode] = useState<"all" | "staff">("all");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const [modalOpen, setModalOpen] = useState(false);

  const [clientTenantId, setClientTenantId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [selectedStaffForBooking, setSelectedStaffForBooking] = useState("");

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  }, []);

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return res.json();
  }

  async function loadData() {
    const [clientsData, appointmentsData, staffData] = await Promise.all([
      fetchWithAuth("/clients"),
      fetchWithAuth("/appointments"),
      fetchWithAuth("/staff"),
    ]);

    setClients(clientsData || []);
    setAppointments(appointmentsData || []);
    setStaff(staffData || []);

    if (staffData?.length) {
      setSelectedStaffId(staffData[0].id);
      setSelectedStaffForBooking(staffData[0].id);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function appointmentsOfDay(day: Date) {
    const key = toInputDate(day);

    return appointments.filter((a) => {
      const sameDay = toInputDate(new Date(a.date)) === key;

      if (viewMode === "staff") {
        return sameDay && a.staffId === selectedStaffId;
      }

      return sameDay;
    });
  }

  function topFromDate(date: string) {
    const d = new Date(date);
    return (d.getHours() - START_HOUR) * HOUR_HEIGHT + (d.getMinutes() / 60) * HOUR_HEIGHT;
  }

  function heightFromDuration(duration: number) {
    return Math.max(40, (duration / 60) * HOUR_HEIGHT);
  }

  function openSlot(day: Date, hour: number) {
    setAppointmentDate(toInputDate(day));
    setAppointmentTime(`${hour}:00`);
    setModalOpen(true);
  }

  function moveWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }

  function toggleService(serviceName: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName],
    );
  }

  async function createAppointment(e: FormEvent) {
    e.preventDefault();

    if (!clientTenantId) return alert("Seleziona cliente");
    if (!appointmentDate) return alert("Seleziona data");
    if (!appointmentTime) return alert("Seleziona ora");
    if (selectedServices.length === 0) return alert("Seleziona almeno un servizio");

    const dateIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

    const created = await fetchWithAuth("/appointments", {
      method: "POST",
      body: JSON.stringify({
        clientTenantId,
        date: dateIso,
        services: selectedServices,
        staffId: selectedStaffForBooking,
      }),
    });

    const normalized = {
      ...created,
      staffId: selectedStaffForBooking,
    };

    setAppointments((prev) => [...prev, normalized]);

    setModalOpen(false);
    setClientTenantId("");
    setSelectedServices([]);
    setAppointmentDate("");
    setAppointmentTime("");
  }

  const visibleTitle =
    viewMode === "all"
      ? "Agenda principale"
      : `Agenda ${staff.find((s) => s.id === selectedStaffId)?.name || ""}`;

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1540 }}>
        <header style={pageHeader}>
          <div>
            <div style={eyebrow}>Agenda Appuntamenti</div>
            <h1 className="sp-title">{visibleTitle}</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Vista generale del salone oppure agenda filtrata per collaboratore.
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
                setSelectedStaffForBooking(e.target.value);
                setViewMode("staff");
              }}
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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

        <section style={calendarWrap}>
          <div style={calendarHeader}>
            <div style={headerCell}>ORA</div>

            {days.map((day) => (
              <div key={day.toISOString()} style={headerCell}>
                <strong>
                  {day.toLocaleDateString("it-IT", { weekday: "short" }).toUpperCase()}
                </strong>
                <div style={{ color: "#b8bfd0", marginTop: 4 }}>{formatDay(day)}</div>
              </div>
            ))}
          </div>

          <div style={calendarBody}>
            <div style={timeColumn}>
              {hours.map((hour) => (
                <div key={hour} style={timeCell}>
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div key={day.toISOString()} style={dayColumn}>
                {hours.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    style={hourCell}
                    onClick={() => openSlot(day, hour)}
                  >
                    <span style={{ color: "rgba(255,255,255,0.12)", fontWeight: 900 }}>
                      +
                    </span>
                  </div>
                ))}

                {appointmentsOfDay(day).map((appointment) => {
                  const top = topFromDate(appointment.date);
                  const height = heightFromDuration(appointment.duration);
                  const assignedStaff = staff.find((s) => s.id === appointment.staffId);

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
                      <strong>{appointment.clientTenant?.clientGlobal?.name || "Cliente"}</strong>

                      <small>
                        {new Date(appointment.date).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {appointment.duration} min
                      </small>

                      {assignedStaff ? <small>👤 {assignedStaff.name}</small> : null}

                      <div style={tagWrap}>
                        {(appointment.note?.split(" + ") || ["Appuntamento"]).map((s, i) => (
                          <span key={i} style={tag}>
                            {s}
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
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Nuovo appuntamento</h2>

            <div style={modalGrid}>
              <select
                style={inputLight}
                value={clientTenantId}
                onChange={(e) => setClientTenantId(e.target.value)}
              >
                <option value="">Cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientGlobal.name} - {c.clientGlobal.phone}
                  </option>
                ))}
              </select>

              <select
                style={inputLight}
                value={selectedStaffForBooking}
                onChange={(e) => setSelectedStaffForBooking(e.target.value)}
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            </div>

            <button style={confirmButton} type="submit">
              CONFERMA DATA IN AGENDA
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

const timeCell: CSSProperties = {
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

const tagWrap: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const tag: CSSProperties = {
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