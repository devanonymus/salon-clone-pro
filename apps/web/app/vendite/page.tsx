"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "../components/AppIcon";
import { ModuleHeader, ModuleMetrics } from "../components/ModuleHeader";
import ops from "../operations.module.css";
import { API_URL, getErrorMessage } from "../../src/lib/api";
import styles from "./vendite.module.css";

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
  technicalCost?: number;
  laborCost?: number;
  duration?: number;
  staffId?: string | null;
  quantity: number;
  discount: number;
};

type ServicePrice = {
  id: string;
  name: string;
  category?: string;
  duration: number;
  price: number;
  cost: number;
  active?: boolean;
};

type StaffMember = {
  id: string;
  name: string;
  role?: string;
  monthlyCost?: number;
  productiveHours?: number;
  active?: boolean;
};

type InventoryProduct = {
  id: string;
  name: string;
  productType: string;
  unit: string;
  stock: number;
  cost: number;
  unitCost?: number;
  sellPrice?: number;
  active?: boolean;
};

type RecipeItem = {
  id: string;
  serviceName: string;
  productId: string;
  quantity: number;
  product?: InventoryProduct;
};

type ProductSuggestion = {
  name: string;
  tag: string;
  price: number;
  cost: number;
  reason: string;
};

type SaleRecord = {
  id: string;
  total: number;
  paymentMethod: string | null;
  fiscalStatus?: string | null;
  createdAt: string;
  clientGlobal: {
    id: string;
    name: string;
    phone: string;
  };
  items?: Array<{
    id: string;
    name: string;
    type?: string;
    price: number;
    quantity: number;
  }>;
  appointment?: {
    id: string;
    staff?: { id: string; name: string } | null;
  } | null;
};

type CompletedSale = {
  id: string;
  total: number;
  clientName: string;
  paymentMethod: string;
  receiptType: ReceiptType;
};

type DiscountType = "none" | "percent" | "fixed";
type ReceiptType = "FISCAL" | "NON_FISCAL";
type SalesPeriod = "today" | "week" | "month" | "all";

