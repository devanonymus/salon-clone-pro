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

const SERVICE_PRICES: Record<string, { price: number; cost: number }> = {
  Piega: { price: 18, cost: 1.5 },
  "Taglio Donna": { price: 20, cost: 0 },
  "Taglio Donna + Piega": { price: 32, cost: 2 },
  "Colore Base": { price: 28, cost: 7 },
  "Colore Base + Piega": { price: 42, cost: 8.5 },
  "Tonalizzante/Gloss": { price: 22, cost: 4.5 },
  "Colpi di Sole/Meches + Piega": { price: 85, cost: 24 },
};

const PRODUCTS = [
  { name: "Shampoo Protezione Colore", price: 18, cost: 6 },
  { name: "Maschera Colore Vivo", price: 24, cost: 8 },
  { name: "Termoprotettore Styling", price: 19, cost: 5 },
  { name: "Siero Gloss Lucentezza", price: 22, cost: 7 },
  { name: "Shampoo Repair Plex", price: 21, cost: 7 },
];

export default function VenditePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptType, setReceiptType] = useState("fiscal");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const margin = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (item.price - item.cost) * item.quantity,
        0,
      ),
    [cart],
  );

  async function fetchWithAuth(path: string, options?: RequestInit) {
    const token = localStorage.getItem("salonpro_token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      throw new Error("Token mancante");
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
      const [clientsData, appointmentsData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
      ]);

      setClients(clientsData || []);
      setAppointments((appointmentsData || []).filter((a: AppointmentItem) => !a.sale));
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore caricamento"}`);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addCartItem(item: Omit<CartItem, "id">) {
    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...item,
      },
    ]);
  }

  function addService(name: string) {
    const data = SERVICE_PRICES[name];
    if (!data) return;

    addCartItem({
      type: "service",
      name,
      price: data.price,
      cost: data.cost,
      quantity: 1,
    });
  }

  function addProduct(name: string) {
    const product = PRODUCTS.find((p) => p.name === name);
    if (!product) return;

    addCartItem({
      type: "product",
      name: product.name,
      price: product.price,
      cost: product.cost,
      quantity: 1,
    });
  }

  function loadAppointment(id: string) {
    setSelectedAppointmentId(id);

    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    const client = clients.find(
      (c) => c.clientGlobal.id === appointment.clientTenant.clientGlobal.id,
    );

    if (client) setSelectedClientId(client.id);

    const services =
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [];

    const items = services.map((name) => {
      const data = SERVICE_PRICES[name] || { price: 30, cost: 5 };

      return {
        id: crypto.randomUUID(),
        type: "service" as const,
        name,
        price: data.price,
        cost: data.cost,
        quantity: 1,
      };
    });

    setCart(items);
  }

  function updateItem(id: string, field: keyof CartItem, value: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "price" || field === "cost" || field === "quantity") {
          return {
            ...item,
            [field]: Number(value || 0),
          };
        }

        if (field === "type") {
          return {
            ...item,
            type: value as "service" | "product",
          };
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function closeSale() {
    if (!selectedClient) {
      setMessage("⚠️ Seleziona un cliente.");
      return;
    }

    if (cart.length === 0) {
      setMessage("⚠️ Aggiungi almeno un servizio o prodotto.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await fetchWithAuth("/sales", {
        method: "POST",
        body: JSON.stringify({
          clientGlobalId: selectedClient.clientGlobal.id,
          appointmentId: selectedAppointmentId || undefined,
          total,
          paymentMethod,
          receiptType,
          receiptNumber,
          date: saleDate,
          items: cart.map((item) => ({
            name: item.name,
            type: item.type,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity,
          })),
        }),
      });

      setMessage("✅ Incasso registrato.");
      setCart([]);
      setSelectedClientId("");
      setSelectedAppointmentId("");
      setReceiptNumber("");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore registrazione incasso"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1580 }}>
        <section style={grid}>
          <div style={card}>
            <SectionTitle title="CHECKOUT" />

            {message ? <div style={messageBox}>{message}</div> : null}

            <select
              style={input}
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Cliente (da storico)...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientGlobal.name} - {client.clientGlobal.phone}
                </option>
              ))}
            </select>

            <div style={twoGrid}>
              <input
                style={input}
                placeholder="Nome Cliente"
                value={selectedClient?.clientGlobal.name || ""}
                readOnly
              />

              <select
                style={input}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Contanti</option>
                <option value="card">Carta</option>
                <option value="mixed">Misto</option>
                <option value="bank">Bonifico</option>
              </select>
            </div>

            <select
              style={input}
              value={receiptType}
              onChange={(e) => setReceiptType(e.target.value)}
            >
              <option value="fiscal">Scontrino FISCALE (RT)</option>
              <option value="non_fiscal">Non fiscale</option>
            </select>

            <input
              style={input}
              placeholder="Numero scontrino fiscale (RT) — es. 1234"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
            />

            <input
              type="date"
              style={{ ...input, maxWidth: 480 }}
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />

            <div style={appointmentRow}>
              <select
                style={input}
                value={selectedAppointmentId}
                onChange={(e) => loadAppointment(e.target.value)}
              >
                <option value="">Clienti del giorno...</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.clientTenant.clientGlobal.name} - {a.note || "Appuntamento"}
                  </option>
                ))}
              </select>

              <button style={smallButton} onClick={loadData}>
                AGGIORNA
              </button>
            </div>

            <div style={twoGrid}>
              <select style={input} onChange={(e) => addService(e.target.value)} value="">
                <option value="">Servizi (Listino)...</option>
                {Object.keys(SERVICE_PRICES).map((name) => (
                  <option key={name} value={name}>
                    {name} — €{SERVICE_PRICES[name].price}
                  </option>
                ))}
              </select>

              <select style={input} onChange={(e) => addProduct(e.target.value)} value="">
                <option value="">Prodotti Rivendita...</option>
                {PRODUCTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} — €{p.price}
                  </option>
                ))}
              </select>
            </div>

            <div style={cartBox}>
              <h3 style={{ marginTop: 0 }}>Carrello</h3>

              {cart.length === 0 ? (
                <p style={{ opacity: 0.65 }}>Nessun servizio/prodotto inserito.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={cartRow}>
                      <select
                        style={input}
                        value={item.type}
                        onChange={(e) => updateItem(item.id, "type", e.target.value)}
                      >
                        <option value="service">Servizio</option>
                        <option value="product">Prodotto</option>
                      </select>

                      <input
                        style={input}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      />

                      <input
                        style={input}
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, "price", e.target.value)}
                      />

                      <input
                        style={input}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      />

                      <button style={deleteButton} onClick={() => removeItem(item.id)}>
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={totals}>
                <strong>Totale: €{total.toFixed(2)}</strong>
                <strong>Margine: €{margin.toFixed(2)}</strong>
              </div>
            </div>

            <button style={saveButton} onClick={closeSale} disabled={loading}>
              {loading ? "SALVATAGGIO..." : "REGISTRA INCASSO"}
            </button>
          </div>

          <div style={card}>
            <SectionTitle title="INCASSI ODIERNI" />
            <p style={{ opacity: 0.65 }}>Qui restano gli incassi registrati dal backend.</p>
          </div>
        </section>

        <section style={coachCard}>
          <SectionTitle title="COACH AI MONITORING" />
          <div style={coachBox}>
            <em>Suggerimento</em> — seleziona servizio/prodotto/card dalla tendina:
            prepara subito +10/+20/+30 e proposta rivendita.
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 style={sectionTitle}>
      <span style={{ marginRight: 10 }}>|</span> {title}
    </h2>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.9fr",
  gap: 20,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  borderRadius: 18,
  padding: 28,
  boxShadow: "0 24px 70px rgba(0,0,0,0.16)",
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 18,
  color: "#22c55e",
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 2,
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
  marginBottom: 12,
};

const twoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const appointmentRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  alignItems: "center",
};

const smallButton: React.CSSProperties = {
  padding: "10px 16px",
  border: 0,
  borderRadius: 8,
  background: "#e8eef8",
  color: "#0f172a",
  fontWeight: 900,
};

const cartBox: React.CSSProperties = {
  marginTop: 14,
  padding: 16,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const cartRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.4fr 0.6fr 0.45fr auto",
  gap: 8,
  alignItems: "center",
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "12px 14px",
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};

const totals: React.CSSProperties = {
  marginTop: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 18,
};

const saveButton: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  padding: 16,
  border: 0,
  borderRadius: 10,
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};

const coachCard: React.CSSProperties = {
  ...card,
  marginTop: 22,
  background: "linear-gradient(135deg,#eef8f7,#eef3f7)",
};

const coachBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 8,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const messageBox: React.CSSProperties = {
  marginBottom: 14,
  padding: 14,
  borderRadius: 12,
  background: "#eef2ff",
  color: "#312e81",
  fontWeight: 900,
};