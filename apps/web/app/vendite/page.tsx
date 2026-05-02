"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
      id: string;
      name: string;
      phone: string;
    };
  };
};

type CartItem = {
  id: string;
  type: "service" | "product";
  name: string;
  price: number;
  cost: number;
  quantity: number;
};

type ProductSuggestion = {
  name: string;
  tag: string;
  price: number;
  cost: number;
  reason: string;
};

const SERVICE_PRICES: Record<string, { price: number; cost: number }> = {
  Piega: { price: 18, cost: 1.5 },
  "Piega Atelier Extra Styling": { price: 25, cost: 2 },
  "Taglio Donna": { price: 20, cost: 0 },
  "Taglio Donna + Piega": { price: 32, cost: 2 },
  "Shampoo + Taglio Uomo": { price: 22, cost: 1 },
  "Barba Rifinitura": { price: 10, cost: 0.5 },
  "Colore Base": { price: 28, cost: 7 },
  "Colore Base + Piega": { price: 42, cost: 8.5 },
  "Colore Base + Taglio + Piega": { price: 55, cost: 9.5 },
  "Tonalizzante/Gloss": { price: 22, cost: 4.5 },
  "Tonalizzante + Piega": { price: 35, cost: 6 },
  "Decapaggio Colore": { price: 45, cost: 10 },
  "Decapaggio + Piega": { price: 70, cost: 12 },
  "Schiariture Parziali Meches Light": { price: 65, cost: 18 },
  "Colpi di Sole/Meches + Piega": { price: 85, cost: 24 },
};

const PRODUCTS: ProductSuggestion[] = [
  {
    name: "Shampoo Protezione Colore",
    tag: "colore",
    price: 18,
    cost: 6,
    reason: "Mantiene colore e brillantezza più a lungo.",
  },
  {
    name: "Maschera Colore Vivo",
    tag: "colore",
    price: 24,
    cost: 8,
    reason: "Perfetta dopo colore, gloss, balayage o tonalizzante.",
  },
  {
    name: "Termoprotettore Styling",
    tag: "piega",
    price: 19,
    cost: 5,
    reason: "Protegge il risultato della piega da phon e piastra.",
  },
  {
    name: "Siero Gloss Lucentezza",
    tag: "piega",
    price: 22,
    cost: 7,
    reason: "Dà effetto lucido e finish premium anche a casa.",
  },
  {
    name: "Shampoo Repair Plex",
    tag: "repair",
    price: 21,
    cost: 7,
    reason: "Continua il trattamento ricostruttivo a casa.",
  },
  {
    name: "Maschera Ricostruzione Profonda",
    tag: "repair",
    price: 28,
    cost: 9,
    reason: "Ideale dopo plex, ricostruzione o capelli stressati.",
  },
  {
    name: "Leave-in Anti Crespo",
    tag: "antifrizz",
    price: 25,
    cost: 8,
    reason: "Perfetto dopo bio plastia o trattamento anti-frizz.",
  },
];

