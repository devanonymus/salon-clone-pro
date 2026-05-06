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
    id: string;
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
  discount: number;
  cardSaleId?: string;
  cardPaymentType?: "RATA_SEDUTA" | "SALDO_INTERO";
};

type SoldCardPayment = {
  id: string;
  amount: number;
  paymentType: string;
  method: string;
  paidAt: string;
};

type SoldCard = {
  id: string;
  clientTenantId?: string | null;
  clientName: string;
  whatsapp?: string | null;
  cardName: string;
  price: number;
  used: number;
  total: number;
  sessions?: any[];
  appointments?: { index?: number; date?: string; time?: string }[];
  paymentMode: "RATE_SEDUTE" | "INTERO_PRIMA_SEDUTA";
  payments?: SoldCardPayment[];
};

type ProductSuggestion = {
  name: string;
  tag: string;
  price: number;
  cost: number;
  reason: string;
};

type DiscountType = "none" | "percent" | "fixed";
type ReceiptType = "FISCAL" | "NON_FISCAL";

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
    reason: "Finish premium anche a casa.",
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
    reason: "Ideale dopo plex o capelli stressati.",
  },
];

function money(value: number) {
  return `€ ${value.toFixed(2)}`;
}

function numberFromInput(value: string) {
  const n = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function VenditePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [soldCards, setSoldCards] = useState<SoldCard[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [receiptType, setReceiptType] = useState<ReceiptType>("FISCAL");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const rowSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const rowDiscountTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const rowTotal = item.price * item.quantity;
      return sum + (rowTotal * item.discount) / 100;
    }, 0);
  }, [cart]);

  const subtotalAfterRowDiscount = Math.max(0, rowSubtotal - rowDiscountTotal);

  const globalDiscountAmount = useMemo(() => {
    const value = numberFromInput(discountValue);

    if (discountType === "percent") {
      return Math.min(subtotalAfterRowDiscount, subtotalAfterRowDiscount * (value / 100));
    }

    if (discountType === "fixed") {
      return Math.min(subtotalAfterRowDiscount, value);
    }

    return 0;
  }, [discountType, discountValue, subtotalAfterRowDiscount]);

  const discountTotal = rowDiscountTotal + globalDiscountAmount;
  const total = Math.max(0, rowSubtotal - discountTotal);

  const costTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  }, [cart]);

  const margin = total - costTotal;

  const suggestions = useMemo(() => {
    const text = cart.map((i) => i.name).join(" ").toLowerCase();
    const tags: string[] = [];

    if (
      text.includes("colore") ||
      text.includes("gloss") ||
      text.includes("tonalizzante") ||
      text.includes("meches") ||
      text.includes("decapaggio")
    ) {
      tags.push("colore");
    }

    if (text.includes("piega") || text.includes("styling")) tags.push("piega");

    if (
      text.includes("plex") ||
      text.includes("repair") ||
      text.includes("ricostruzione")
    ) {
      tags.push("repair");
    }

    if (tags.length === 0) tags.push("piega");

    const already = cart.map((i) => i.name);

    return PRODUCTS.filter((p) => tags.includes(p.tag) && !already.includes(p.name)).slice(
      0,
      4,
    );
  }, [cart]);

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
      const msg =
        typeof data?.message === "object" ? JSON.stringify(data.message) : data?.message;
      throw new Error(msg || text || "Errore richiesta");
    }

    return data;
  }


  function soldCardPaidTotal(card: SoldCard) {
    return (card.payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
  }

  function soldCardResidual(card: SoldCard) {
    return Math.max(0, Number(card.price || 0) - soldCardPaidTotal(card));
  }

  function soldCardInstallment(card: SoldCard) {
    return Number(card.price || 0) / Math.max(1, Number(card.total || 1));
  }

  function sameAppointmentMinute(a: string, date?: string, time?: string) {
    if (!date || !time) return false;

    const left = new Date(a);
    const right = new Date(`${date}T${time}:00`);

    return Math.abs(left.getTime() - right.getTime()) <= 15 * 60 * 1000;
  }

  function findCardForAppointment(appointment: AppointmentItem) {
    const activeForClient = soldCards.filter((card) => {
      return (
        card.clientTenantId === appointment.clientTenant.id &&
        soldCardResidual(card) > 0
      );
    });

    const exact = activeForClient.find((card) => {
      return (card.appointments || []).some((planned) =>
        sameAppointmentMinute(appointment.date, planned.date, planned.time),
      );
    });

    return exact || activeForClient[0] || null;
  }

  function buildCardPaymentItem(card: SoldCard): CartItem | null {
    const residual = soldCardResidual(card);

    if (residual <= 0) return null;

    const amount =
      card.paymentMode === "INTERO_PRIMA_SEDUTA"
        ? residual
        : Math.min(soldCardInstallment(card), residual);

    return {
      id: crypto.randomUUID(),
      type: "service",
      name:
        card.paymentMode === "INTERO_PRIMA_SEDUTA"
          ? `Saldo card: ${card.cardName}`
          : `Rata card: ${card.cardName}`,
      price: Number(amount.toFixed(2)),
      cost: 0,
      quantity: 1,
      discount: 0,
      cardSaleId: card.id,
      cardPaymentType:
        card.paymentMode === "INTERO_PRIMA_SEDUTA"
          ? "SALDO_INTERO"
          : "RATA_SEDUTA",
    };
  }

  async function loadData() {
    try {
      const [clientsData, appointmentsData, soldCardsData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
        fetchWithAuth("/marketing/cards/sales"),
      ]);

      setClients(clientsData || []);
      setSoldCards(soldCardsData || []);

      const now = Date.now();

      const ready = (appointmentsData || [])
        .filter((a: AppointmentItem) => {
          if (a.sale) return false;

          const start = new Date(a.date).getTime();

          // In cassa mostriamo solo appuntamenti già iniziati o passati.
          // Così non escono appuntamenti card futuri con "Finisce tra 80000 min".
          return start <= now;
        })
        .sort(
          (a: AppointmentItem, b: AppointmentItem) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      setAppointments(ready);
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore caricamento cassa"}`);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      discount: 0,
    });
  }

  function addProduct(product: ProductSuggestion) {
    addCartItem({
      type: "product",
      name: product.name,
      price: product.price,
      cost: product.cost,
      quantity: 1,
      discount: 0,
    });
  }

  function loadAppointment(appointment: AppointmentItem) {
    setSelectedAppointment(appointment);

    const client = clients.find(
      (c) => c.clientGlobal.id === appointment.clientTenant.clientGlobal.id,
    );

    if (client) setSelectedClientId(client.id);

    const linkedCard = findCardForAppointment(appointment);

    if (linkedCard) {
      const cardItem = buildCardPaymentItem(linkedCard);

      if (cardItem) {
        setCart([cardItem]);
        setMessage(
          linkedCard.paymentMode === "INTERO_PRIMA_SEDUTA"
            ? `✅ Appuntamento card caricato: saldo intero ${money(cardItem.price)}.`
            : `✅ Appuntamento card caricato: rata seduta ${money(cardItem.price)}.`,
        );
        return;
      }

      setCart([]);
      setMessage("✅ Card già saldata. Nessun importo da incassare.");
      return;
    }

    const services =
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [];

    const items: CartItem[] = services.map((name) => {
      const data = SERVICE_PRICES[name] || { price: 30, cost: 5 };

      return {
        id: crypto.randomUUID(),
        type: "service",
        name,
        price: data.price,
        cost: data.cost,
        quantity: 1,
        discount: 0,
      };
    });

    setCart(items);
    setMessage(`✅ Appuntamento di ${appointment.clientTenant.clientGlobal.name} caricato in cassa.`);
  }

  function updateItem(id: string, field: keyof CartItem, value: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "price" || field === "cost" || field === "quantity" || field === "discount") {
          const n = Number(String(value).replace(",", "."));

          return {
            ...item,
            [field]:
              field === "quantity"
                ? Math.max(1, Number.isFinite(n) ? n : 1)
                : Math.max(0, Number.isFinite(n) ? n : 0),
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

  function increment(id: string, delta: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + delta),
            }
          : item,
      ),
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
      setMessage("⚠️ Carrello vuoto.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const cartSnapshot = [...cart];

      await fetchWithAuth("/sales", {
        method: "POST",
        body: JSON.stringify({
          clientGlobalId: selectedClient.clientGlobal.id,
          appointmentId: selectedAppointment?.id || undefined,
          total,
          paymentMethod,
          fiscalStatus: receiptType === "FISCAL" ? "TO_ISSUE" : "NON_FISCAL",
          items: cartSnapshot.map((item) => ({
            name: item.name,
            type: item.type,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity,
            discount: item.discount,
          })),
        }),
      });

      const cardPaymentItems = cartSnapshot.filter((item) => item.cardSaleId);

      for (const item of cardPaymentItems) {
        const gross = item.price * item.quantity;
        const discount = (gross * item.discount) / 100;
        const amount = Math.max(0, gross - discount);

        if (!item.cardSaleId || amount <= 0) continue;

        await fetchWithAuth(`/marketing/cards/sales/${item.cardSaleId}/payments`, {
          method: "POST",
          body: JSON.stringify({
            amount,
            paymentType: item.cardPaymentType || "RATA_SEDUTA",
            method: paymentMethod.toUpperCase(),
            note: item.name,
          }),
        });

        await fetchWithAuth(`/marketing/cards/sales/${item.cardSaleId}/use`, {
          method: "PATCH",
        });
      }

      setMessage(
        receiptType === "FISCAL"
          ? "✅ Vendita registrata. Scontrino fiscale da emettere."
          : "✅ Vendita registrata come NON fiscale.",
      );

      setCart([]);
      setSelectedAppointment(null);
      setSelectedClientId("");
      setDiscountType("none");
      setDiscountValue("");
      setReceiptType("FISCAL");
      await loadData();
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore registrazione vendita"}`);
    } finally {
      setLoading(false);
    }
  }

  function appointmentStatus(appointment: AppointmentItem) {
    const start = new Date(appointment.date).getTime();
    const end = start + appointment.duration * 60 * 1000;

    if (Date.now() < start) {
      const diff = Math.ceil((start - Date.now()) / 60000);
      return `Inizia tra ${diff} min`;
    }

    const diff = Math.floor((Date.now() - end) / 60000);

    if (diff < 0) return "In corso";
    if (diff === 0) return "Appena finito";
    return `Finito da ${diff} min`;
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1540 }}>
        <header style={header}>
          <div>
            <div style={eyebrow}>Cassa & Checkout</div>
            <h1 className="sp-title">Cassa PRO</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Carica l’appuntamento, aggiungi extra, scegli sconto e uscita fiscale/non fiscale.
            </p>
          </div>

          <button className="sp-button-purple" onClick={closeSale} disabled={loading}>
            {loading ? "Salvataggio..." : "Chiudi vendita"}
          </button>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={mainGrid}>
          <aside className="sp-card" style={card}>
            <h2 style={title}>Appuntamenti pronti</h2>

            <div style={{ display: "grid", gap: 12 }}>
              {appointments.length === 0 ? (
                <div style={emptyBox}>Nessun appuntamento pronto.</div>
              ) : (
                appointments.map((appointment) => {
                  const active = selectedAppointment?.id === appointment.id;

                  return (
                    <button
                      key={appointment.id}
                      onClick={() => loadAppointment(appointment)}
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
                      <small>{appointmentStatus(appointment)}</small>
                    </button>
                  );
                })
              )}
            </div>

            <h2 style={{ ...title, marginTop: 24 }}>Cliente</h2>
            <select
              className="sp-input"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Seleziona cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientGlobal.name} - {client.clientGlobal.phone}
                </option>
              ))}
            </select>
          </aside>

          <section className="sp-card" style={card}>
            <h2 style={title}>Vendita collegata</h2>

            {selectedAppointment ? (
              <div style={selectedBox}>
                <strong>{selectedAppointment.clientTenant.clientGlobal.name}</strong>
                <span>{selectedAppointment.clientTenant.clientGlobal.phone}</span>
                <span>{selectedAppointment.note || "Appuntamento"}</span>
              </div>
            ) : (
              <div style={emptyBox}>Nessun appuntamento caricato.</div>
            )}

            <h2 style={{ ...title, marginTop: 22 }}>Aggiungi extra</h2>

            <div style={extraGrid}>
              <select
                className="sp-input"
                value=""
                onChange={(e) => {
                  if (e.target.value) addService(e.target.value);
                }}
              >
                <option value="">+ Servizio extra...</option>
                {Object.keys(SERVICE_PRICES).map((name) => (
                  <option key={name} value={name}>
                    {name} — {money(SERVICE_PRICES[name].price)}
                  </option>
                ))}
              </select>

              <select
                className="sp-input"
                value=""
                onChange={(e) => {
                  const product = PRODUCTS.find((p) => p.name === e.target.value);
                  if (product) addProduct(product);
                }}
              >
                <option value="">+ Prodotto...</option>
                {PRODUCTS.map((product) => (
                  <option key={product.name} value={product.name}>
                    {product.name} — {money(product.price)}
                  </option>
                ))}
              </select>
            </div>

            <h2 style={{ ...title, marginTop: 18 }}>Carrello</h2>

            {cart.length === 0 ? (
              <div style={emptyBox}>Carrello vuoto.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {cart.map((item) => {
                  const itemSubtotal = item.price * item.quantity;
                  const itemDiscount = (itemSubtotal * item.discount) / 100;
                  const itemTotal = itemSubtotal - itemDiscount;

                  return (
                    <div key={item.id} style={cartRow}>
                      <div style={cartFields}>
                        <select
                          className="sp-input"
                          value={item.type}
                          onChange={(e) => updateItem(item.id, "type", e.target.value)}
                        >
                          <option value="service">Servizio</option>
                          <option value="product">Prodotto</option>
                        </select>

                        <input
                          className="sp-input"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                        />

                        <input
                          className="sp-input"
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, "price", e.target.value)}
                          placeholder="Prezzo"
                        />

                        <input
                          className="sp-input"
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, "discount", e.target.value)}
                          placeholder="Sconto %"
                        />

                        <div style={qtyBox}>
                          <button type="button" style={qtyBtn} onClick={() => increment(item.id, -1)}>
                            -
                          </button>
                          <strong>{item.quantity}</strong>
                          <button type="button" style={qtyBtn} onClick={() => increment(item.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>

                      <div style={rowRight}>
                        <strong style={{ color: "#d4af37" }}>{money(itemTotal)}</strong>
                        {item.discount > 0 ? (
                          <small style={{ color: "#fecaca" }}>-{money(itemDiscount)}</small>
                        ) : null}
                        <button type="button" style={deleteButton} onClick={() => removeItem(item.id)}>
                          X
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="sp-card" style={coachCard}>
            <h2 style={title}>💎 Coach prodotti</h2>

            <div style={coachBox}>
              {selectedAppointment
                ? `Proposte basate su: ${selectedAppointment.note || "servizio effettuato"}`
                : "Carica un appuntamento o aggiungi un servizio."}
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {suggestions.map((product) => (
                <div key={product.name} style={suggestionCard}>
                  <strong>{product.name}</strong>
                  <p className="sp-muted" style={{ margin: "6px 0 0" }}>
                    {product.reason}
                  </p>
                  <div style={{ color: "#d4af37", fontWeight: 900 }}>
                    + {money(product.price)} · margine {money(product.price - product.cost)}
                  </div>
                  <button type="button" style={addBtn} onClick={() => addProduct(product)}>
                    + Aggiungi alla cassa
                  </button>
                </div>
              ))}
            </div>

            <div style={summaryBox}>
              <div style={summaryRow}>
                <span>Subtotale lordo</span>
                <strong>{money(rowSubtotal)}</strong>
              </div>

              <div style={summaryRow}>
                <span>Sconti riga</span>
                <strong style={{ color: "#fecaca" }}>-{money(rowDiscountTotal)}</strong>
              </div>

              <div style={discountPanel}>
                <label style={label}>Sconto extra</label>

                <div style={discountGrid}>
                  <select
                    className="sp-input"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                  >
                    <option value="none">Nessuno</option>
                    <option value="percent">Sconto %</option>
                    <option value="fixed">Sconto €</option>
                  </select>

                  <input
                    className="sp-input"
                    placeholder={discountType === "percent" ? "Es. 10" : "Es. 5"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={discountType === "none"}
                  />
                </div>
              </div>

              <div style={summaryRow}>
                <span>Sconto extra</span>
                <strong style={{ color: "#fecaca" }}>-{money(globalDiscountAmount)}</strong>
              </div>

              <div style={summaryRow}>
                <span>Sconto totale</span>
                <strong style={{ color: "#fecaca" }}>-{money(discountTotal)}</strong>
              </div>

              <div style={summaryRowBig}>
                <span>Totale finale</span>
                <strong>{money(total)}</strong>
              </div>

              <div style={summaryRow}>
                <span>Margine stimato</span>
                <strong style={{ color: "#86efac" }}>{money(margin)}</strong>
              </div>
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

            <div style={{ marginTop: 16 }}>
              <label style={label}>Uscita documento</label>
              <select
                className="sp-input"
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
              >
                <option value="FISCAL">Scontrino FISCALE</option>
                <option value="NON_FISCAL">Non fiscale</option>
              </select>
            </div>

            <button
              className="sp-button-purple"
              style={{ width: "100%", marginTop: 18, padding: 18 }}
              onClick={closeSale}
              disabled={loading}
            >
              {loading
                ? "Salvataggio..."
                : receiptType === "FISCAL"
                  ? "REGISTRA + SCONTRINO FISCALE"
                  : "REGISTRA NON FISCALE"}
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
  gridTemplateColumns: "0.78fr 1.2fr 0.92fr",
  gap: 20,
};

const card: React.CSSProperties = {
  padding: 22,
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

const extraGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const cartRow: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  alignItems: "center",
};

const cartFields: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.8fr 1.4fr 0.65fr 0.65fr 0.7fr",
  gap: 8,
};

const qtyBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  color: "#fff",
};

const qtyBtn: React.CSSProperties = {
  border: 0,
  width: 34,
  height: 34,
  borderRadius: 10,
  background: "#8b5cf6",
  color: "#fff",
  fontWeight: 900,
};

const rowRight: React.CSSProperties = {
  minWidth: 110,
  display: "grid",
  gap: 6,
  justifyItems: "end",
};

const deleteButton: React.CSSProperties = {
  border: 0,
  background: "#ef4444",
  color: "#fff",
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 900,
};

const coachCard: React.CSSProperties = {
  padding: 22,
  background:
    "radial-gradient(circle at top right, rgba(212,175,55,0.15), transparent 35%), rgba(255,255,255,0.05)",
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

const summaryBox: React.CSSProperties = {
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(0,0,0,0.24)",
  display: "grid",
  gap: 10,
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#fff",
  fontWeight: 900,
};

const summaryRowBig: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#fff",
  fontSize: 24,
  fontWeight: 900,
};

const discountPanel: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const discountGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
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