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
  clientTenant: ClientItem;
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

function getCategory(service: string) {
  const value = service.toLowerCase();

  if (
    value.includes("colore") ||
    value.includes("tonalizzante") ||
    value.includes("gloss") ||
    value.includes("decapaggio") ||
    value.includes("schiariture") ||
    value.includes("meches") ||
    value.includes("sole")
  ) {
    return "color";
  }

  if (value.includes("taglio") || value.includes("barba")) return "cut";

  if (
    value.includes("ricostruzione") ||
    value.includes("keratina") ||
    value.includes("rituale") ||
    value.includes("bio plastia") ||
    value.includes("laminazione")
  ) {
    return "treatment";
  }

  if (value.includes("piega") || value.includes("styling")) return "style";

  return "other";
}

function getAppointmentColor(note: string | null, sold?: boolean) {
  if (sold) return "linear-gradient(135deg,#16a34a,#22c55e)";
  if (!note) return "linear-gradient(135deg,#d4af37,#facc15)";

  const main = note.split(" + ")[0];
  const category = getCategory(main);

  if (category === "color") return "linear-gradient(135deg,#f97316,#fb923c)";
  if (category === "cut") return "linear-gradient(135deg,#3b82f6,#60a5fa)";
  if (category === "treatment") return "linear-gradient(135deg,#10b981,#34d399)";
  if (category === "style") return "linear-gradient(135deg,#8b5cf6,#a78bfa)";

  return "linear-gradient(135deg,#d4af37,#facc15)";
}