export default function VenditePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [readyAppointments, setReadyAppointments] = useState<AppointmentItem[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const costTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.cost * item.quantity, 0),
    [cart],
  );

  const margin = total - costTotal;

  const suggestions = useMemo(() => {
    const text = cart.map((i) => i.name).join(" ").toLowerCase();
    const tags: string[] = [];

    if (
      text.includes("colore") ||
      text.includes("balayage") ||
      text.includes("gloss") ||
      text.includes("tonalizzante") ||
      text.includes("meches") ||
      text.includes("decapaggio")
    ) {
      tags.push("colore");
    }

    if (text.includes("piega") || text.includes("styling")) {
      tags.push("piega");
    }

    if (
      text.includes("ricostruzione") ||
      text.includes("plex") ||
      text.includes("trattamento")
    ) {
      tags.push("repair");
    }

    if (text.includes("bio plastia") || text.includes("anti-frizz")) {
      tags.push("antifrizz");
    }

    if (tags.length === 0) tags.push("piega");

    const already = cart.map((i) => i.name);

    return PRODUCTS.filter((p) => tags.includes(p.tag) && !already.includes(p.name)).slice(
      0,
      4,
    );
  }, [cart]);

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token = localStorage.getItem("salonpro_token");

    if (!token) {
      router.push("/login");
      throw new Error("Token mancante");
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
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
      const msg =
        typeof data?.message === "object" ? JSON.stringify(data.message) : data?.message;

      throw new Error(msg || text || "Errore richiesta");
    }

    return data;
  }

  async function loadData() {
    try {
      const [clientsData, appointmentsData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
      ]);

      setClients(clientsData);

      const now = Date.now();

      const from = new Date();
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);

      const to = new Date();
      to.setHours(23, 59, 59, 999);

      const ready = appointmentsData
        .filter((a: AppointmentItem) => !a.sale)
        .filter((a: AppointmentItem) => {
          const end = new Date(a.date).getTime() + a.duration * 60 * 1000;
          return end >= from.getTime() && end <= to.getTime();
        })
        .sort((a: AppointmentItem, b: AppointmentItem) => {
          const aEnd = new Date(a.date).getTime() + a.duration * 60 * 1000;
          const bEnd = new Date(b.date).getTime() + b.duration * 60 * 1000;
          return Math.abs(now - aEnd) - Math.abs(now - bEnd);
        });

      setReadyAppointments(ready);

      if (!selectedAppointment && ready.length > 0) {
        autoLoadAppointment(ready[0], clientsData);
      }

      if (ready.length === 0) {
        setMessage("");
      }
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore caricamento cassa"}`);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function autoLoadAppointment(appointment: AppointmentItem, clientsList = clients) {
    setSelectedAppointment(appointment);

    const client = clientsList.find(
      (c) => c.clientGlobal.id === appointment.clientTenant.clientGlobal.id,
    );

    if (client) {
      setSelectedClientId(client.id);
    }

    const services =
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [];

    const serviceItems: CartItem[] = services.map((serviceName) => {
      const priceData = SERVICE_PRICES[serviceName] || { price: 30, cost: 5 };

      return {
        id: crypto.randomUUID(),
        type: "service",
        name: serviceName,
        price: priceData.price,
        cost: priceData.cost,
        quantity: 1,
      };
    });

    setCart(serviceItems);
    setMessage(
      `✅ Appuntamento di ${appointment.clientTenant.clientGlobal.name} caricato in cassa.`,
    );
  }

  function addSuggestion(product: ProductSuggestion) {
    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "product",
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: 1,
      },
    ]);
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function closeSale() {
    if (!selectedClient) {
      setMessage("⚠️ Cliente non selezionato.");
      return;
    }

    if (cart.length === 0) {
      setMessage("⚠️ Carrello vuoto.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await fetchWithAuth("/sales", {
        method: "POST",
        body: JSON.stringify({
          clientGlobalId: selectedClient.clientGlobal.id,
          appointmentId: selectedAppointment?.id || undefined,
          total,
          paymentMethod,
          items: cart.map((item) => ({
            name: item.name,
            type: item.type,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity,
          })),
        }),
      });

      setMessage("✅ Vendita registrata e collegata all’appuntamento.");
      setCart([]);
      setSelectedAppointment(null);
      setSelectedClientId("");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore registrazione vendita"}`);
    } finally {
      setLoading(false);
    }
  }

  function minutesStatus(appointment: AppointmentItem) {
    const end = new Date(appointment.date).getTime() + appointment.duration * 60 * 1000;
    const diff = Math.floor((Date.now() - end) / 60000);

    if (diff < 0) return `Finisce tra ${Math.abs(diff)} min`;
    if (diff === 0) return "Appena finito";
    return `Finito da ${diff} min`;
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">
        <header style={header}>
          <div>
            <div style={eyebrow}>Cassa & Checkout</div>
            <h1 className="sp-title">Cassa automatica da appuntamento</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Gli appuntamenti di oggi e ieri non ancora pagati vengono caricati in
              automatico.
            </p>
          </div>

          <button className="sp-button-purple" onClick={closeSale} disabled={loading}>
            {loading ? "Salvataggio..." : "Registra vendita"}
          </button>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={mainGrid}>
          <aside className="sp-card" style={card}>
            <h2 style={title}>Appuntamenti pronti</h2>

            <div style={{ display: "grid", gap: 12 }}>
              {readyAppointments.length === 0 ? (
                <div style={emptyBox}>Nessun appuntamento pronto per la cassa.</div>
              ) : (
                readyAppointments.map((appointment) => {
                  const active = selectedAppointment?.id === appointment.id;

                  return (
                    <button
                      key={appointment.id}
                      onClick={() => autoLoadAppointment(appointment)}
                      style={{
                        ...appointmentCard,
                        borderColor: active
                          ? "rgba(212,175,55,0.75)"
                          : "rgba(255,255,255,0.08)",
                        background: active
                          ? "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(212,175,55,0.12))"
                          : "rgba(255,255,255,0.045)",
                      }}
                    >
                      <strong>{appointment.clientTenant.clientGlobal.name}</strong>
                      <span>{appointment.note || "Appuntamento"}</span>
                      <small>{minutesStatus(appointment)}</small>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="sp-card" style={card}>
            <h2 style={title}>Vendita collegata</h2>

            {selectedAppointment ? (
              <div style={selectedBox}>
                <strong>{selectedAppointment.clientTenant.clientGlobal.name}</strong>
                <span>{selectedAppointment.clientTenant.clientGlobal.phone}</span>
                <span>{selectedAppointment.note || "Appuntamento"}</span>
                <span>{minutesStatus(selectedAppointment)}</span>
              </div>
            ) : (
              <div style={emptyBox}>Nessun appuntamento caricato.</div>
            )}

            <h2 style={{ ...title, marginTop: 22 }}>Carrello automatico</h2>

            {cart.length === 0 ? (
              <div style={emptyBox}>Il carrello verrà compilato dall’appuntamento.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {cart.map((item) => (
                  <div key={item.id} style={cartRow}>
                    <div>
                      <strong>{item.name}</strong>
                      <div className="sp-muted">
                        {item.type === "service"
                          ? "Servizio appuntamento"
                          : "Prodotto consigliato"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <strong style={{ color: "#d4af37" }}>
                        € {(item.price * item.quantity).toFixed(2)}
                      </strong>
                      <button style={miniDanger} onClick={() => removeItem(item.id)}>
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="sp-card" style={coachCard}>
            <h2 style={title}>💎 Coach prodotti</h2>

            <div style={coachBox}>
              {selectedAppointment
                ? `Proposte basate su: ${selectedAppointment.note || "servizio effettuato"}`
                : "Carica un appuntamento per generare proposte automatiche."}
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {suggestions.map((product) => (
                <div key={product.name} style={suggestionCard}>
                  <div>
                    <strong>{product.name}</strong>
                    <p className="sp-muted" style={{ margin: "6px 0 0" }}>
                      {product.reason}
                    </p>
                    <div style={{ color: "#d4af37", fontWeight: 900, marginTop: 8 }}>
                      + € {product.price.toFixed(2)} · margine €{" "}
                      {(product.price - product.cost).toFixed(2)}
                    </div>
                  </div>

                  <button style={addBtn} onClick={() => addSuggestion(product)}>
                    + Aggiungi alla cassa
                  </button>
                </div>
              ))}
            </div>

            <div style={summaryRow}>
              <span>Totale</span>
              <strong>€ {total.toFixed(2)}</strong>
            </div>

            <div style={summaryRow}>
              <span>Margine</span>
              <strong style={{ color: "#86efac" }}>€ {margin.toFixed(2)}</strong>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Pagamento</label>
              <select
                className="sp-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="card">Carta</option>
                <option value="cash">Contanti</option>
                <option value="mixed">Misto</option>
                <option value="bank">Bonifico</option>
              </select>
            </div>

            <button
              className="sp-button-purple"
              style={{ width: "100%", marginTop: 18, padding: 18 }}
              onClick={closeSale}
              disabled={loading}
            >
              {loading ? "Salvataggio..." : "Chiudi vendita"}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  marginBottom: 24,
  flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: "uppercase",
  fontSize: 13,
};

const messageBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  marginBottom: 18,
  background: "rgba(139,92,246,0.14)",
  border: "1px solid rgba(139,92,246,0.32)",
  color: "#fff",
  fontWeight: 900,
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.05fr 0.9fr",
  gap: 20,
};

const card: React.CSSProperties = {
  padding: 22,
};

const coachCard: React.CSSProperties = {
  padding: 22,
  background:
    "radial-gradient(circle at top right, rgba(212,175,55,0.15), transparent 35%), rgba(255,255,255,0.05)",
};

const title: React.CSSProperties = {
  color: "#d4af37",
  marginTop: 0,
};

const appointmentCard: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  textAlign: "left",
  display: "grid",
  gap: 6,
  cursor: "pointer",
};

const selectedBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(212,175,55,0.10)",
  border: "1px solid rgba(212,175,55,0.24)",
  color: "#fff",
  display: "grid",
  gap: 6,
};

const cartRow: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  justifyContent: "space-between",
  color: "#fff",
  gap: 12,
};

const miniDanger: React.CSSProperties = {
  border: 0,
  background: "#ef4444",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 900,
};

const coachBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(212,175,55,0.12)",
  color: "#f5d76e",
  fontWeight: 900,
  lineHeight: 1.5,
};

const suggestionCard: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  display: "grid",
  gap: 10,
  color: "#fff",
};

const addBtn: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  border: 0,
  background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
  color: "#fff",
  fontWeight: 900,
};

const summaryRow: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "space-between",
  color: "#fff",
  fontSize: 22,
  fontWeight: 900,
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "#fff",
  fontWeight: 900,
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  color: "#b8bfd0",
};