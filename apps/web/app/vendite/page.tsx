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
  "Barba Rifinitura": { price: 10, cost: 0.5 },
  "Colore Base": { price: 28, cost: 7 },
  "Tonalizzante/Gloss": { price: 22, cost: 4.5 },
};

const PRODUCTS: ProductSuggestion[] = [
  { name: "Shampoo Protezione Colore", tag: "colore", price: 18, cost: 6, reason: "Mantiene colore più a lungo." },
  { name: "Maschera Colore Vivo", tag: "colore", price: 24, cost: 8, reason: "Ideale post colore." },
  { name: "Termoprotettore Styling", tag: "piega", price: 19, cost: 5, reason: "Protegge la piega." },
  { name: "Siero Gloss Lucentezza", tag: "piega", price: 22, cost: 7, reason: "Finish premium." },
];

export default function VenditePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [message, setMessage] = useState("");

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const margin = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (item.price - item.cost) * item.quantity,
        0
      ),
    [cart]
  );

  function addService(name: string) {
    const data = SERVICE_PRICES[name];
    if (!data) return;

    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "service",
        name,
        price: data.price,
        cost: data.cost,
        quantity: 1,
      },
    ]);
  }

  function addProduct(name: string) {
    const product = PRODUCTS.find((p) => p.name === name);
    if (!product) return;

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
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function loadAppointment(a: AppointmentItem) {
    setSelectedAppointment(a);

    const services =
      a.note && a.note !== "Appuntamento"
        ? a.note.split(" + ")
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
    setMessage("✅ Appuntamento caricato in cassa");
  }

  return (
    <main className="sp-page">
      <div className="sp-shell">

        {message && <div style={messageBox}>{message}</div>}

        <section style={grid}>

          {/* SINISTRA */}
          <div style={card}>
            <h2 style={title}>Appuntamenti pronti</h2>

            {appointments.map((a) => (
              <button
                key={a.id}
                onClick={() => loadAppointment(a)}
                style={appointmentCard}
              >
                <strong>{a.clientTenant.clientGlobal.name}</strong>
                <span>{a.note}</span>
              </button>
            ))}
          </div>

          {/* CENTRO */}
          <div style={card}>
            <h2 style={title}>Vendita collegata</h2>

            {selectedAppointment && (
              <div style={selectedBox}>
                <strong>{selectedAppointment.clientTenant.clientGlobal.name}</strong>
                <span>{selectedAppointment.note}</span>
              </div>
            )}

            {/* 👇 NUOVE TENDINE */}
            <div style={extraGrid}>
              <select
                className="sp-input"
                onChange={(e) => addService(e.target.value)}
                value=""
              >
                <option value="">+ Aggiungi servizio</option>
                {Object.keys(SERVICE_PRICES).map((s) => (
                  <option key={s} value={s}>
                    {s} — €{SERVICE_PRICES[s].price}
                  </option>
                ))}
              </select>

              <select
                className="sp-input"
                onChange={(e) => addProduct(e.target.value)}
                value=""
              >
                <option value="">+ Aggiungi prodotto</option>
                {PRODUCTS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} — €{p.price}
                  </option>
                ))}
              </select>
            </div>

            {/* CARRELLO */}
            {cart.map((item) => (
              <div key={item.id} style={cartRow}>
                <div>
                  <strong>{item.name}</strong>
                  <div className="sp-muted">{item.type}</div>
                </div>

                <div>
                  €{item.price}
                  <button onClick={() => removeItem(item.id)}>X</button>
                </div>
              </div>
            ))}
          </div>

          {/* DESTRA */}
          <div style={card}>
            <h2 style={title}>Coach prodotti</h2>

            {PRODUCTS.map((p) => (
              <div key={p.name} style={suggestionCard}>
                <strong>{p.name}</strong>
                <p>{p.reason}</p>

                <button onClick={() => addProduct(p.name)}>
                  + Aggiungi
                </button>
              </div>
            ))}

            <div style={summary}>
              <strong>Totale €{total}</strong>
              <strong>Margine €{margin}</strong>
            </div>

            <select
              className="sp-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="card">Carta</option>
              <option value="cash">Contanti</option>
            </select>
          </div>
        </section>
      </div>
    </main>
  );
}

/* STILI */
const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 20,
};

const card = {
  padding: 20,
  background: "rgba(255,255,255,0.05)",
  borderRadius: 16,
};

const title = {
  color: "#d4af37",
};

const appointmentCard = {
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
};

const selectedBox = {
  padding: 14,
  borderRadius: 14,
  background: "rgba(212,175,55,0.1)",
};

const cartRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: 10,
};

const suggestionCard = {
  padding: 10,
  borderRadius: 10,
  background: "rgba(255,255,255,0.05)",
};

const summary = {
  marginTop: 20,
};

const extraGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  margin: "15px 0",
};

const messageBox = {
  padding: 12,
  background: "#22c55e",
  color: "#fff",
  borderRadius: 10,
};