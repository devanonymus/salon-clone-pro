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
type CatalogMode = "services" | "products";

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
  const [catalogMode, setCatalogMode] = useState<CatalogMode>("services");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);

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
      if (paymentOpen) {
        setPaymentOpen(false);
        return;
      }
      if (cart.length > 0 && !window.confirm("Uscire dalla cassa e perdere il carrello corrente?")) return;
      setRegisterOpen(false);
      setCompletedSale(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cart.length, loading, paymentOpen, registerOpen]);

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
    return appointments.filter((appointment) => {
      return !appointment.sale && isAppointmentFinished(appointment);
    });
  }, [appointments]);

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
  const cashAmountIsMissing = paymentMethod === "cash" && cashReceived === "";

  const canStartPayment = Boolean(
    selectedClient &&
      cart.length > 0 &&
      total > 0 &&
      !loading &&
      !missingStaffForServices,
  );

  const canCloseSale = Boolean(
    canStartPayment && !cashAmountIsInvalid && !cashAmountIsMissing,
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

  const filteredServiceNames = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return Object.keys(serviceCatalog)
      .filter((name) => !query || name.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b, "it"));
  }, [catalogSearch, serviceCatalog]);

  const filteredProducts = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return PRODUCTS.filter((product) => !query || product.name.toLowerCase().includes(query));
  }, [catalogSearch]);

  const cashQuickAmounts = useMemo(() => {
    const roundedFive = Math.ceil(total / 5) * 5;
    const roundedTen = Math.ceil(total / 10) * 10;
    return Array.from(new Set([total, roundedFive, roundedTen, 20, 50, 100]))
      .filter((amount) => amount >= total && amount > 0)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [total]);

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
    setCatalogMode("services");
    setCatalogSearch("");
    setPaymentOpen(false);
    setCompletedSale(null);
    setMessage("Cassa pulita.");
  }

  function openRegister(appointment?: AppointmentItem) {
    setRegisterOpen(true);
    setPaymentOpen(false);
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
      setPaymentOpen(false);
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
                  const receiptDemo = sale.fiscalStatus === "DEMO_ISSUED";
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
                        {receiptIssued ? "Documento emesso" : receiptDemo ? "Stampa demo" : nonFiscal ? "Non fiscale" : "Da emettere"}
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
              <header className={styles.posHeader}>
                <div className={styles.posBrand}>
                  <span className={styles.registerIcon}><AppIcon name="cash" size={20} /></span>
                  <div><small>Vendita in corso</small><strong>Registratore di cassa</strong></div>
                </div>
                <div className={styles.posStatus}>
                  <span><i /> Cassa online</span>
                  <strong>{selectedClient ? selectedClient.clientGlobal.name : "Seleziona il cliente"}</strong>
                  <small>{cart.length} {cart.length === 1 ? "voce" : "voci"} nello scontrino</small>
                </div>
                <div className={styles.posHeaderActions}>
                  <button onClick={clearCheckout} type="button">Nuova vendita</button>
                  <button onClick={closeRegister} type="button"><AppIcon name="x" size={17} /> Esci</button>
                </div>
              </header>

              <div className={styles.posWorkspace}>
                {message ? <div className={styles.registerMessage}>{message}</div> : null}

                <div className={styles.posGrid}>
                  <section className={styles.catalogPanel}>
                    {filteredAppointments.length > 0 ? (
                      <div className={styles.readyCheckoutStrip}>
                        <div className={styles.readyCheckoutHeading}>
                          <span><AppIcon name="agenda" size={16} /> Pronti da incassare</span>
                          <small>Clicca un appuntamento: cliente e servizi si caricano da soli.</small>
                        </div>
                        <div className={styles.readyCheckoutList}>
                          {filteredAppointments.slice(0, 5).map((appointment) => {
                            const date = new Date(appointment.date);
                            const active = selectedAppointment?.id === appointment.id;
                            return (
                              <button
                                className={active ? styles.readyCheckoutActive : ""}
                                key={appointment.id}
                                onClick={() => loadAppointment(appointment)}
                                type="button"
                              >
                                <span>{date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                                <strong>{appointment.clientTenant.clientGlobal.name}</strong>
                                <small>{appointment.note || "Appuntamento"}</small>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className={styles.saleContextBar}>
                      <label>
                        <span>Cliente</span>
                        <div className={styles.contextInput}>
                          <AppIcon name="search" size={16} />
                          <input
                            onChange={(event) => setClientSearch(event.target.value)}
                            placeholder="Cerca cliente..."
                            value={clientSearch}
                          />
                        </div>
                        <select value={selectedClientId} onChange={(event) => loadClientOnly(event.target.value)}>
                          <option value="">Seleziona cliente</option>
                          {filteredClients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.clientGlobal.name} · {client.clientGlobal.phone}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Operatore</span>
                        <select value={selectedStaffId} onChange={(event) => changeCheckoutStaff(event.target.value)}>
                          <option value="">Seleziona operatore</option>
                          {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                        <small>{selectedAppointment ? "Impostato dall’appuntamento" : "Necessario per i servizi"}</small>
                      </label>
                    </div>

                    <div className={styles.catalogToolbar}>
                      <div className={styles.catalogTabs}>
                        <button className={catalogMode === "services" ? styles.catalogTabActive : ""} onClick={() => setCatalogMode("services")} type="button">
                          Servizi
                        </button>
                        <button className={catalogMode === "products" ? styles.catalogTabActive : ""} onClick={() => setCatalogMode("products")} type="button">
                          Prodotti
                        </button>
                      </div>
                      <label className={styles.catalogSearch}>
                        <AppIcon name="search" size={17} />
                        <input
                          onChange={(event) => setCatalogSearch(event.target.value)}
                          placeholder={catalogMode === "services" ? "Cerca un servizio..." : "Cerca un prodotto..."}
                          value={catalogSearch}
                        />
                      </label>
                    </div>

                    <div className={styles.catalogGrid}>
                      {catalogMode === "services" ? filteredServiceNames.map((name) => (
                        <button className={styles.catalogTile} key={name} onClick={() => addService(name)} type="button">
                          <span className={styles.catalogTileIcon}><AppIcon name="plus" size={18} /></span>
                          <strong>{name}</strong>
                          <span>{money(serviceCatalog[name].price)}</span>
                          <small>{serviceCatalog[name].duration} min</small>
                        </button>
                      )) : filteredProducts.map((product) => (
                        <button className={styles.catalogTile} key={product.name} onClick={() => addProduct(product)} type="button">
                          <span className={styles.catalogTileIcon}><AppIcon name="plus" size={18} /></span>
                          <strong>{product.name}</strong>
                          <span>{money(product.price)}</span>
                          <small>Prodotto</small>
                        </button>
                      ))}
                    </div>

                    {catalogMode === "services" && cart.length > 0 && suggestions.length > 0 ? (
                      <div className={styles.upsellBar}>
                        <div><AppIcon name="sparkle" size={17} /><span>Da proporre al cliente</span></div>
                        {suggestions.map((product) => (
                          <button key={product.name} onClick={() => addProduct(product)} type="button">
                            <span>+ {product.name}</span><strong>{money(product.price)}</strong>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <aside className={styles.receiptPanel}>
                    <div className={styles.receiptHeader}>
                      <div>
                        <span>Scontrino</span>
                        <strong>{selectedClient?.clientGlobal.name || "Vendita libera"}</strong>
                      </div>
                      {cart.length > 0 ? <button onClick={() => setCart([])} type="button">Svuota</button> : null}
                    </div>

                    <div className={styles.receiptLines}>
                      {cart.length === 0 ? (
                        <div className={styles.receiptEmpty}>
                          <span><AppIcon name="cash" size={26} /></span>
                          <strong>Scontrino vuoto</strong>
                          <p>Tocca un servizio o un prodotto per aggiungerlo.</p>
                        </div>
                      ) : cart.map((item) => {
                        const itemSubtotal = item.price * item.quantity;
                        const itemDiscount = (itemSubtotal * item.discount) / 100;
                        const itemTotal = itemSubtotal - itemDiscount;
                        return (
                          <article className={styles.receiptLine} key={item.id}>
                            <div className={styles.receiptLineTop}>
                              <div><small>{item.type === "service" ? "Servizio" : "Prodotto"}</small><strong>{item.name}</strong></div>
                              <strong>{money(itemTotal)}</strong>
                            </div>
                            <div className={styles.receiptLineActions}>
                              <div className={styles.quantityControl}>
                                <button onClick={() => increment(item.id, -1)} type="button">−</button>
                                <strong>{item.quantity}</strong>
                                <button onClick={() => increment(item.id, 1)} type="button">+</button>
                              </div>
                              <details className={styles.lineEditor}>
                                <summary>Modifica</summary>
                                <div>
                                  <label>Descrizione<input value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} /></label>
                                  <label>Prezzo €<input type="number" value={item.price} onChange={(event) => updateItem(item.id, "price", event.target.value)} /></label>
                                  <label>Sconto %<input type="number" value={item.discount} onChange={(event) => updateItem(item.id, "discount", event.target.value)} /></label>
                                  <p>Margine: <strong>{item.type === "service" && !selectedStaffId ? "seleziona operatore" : money(itemMarginTotal(item))}</strong></p>
                                </div>
                              </details>
                              <button className={styles.removeLineButton} onClick={() => removeItem(item.id)} type="button"><AppIcon name="x" size={15} /></button>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <details className={styles.receiptDiscount}>
                      <summary>Sconto sul totale <span>{discountTotal > 0 ? `-${money(discountTotal)}` : "Nessuno"}</span></summary>
                      <div>
                        <select value={discountType} onChange={(event) => setDiscountType(event.target.value as DiscountType)}>
                          <option value="none">Nessuno sconto</option>
                          <option value="percent">Percentuale %</option>
                          <option value="fixed">Importo €</option>
                        </select>
                        <input
                          disabled={discountType === "none"}
                          onChange={(event) => setDiscountValue(event.target.value)}
                          placeholder={discountType === "percent" ? "10" : "5,00"}
                          value={discountValue}
                        />
                      </div>
                    </details>

                    <div className={styles.receiptTotals}>
                      <div><span>Subtotale</span><strong>{money(rowSubtotal)}</strong></div>
                      {discountTotal > 0 ? <div><span>Sconti</span><strong>-{money(discountTotal)}</strong></div> : null}
                      <div className={styles.receiptGrandTotal}><span>Totale</span><strong>{money(total)}</strong></div>
                    </div>

                    {!selectedClient ? <p className={styles.checkoutHint}>Seleziona un cliente per continuare.</p>
                      : cart.length === 0 ? <p className={styles.checkoutHint}>Aggiungi almeno una voce.</p>
                      : missingStaffForServices ? <p className={styles.checkoutHint}>Seleziona l’operatore.</p>
                      : <p className={styles.checkoutReady}><AppIcon name="check" size={15} /> Pronto per il pagamento</p>}

                    <button className={styles.goToPaymentButton} disabled={!canStartPayment} onClick={() => setPaymentOpen(true)} type="button">
                      <span>Vai al pagamento</span><strong>{money(total)}</strong><AppIcon name="arrow" size={19} />
                    </button>
                  </aside>
                </div>
              </div>

              {paymentOpen ? (
                <div aria-label="Pagamento" aria-modal="true" className={styles.paymentOverlay} role="dialog">
                  <section className={styles.paymentDialog}>
                    <header>
                      <button onClick={() => setPaymentOpen(false)} type="button">← Torna allo scontrino</button>
                      <div><small>Totale da incassare</small><strong>{money(total)}</strong></div>
                      <span>{selectedClient?.clientGlobal.name}</span>
                    </header>

                    <div className={styles.paymentBody}>
                      <div className={styles.paymentChoice}>
                        <h2>Come paga il cliente?</h2>
                        <p>Scegli il metodo di pagamento.</p>
                        <div className={styles.paymentMethods}>
                          {[
                            ["card", "Carta", "POS"],
                            ["cash", "Contanti", "Calcola il resto"],
                            ["mixed", "Misto", "Carta + contanti"],
                            ["bank", "Bonifico", "Pagamento tracciato"],
                          ].map(([value, name, detail]) => (
                            <button
                              className={paymentMethod === value ? styles.paymentMethodActive : ""}
                              key={value}
                              onClick={() => {
                                setPaymentMethod(value);
                                setCashReceived(value === "cash" ? total.toFixed(2) : "");
                              }}
                              type="button"
                            >
                              <span>{name.slice(0, 1)}</span><strong>{name}</strong><small>{detail}</small>
                            </button>
                          ))}
                        </div>

                        {paymentMethod === "cash" ? (
                          <div className={styles.cashPanel}>
                            <label htmlFor="cash-received">Contanti ricevuti</label>
                            <div className={styles.cashQuickButtons}>
                              {cashQuickAmounts.map((amount) => (
                                <button className={cashReceivedValue === amount ? styles.cashQuickActive : ""} key={amount} onClick={() => setCashReceived(amount.toFixed(2))} type="button">
                                  {amount === total ? "Esatto" : money(amount)}
                                </button>
                              ))}
                            </div>
                            <div className={styles.cashInputRow}>
                              <span>€</span><input id="cash-received" inputMode="decimal" onChange={(event) => setCashReceived(event.target.value)} value={cashReceived} />
                            </div>
                            <div className={cashAmountIsInvalid || cashAmountIsMissing ? styles.cashWarning : styles.changeBox}>
                              <span>{cashAmountIsMissing ? "Inserisci l’importo" : cashAmountIsInvalid ? "Mancano" : "Resto da dare"}</span>
                              <strong>{cashAmountIsMissing ? "—" : money(cashAmountIsInvalid ? total - cashReceivedValue : cashChange)}</strong>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <aside className={styles.paymentSummary}>
                        <h3>Documento</h3>
                        <div className={styles.documentOptions}>
                          <button className={receiptType === "FISCAL" ? styles.documentOptionActive : ""} onClick={() => setReceiptType("FISCAL")} type="button">
                            <strong>Fiscale</strong><span>Da emettere dopo l’incasso</span>
                          </button>
                          <button className={receiptType === "NON_FISCAL" ? styles.documentOptionActive : ""} onClick={() => setReceiptType("NON_FISCAL")} type="button">
                            <strong>Non fiscale</strong><span>Solo registrazione gestionale</span>
                          </button>
                        </div>
                        <div className={styles.paymentRecap}>
                          <div><span>Cliente</span><strong>{selectedClient?.clientGlobal.name}</strong></div>
                          <div><span>Voci</span><strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong></div>
                          <div><span>Pagamento</span><strong>{paymentLabel(paymentMethod)}</strong></div>
                          <div><span>Totale</span><strong>{money(total)}</strong></div>
                        </div>
                        <button className={styles.checkoutButton} disabled={!canCloseSale} onClick={closeSale} type="button">
                          <span>{loading ? "Registrazione in corso..." : "Incassa ora"}</span>
                          <strong>{loading ? "Attendi" : money(total)}</strong>
                        </button>
                      </aside>
                    </div>
                  </section>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