const SERVICE_PRICES: Record<string, { price: number; cost: number }> = {
  Piega: { price: 18, cost: 0 },
  "Piega Atelier Extra Styling": { price: 25, cost: 0 },
  "Taglio Donna": { price: 20, cost: 0 },
  "Taglio Donna + Piega": { price: 32, cost: 0 },
  "Shampoo + Taglio Uomo": { price: 22, cost: 0 },
  "Barba Rifinitura": { price: 10, cost: 0 },
  "Colore Base": { price: 28, cost: 0 },
  "Colore Base + Piega": { price: 42, cost: 0 },
  "Colore Base + Taglio + Piega": { price: 55, cost: 0 },
  "Tonalizzante/Gloss": { price: 22, cost: 0 },
  "Tonalizzante + Piega": { price: 35, cost: 0 },
  "Decapaggio Colore": { price: 45, cost: 0 },
  "Decapaggio + Piega": { price: 70, cost: 0 },
  "Schiariture Parziali Meches Light": { price: 65, cost: 0 },
  "Colpi di Sole/Meches + Piega": { price: 85, cost: 0 },
  "Ricostruzione": { price: 30, cost: 0 },
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

function inventoryUnitCost(product?: InventoryProduct) {
  if (!product) return 0;

  const directUnitCost = Number(product.unitCost || 0);
  if (directUnitCost > 0) return directUnitCost;

  const stock = Number(product.stock || 0);
  const cost = Number(product.cost || 0);
  return stock > 0 && cost > 0 ? cost / stock : cost;
}

function isSameDay(value: string, reference: Date) {
  const date = new Date(value);
  return date.getDate() === reference.getDate()
    && date.getMonth() === reference.getMonth()
    && date.getFullYear() === reference.getFullYear();
}

function paymentLabel(method?: string | null) {
  if (method === "cash") return "Contanti";
  if (method === "mixed") return "Pagamento misto";
  if (method === "bank") return "Bonifico";
  return "Carta";
}

function isAppointmentFinished(appointment: AppointmentItem) {
  const start = new Date(appointment.date).getTime();
  const durationMs = Number(appointment.duration || 0) * 60 * 1000;
  const end = start + durationMs;

  return end <= Date.now();
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
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState("");
  const [receiptType, setReceiptType] = useState<ReceiptType>("FISCAL");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [salesSearch, setSalesSearch] = useState("");
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("today");
  const [cashReceived, setCashReceived] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const checkoutKeyRef = useRef<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  useEffect(() => {
    checkoutKeyRef.current = null;
  }, [
    cart,
    selectedClientId,
    selectedAppointment?.id,
    paymentMethod,
    receiptType,
    discountType,
    discountValue,
  ]);

  useEffect(() => {
    if (!registerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || loading) return;
      if (cart.length > 0 && !window.confirm("Uscire dalla cassa e perdere il carrello corrente?")) return;
      setRegisterOpen(false);
      setCompletedSale(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cart.length, loading, registerOpen]);

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

  const technicalCostTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      const technicalCost = Number(item.technicalCost ?? (item.type === "product" ? item.cost : 0));

      return sum + technicalCost * quantity;
    }, 0);
  }, [cart]);

  const laborCostTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const quantity = Number(item.quantity || 1);
      const laborCost = Number(item.laborCost || 0);

      return sum + laborCost * quantity;
    }, 0);
  }, [cart]);

  const costTotal = technicalCostTotal + laborCostTotal;
  const margin = total - costTotal;

  const hasServiceItems = cart.some((item) => item.type === "service");
  const missingStaffForServices = hasServiceItems && !selectedStaffId;

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

    const ready = appointments.filter((appointment) => {
      return !appointment.sale && isAppointmentFinished(appointment);
    });

    if (!q) return ready;

    return ready.filter((appointment) => {
      const text = `${appointment.clientTenant.clientGlobal.name} ${appointment.clientTenant.clientGlobal.phone} ${appointment.note || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [appointments, appointmentSearch]);

  const filteredSales = useMemo(() => {
    const query = salesSearch.trim().toLowerCase();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((sale) => {
      const createdAt = new Date(sale.createdAt);
      const inPeriod = salesPeriod === "all"
        || (salesPeriod === "today" && isSameDay(sale.createdAt, now))
        || (salesPeriod === "week" && createdAt >= weekStart)
        || (salesPeriod === "month" && createdAt >= monthStart);
      if (!inPeriod) return false;
      if (!query) return true;

      const searchable = [
        sale.clientGlobal.name,
        sale.clientGlobal.phone,
        sale.paymentMethod,
        ...(sale.items || []).map((item) => item.name),
      ].join(" ").toLowerCase();

      return searchable.includes(query);
    });
  }, [sales, salesPeriod, salesSearch]);

  const salesMetrics = useMemo(() => {
    const now = new Date();
    const todaySales = sales.filter((sale) => isSameDay(sale.createdAt, now));
    const revenueToday = todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const averageTicket = todaySales.length > 0 ? revenueToday / todaySales.length : 0;
    const pendingReceipts = sales.filter((sale) => sale.fiscalStatus !== "ISSUED" && sale.fiscalStatus !== "NON_FISCAL").length;

    return { revenueToday, averageTicket, pendingReceipts, transactionsToday: todaySales.length };
  }, [sales]);

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

  const cashReceivedValue = numberFromInput(cashReceived);
  const cashChange = paymentMethod === "cash"
    ? Math.max(0, cashReceivedValue - total)
    : 0;
  const cashAmountIsInvalid = paymentMethod === "cash"
    && cashReceived !== ""
    && cashReceivedValue < total;

  const canCloseSale = Boolean(
    selectedClient &&
      cart.length > 0 &&
      total > 0 &&
      !loading &&
      !missingStaffForServices &&
      !cashAmountIsInvalid,
  );

  const serviceCatalog = useMemo(() => {
    const catalog: Record<string, { price: number; cost: number; duration: number }> = {};

    Object.entries(SERVICE_PRICES).forEach(([name, data]) => {
      catalog[name] = {
        price: data.price,
        cost: data.cost,
        duration: 30,
      };
    });

    servicePrices.forEach((service) => {
      const recipeCost = Number(recipes
        .filter((recipe) => recipe.serviceName === service.name)
        .reduce((sum, recipe) => sum + inventoryUnitCost(recipe.product) * Number(recipe.quantity || 0), 0)
        .toFixed(2));

      catalog[service.name] = {
        price: Number(service.price || 0),
        cost: recipeCost > 0 ? recipeCost : 0,
        duration: Number(service.duration || 30),
      };
    });

    return catalog;
  }, [servicePrices, recipes]);

  function getServiceData(name: string) {
    return serviceCatalog[name] || { price: 30, cost: 0, duration: 30 };
  }

  function getStaffMinuteCost(staffId?: string) {
    if (!staffId) return 0;

    const member = staff.find((item) => item.id === staffId);

    if (!member) return 0;

    const monthlyCost = Number(member.monthlyCost || 0);
    const productiveHours = Number(member.productiveHours || 0);

    if (monthlyCost <= 0 || productiveHours <= 0) return 0;

    return monthlyCost / productiveHours / 60;
  }

  function getServiceTechnicalCost(serviceName: string) {
    const data = getServiceData(serviceName);
    return Number(data.cost || 0);
  }

  function getServiceDuration(serviceName: string) {
    const data = getServiceData(serviceName);
    return Number(data.duration || 30);
  }

  function getServiceLaborCost(serviceName: string, staffId?: string) {
    const data = getServiceData(serviceName);
    const minuteCost = getStaffMinuteCost(staffId || selectedStaffId || selectedAppointment?.staff?.id || "");

    return Number((Number(data.duration || 30) * minuteCost).toFixed(2));
  }

  function getServiceFullCost(serviceName: string, staffId?: string) {
    const data = getServiceData(serviceName);
    const technicalCost = Number(data.cost || 0);
    const laborCost = getServiceLaborCost(serviceName, staffId);

    return Number((technicalCost + laborCost).toFixed(2));
  }



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
      const msg =
        typeof data?.message === "object" ? JSON.stringify(data.message) : data?.message;
      throw new Error(msg || text || "Errore richiesta");
    }

    return data;
  }

  async function loadData() {
    try {
      setDataLoading(true);

      const [clientsData, appointmentsData, servicePricesData, recipesData, staffData, salesData] = await Promise.all([
        fetchWithAuth("/clients"),
        fetchWithAuth("/appointments"),
        fetchWithAuth("/service-prices"),
        fetchWithAuth("/inventory/recipes"),
        fetchWithAuth("/staff"),
        fetchWithAuth("/sales"),
      ]);

      setClients(clientsData || []);
      setServicePrices(Array.isArray(servicePricesData) ? servicePricesData.filter((item: ServicePrice) => item.active !== false) : []);
      setRecipes(Array.isArray(recipesData) ? recipesData : []);
      setStaff(Array.isArray(staffData) ? staffData.filter((item: StaffMember) => item.active !== false) : []);
      setSales(Array.isArray(salesData) ? salesData : []);

      const ready = (appointmentsData || []).sort(
        (a: AppointmentItem, b: AppointmentItem) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      setAppointments(ready);
    } catch (error) {
      setMessage(`⚠️ ${getErrorMessage(error, "Errore caricamento cassa")}`);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData);
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
    const data = getServiceData(name);
    if (!data) return;

    addCartItem({
      type: "service",
      name,
      price: Number(data.price || 0),
      cost: getServiceFullCost(name),
      technicalCost: getServiceTechnicalCost(name),
      laborCost: getServiceLaborCost(name),
      duration: getServiceDuration(name),
      staffId: selectedStaffId || selectedAppointment?.staff?.id || null,
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
      technicalCost: product.cost,
      laborCost: 0,
      duration: 0,
      staffId: null,
      quantity: 1,
      discount: 0,
    });
  }

  function loadAppointment(appointment: AppointmentItem) {
    setSelectedAppointment(appointment);
    setSelectedStaffId(appointment.staff?.id || "");

    const client = clients.find(
      (c) => c.clientGlobal.id === appointment.clientTenant.clientGlobal.id,
    );

    if (client) setSelectedClientId(client.id);

    const services =
      appointment.note && appointment.note !== "Appuntamento"
        ? appointment.note.split(" + ")
        : [];

    const items: CartItem[] = services.map((name) => {
      const data = getServiceData(name);

      return {
        id: crypto.randomUUID(),
        type: "service",
        name,
        price: Number(data.price || 0),
        cost: getServiceFullCost(name, appointment.staff?.id || ""),
        technicalCost: getServiceTechnicalCost(name),
        laborCost: getServiceLaborCost(name, appointment.staff?.id || ""),
        duration: getServiceDuration(name),
        staffId: appointment.staff?.id || null,
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
    if (!selectedStaffId && staff[0]) setSelectedStaffId(staff[0].id);
    const client = clients.find((c) => c.id === clientId);
    setMessage(client ? `Cliente ${client.clientGlobal.name} selezionato.` : "");
  }

  function changeCheckoutStaff(staffId: string) {
    setSelectedStaffId(staffId);

    setCart((prev) =>
      prev.map((item) =>
        item.type === "service"
          ? {
              ...item,
              cost: getServiceFullCost(item.name, staffId),
              technicalCost: getServiceTechnicalCost(item.name),
              laborCost: getServiceLaborCost(item.name, staffId),
              duration: getServiceDuration(item.name),
              staffId: staffId || null,
            }
          : item,
      ),
    );
  }

  function itemTechnicalTotal(item: CartItem) {
    const quantity = Number(item.quantity || 1);
    return Number(item.technicalCost ?? (item.type === "product" ? item.cost : 0)) * quantity;
  }

  function itemLaborTotal(item: CartItem) {
    const quantity = Number(item.quantity || 1);
    return Number(item.laborCost || 0) * quantity;
  }

  function itemRealCostTotal(item: CartItem) {
    return itemTechnicalTotal(item) + itemLaborTotal(item);
  }

  function itemNetTotal(item: CartItem) {
    const gross = Number(item.price || 0) * Number(item.quantity || 1);
    const discount = gross * (Number(item.discount || 0) / 100);
    return Math.max(0, gross - discount);
  }

  function itemMarginTotal(item: CartItem) {
    return itemNetTotal(item) - itemRealCostTotal(item);
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
    setCashReceived("");
    setCompletedSale(null);
    setMessage("Cassa pulita.");
  }

  function openRegister(appointment?: AppointmentItem) {
    setRegisterOpen(true);
    setCompletedSale(null);
    setMessage("");

    if (appointment) loadAppointment(appointment);
  }

  function closeRegister() {
    if (loading) return;
    if (cart.length > 0 && !window.confirm("Uscire dalla cassa e perdere il carrello corrente?")) return;
    clearCheckout();
    setMessage("");
    setRegisterOpen(false);
  }

  function startNewSale() {
    clearCheckout();
    setMessage("");
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

    const idempotencyKey = checkoutKeyRef.current ?? crypto.randomUUID();
    checkoutKeyRef.current = idempotencyKey;

    try {
      const savedSale = await fetchWithAuth("/sales", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
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
            technicalCost: item.technicalCost ?? item.cost,
            laborCost: item.laborCost ?? 0,
            duration: item.duration ?? 0,
            staffId: item.staffId ?? selectedStaffId ?? null,
            quantity: item.quantity,
            discount: item.discount,
          })),
        }),
      });

      checkoutKeyRef.current = null;
      setCompletedSale({
        id: savedSale?.id || idempotencyKey,
        total,
        clientName: selectedClient.clientGlobal.name,
        paymentMethod,
        receiptType,
      });
      setMessage("");

      setCart([]);
      setSelectedAppointment(null);
      setSelectedClientId("");
      setDiscountType("none");
      setDiscountValue("");
      setReceiptType("FISCAL");
      setCashReceived("");
      await loadData();
    } catch (error) {
      setMessage(`⚠️ ${getErrorMessage(error, "Errore registrazione vendita")}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <main className={`sp-page ${ops.modulePage}`}>
        <div className={`sp-shell ${styles.historyShell}`}>
          <ModuleHeader
            eyebrow="Vendite & pagamenti"
            title="Vendite"
            description="Controlla gli incassi, ritrova ogni transazione e apri la cassa quando serve."
            icon="cash"
            status="Cassa pronta"
            actions={(
              <button className={`${ops.primaryAction} ${styles.openRegisterButton}`} onClick={() => openRegister()} type="button">
                <AppIcon name="cash" size={17} />
                Apri cassa
              </button>
            )}
          />

          <ModuleMetrics
            items={[
              { label: "Incasso di oggi", value: money(salesMetrics.revenueToday), detail: `${salesMetrics.transactionsToday} transazioni`, tone: "accent" },
              { label: "Scontrino medio", value: money(salesMetrics.averageTicket), detail: "media delle vendite odierne" },
              { label: "Da incassare", value: filteredAppointments.length, detail: "appuntamenti conclusi", tone: filteredAppointments.length ? "warning" : "neutral" },
              { label: "Documenti aperti", value: salesMetrics.pendingReceipts, detail: "scontrini da emettere", tone: salesMetrics.pendingReceipts ? "danger" : "success" },
            ]}
          />

          {message && !registerOpen ? <div className={styles.historyMessage}>{message}</div> : null}

          <section className={styles.historyGrid}>
            <article className={`sp-card ${ops.surface} ${styles.salesPanel}`}>
              <div className={styles.panelHeading}>
                <div>
                  <span className={styles.kicker}>Movimenti</span>
                  <h2>Storico vendite</h2>
                  <p>Consulta rapidamente clienti, importi e stato del documento.</p>
                </div>
                <span className={styles.resultCount}>{filteredSales.length} risultati</span>
              </div>

              <div className={styles.salesToolbar}>
                <label className={styles.searchBox}>
                  <AppIcon name="search" size={17} />
                  <input
                    aria-label="Cerca nello storico vendite"
                    onChange={(event) => setSalesSearch(event.target.value)}
                    placeholder="Cerca cliente, telefono o servizio..."
                    value={salesSearch}
                  />
                </label>
                <div className={styles.periodTabs} aria-label="Periodo vendite">
                  {([
                    ["today", "Oggi"],
                    ["week", "7 giorni"],
                    ["month", "Mese"],
                    ["all", "Tutte"],
                  ] as Array<[SalesPeriod, string]>).map(([value, label]) => (
                    <button
                      className={salesPeriod === value ? styles.periodTabActive : ""}
                      key={value}
                      onClick={() => setSalesPeriod(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.salesList}>
                {dataLoading ? (
                  <div className={styles.listEmpty}>Caricamento vendite...</div>
                ) : filteredSales.length === 0 ? (
                  <div className={styles.listEmpty}>
                    <AppIcon name="cash" size={24} />
                    <strong>Nessuna vendita nel periodo</strong>
                    <span>Apri la cassa per registrare il prossimo incasso.</span>
                  </div>
                ) : filteredSales.slice(0, 60).map((sale) => {
                  const date = new Date(sale.createdAt);
                  const itemCount = (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
                  const receiptIssued = sale.fiscalStatus === "ISSUED";
                  const nonFiscal = sale.fiscalStatus === "NON_FISCAL";

                  return (
                    <div className={styles.saleRow} key={sale.id}>
                      <div className={styles.saleDate}>
                        <strong>{date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</strong>
                        <span>{date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</span>
                      </div>
                      <div className={styles.saleClient}>
                        <strong>{sale.clientGlobal.name}</strong>
                        <span>{itemCount} {itemCount === 1 ? "voce" : "voci"} · {sale.clientGlobal.phone}</span>
                      </div>
                      <span className={styles.paymentBadge}>{paymentLabel(sale.paymentMethod)}</span>
                      <span className={receiptIssued ? styles.receiptIssued : nonFiscal ? styles.receiptNonFiscal : styles.receiptPending}>
                        {receiptIssued ? "Documento emesso" : nonFiscal ? "Non fiscale" : "Da emettere"}
                      </span>
                      <strong className={styles.saleTotal}>{money(sale.total)}</strong>
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className={`sp-card ${ops.surface} ${styles.readyPanel}`}>
              <div className={styles.panelHeading}>
                <div>
                  <span className={styles.kicker}>Flusso rapido</span>
                  <h2>Pronti da incassare</h2>
                  <p>Apri la cassa con cliente e servizi già caricati.</p>
                </div>
              </div>

              <div className={styles.readyList}>
                {dataLoading ? (
                  <div className={styles.readyEmpty}>Caricamento appuntamenti...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className={styles.readyEmpty}>
                    <AppIcon name="check" size={22} />
                    <strong>Tutto incassato</strong>
                    <span>Non ci sono appuntamenti conclusi in attesa.</span>
                  </div>
                ) : filteredAppointments.slice(0, 6).map((appointment) => (
                  <button className={styles.readyCard} key={appointment.id} onClick={() => openRegister(appointment)} type="button">
                    <div>
                      <strong>{appointment.clientTenant.clientGlobal.name}</strong>
                      <span>{appointment.note || "Appuntamento"}</span>
                    </div>
                    <small>{appointmentStatus(appointment)}</small>
                    <AppIcon name="arrow" size={17} />
                  </button>
                ))}
              </div>

              <button className={styles.freeSaleButton} onClick={() => openRegister()} type="button">
                <AppIcon name="plus" size={17} />
                Nuova vendita libera
              </button>
            </aside>
          </section>
        </div>
      </main>

      {registerOpen ? (
        <div aria-label="Cassa operativa" aria-modal="true" className={styles.registerOverlay} role="dialog">
          {completedSale ? (
            <div className={styles.successScreen}>
              <div className={styles.successMark}><AppIcon name="check" size={36} /></div>
              <span className={styles.kicker}>Pagamento completato</span>
              <h2>{money(completedSale.total)} incassati</h2>
              <p>La vendita di <strong>{completedSale.clientName}</strong> è stata registrata correttamente.</p>
              <div className={styles.successDetails}>
                <div><span>Pagamento</span><strong>{paymentLabel(completedSale.paymentMethod)}</strong></div>
                <div><span>Documento</span><strong>{completedSale.receiptType === "FISCAL" ? "Fiscale da emettere" : "Non fiscale"}</strong></div>
                <div><span>Operazione</span><strong>#{completedSale.id.slice(0, 8).toUpperCase()}</strong></div>
              </div>
              <div className={styles.successActions}>
                <button className={styles.secondaryRegisterAction} onClick={() => { startNewSale(); setRegisterOpen(false); }} type="button">
                  Torna alle vendite
                </button>
                <button className={styles.primaryRegisterAction} onClick={startNewSale} type="button">
                  <AppIcon name="plus" size={17} /> Nuova vendita
                </button>
              </div>
            </div>
          ) : (
            <>
              <header className={styles.registerHeader}>
                <div className={styles.registerBrand}>
                  <span className={styles.registerIcon}><AppIcon name="cash" size={20} /></span>
                  <div><small>Modalità operativa</small><strong>Cassa principale</strong></div>
                </div>
                <div className={styles.registerContext}>
                  <span><i /> Cassa online</span>
                  <strong>{selectedClient ? selectedClient.clientGlobal.name : "Nessun cliente"}</strong>
                  <small>{cart.length} {cart.length === 1 ? "articolo" : "articoli"} · {money(total)}</small>
                </div>
                <div className={styles.registerActions}>
                  <button onClick={clearCheckout} type="button">Pulisci</button>
                  <button onClick={closeRegister} type="button"><AppIcon name="x" size={17} /> Esci dalla cassa</button>
                </div>
              </header>

              <div className={styles.registerWorkspace}>
                <section className={`${ops.stepBar} ${styles.registerSteps}`} style={stepBar}>
                  <Step active={Boolean(selectedClient)} number="1" title="Cliente" text={selectedClient ? selectedClient.clientGlobal.name : "Seleziona"} />
                  <Step active={cart.length > 0} number="2" title="Carrello" text={`${cart.length} voci`} />
                  <Step active={total > 0} number="3" title="Pagamento" text={money(total)} />
                </section>

                {message ? <div className={styles.registerMessage}>{message}</div> : null}

                <section className={`${ops.contentGrid} ${styles.registerGrid}`} style={mainGrid}>
          <aside className={`sp-card ${ops.surface}`} style={card}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>1</span>
                <h2 style={title}>1. Cliente</h2>
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
                <EmptyBox text="Nessun appuntamento finito da incassare. Se serve, seleziona un cliente sotto." />
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

          <section className={`sp-card ${ops.surface}`} style={card}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>2</span>
                <h2 style={title}>2. Servizi e prodotti</h2>
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

            {staff.length > 0 ? (
              <div style={staffSelectBox}>
                <label style={label}>Operatore</label>
                <select
                  className="sp-input"
                  value={selectedStaffId}
                  onChange={(e) => changeCheckoutStaff(e.target.value)}
                >
                  <option value="">Nessun operatore</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <small>
                  Serve per calcolare il costo personale reale del servizio.
                </small>
              </div>
            ) : null}

            <div style={quickPanel}>
              <h3 style={smallTitleNoMargin}>Servizi rapidi</h3>
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
                {Object.keys(serviceCatalog).map((name) => (
                  <option key={name} value={name}>
                    {name} — {money(serviceCatalog[name].price)}
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
              <h2 style={title}>Carrello cliente</h2>
              {cart.length > 0 ? (
                <button style={miniDanger} onClick={() => setCart([])}>
                  Svuota
                </button>
              ) : null}
            </div>
            {cart.length === 0 ? (
              <div style={bigEmptyCart}>
                <strong>Carrello cliente vuoto</strong>
                <span>Aggiungi un servizio rapido oppure carica un appuntamento finito.</span>
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

                        <div style={rowRightEasy}>
                          <div style={easyTotalBox}>
                            <span>Totale</span>
                            <strong>{money(itemTotal)}</strong>
                          </div>

                          <div style={easyMarginBox}>
                            <span>Margine</span>
                            <strong>
                              {item.type === "service" && !selectedStaffId
                                ? "Incompleto"
                                : money(itemMarginTotal(item))}
                            </strong>
                          </div>

                          <details style={costDetailsBox}>
                            <summary>Dettaglio costi</summary>

                            <div style={costDetailsGrid}>
                              <span>Materiali</span>
                              <strong>{money(itemTechnicalTotal(item))}</strong>

                              <span>Personale</span>
                              <strong>
                                {item.type === "service" && !selectedStaffId
                                  ? "Manca operatore"
                                  : money(itemLaborTotal(item))}
                              </strong>

                              <span>Costo reale</span>
                              <strong>
                                {item.type === "service" && !selectedStaffId
                                  ? "Incompleto"
                                  : money(itemRealCostTotal(item))}
                              </strong>
                            </div>
                          </details>

                          {item.discount > 0 ? (
                            <small style={{ color: "#fecaca", fontWeight: 900 }}>
                              Sconto riga -{money(itemDiscount)}
                            </small>
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

          <aside className={`sp-card ${ops.surface}`} style={checkoutCard}>
            <div style={sectionHeader}>
              <div>
                <span style={stepBadge}>3</span>
                <h2 style={title}>3. Incasso</h2>
              </div>
            </div>

            <div style={coachBlock}>
              <h3>💎 Prodotti consigliati</h3>
              <p>
                {cart.length === 0
                  ? "Aggiungi un servizio: ti suggerirò i prodotti giusti."
                  : "Suggerimenti utili in base ai servizi inseriti."}
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
              <SummaryRow label="Totale servizi/prodotti" value={money(rowSubtotal)} />
              <SummaryRow label="Sconti sui servizi" value={`-${money(rowDiscountTotal)}`} danger />

              <div style={discountPanel}>
                <label style={label}>Sconto finale</label>
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

              <SummaryRow label="Sconto finale" value={`-${money(globalDiscountAmount)}`} danger />
              <SummaryRow label="Sconto totale" value={`-${money(discountTotal)}`} danger />

              <div style={totalBox}>
                <span>Cliente paga</span>
                <strong>{money(total)}</strong>
              </div>

              <SummaryRow label="Margine reale" value={money(margin)} success />
            </div>

            <div className={styles.paymentSection}>
              <label style={label}>Metodo di pagamento</label>
              <div className={styles.paymentMethods}>
                {[
                  ["card", "Carta", "POS"],
                  ["cash", "Contanti", "Resto automatico"],
                  ["mixed", "Misto", "Carta + contanti"],
                  ["bank", "Bonifico", "Pagamento tracciato"],
                ].map(([value, name, detail]) => (
                  <button
                    className={paymentMethod === value ? styles.paymentMethodActive : ""}
                    key={value}
                    onClick={() => {
                      setPaymentMethod(value);
                      if (value !== "cash") setCashReceived("");
                    }}
                    type="button"
                  >
                    <strong>{name}</strong>
                    <span>{detail}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" ? (
              <div className={styles.cashPanel}>
                <label htmlFor="cash-received" style={label}>Contanti ricevuti</label>
                <div className={styles.cashInputRow}>
                  <span>€</span>
                  <input
                    className="sp-input"
                    id="cash-received"
                    inputMode="decimal"
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder={total.toFixed(2)}
                    value={cashReceived}
                  />
                  <button onClick={() => setCashReceived(total.toFixed(2))} type="button">Importo esatto</button>
                </div>
                <div className={cashAmountIsInvalid ? styles.cashWarning : styles.changeBox}>
                  <span>{cashAmountIsInvalid ? "Mancano" : "Resto"}</span>
                  <strong>{money(cashAmountIsInvalid ? total - cashReceivedValue : cashChange)}</strong>
                </div>
              </div>
            ) : null}

            <div className={styles.paymentSection}>
              <label style={label}>Documento</label>
              <div className={styles.documentOptions}>
                <button className={receiptType === "FISCAL" ? styles.documentOptionActive : ""} onClick={() => setReceiptType("FISCAL")} type="button">
                  <strong>Scontrino fiscale</strong><span>Da emettere dopo l’incasso</span>
                </button>
                <button className={receiptType === "NON_FISCAL" ? styles.documentOptionActive : ""} onClick={() => setReceiptType("NON_FISCAL")} type="button">
                  <strong>Non fiscale</strong><span>Solo registrazione gestionale</span>
                </button>
              </div>
            </div>

            {!selectedClient ? (
              <div style={warningBox}>{missingStaffForServices
                    ? "Seleziona un operatore per calcolare il costo personale e incassare."
                    : "Seleziona un cliente per incassare."}</div>
            ) : cart.length === 0 ? (
              <div style={warningBox}>Aggiungi almeno una voce al carrello.</div>
            ) : null}

            <button
              className={styles.checkoutButton}
              onClick={closeSale}
              disabled={!canCloseSale}
            >
              <span>{loading ? "Registrazione in corso" : "Conferma pagamento"}</span>
              {loading
                ? "Attendi..."
                : money(total)}
            </button>
          </aside>
                </section>
              </div>
            </>
          )}
        </div>
      ) : null}
    </>
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

const staffSelectBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#d9f99d",
  display: "grid",
  gap: 8,
  marginBottom: 16,
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


const rowRightEasy: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px 110px 1fr auto",
  gap: 10,
  alignItems: "center",
  width: "100%",
};

const easyTotalBox: React.CSSProperties = {
  display: "grid",
  gap: 3,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.18)",
};

const easyMarginBox: React.CSSProperties = {
  display: "grid",
  gap: 3,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.18)",
  color: "#86efac",
};

const costDetailsBox: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 850,
};

const costDetailsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "6px 12px",
  marginTop: 10,
  fontSize: 13,
};
