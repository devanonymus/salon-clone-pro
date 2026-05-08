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
  staff?: { id: string; name: string } | null;
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
  discount: number;
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
  "Ricostruzione": { price: 30, cost: 7 },
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
  return `€ ${Number(value || 0).toFixed(2)}`;
}

function numberFromInput(value: string) {
  const n = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function appointmentStatus(appointment: AppointmentItem) {
  const end = new Date(appointment.date).getTime() + appointment.duration * 60 * 1000;
  const diffMinutes = Math.floor((Date.now() - end) / 60000);

  if (diffMinutes < 0) {
    const mins = Math.abs(diffMinutes);
    if (mins < 60) return `Finisce tra ${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return `Finisce tra ${hours}h ${rest}m`;
  }

  if (diffMinutes < 5) return "Appena finito";
  if (diffMinutes < 60) return `Finito da ${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `Finito da ${hours} ore`;

  const days = Math.floor(hours / 24);
  return `Finito da ${days} giorni`;
}

export default function VenditePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [receiptType, setReceiptType] = useState<ReceiptType>("FISCAL");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

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

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;

    return clients.filter((client) => {
      const text = `${client.clientGlobal.name} ${client.clientGlobal.phone}`.toLowerCase();
      return text.includes(q);
    });
  }, [clients, clientSearch]);

  const filteredAppointments = useMemo(() => {
    const q = appointmentSearch.toLowerCase().trim();
    const ready = appointments.filter((a) => !a.sale);

    if (!q) return ready;

    return ready.filter((appointment) => {
      const text = `${appointment.clientTenant.clientGlobal.name} ${appointment.clientTenant.clientGlobal.phone} ${appointment.note || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [appointments, appointmentSearch]);

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

    return PRODUCTS.filter((p) => tags.includes(p.tag) && !already.includes(p.name)).slice(0, 3);
  }, [cart]);

  const canCloseSale = Boolean(selectedClient && cart.length > 0 && total > 0 && !loading);

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

  async function loadData() {
    try {
      setDataLoading(true);

      const [clientsData, appointmentsData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
      ]);

      setClients(clientsData || []);

      const ready = (appointmentsData || []).sort(
        (a: AppointmentItem, b: AppointmentItem) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      setAppointments(ready);
    } catch (err: any) {
      setMessage(`⚠️ ${err.message || "Errore caricamento cassa"}`);
    } finally {
      setDataLoading(false);
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

  function loadClientOnly(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedAppointment(null);
    setCart([]);
    const client = clients.find((c) => c.id === clientId);
    setMessage(client ? `Cliente ${client.clientGlobal.name} selezionato.` : "");
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

  function clearCheckout() {
    setSelectedAppointment(null);
    setSelectedClientId("");
    setCart([]);
    setDiscountType("none");
    setDiscountValue("");
    setReceiptType("FISCAL");
    setPaymentMethod("card");
    setMessage("Cassa pulita.");
  }

  async function closeSale() {
    if (!selectedClient) {
      setMessage("⚠️ Seleziona un cliente o carica un appuntamento.");
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
          appointmentId: selectedAppointment?.id || undefined,
          total,
          paymentMethod,
          fiscalStatus: receiptType === "FISCAL" ? "TO_ISSUE" : "NON_FISCAL",
          items: cart.map((item) => ({
            name: item.name,
            type: item.type,
            price: item.price,
            cost: item.cost,
            quantity: item.quantity,
            discount: item.discount,
          })),
        }),
      });

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

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1640 }}>
        <header style={header}>
          <div>
            <div style={eyebrow}>Cassa & Checkout</div>
            <h1 className="sp-title">Cassa semplice</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Carica l’appuntamento, controlla il carrello e incassa in pochi click.
            </p>
          </div>

          <div style={topActions}>
            <button style={lightButton} onClick={clearCheckout}>
              Pulisci cassa
            </button>
            <button style={primaryTopButton} onClick={closeSale} disabled={!canCloseSale}>
              {loading ? "Salvataggio..." : `Incassa ${money(total)}`}
            </button>
          </div>
        </header>

        <section style={stepBar}>
          <Step active={Boolean(selectedClient)} number="1" title="Cliente" text={selectedClient ? selectedClient.clientGlobal.name : "Seleziona"} />
          <Step active={cart.length > 0} number="2" title="Carrello" text={`${cart.length} voci`} />
          <Step active={total > 0} number="3" title="Incasso" text={money(total)} />
        </section>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={mainGrid}>
          <aside className="sp-card" style={card}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>1</span>
                <h2 style={title}>Cliente o appuntamento</h2>
              </div>
            </div>

            <div style={hintBox}>
              Consiglio: clicca un appuntamento pronto. Il cliente e i servizi si caricano da soli.
            </div>

            <input
              className="sp-input"
              placeholder="Cerca appuntamento o cliente..."
              value={appointmentSearch}
              onChange={(e) => setAppointmentSearch(e.target.value)}
              style={searchInput}
            />

            <div style={listArea}>
              {dataLoading ? (
                <EmptyBox text="Caricamento appuntamenti..." />
              ) : filteredAppointments.length === 0 ? (
                <EmptyBox text="Nessun appuntamento pronto. Seleziona un cliente sotto." />
              ) : (
                filteredAppointments.slice(0, 8).map((appointment) => {
                  const active = selectedAppointment?.id === appointment.id;
                  const date = new Date(appointment.date);

                  return (
                    <button
                      key={appointment.id}
                      onClick={() => loadAppointment(appointment)}
                      style={{
                        ...appointmentCard,
                        borderColor: active
                          ? "rgba(212,175,55,0.85)"
                          : "rgba(255,255,255,0.09)",
                        background: active
                          ? "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(212,175,55,0.14))"
                          : "rgba(255,255,255,0.055)",
                      }}
                    >
                      <div style={appointmentTop}>
                        <strong>{appointment.clientTenant.clientGlobal.name}</strong>
                        <span>{date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <span>{appointment.note || "Appuntamento"}</span>
                      <small>{appointmentStatus(appointment)}</small>
                      <em>Carica in cassa →</em>
                    </button>
                  );
                })
              )}
            </div>

            <h3 style={smallTitle}>Cliente senza appuntamento</h3>

            <input
              className="sp-input"
              placeholder="Cerca cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={searchInput}
            />

            <select
              className="sp-input"
              value={selectedClientId}
              onChange={(e) => loadClientOnly(e.target.value)}
            >
              <option value="">Seleziona cliente...</option>
              {filteredClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.clientGlobal.name} - {client.clientGlobal.phone}
                </option>
              ))}
            </select>

            {selectedClient ? (
              <div style={selectedClientBox}>
                <strong>{selectedClient.clientGlobal.name}</strong>
                <span>{selectedClient.clientGlobal.phone}</span>
              </div>
            ) : null}
          </aside>

          <section className="sp-card" style={card}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>2</span>
                <h2 style={title}>Vendita collegata</h2>
              </div>
            </div>

            {selectedAppointment ? (
              <div style={selectedBox}>
                <strong>{selectedAppointment.clientTenant.clientGlobal.name}</strong>
                <span>{selectedAppointment.clientTenant.clientGlobal.phone}</span>
                <span>{selectedAppointment.note || "Appuntamento"}</span>
              </div>
            ) : selectedClient ? (
              <div style={selectedBox}>
                <strong>{selectedClient.clientGlobal.name}</strong>
                <span>{selectedClient.clientGlobal.phone}</span>
                <span>Vendita libera senza appuntamento.</span>
              </div>
            ) : (
              <EmptyBox text="Carica un appuntamento o seleziona un cliente." />
            )}

            <div style={quickPanel}>
              <h3 style={smallTitleNoMargin}>Aggiunte rapide</h3>
              <div style={quickGrid}>
                {["Piega", "Colore Base + Piega", "Taglio Donna + Piega", "Ricostruzione"].map((name) => (
                  <button key={name} style={quickButton} onClick={() => addService(name)}>
                    + {name}
                  </button>
                ))}
              </div>
            </div>

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

            <div style={cartHeader}>
              <h2 style={title}>Carrello</h2>
              {cart.length > 0 ? (
                <button style={miniDanger} onClick={() => setCart([])}>
                  Svuota
                </button>
              ) : null}
            </div>

            {cart.length === 0 ? (
              <div style={bigEmptyCart}>
                <strong>Carrello vuoto</strong>
                <span>Aggiungi un servizio o carica un appuntamento pronto.</span>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
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
                      </div>

                      <div style={rowBottom}>
                        <div style={qtyBox}>
                          <button type="button" style={qtyBtn} onClick={() => increment(item.id, -1)}>
                            -
                          </button>
                          <strong>{item.quantity}</strong>
                          <button type="button" style={qtyBtn} onClick={() => increment(item.id, 1)}>
                            +
                          </button>
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
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="sp-card" style={checkoutCard}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>3</span>
                <h2 style={title}>Incasso</h2>
              </div>
            </div>

            <div style={coachBlock}>
              <h3>💎 Coach prodotti</h3>
              <p>
                {cart.length === 0
                  ? "Aggiungi un servizio: ti suggerirò i prodotti giusti."
                  : "Proposte consigliate in base al carrello."}
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {suggestions.map((product) => (
                  <button key={product.name} style={suggestionButton} onClick={() => addProduct(product)}>
                    <strong>{product.name}</strong>
                    <span>{product.reason}</span>
                    <em>+ {money(product.price)} · margine {money(product.price - product.cost)}</em>
                  </button>
                ))}
              </div>
            </div>

            <div style={summaryBox}>
              <SummaryRow label="Subtotale" value={money(rowSubtotal)} />
              <SummaryRow label="Sconti riga" value={`-${money(rowDiscountTotal)}`} danger />

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

              <SummaryRow label="Sconto extra" value={`-${money(globalDiscountAmount)}`} danger />
              <SummaryRow label="Sconto totale" value={`-${money(discountTotal)}`} danger />

              <div style={totalBox}>
                <span>Totale da pagare</span>
                <strong>{money(total)}</strong>
              </div>

              <SummaryRow label="Margine stimato" value={money(margin)} success />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Metodo pagamento</label>
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
              <label style={label}>Documento</label>
              <select
                className="sp-input"
                value={receiptType}
                onChange={(e) => setReceiptType(e.target.value as ReceiptType)}
              >
                <option value="FISCAL">Scontrino fiscale</option>
                <option value="NON_FISCAL">Non fiscale</option>
              </select>
            </div>

            {!selectedClient ? (
              <div style={warningBox}>Seleziona un cliente per incassare.</div>
            ) : cart.length === 0 ? (
              <div style={warningBox}>Aggiungi almeno una voce al carrello.</div>
            ) : null}

            <button
              className="sp-button-purple"
              style={{
                width: "100%",
                marginTop: 18,
                padding: 20,
                fontSize: 16,
                opacity: canCloseSale ? 1 : 0.5,
              }}
              onClick={closeSale}
              disabled={!canCloseSale}
            >
              {loading
                ? "Salvataggio..."
                : receiptType === "FISCAL"
                  ? `Incassa ${money(total)} + scontrino`
                  : `Incassa ${money(total)} non fiscale`}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Step({
  active,
  number,
  title,
  text,
}: {
  active: boolean;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div style={{ ...stepItem, opacity: active ? 1 : 0.72 }}>
      <span style={{ ...stepCircle, background: active ? "linear-gradient(135deg,#8b5cf6,#d4af37)" : "rgba(255,255,255,0.1)" }}>
        {number}
      </span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return <div style={emptyBox}>{text}</div>;
}

function SummaryRow({
  label,
  value,
  danger,
  success,
}: {
  label: string;
  value: string;
  danger?: boolean;
  success?: boolean;
}) {
  return (
    <div style={summaryRow}>
      <span>{label}</span>
      <strong style={{ color: danger ? "#fecaca" : success ? "#86efac" : "#fff" }}>
        {value}
      </strong>
    </div>
  );
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  marginBottom: 18,
  flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: "uppercase",
  fontSize: 13,
};

const topActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const primaryTopButton: React.CSSProperties = {
  border: 0,
  borderRadius: 16,
  padding: "15px 22px",
  background: "linear-gradient(135deg,#8b5cf6,#d4af37)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const lightButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 16,
  padding: "15px 18px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
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

const stepBar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  marginBottom: 18,
};

const stepItem: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(212,175,55,0.2)",
  background: "rgba(255,255,255,0.055)",
  color: "#fff",
};

const stepCircle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontWeight: 950,
  color: "#fff",
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.82fr 1.25fr 0.9fr",
  gap: 18,
  alignItems: "start",
};

const card: React.CSSProperties = {
  padding: 22,
  minHeight: 720,
};

const checkoutCard: React.CSSProperties = {
  padding: 22,
  position: "sticky",
  top: 18,
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const stepBadge: React.CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 28,
  height: 28,
  borderRadius: 999,
  background: "rgba(139,92,246,0.22)",
  border: "1px solid rgba(139,92,246,0.45)",
  color: "#fff",
  fontWeight: 950,
  marginRight: 10,
};

const title: React.CSSProperties = {
  color: "#d4af37",
  margin: 0,
};

const smallTitle: React.CSSProperties = {
  color: "#d4af37",
  margin: "22px 0 10px",
};

const smallTitleNoMargin: React.CSSProperties = {
  color: "#d4af37",
  margin: 0,
};

const hintBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.20)",
  color: "#f8e9ad",
  fontWeight: 850,
  marginBottom: 14,
};

const searchInput: React.CSSProperties = {
  marginBottom: 12,
};

const listArea: React.CSSProperties = {
  display: "grid",
  gap: 10,
  maxHeight: 360,
  overflowY: "auto",
  paddingRight: 4,
};

const appointmentCard: React.CSSProperties = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  textAlign: "left",
  display: "grid",
  gap: 7,
  cursor: "pointer",
};

const appointmentTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const selectedClientBox: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.22)",
  color: "#fff",
  display: "grid",
  gap: 4,
};

const selectedBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  display: "grid",
  gap: 6,
  marginBottom: 16,
};

const emptyBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.07)",
  color: "#d7d7e7",
  fontWeight: 850,
};

const quickPanel: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 16,
};

const quickGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 12,
};

const quickButton: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.25)",
  borderRadius: 14,
  padding: 13,
  background: "rgba(212,175,55,0.1)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const extraGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 18,
};

const cartHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const bigEmptyCart: React.CSSProperties = {
  minHeight: 220,
  borderRadius: 22,
  border: "1px dashed rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.04)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  color: "#d7d7e7",
  fontWeight: 900,
  padding: 24,
};

const cartRow: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const cartFields: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.85fr 1.45fr 0.6fr 0.6fr",
  gap: 10,
};

const rowBottom: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginTop: 10,
};

const qtyBox: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  padding: 8,
  borderRadius: 14,
  background: "rgba(0,0,0,0.28)",
};

const qtyBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  border: 0,
  borderRadius: 10,
  background: "rgba(139,92,246,0.9)",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const rowRight: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  background: "#ef4444",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
  padding: "9px 12px",
};

const miniDanger: React.CSSProperties = {
  ...deleteButton,
  padding: "8px 12px",
};

const coachBlock: React.CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: "rgba(212,175,55,0.10)",
  border: "1px solid rgba(212,175,55,0.18)",
  color: "#fff",
  marginBottom: 16,
};

const suggestionButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  display: "grid",
  gap: 5,
  textAlign: "left",
  cursor: "pointer",
};

const summaryBox: React.CSSProperties = {
  borderRadius: 20,
  background: "rgba(0,0,0,0.38)",
  padding: 16,
  border: "1px solid rgba(255,255,255,0.08)",
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
  color: "#fff",
  fontWeight: 850,
};

const discountPanel: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  margin: "12px 0",
};

const label: React.CSSProperties = {
  display: "block",
  color: "#fff",
  fontWeight: 900,
  marginBottom: 8,
};

const discountGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const totalBox: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 12,
  padding: 16,
  borderRadius: 18,
  background: "linear-gradient(135deg,rgba(139,92,246,0.28),rgba(212,175,55,0.18))",
  border: "1px solid rgba(212,175,55,0.25)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#fff",
};

const warningBox: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.22)",
  color: "#fecaca",
  fontWeight: 900,
};
