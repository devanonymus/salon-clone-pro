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
  clientGlobal: {
    id: string;
    name: string;
    phone: string;
  };
};

type StaffItem = {
  id: string;
  name: string;
  role: string;
  color?: string;
};

type AppointmentItem = {
  id: string;
  tenantId: string;
  clientTenantId: string;
  staffId?: string | null;
  date: string;
  duration: number;
  note: string | null;
  clientTenant: ClientItem;
  staff?: StaffItem | null;
  sale?: any | null;
};

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

function hexToGradient(hex?: string) {
  const color = hex || "#8b5cf6";
  return `linear-gradient(135deg, ${color}, ${color}cc)`;
}

export default function AgendaPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [agendaMode, setAgendaMode] = useState<"all" | "staff">("all");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const [clientTenantId, setClientTenantId] = useState("");
  const [appointmentStaffId, setAppointmentStaffId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

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

      const [clientsData, appointmentsData, staffData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
        fetchWithAuth("/staff"),
      ]);

      setClients(clientsData || []);
      setAppointments(appointmentsData || []);
      setStaff(staffData || []);

      if (clientsData?.length && !clientTenantId) {
        setClientTenantId(clientsData[0].id);
      }

      if (staffData?.length) {
        if (!selectedStaffId) setSelectedStaffId(staffData[0].id);
        if (!appointmentStaffId) setAppointmentStaffId(staffData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Errore caricamento agenda");
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleService(serviceName: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((item) => item !== serviceName)
        : [...prev, serviceName],
    );
  }

  function getStaffColor(staffId?: string | null) {
    return staff.find((s) => s.id === staffId)?.color || "#8b5cf6";
  }

  function openSlot(day: Date, hour: number, minute: number, targetStaffId?: string | null) {
    if (draggingId) return;

    setAppointmentDate(toInputDate(day));
    setAppointmentTime(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    setAppointmentStaffId(targetStaffId || selectedStaffId || staff[0]?.id || "");
    setSelectedServices([]);
    setSelectedAppointment(null);
    setModalOpen(true);
  }

  function openEditAppointment(appointment: AppointmentItem) {
    const d = new Date(appointment.date);

    setSelectedAppointment(appointment);
    setAppointmentDate(toInputDate(d));
    setAppointmentTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    setSelectedServices(
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [],
    );
    setClientTenantId(appointment.clientTenantId);
    setAppointmentStaffId(appointment.staffId || staff[0]?.id || "");
    setEditOpen(true);
  }

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!clientTenantId) throw new Error("Seleziona un cliente");
      if (!appointmentStaffId) throw new Error("Seleziona un dipendente");
      if (selectedServices.length === 0) throw new Error("Seleziona almeno un trattamento");
      if (!appointmentDate) throw new Error("Seleziona data");
      if (!appointmentTime) throw new Error("Seleziona ora");

      await fetchWithAuth("/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientTenantId,
          staffId: appointmentStaffId,
          date: new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString(),
          services: selectedServices,
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

  async function updateAppointment(e: FormEvent) {
    e.preventDefault();
    if (!selectedAppointment) return;

    setLoading(true);
    setError("");

    try {
      if (!clientTenantId) throw new Error("Seleziona un cliente");
      if (!appointmentStaffId) throw new Error("Seleziona un dipendente");
      if (selectedServices.length === 0) throw new Error("Seleziona almeno un trattamento");

      await fetchWithAuth(`/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          clientTenantId,
          staffId: appointmentStaffId,
          date: new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString(),
          services: selectedServices,
        }),
      });

      setEditOpen(false);
      setSelectedAppointment(null);
      setSelectedServices([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore modifica appuntamento");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAppointment() {
    if (!selectedAppointment) return;

    const ok = confirm("Vuoi eliminare questo appuntamento?");
    if (!ok) return;

    setLoading(true);
    setError("");

    try {
      await fetchWithAuth(`/appointments/${selectedAppointment.id}`, {
        method: "DELETE",
      });

      setEditOpen(false);
      setSelectedAppointment(null);
      setSelectedServices([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore eliminazione appuntamento");
    } finally {
      setLoading(false);
    }
  }

  async function moveAppointment(
    appointmentId: string,
    day: Date,
    hour: number,
    minute: number,
    targetStaffId?: string | null,
  ) {
    try {
      setError("");

      const dateIso = new Date(
        `${toInputDate(day)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      ).toISOString();

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? { ...a, date: dateIso, staffId: targetStaffId === undefined ? a.staffId : targetStaffId }
            : a,
        ),
      );

      await fetchWithAuth(`/appointments/${appointmentId}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          date: dateIso,
          staffId: targetStaffId === undefined ? undefined : targetStaffId,
        }),
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore spostamento appuntamento");
      await loadData();
    } finally {
      setDraggingId(null);
    }
  }

  async function updateStaffColor(member: StaffItem, color: string) {
    try {
      setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, color } : s)));

      await fetchWithAuth(`/staff/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ color }),
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || "Errore salvataggio colore dipendente");
    }
  }

  function getMinuteFromMouse(e: MouseEvent<HTMLDivElement>, hour: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.max(0, Math.min(59, Math.round((y / HOUR_HEIGHT) * 60)));
    return { hour, minute };
  }

  function getMinuteFromDrag(e: DragEvent<HTMLDivElement>, hour: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.max(0, Math.min(59, Math.round((y / HOUR_HEIGHT) * 60)));
    return { hour, minute };
  }

  function topFromDate(date: string) {
    const d = new Date(date);
    return (d.getHours() - START_HOUR) * HOUR_HEIGHT + (d.getMinutes() / 60) * HOUR_HEIGHT;
  }

  function heightFromDuration(duration: number) {
    return Math.max(42, (duration / 60) * HOUR_HEIGHT);
  }

  function movePeriod(delta: number) {
    if (viewMode === "week") {
      const next = new Date(weekStart);
      next.setDate(next.getDate() + delta * 7);
      setWeekStart(next);
      return;
    }

    const next = new Date(selectedDay);
    next.setDate(next.getDate() + delta);
    setSelectedDay(next);
  }

  function appointmentsOfDay(day: Date, staffId?: string) {
    const key = toInputDate(day);

    return appointments.filter((a) => {
      const sameDay = toInputDate(new Date(a.date)) === key;
      const staffOk = agendaMode === "all" && !staffId ? true : a.staffId === (staffId || selectedStaffId);
      return sameDay && staffOk;
    });
  }

  function renderAppointment(appointment: AppointmentItem) {
    const top = topFromDate(appointment.date);
    const height = heightFromDuration(appointment.duration);
    const color = getStaffColor(appointment.staffId);

    return (
      <div
        key={appointment.id}
        draggable={!appointment.sale}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("appointmentId", appointment.id);
          setDraggingId(appointment.id);
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          setTimeout(() => setDraggingId(null), 50);
        }}
        onClick={(e) => {
          e.stopPropagation();
          openEditAppointment(appointment);
        }}
        style={{
          ...appointmentCard,
          top,
          height,
          background: hexToGradient(color),
          opacity: draggingId === appointment.id ? 0.55 : 1,
          cursor: appointment.sale ? "not-allowed" : "pointer",
        }}
      >
        <strong>{appointment.clientTenant?.clientGlobal?.name || "Cliente"}</strong>

        <span>
          🕒{" "}
          {new Date(appointment.date).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          {appointment.staff?.name || staff.find((s) => s.id === appointment.staffId)?.name || "Senza dipendente"}
        </span>

        <div style={appointmentTags}>
          {(appointment.note?.split(" + ") || ["Appuntamento"]).map((s, i) => (
            <span key={i} style={appointmentTag}>
              {s}
            </span>
          ))}
        </div>

        <span>{appointment.sale ? "Venduto" : `${appointment.duration} min`}</span>
      </div>
    );
  }

  const title =
    agendaMode === "staff" && selectedStaff
      ? `Agenda ${selectedStaff.name}`
      : "Agenda principale";

  const subtitle =
    viewMode === "week"
      ? "Vista settimanale con tutti i dipendenti oppure filtrata per collaboratore."
      : "Vista giornaliera generale oppure per singolo collaboratore.";

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1540 }}>
        <header style={pageHeader}>
          <div>
            <div style={eyebrow}>Agenda Appuntamenti</div>
            <h1 className="sp-title">{title}</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              {subtitle}
            </p>
          </div>

          <div style={topActions}>
            <button style={agendaMode === "all" ? activeButton : ghostButton} onClick={() => setAgendaMode("all")}>
              Agenda principale
            </button>

            <button style={agendaMode === "staff" ? activeButton : ghostButton} onClick={() => setAgendaMode("staff")}>
              Per dipendente
            </button>

            <select style={selectDark} value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

            <button style={viewMode === "week" ? activeButton : ghostButton} onClick={() => setViewMode("week")}>
              Settimana
            </button>

            <button style={viewMode === "day" ? activeButton : ghostButton} onClick={() => setViewMode("day")}>
              Giorno
            </button>

            <button style={purpleButton} onClick={() => movePeriod(-1)}>
              ←
            </button>

            <div style={weekBadge}>
              {viewMode === "week"
                ? `${formatDay(days[0])} - ${formatDay(days[6])}`
                : formatDay(selectedDay)}
            </div>

            <button style={purpleButton} onClick={() => movePeriod(1)}>
              →
            </button>
          </div>
        </header>

        {error ? <div style={errorBox}>⚠️ {error}</div> : null}

        <section style={staffColorBar}>
          {staff.map((member) => (
            <div key={member.id} style={staffColorItem}>
              <span style={{ ...staffDot, background: member.color || "#8b5cf6" }} />
              <strong>{member.name}</strong>
              <input
                type="color"
                value={member.color || "#8b5cf6"}
                onChange={(e) => updateStaffColor(member, e.target.value)}
                style={colorInput}
              />
            </div>
          ))}
        </section>

        {viewMode === "week" ? (
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
                      onClick={(e) => {
                        const pos = getMinuteFromMouse(e, hour);
                        openSlot(day, pos.hour, pos.minute, agendaMode === "staff" ? selectedStaffId : selectedStaffId);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const appointmentId = e.dataTransfer.getData("appointmentId");
                        const pos = getMinuteFromDrag(e, hour);

                        if (appointmentId) {
                          moveAppointment(appointmentId, day, pos.hour, pos.minute, undefined);
                        }
                      }}
                      style={{
                        ...hourCell,
                        background: isToday(day) ? "rgba(212,175,55,0.045)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ color: "rgba(255,255,255,0.12)", fontWeight: 900 }}>+</div>
                    </div>
                  ))}

                  {appointmentsOfDay(day).map(renderAppointment)}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section style={calendarWrap}>
            <div
              style={{
                ...dayHeader,
                gridTemplateColumns:
                  agendaMode === "all"
                    ? `70px repeat(${Math.max(staff.length, 1)}, minmax(170px, 1fr))`
                    : "70px minmax(220px, 1fr)",
                minWidth: agendaMode === "all" ? Math.max(900, 70 + staff.length * 190) : 520,
              }}
            >
              <div style={headerCell}>ORA</div>
              {(agendaMode === "all" ? staff : staff.filter((s) => s.id === selectedStaffId)).map((member) => (
                <div key={member.id} style={headerCell}>
                  <span style={{ ...staffDot, background: member.color || "#8b5cf6" }} />
                  <strong>{member.name}</strong>
                </div>
              ))}
            </div>

            <div
              style={{
                ...dayBody,
                gridTemplateColumns:
                  agendaMode === "all"
                    ? `70px repeat(${Math.max(staff.length, 1)}, minmax(170px, 1fr))`
                    : "70px minmax(220px, 1fr)",
                minWidth: agendaMode === "all" ? Math.max(900, 70 + staff.length * 190) : 520,
              }}
            >
              <div style={timeColumn}>
                {hours.map((hour) => (
                  <div key={hour} style={timeHourCell}>
                    {String(hour).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {(agendaMode === "all" ? staff : staff.filter((s) => s.id === selectedStaffId)).map((member) => (
                <div key={member.id} style={dayColumn}>
                  {hours.map((hour) => (
                    <div
                      key={`${member.id}-${hour}`}
                      onClick={(e) => {
                        const pos = getMinuteFromMouse(e, hour);
                        openSlot(selectedDay, pos.hour, pos.minute, member.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const appointmentId = e.dataTransfer.getData("appointmentId");
                        const pos = getMinuteFromDrag(e, hour);

                        if (appointmentId) {
                          moveAppointment(appointmentId, selectedDay, pos.hour, pos.minute, member.id);
                        }
                      }}
                      style={{
                        ...hourCell,
                        background:
                          isToday(selectedDay) ? "rgba(212,175,55,0.045)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ color: "rgba(255,255,255,0.12)", fontWeight: 900 }}>+</div>
                    </div>
                  ))}

                  {appointmentsOfDay(selectedDay, member.id).map(renderAppointment)}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {modalOpen ? (
        <AppointmentModal
          title="Nuovo appuntamento"
          clients={clients}
          staff={staff}
          clientTenantId={clientTenantId}
          setClientTenantId={setClientTenantId}
          appointmentStaffId={appointmentStaffId}
          setAppointmentStaffId={setAppointmentStaffId}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          selectedServices={selectedServices}
          toggleService={toggleService}
          totalDuration={totalDuration}
          loading={loading}
          onSubmit={createAppointment}
          onClose={() => setModalOpen(false)}
          submitLabel="CONFERMA DATA IN AGENDA"
        />
      ) : null}

      {editOpen && selectedAppointment ? (
        <AppointmentModal
          title="Modifica appuntamento"
          clients={clients}
          staff={staff}
          clientTenantId={clientTenantId}
          setClientTenantId={setClientTenantId}
          appointmentStaffId={appointmentStaffId}
          setAppointmentStaffId={setAppointmentStaffId}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          selectedServices={selectedServices}
          toggleService={toggleService}
          totalDuration={totalDuration}
          loading={loading}
          onSubmit={updateAppointment}
          onClose={() => {
            setEditOpen(false);
            setSelectedAppointment(null);
            setSelectedServices([]);
          }}
          submitLabel="SALVA MODIFICHE"
          onDelete={deleteAppointment}
        />
      ) : null}
    </main>
  );
}

function AppointmentModal(props: {
  title: string;
  clients: ClientItem[];
  staff: StaffItem[];
  clientTenantId: string;
  setClientTenantId: (v: string) => void;
  appointmentStaffId: string;
  setAppointmentStaffId: (v: string) => void;
  appointmentDate: string;
  setAppointmentDate: (v: string) => void;
  appointmentTime: string;
  setAppointmentTime: (v: string) => void;
  selectedServices: string[];
  toggleService: (v: string) => void;
  totalDuration: number;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  submitLabel: string;
  onDelete?: () => void;
}) {
  return (
    <div style={modalBackdrop}>
      <form style={modalCard} onSubmit={props.onSubmit}>
        <h2 style={{ marginTop: 0, color: "#0f172a", fontWeight: 900 }}>{props.title}</h2>

        <div style={modalGrid}>
          <select style={inputLight} value={props.clientTenantId} onChange={(e) => props.setClientTenantId(e.target.value)}>
            <option value="">Cliente...</option>
            {props.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.clientGlobal.name} - {client.clientGlobal.phone}
              </option>
            ))}
          </select>

          <select style={inputLight} value={props.appointmentStaffId} onChange={(e) => props.setAppointmentStaffId(e.target.value)}>
            {props.staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          <input style={inputLight} type="date" value={props.appointmentDate} onChange={(e) => props.setAppointmentDate(e.target.value)} />
          <input style={inputLight} type="time" value={props.appointmentTime} onChange={(e) => props.setAppointmentTime(e.target.value)} />
        </div>

        <div style={servicesBox}>
          <strong style={{ color: "#0f172a" }}>Trattamenti</strong>

          <div style={servicesList}>
            {services.map((service) => {
              const active = props.selectedServices.includes(service.name);

              return (
                <button
                  key={service.name}
                  type="button"
                  onClick={() => props.toggleService(service.name)}
                  style={{
                    ...serviceButton,
                    background: active ? "linear-gradient(135deg,#8b5cf6,#a78bfa)" : "#f8fafc",
                    color: active ? "#fff" : "#0f172a",
                  }}
                >
                  {service.name} · {service.duration}m
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, color: "#0f172a", fontWeight: 900 }}>
            Durata totale: {props.totalDuration} min
          </div>
        </div>

        <button style={confirmButton} disabled={props.loading} type="submit">
          {props.loading ? "SALVATAGGIO..." : props.submitLabel}
        </button>

        {props.onDelete ? (
          <button
            type="button"
            disabled={props.loading}
            onClick={props.onDelete}
            style={{
              ...confirmButton,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
            }}
          >
            ELIMINA APPUNTAMENTO
          </button>
        ) : null}

        <button type="button" style={cancelButton} onClick={props.onClose}>
          Annulla
        </button>
      </form>
    </div>
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

const staffColorBar: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const staffColorItem: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(212,175,55,0.20)",
};

const staffDot: CSSProperties = {
  display: "inline-block",
  width: 12,
  height: 12,
  borderRadius: 999,
};

const colorInput: CSSProperties = {
  width: 34,
  height: 28,
  border: 0,
  background: "transparent",
};

const calendarWrap: CSSProperties = {
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 24,
  overflow: "auto",
  background: "rgba(255,255,255,0.035)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  maxHeight: "calc(100vh - 270px)",
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

const dayHeader: CSSProperties = {
  display: "grid",
  background: "rgba(0,0,0,0.72)",
  borderBottom: "1px solid rgba(212,175,55,0.22)",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const dayBody: CSSProperties = {
  display: "grid",
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
  position: "relative",
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