"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ClientItem = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function normalizeClient(client: any): ClientItem {
  return {
    id: String(client.clientGlobal?.id ?? client.id),
    name: client.clientGlobal?.name ?? client.name ?? "Senza nome",
    phone: client.clientGlobal?.phone ?? client.phone ?? "Senza telefono",
    notes: client.notes ?? "",
    createdAt: client.clientGlobal?.createdAt ?? client.createdAt,
  };
}

export default function ClientiPage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const [relationshipNotes, setRelationshipNotes] = useState("");
  const [editingClient, setEditingClient] = useState(false);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function getToken() {
    return localStorage.getItem("salonpro_token");
  }

  async function loadClients() {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore caricamento clienti");
      }

      const list = Array.isArray(data)
        ? data.map(normalizeClient)
        : Array.isArray(data.clients)
          ? data.clients.map(normalizeClient)
          : [];

      setClients(list);
      if (list[0]) setSelectedClientId(list[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return clients;

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        client.phone.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((client) => client.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  useEffect(() => {
    setRelationshipNotes(selectedClient?.notes || "");
    setEditClientName(selectedClient?.name || "");
    setEditClientPhone(selectedClient?.phone || "");
    setEditingClient(false);
    setNotesMessage("");
  }, [selectedClient?.id]);

  async function createQuickClient() {
    if (!name.trim() || !phone.trim()) return;

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/clients/quick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore creazione cliente");
      }

      const created = normalizeClient(data);

      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);
      setName("");
      setPhone("");
    } finally {
      setSaving(false);
    }
  }


  async function saveClientChanges() {
    if (!selectedClient) return;

    if (!editClientName.trim()) {
      setNotesMessage("Inserisci il nome cliente.");
      return;
    }

    if (!editClientPhone.trim()) {
      setNotesMessage("Inserisci il telefono cliente.");
      return;
    }

    try {
      setSavingClient(true);
      setNotesMessage("");

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/clients/${selectedClient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editClientName.trim(),
          phone: editClientPhone.trim(),
          notes: relationshipNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore modifica cliente");
      }

      const updated = normalizeClient(data);

      setClients((prev) =>
        prev.map((client) => (client.id === updated.id ? updated : client)),
      );

      setSelectedClientId(updated.id);
      setEditingClient(false);
      setNotesMessage("Cliente aggiornato correttamente.");
    } catch (error: any) {
      setNotesMessage(error.message || "Errore modifica cliente");
    } finally {
      setSavingClient(false);
    }
  }

  async function saveRelationshipNotes() {
    if (!selectedClient) return;

    try {
      setSavingNotes(true);
      setNotesMessage("");

      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/clients/${selectedClient.id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: relationshipNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Errore salvataggio note");
      }

      const updated = normalizeClient(data);

      setClients((prev) =>
        prev.map((client) => (client.id === updated.id ? updated : client)),
      );

      setNotesMessage("Note salvate correttamente.");
    } catch (error: any) {
      setNotesMessage(error.message || "Errore salvataggio note");
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>CRM STORICO CLIENTI</p>
            <h1 style={titleStyle}>Clienti, storico e valore</h1>
            <p style={subtitleStyle}>
              Una scheda cliente completa per capire frequenza, spesa e relazione.
            </p>
          </div>

          <button style={primaryTopButton} onClick={createQuickClient}>
            Crea cliente
          </button>
        </section>

        <section style={gridStyle}>
          <aside style={cardStyle}>
            <h2 style={sectionTitleStyle}>Nuovo cliente</h2>

            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome cliente"
                style={inputStyle}
              />

              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Telefono"
                style={inputStyle}
              />

              <button
                onClick={createQuickClient}
                disabled={saving}
                style={{
                  ...goldButtonStyle,
                  opacity: saving ? 0.55 : 1,
                }}
              >
                {saving ? "Creazione..." : "Crea cliente rapido"}
              </button>
            </div>

            <div style={{ marginTop: 26 }}>
              <h2 style={sectionTitleStyle}>Lista clienti</h2>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cerca cliente..."
                style={{
                  ...inputStyle,
                  marginTop: 16,
                }}
              />

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {loading && <EmptyBox text="Caricamento clienti..." />}

                {!loading && filteredClients.length === 0 && (
                  <EmptyBox text="Nessun cliente presente." />
                )}

                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    style={{
                      ...clientButtonStyle,
                      border:
                        selectedClientId === client.id
                          ? "1px solid rgba(212,175,55,0.58)"
                          : "1px solid rgba(255,255,255,0.08)",
                      background:
                        selectedClientId === client.id
                          ? "rgba(212,175,55,0.16)"
                          : "rgba(255,255,255,0.055)",
                    }}
                  >
                    <strong>{client.name}</strong>
                    <span>{client.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Scheda cliente</h2>

            {!selectedClient ? (
              <EmptyBox text="Seleziona un cliente." />
            ) : (
              <>
                <div style={selectedHeaderStyle}>
                  <div style={{ width: "100%" }}>
                    <p style={eyebrowSmallStyle}>CLIENTE ATTIVO</p>

                    {editingClient ? (
                      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        <input
                          value={editClientName}
                          onChange={(event) => setEditClientName(event.target.value)}
                          placeholder="Nome cliente"
                          style={inputStyle}
                        />

                        <input
                          value={editClientPhone}
                          onChange={(event) => setEditClientPhone(event.target.value)}
                          placeholder="Telefono"
                          style={inputStyle}
                        />
                      </div>
                    ) : (
                      <>
                        <h3 style={clientNameStyle}>{selectedClient.name}</h3>
                        <p style={mutedTextStyle}>{selectedClient.phone}</p>
                      </>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 10, minWidth: 150 }}>
                    <div style={statusPillStyle}>Attivo</div>

                    {editingClient ? (
                      <>
                        <button
                          style={smallGoldButtonStyle}
                          onClick={saveClientChanges}
                          disabled={savingClient}
                        >
                          {savingClient ? "Salvataggio..." : "Salva"}
                        </button>

                        <button
                          style={smallDarkButtonStyle}
                          onClick={() => {
                            setEditingClient(false);
                            setEditClientName(selectedClient.name);
                            setEditClientPhone(selectedClient.phone);
                          }}
                        >
                          Annulla
                        </button>
                      </>
                    ) : (
                      <button
                        style={smallGoldButtonStyle}
                        onClick={() => setEditingClient(true)}
                      >
                        Modifica
                      </button>
                    )}
                  </div>
                </div>

                <div style={metricGridStyle}>
                  <Metric label="Telefono" value={selectedClient.phone} />
                  <Metric label="Appuntamenti" value="0" />
                  <Metric label="Valore cliente" value="€ 0.00" />
                </div>

                <div style={darkPanelStyle}>
                  <h3 style={subSectionTitleStyle}>Storico</h3>
                  <EmptyBox text="Qui collegheremo appuntamenti, vendite, frequenza e note." />
                </div>

                <div style={darkPanelStyle}>
                  <h3 style={subSectionTitleStyle}>Note relazione</h3>
                  <textarea
                    value={relationshipNotes}
                    onChange={(event) => setRelationshipNotes(event.target.value)}
                    placeholder="Preferenze, formule colore, abitudini, note private..."
                    style={textareaStyle}
                  />

                  {notesMessage ? (
                    <div style={notesMessageStyle}>{notesMessage}</div>
                  ) : null}

                  <button
                    onClick={saveRelationshipNotes}
                    disabled={savingNotes}
                    style={{
                      ...purpleButtonStyle,
                      opacity: savingNotes ? 0.6 : 1,
                    }}
                  >
                    {savingNotes ? "Salvataggio..." : "Salva note relazione"}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside style={cardStyle}>
            <h2 style={sectionTitleStyle}>💎 Coach cliente</h2>

            <div style={coachNoticeStyle}>
              Usa storico e frequenza per aumentare ritorno, retention e valore medio.
            </div>

            <CoachAction
              title="Richiamo intelligente"
              text="Suggerisci follow-up se il cliente non torna da oltre 30 giorni."
            />

            <CoachAction
              title="Proposta trattamento"
              text="Collega prodotti e servizi in base allo storico."
            />

            <CoachAction
              title="Card fedeltà"
              text="Mostra punti, premi e offerte dedicate."
            />

            <button style={purpleButtonStyle}>Apri strategia cliente</button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <p style={metricLabelStyle}>{label}</p>
      <p style={metricValueStyle}>{value}</p>
    </div>
  );
}

function CoachAction({ title, text }: { title: string; text: string }) {
  return (
    <div style={coachActionStyle}>
      <h3 style={coachTitleStyle}>{title}</h3>
      <p style={coachTextStyle}>{text}</p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div style={emptyBoxStyle}>{text}</div>;
}

const pageStyle: React.CSSProperties = {
  minHeight: "calc(100vh - 140px)",
  background:
    "radial-gradient(circle at top left, rgba(139,92,246,0.32), transparent 34%), linear-gradient(180deg,#07050b,#08050d 45%,#050505)",
  color: "#f8fafc",
  padding: "24px 28px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1500,
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 22,
  marginBottom: 28,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 13,
  fontWeight: 950,
  letterSpacing: "0.34em",
};

const eyebrowSmallStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: "0.28em",
};

const titleStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 36,
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 10,
  color: "rgba(255,255,255,0.68)",
  fontSize: 16,
  fontWeight: 650,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "390px 1fr 360px",
  gap: 18,
};

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  padding: 24,
  minHeight: 520,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(212,175,55,0.22)",
  boxShadow: "0 28px 80px rgba(0,0,0,0.30)",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 26,
  fontWeight: 950,
  lineHeight: 1.1,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.075)",
  color: "#fff",
  padding: "15px 16px",
  outline: "none",
  fontSize: 15,
  fontWeight: 750,
};

const goldButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: "15px 18px",
  background: "linear-gradient(135deg,#d4af37,#f7df88)",
  color: "#050505",
  fontSize: 15,
  fontWeight: 950,
  cursor: "pointer",
};

const primaryTopButton: React.CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: "15px 24px",
  background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 950,
  cursor: "pointer",
};


const smallGoldButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  padding: "11px 14px",
  background: "linear-gradient(135deg,#d4af37,#f7df88)",
  color: "#050505",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
};

const smallDarkButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  padding: "11px 14px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 950,
  cursor: "pointer",
};

const purpleButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  border: 0,
  borderRadius: 16,
  padding: "15px 18px",
  background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 950,
  cursor: "pointer",
};

const clientButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gap: 4,
  textAlign: "left",
  borderRadius: 16,
  padding: 15,
  color: "#fff",
  cursor: "pointer",
};

const selectedHeaderStyle: React.CSSProperties = {
  marginTop: 18,
  borderRadius: 22,
  padding: 22,
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const clientNameStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 32,
  fontWeight: 950,
  lineHeight: 1.05,
};

const mutedTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: "rgba(255,255,255,0.62)",
  fontWeight: 750,
};

const statusPillStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(212,175,55,0.15)",
  border: "1px solid rgba(212,175,55,0.38)",
  color: "#d4af37",
  fontWeight: 950,
};