export default function AgendaPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);

  const [clientTenantId, setClientTenantId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

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

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, serviceName) => {
      const service = services.find((item) => item.name === serviceName);
      return sum + (service?.duration || 30);
    }, 0);
  }, [selectedServices]);

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token =
      localStorage.getItem("salonpro_token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      throw new Error("Token mancante");
    }

    const finalUrl = path.startsWith("http") ? path : `${API_URL}${path}`;

    const res = await fetch(finalUrl, {
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

      setClients(clientsData);
      setAppointments(appointmentsData);

      if (clientsData.length > 0 && !clientTenantId) {
        setClientTenantId(clientsData[0].id);
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

  function openSlot(day: Date, hour: number, minute: number) {
    if (draggingId) return;

    setAppointmentDate(toInputDate(day));
    setAppointmentTime(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
    setSelectedServices([]);
    setNewClientOpen(false);
    setSelectedAppointment(null);
    setModalOpen(true);
  }

  function openEditAppointment(appointment: AppointmentItem) {
    const d = new Date(appointment.date);

    setSelectedAppointment(appointment);
    setAppointmentDate(toInputDate(d));
    setAppointmentTime(
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    );
    setSelectedServices(
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [],
    );

    setClientTenantId(appointment.clientTenantId);
    setEditOpen(true);
  }

  function autoOra() {
    const now = new Date();
    setAppointmentDate(toInputDate(now));
    setAppointmentTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    );
  }

  async function createQuickClientIfNeeded() {
    if (!newClientOpen) return clientTenantId;

    if (!newClientName.trim()) throw new Error("Inserisci nome cliente nuovo");
    if (!newClientPhone.trim()) throw new Error("Inserisci telefono cliente nuovo");

    await fetchWithAuth("/clients/quick", {
      method: "POST",
      body: JSON.stringify({
        name: newClientName.trim(),
        phone: newClientPhone.trim(),
      }),
    });

    const list = await fetchWithAuth("/clients");
    setClients(list);

    const found = list.find(
      (c: ClientItem) => c.clientGlobal.phone === newClientPhone.trim(),
    );

    return found?.id || clientTenantId;
  }

  async function createAppointment(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalClientTenantId = await createQuickClientIfNeeded();

      if (!finalClientTenantId) throw new Error("Seleziona un cliente");
      if (selectedServices.length === 0) {
        throw new Error("Seleziona almeno un trattamento");
      }
      if (!appointmentDate) throw new Error("Seleziona data");
      if (!appointmentTime) throw new Error("Seleziona ora");

      const dateIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

      await fetchWithAuth("/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientTenantId: finalClientTenantId,
          date: dateIso,
          services: selectedServices,
        }),
      });

      setModalOpen(false);
      setNewClientName("");
      setNewClientPhone("");
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
      if (selectedServices.length === 0) {
        throw new Error("Seleziona almeno un trattamento");
      }
      if (!appointmentDate) throw new Error("Seleziona data");
      if (!appointmentTime) throw new Error("Seleziona ora");

      const dateIso = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

      await fetchWithAuth(`/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          clientTenantId,
          date: dateIso,
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
  ) {
    try {
      setError("");

      const dateIso = new Date(
        `${toInputDate(day)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
      ).toISOString();

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, date: dateIso } : a)),
      );

      await fetchWithAuth(`/appointments/${appointmentId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ date: dateIso }),
      });
    } catch (err: any) {
      setError(err.message || "Errore spostamento appuntamento");
      await loadData();
    } finally {
      setDraggingId(null);
    }
  }

  function appointmentsOfDay(day: Date) {
    const key = toInputDate(day);
    return appointments.filter((a) => toInputDate(new Date(a.date)) === key);
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
    return Math.max(38, (duration / 60) * HOUR_HEIGHT);
  }

  function moveWeek(delta: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1540 }}>
        <header style={pageHeader}>
          <div>
            <div style={eyebrow}>Agenda Appuntamenti</div>
            <h1 className="sp-title">Settimana salone</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Clicca per creare. Clicca su un appuntamento per modificarlo o eliminarlo.
            </p>
          </div>

          <div style={weekControls}>
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
                <div style={{ marginTop: 4, color: "#b8bfd0" }}>
                  {formatDay(day)}
                </div>
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
                      if (draggingId) return;
                      const pos = getMinuteFromMouse(e, hour);
                      openSlot(day, pos.hour, pos.minute);
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
                        moveAppointment(appointmentId, day, pos.hour, pos.minute);
                      }
                    }}
                    style={{
                      ...hourCell,
                      background: isToday(day)
                        ? "rgba(212,175,55,0.045)"
                        : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div style={minuteLine25} />
                    <div style={minuteLine50} />
                    <div style={{ color: "rgba(255,255,255,0.12)", fontWeight: 900 }}>+</div>
                  </div>
                ))}

                {appointmentsOfDay(day).map((appointment) => {
                  const top = topFromDate(appointment.date);
                  const height = heightFromDuration(appointment.duration);

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
                        position: "absolute",
                        top,
                        left: 7,
                        right: 7,
                        height,
                        minHeight: 38,
                        padding: 9,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: getAppointmentColor(appointment.note, !!appointment.sale),
                        color: "#fff",
                        boxShadow: "0 10px 22px rgba(0,0,0,0.28)",
                        opacity: draggingId === appointment.id ? 0.55 : 1,
                        cursor: appointment.sale ? "not-allowed" : "pointer",
                        zIndex: 4,
                      }}
                    >
                      <strong style={{ fontSize: 13, fontWeight: 900 }}>
                        {appointment.clientTenant.clientGlobal.name}
                      </strong>

                      <div style={{ fontSize: 11, marginTop: 4, opacity: 0.9 }}>
                        🕒{" "}
                        {new Date(appointment.date).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      <div style={appointmentTags}>
                        {(appointment.note?.split(" + ") || ["Appuntamento"]).map((s, i) => (
                          <span key={i} style={appointmentTag}>
                            {s}
                          </span>
                        ))}
                      </div>

                      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.95 }}>
                        {appointment.sale ? "Venduto" : `${appointment.duration} min`}
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
        <AppointmentModal
          title="Nuovo appuntamento"
          clients={clients}
          clientTenantId={clientTenantId}
          setClientTenantId={setClientTenantId}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          selectedServices={selectedServices}
          toggleService={toggleService}
          totalDuration={totalDuration}
          newClientOpen={newClientOpen}
          setNewClientOpen={setNewClientOpen}
          newClientName={newClientName}
          setNewClientName={setNewClientName}
          newClientPhone={newClientPhone}
          setNewClientPhone={setNewClientPhone}
          loading={loading}
          onSubmit={createAppointment}
          onAutoOra={autoOra}
          onClose={() => setModalOpen(false)}
          submitLabel="CONFERMA DATA IN AGENDA"
          showNewClient
        />
      ) : null}

      {editOpen && selectedAppointment ? (
        <AppointmentModal
          title="Modifica appuntamento"
          clients={clients}
          clientTenantId={clientTenantId}
          setClientTenantId={setClientTenantId}
          appointmentDate={appointmentDate}
          setAppointmentDate={setAppointmentDate}
          appointmentTime={appointmentTime}
          setAppointmentTime={setAppointmentTime}
          selectedServices={selectedServices}
          toggleService={toggleService}
          totalDuration={totalDuration}
          newClientOpen={false}
          setNewClientOpen={() => {}}
          newClientName=""
          setNewClientName={() => {}}
          newClientPhone=""
          setNewClientPhone={() => {}}
          loading={loading}
          onSubmit={updateAppointment}
          onAutoOra={autoOra}
          onClose={() => {
            setEditOpen(false);
            setSelectedAppointment(null);
            setSelectedServices([]);
          }}
          submitLabel="SALVA MODIFICHE"
          showNewClient={false}
          onDelete={deleteAppointment}
        />
      ) : null}
    </main>
  );
}

function AppointmentModal(props: {
  title: string;
  clients: ClientItem[];
  clientTenantId: string;
  setClientTenantId: (v: string) => void;
  appointmentDate: string;
  setAppointmentDate: (v: string) => void;
  appointmentTime: string;
  setAppointmentTime: (v: string) => void;
  selectedServices: string[];
  toggleService: (v: string) => void;
  totalDuration: number;
  newClientOpen: boolean;
  setNewClientOpen: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientPhone: string;
  setNewClientPhone: (v: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onAutoOra: () => void;
  onClose: () => void;
  submitLabel: string;
  showNewClient: boolean;
  onDelete?: () => void;
}) {
  return (
    <div style={modalBackdrop}>
      <form onSubmit={props.onSubmit} style={modalCard}>
        <h2 style={{ marginTop: 0, color: "#0f172a", fontWeight: 900 }}>
          {props.title}
        </h2>

        <div style={modalGridTop}>
          <select
            value={props.clientTenantId}
            onChange={(e) => props.setClientTenantId(e.target.value)}
            style={bigInput}
            disabled={props.showNewClient && props.newClientOpen}
          >
            <option value="">Cliente da storico...</option>
            {props.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.clientGlobal.name} - {client.clientGlobal.phone}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={props.appointmentDate}
            onChange={(e) => props.setAppointmentDate(e.target.value)}
            style={bigInput}
          />

          <input
            type="time"
            step="60"
            value={props.appointmentTime}
            onChange={(e) => props.setAppointmentTime(e.target.value)}
            style={bigInput}
          />

          <button type="button" onClick={props.onAutoOra} style={autoButton}>
            AUTO ORA
          </button>
        </div>

        <div style={servicesBox}>
          <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 12, fontSize: 16 }}>
            Trattamenti
          </div>

          <div style={serviceList}>
            {services.map((service) => {
              const selected = props.selectedServices.includes(service.name);

              return (
                <button
                  key={service.name}
                  type="button"
                  onClick={() => props.toggleService(service.name)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: selected ? "1px solid #8b5cf6" : "1px solid #cbd5e1",
                    background: selected
                      ? "linear-gradient(135deg,#8b5cf6,#a78bfa)"
                      : "#f8fafc",
                    color: selected ? "#fff" : "#0f172a",
                    fontWeight: 900,
                  }}
                >
                  {service.name} · {service.duration}m
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, color: "#0f172a", fontWeight: 900, fontSize: 17 }}>
            Durata totale: {props.totalDuration} min
          </div>
        </div>

        {props.showNewClient ? (
          <div style={newClientBox}>
            <button
              type="button"
              onClick={() => props.setNewClientOpen(!props.newClientOpen)}
              style={newClientTitle}
            >
              🆕 CLIENTE NUOVO OPZIONALE
              <span style={smallButton}>{props.newClientOpen ? "CHIUDI" : "APRI"}</span>
            </button>

            {props.newClientOpen ? (
              <div style={newClientGrid}>
                <input
                  placeholder="Nome nuovo cliente"
                  value={props.newClientName}
                  onChange={(e) => props.setNewClientName(e.target.value)}
                  style={bigInput}
                />
                <input
                  placeholder="Telefono nuovo cliente"
                  value={props.newClientPhone}
                  onChange={(e) => props.setNewClientPhone(e.target.value)}
                  style={bigInput}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <button type="submit" disabled={props.loading} style={confirmButton}>
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

        <button type="button" onClick={props.onClose} style={cancelButton}>
          Annulla
        </button>
      </form>
    </div>
  );
}

const pageHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
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

const weekControls: CSSProperties = {
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
  maxHeight: "calc(100vh - 220px)",
  width: "100%",
};

const calendarHeader: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px repeat(7, minmax(138px, 1fr))",
  background: "rgba(0,0,0,0.72)",
  borderBottom: "1px solid rgba(212,175,55,0.22)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  minWidth: 1036,
};

const calendarBody: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px repeat(7, minmax(138px, 1fr))",
  minWidth: 1036,
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

const minuteLine25: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "33.33%",
  borderTop: "1px dashed rgba(255,255,255,0.05)",
};

const minuteLine50: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "66.66%",
  borderTop: "1px dashed rgba(255,255,255,0.05)",
};

const headerCell: CSSProperties = {
  padding: 11,
  textAlign: "center",
  borderLeft: "1px solid rgba(255,255,255,0.07)",
  fontSize: 12,
};

const appointmentTags: CSSProperties = {
  fontSize: 11,
  marginTop: 6,
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

const modalGridTop: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 0.9fr 0.7fr 0.55fr",
  gap: 12,
};

const bigInput: CSSProperties = {
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

const serviceList: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  maxHeight: 180,
  overflowY: "auto",
};

const autoButton: CSSProperties = {
  padding: "15px 17px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#e8eef8",
  color: "#0f172a",
  fontWeight: 900,
};

const newClientBox: CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 14,
  border: "1px solid #dbe3ef",
  background: "#f8fafc",
};

const newClientTitle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "transparent",
  border: 0,
  color: "#22c55e",
  fontSize: 17,
  fontWeight: 900,
};

const newClientGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginTop: 14,
};

const smallButton: CSSProperties = {
  background: "#e8eef8",
  color: "#0f172a",
  padding: "7px 14px",
  borderRadius: 10,
  fontSize: 13,
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