const metricGridStyle: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
  gap: 14,
};

const metricStyle: React.CSSProperties = {
  borderRadius: 18,
  padding: 18,
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const metricLabelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)",
  fontSize: 13,
  fontWeight: 800,
};

const metricValueStyle: React.CSSProperties = {
  marginTop: 8,
  color: "#fff",
  fontSize: 20,
  fontWeight: 950,
};

const darkPanelStyle: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 22,
  padding: 20,
  background: "rgba(0,0,0,0.26)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const subSectionTitleStyle: React.CSSProperties = {
  color: "#d4af37",
  fontSize: 22,
  fontWeight: 950,
};

const notesMessageStyle: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 14,
  padding: 12,
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86efac",
  fontWeight: 850,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 120,
  marginTop: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.065)",
  color: "#fff",
  padding: 16,
  outline: "none",
  resize: "vertical",
  fontWeight: 700,
};

const coachNoticeStyle: React.CSSProperties = {
  marginTop: 20,
  borderRadius: 18,
  padding: 18,
  background: "rgba(212,175,55,0.16)",
  color: "#f7df88",
  fontWeight: 850,
  lineHeight: 1.55,
};

const coachActionStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 18,
  padding: 18,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const coachTitleStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 17,
  fontWeight: 950,
};

const coachTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: "rgba(255,255,255,0.68)",
  fontWeight: 650,
  lineHeight: 1.45,
};

const emptyBoxStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 18,
  padding: 18,
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 750,
};