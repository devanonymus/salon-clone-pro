"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../src/lib/api";

type SaleItemRow = {
  id?: string;
  name: string;
  type: string;
  price: number;
  cost?: number;
  technicalCost?: number;
  laborCost?: number;
  duration?: number;
  staffId?: string | null;
  quantity: number;
};

type SaleRow = {
  id: string;
  total: number;
  paymentMethod?: string | null;
  fiscalStatus?: string | null;
  createdAt: string;
  items?: SaleItemRow[];
};

type FixedCost = {
  id: string;
  name: string;
  amount: number;
};

type CoachAppointment = {
  id: string;
  date: string;
  note?: string | null;
  clientTenant?: {
    clientGlobal?: {
      name?: string;
      phone?: string;
    };
  };
  staff?: {
    name?: string;
  } | null;
};

type PrebookingStatus = "PRENOTATO" | "DA_RICHIAMARE" | "NON_INTERESSATA" | "NON_PROPOSTO";

type PrebookingResult = {
  appointmentId: string;
  status: PrebookingStatus;
  note?: string | null;
};

type CoachSale = {
  id: string;
  total: number;
  createdAt: string;
  items?: {
    name: string;
    type: string;
    price: number;
    quantity: number;
  }[];
};

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const INITIAL_COSTS: FixedCost[] = [
  { id: "1", name: "FITTO LOCALE", amount: 1250 },
  { id: "2", name: "COMMERCIALISTA / CONSULENZA", amount: 250 },
  { id: "3", name: "SOFTWARE ACQUAVIVA STRATEGIC", amount: 80 },
  { id: "4", name: "ENERGIA ELETTRICA", amount: 450 },
  { id: "5", name: "GAS / RISCALDAMENTO", amount: 150 },
  { id: "6", name: "ACQUA", amount: 60 },
  { id: "7", name: "INTERNET / TELEFONO", amount: 60 },
  { id: "8", name: "TARI / RIFIUTI", amount: 120 },
  { id: "9", name: "ASSICURAZIONE", amount: 70 },
  { id: "10", name: "PULIZIE / IGIENE", amount: 200 },
];

function euro(value: number) {
  return `€ ${value.toFixed(2)}`;
}

export default function DashboardCoachPage() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [ivaServizi, setIvaServizi] = useState("22");
  const [ivaRivendita, setIvaRivendita] = useState("22");
  const [oreProd, setOreProd] = useState("140");
  const [feePos, setFeePos] = useState("1.5");
  const [feePosFisso, setFeePosFisso] = useState("0");
  const [overhead, setOverhead] = useState("3");
  const [riservaTasse, setRiservaTasse] = useState("25");
  const [grigliaAgenda, setGrigliaAgenda] = useState("5");
  const [domain, setDomain] = useState("app.acquavivastrategic.it");
  const [cardCostIncluded, setCardCostIncluded] = useState(false);

  const [fishBase, setFishBase] = useState("");
  const [clientiPrevisti, setClientiPrevisti] = useState("");
  const [objective, setObjective] = useState("+10%");
  const [prebookingStatus, setPrebookingStatus] = useState<Record<string, PrebookingStatus>>({});
  const [prebookingNotes, setPrebookingNotes] = useState<Record<string, string>>({});

  const [costName, setCostName] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [appointments, setAppointments] = useState<CoachAppointment[]>([]);
  const [sales, setSales] = useState<CoachSale[]>([]);
  const [message, setMessage] = useState("");
  const [coachRange, setCoachRange] = useState<"TODAY" | "LAST_7" | "MONTH">("TODAY");
  const [focusCrm, setFocusCrm] = useState(true);

  const report = useMemo(() => {
    const selectedSales = sales.filter((sale) => {
      const d = new Date(sale.createdAt);
      return d.getMonth() === Number(month) && d.getFullYear() === Number(year);
    });

    const previousMonth = Number(month) === 0 ? 11 : Number(month) - 1;
    const previousYear = Number(month) === 0 ? Number(year) - 1 : Number(year);

    const previousSales = sales.filter((sale) => {
      const d = new Date(sale.createdAt);
      return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
    });

    const calcRevenueSplit = (rows: SaleRow[]) => {
      return rows.reduce(
        (acc, sale) => {
          const items = sale.items || [];
          const itemsGross = items.reduce(
            (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
            0,
          );

          const factor = itemsGross > 0 ? Number(sale.total || 0) / itemsGross : 1;

          const servicesGross = items
            .filter((item) => item.type !== "product")
            .reduce(
              (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1) * factor,
              0,
            );

          const resaleGross = items
            .filter((item) => item.type === "product")
            .reduce(
              (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1) * factor,
              0,
            );

          const technicalCost = items.reduce(
            (sum, item) =>
              sum +
              Number(item.technicalCost ?? item.cost ?? 0) *
                Number(item.quantity || 1),
            0,
          );

          const laborCost = items.reduce(
            (sum, item) =>
              sum + Number(item.laborCost || 0) * Number(item.quantity || 1),
            0,
          );

          acc.services += servicesGross;
          acc.resale += resaleGross;
          acc.technicalCost += technicalCost;
          acc.laborCost += laborCost;
          acc.total += Number(sale.total || 0);

          const method = String(sale.paymentMethod || "").toLowerCase();
          if (method === "card" || method === "mixed") {
            acc.posBase += Number(sale.total || 0);
            acc.posSales += 1;
          }

          return acc;
        },
        { services: 0, resale: 0, technicalCost: 0, laborCost: 0, total: 0, posBase: 0, posSales: 0 },
      );
    };

    const current = calcRevenueSplit(selectedSales);
    const previous = calcRevenueSplit(previousSales);

    const ivaServiziValue = Number(String(ivaServizi || 0).replace(",", "."));
    const ivaRivenditaValue = Number(String(ivaRivendita || 0).replace(",", "."));
    const feePosPercentValue = Number(String(feePos || 0).replace(",", "."));
    const feePosFixedValue = Number(String(feePosFisso || 0).replace(",", "."));
    const overheadValue = Number(String(overhead || 0).replace(",", "."));
    const taxReserveValue = Number(String(riservaTasse || 0).replace(",", "."));

    const fatturatoLordo = current.total;

    const ivaServiziStimata =
      ivaServiziValue > 0
        ? current.services - current.services / (1 + ivaServiziValue / 100)
        : 0;

    const ivaRivenditaStimata =
      ivaRivenditaValue > 0
        ? current.resale - current.resale / (1 + ivaRivenditaValue / 100)
        : 0;

    const iva = ivaServiziStimata + ivaRivenditaStimata;
    const netto = fatturatoLordo - iva;

    const commissioni =
      current.posBase * (feePosPercentValue / 100) + current.posSales * feePosFixedValue;

    const costoPersonale = current.laborCost;
    const costoProdotti = current.technicalCost;

    const costiFissi =
      fixedCosts.length > 0
        ? fixedCosts.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : 0;

    const overheadVariabile = netto * (overheadValue / 100);

    const utileOperativo =
      netto - commissioni - costoPersonale - costoProdotti - costiFissi - overheadVariabile;

    const riserva = Math.max(0, utileOperativo * (taxReserveValue / 100));
    const utileReale = utileOperativo - riserva;

    const fishMedio = selectedSales.length > 0 ? fatturatoLordo / selectedSales.length : 0;

    const crescita =
      previous.total > 0
        ? ((fatturatoLordo - previous.total) / previous.total) * 100
        : fatturatoLordo > 0
          ? 100
          : 0;

    return {
      fatturatoLordo,
      servizi: current.services,
      rivendita: current.resale,
      iva,
      netto,
      commissioni,
      costoPersonale,
      costoProdotti,
      costiFissi,
      overheadVariabile,
      utileOperativo,
      riserva,
      utileReale,
      fishMedio,
      crescita,
      vendite: selectedSales.length,
    };
  }, [
    sales,
    month,
    year,
    ivaServizi,
    ivaRivendita,
    feePos,
    feePosFisso,
    overhead,
    riservaTasse,
    fixedCosts,
  ]);

  const parsedFishBase = Number(String(fishBase || 0).replace(",", "."));
  const parsedClientiPrevisti = Number(String(clientiPrevisti || 0).replace(",", "."));

  const effectiveFishBase =
    parsedFishBase > 0 ? parsedFishBase : Number(report.fishMedio || 0);

  const effectiveClientiPrevisti =
    parsedClientiPrevisti > 0 ? parsedClientiPrevisti : Number(report.vendite || 0);

  const baseline = effectiveFishBase * effectiveClientiPrevisti;
  const multiplier = objective.includes("+20") ? 1.2 : objective.includes("+30") ? 1.3 : 1.1;
  const target = baseline * multiplier;


  const todayKey = new Date().toISOString().slice(0, 10);

  const coachReportData = useMemo(() => {
    const now = new Date();

    const inRangeAppointments = appointments.filter((appointment) => {
      const date = new Date(appointment.date);
      const key = date.toISOString().slice(0, 10);

      if (coachRange === "TODAY") {
        return key === todayKey;
      }

      if (coachRange === "LAST_7") {
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        return date >= from && date <= now;
      }

      return date.getMonth() === month && date.getFullYear() === year;
    });

    const serviceText = inRangeAppointments
      .map((appointment) => appointment.note || "")
      .join(" ")
      .toLowerCase();

    const colorClients = inRangeAppointments.filter((appointment) => {
      const text = String(appointment.note || "").toLowerCase();
      return (
        text.includes("colore") ||
        text.includes("gloss") ||
        text.includes("tonalizzante") ||
        text.includes("meches") ||
        text.includes("balayage")
      );
    }).length;

    const piegaClients = inRangeAppointments.filter((appointment) => {
      const text = String(appointment.note || "").toLowerCase();
      return text.includes("piega") || text.includes("styling");
    }).length;

    const repairClients = inRangeAppointments.filter((appointment) => {
      const text = String(appointment.note || "").toLowerCase();
      return text.includes("plex") || text.includes("repair") || text.includes("ricostruzione");
    }).length;

    const rangeSales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      const key = date.toISOString().slice(0, 10);

      if (coachRange === "TODAY") {
        return key === todayKey;
      }

      if (coachRange === "LAST_7") {
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        return date >= from && date <= now;
      }

      return date.getMonth() === month && date.getFullYear() === year;
    });

    const revenue = rangeSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const fish = rangeSales.length > 0 ? revenue / rangeSales.length : effectiveFishBase;
    const expectedExtra =
      coachRange === "TODAY" ? Math.max(0, target - baseline) : Math.max(0, revenue * 0.1);

    const actions: string[] = [];

    if (colorClients > 0) {
      actions.push(`${colorClients} clienti colore: proponi trattamento/Plex + mantenimento colore.`);
    }

    if (piegaClients > 0) {
      actions.push(`${piegaClients} clienti piega/styling: proponi termoprotettore o finish.`);
    }

    if (repairClients > 0) {
      actions.push(`${repairClients} clienti repair: proponi mantenimento ricostruzione.`);
    }

    if (inRangeAppointments.length > 0) {
      actions.push(`${inRangeAppointments.length} clienti: chiedi sempre il prossimo appuntamento prima dell’uscita.`);
    }

    if (actions.length === 0) {
      actions.push("Nessun appuntamento nel periodo: usa la giornata per richiamare clienti dormienti e proporre prebooking.");
    }

    return {
      appointmentsCount: inRangeAppointments.length,
      revenue,
      fish,
      expectedExtra,
      colorClients,
      piegaClients,
      repairClients,
      actions,
    };
  }, [appointments, sales, coachRange, todayKey, month, year, effectiveFishBase, target, baseline]);

  const coachRangeLabel =
    coachRange === "TODAY"
      ? "oggi"
      : coachRange === "LAST_7"
        ? "negli ultimi 7 giorni"
        : "nel mese selezionato";

  function resetMorningBrief() {
    setFishBase("");
    setClientiPrevisti("");
    setObjective("+10%");
  }

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const key = new Date(appointment.date).toISOString().slice(0, 10);
        return key === todayKey;
      })
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [appointments, todayKey]);

  function printPrebookingList() {
    const esc = (value: any) =>
      String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    const labelStatus = (status: PrebookingStatus) => {
      if (status === "PRENOTATO") return "Prenotato";
      if (status === "DA_RICHIAMARE") return "Da richiamare WhatsApp";
      if (status === "NON_INTERESSATA") return "Non interessata";
      return "Non proposto";
    };

    const rows = todayAppointments
      .map((appointment, index) => {
        const client = appointment.clientTenant?.clientGlobal?.name || "Cliente";
        const phone = appointment.clientTenant?.clientGlobal?.phone || "";
        const time = new Date(appointment.date).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const service = appointment.note || "Appuntamento";
        const staffName = appointment.staff?.name || "";
        const action = suggestedActionForAppointment(appointment);
        const status = prebookingStatus[appointment.id] || "NON_PROPOSTO";
        const note = prebookingNotes[appointment.id] || "";

        return `
          <div class="client-card">
            <div class="client-head">
              <div>
                <div class="client-index">${index + 1}. ${esc(time)} · ${esc(client)}</div>
                <div class="muted">
                  ${phone ? `WhatsApp: ${esc(phone)} · ` : ""}
                  ${staffName ? `Operatore: ${esc(staffName)}` : ""}
                </div>
              </div>
              <div class="badge">${esc(labelStatus(status))}</div>
            </div>

            <div class="service">Servizio: <strong>${esc(service)}</strong></div>

            <div class="grid">
              <div>
                <span>Prebooking consigliato</span>
                <strong>${esc(action.next)}</strong>
              </div>
              <div>
                <span>Extra da proporre</span>
                <strong>${esc(action.extra)}</strong>
              </div>
              <div>
                <span>Prodotto consigliato</span>
                <strong>${esc(action.product)}</strong>
              </div>
            </div>

            <div class="phrase">
              “${esc(action.phrase)}”
            </div>

            <div class="outcome">
              <strong>Esito fine giornata:</strong> ${esc(labelStatus(status))}
            </div>

            ${
              note
                ? `<div class="note"><strong>Note:</strong> ${esc(note)}</div>`
                : `<div class="note empty"><strong>Note:</strong> ________________________________</div>`
            }

            <div class="checkline">
              ☐ Prenotato &nbsp;&nbsp; ☐ Da richiamare WhatsApp &nbsp;&nbsp; ☐ Non interessata &nbsp;&nbsp; ☐ Non proposto
            </div>
          </div>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Controllo prebooking giornata</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #171717;
              line-height: 1.45;
            }
            h1 {
              margin: 0 0 6px;
              font-size: 28px;
            }
            .subtitle {
              color: #555;
              margin-bottom: 22px;
              font-size: 14px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .summary div {
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 12px;
              background: #fafafa;
            }
            .summary span {
              display: block;
              color: #666;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .summary strong {
              font-size: 18px;
            }
            .client-card {
              border: 1px solid #ddd;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 14px;
              break-inside: avoid;
            }
            .client-head {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            .client-index {
              font-size: 18px;
              font-weight: 800;
            }
            .muted {
              color: #666;
              font-size: 13px;
              margin-top: 3px;
            }
            .badge {
              border: 1px solid #999;
              border-radius: 999px;
              padding: 5px 10px;
              font-size: 12px;
              font-weight: 800;
              white-space: nowrap;
            }
            .service {
              margin: 10px 0;
              padding: 10px;
              background: #f6f6f6;
              border-radius: 10px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin: 12px 0;
            }
            .grid div {
              border: 1px solid #eee;
              border-radius: 12px;
              padding: 10px;
            }
            .grid span {
              display: block;
              color: #777;
              font-size: 11px;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .phrase {
              border-left: 4px solid #111;
              padding: 10px 12px;
              background: #fafafa;
              font-weight: 700;
              margin-top: 10px;
            }
            .outcome {
              margin-top: 12px;
              padding: 10px;
              background: #f1f5f9;
              border-radius: 10px;
              font-size: 14px;
            }
            .note {
              margin-top: 10px;
              padding: 10px;
              border: 1px dashed #bbb;
              border-radius: 10px;
              font-size: 14px;
            }
            .note.empty {
              color: #777;
            }
            .checkline {
              margin-top: 12px;
              font-weight: 800;
              font-size: 13px;
            }
            @media print {
              body { padding: 18px; }
              .client-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Controllo prebooking giornata</h1>
          <div class="subtitle">Data: ${esc(new Date().toLocaleDateString("it-IT"))}</div>

          <div class="summary">
            <div><span>Clienti oggi</span><strong>${todayAppointments.length}</strong></div>
            <div><span>Prenotati</span><strong>${prebookingDone}</strong></div>
            <div><span>Da richiamare</span><strong>${prebookingToCall}</strong></div>
            <div><span>Non proposti</span><strong>${prebookingNotProposed}</strong></div>
            <div><span>Tasso</span><strong>${prebookingRate}%</strong></div>
          </div>

          ${
            rows ||
            '<div class="client-card"><strong>Nessun appuntamento previsto oggi.</strong></div>'
          }

          <script>window.print();</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function loadCoachData() {
    try {
      const [settings, costs, appointmentsData, salesData, prebookingData] = await Promise.all([
        apiFetch("/coach/settings"),
        apiFetch("/coach/fixed-costs"),
        apiFetch("/appointments"),
        apiFetch("/sales"),
        apiFetch(`/coach/prebooking?dateKey=${new Date().toISOString().slice(0, 10)}`),
      ]);

      setIvaServizi(String(settings.vatServicesPercent ?? 22));
      setIvaRivendita(String(settings.vatResalePercent ?? 22));
      setOreProd(String(settings.productiveHoursMonth ?? 140));
      setFeePos(String(settings.posFeePercent ?? 1.5));
      setFeePosFisso(String(settings.posFixedFee ?? 0));
      setOverhead(String(settings.variableOverheadPercent ?? 3));
      setRiservaTasse(String(settings.taxReservePercent ?? 25));
      setGrigliaAgenda(String(settings.agendaGridMinutes ?? 5));
      setDomain(String(settings.allowedDomains || "app.acquavivastrategic.it"));
      setCardCostIncluded(Boolean(settings.cardGiftKitInCost));

      setFixedCosts(Array.isArray(costs) ? costs : []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setSales(Array.isArray(salesData) ? salesData : []);

      const statuses: Record<string, PrebookingStatus> = {};
      const notes: Record<string, string> = {};

      if (Array.isArray(prebookingData)) {
        prebookingData.forEach((item: any) => {
          statuses[item.appointmentId] = item.status || "NON_PROPOSTO";
          notes[item.appointmentId] = item.note || "";
        });
      }

      setPrebookingStatus(statuses);
      setPrebookingNotes(notes);
    } catch (error: any) {
      setMessage(error.message || "Errore caricamento Dashboard Coach");
      setFixedCosts([]);
    }
  }

  async function saveCoachSettings() {
    try {
      await apiFetch("/coach/settings", {
        method: "PATCH",
        body: JSON.stringify({
          vatServicesPercent: ivaServizi,
          vatResalePercent: ivaRivendita,
          productiveHoursMonth: oreProd,
          posFeePercent: feePos,
          posFixedFee: feePosFisso,
          variableOverheadPercent: overhead,
          taxReservePercent: riservaTasse,

        }),
      });

      setMessage("✅ Impostazioni profitto reale salvate.");
    } catch (error: any) {
      setMessage(error.message || "Errore salvataggio impostazioni");
    }
  }

  useEffect(() => {
    loadCoachData();

    const timer = setInterval(loadCoachData, 30000);
    return () => clearInterval(timer);
  }, []);

  async function addFixedCost() {
    if (!costName.trim()) return;

    try {
      const created = await apiFetch("/coach/fixed-costs", {
        method: "POST",
        body: JSON.stringify({
          name: costName.trim().toUpperCase(),
          amount: Number(String(costAmount || 0).replace(",", ".")),
        }),
      });

      setFixedCosts((prev) => [...prev, created]);
      setCostName("");
      setCostAmount("");
      setMessage("✅ Costo fisso aggiunto.");
    } catch (error: any) {
      setMessage(error.message || "Errore aggiunta costo fisso");
    }
  }

  function updateFixedCost(id: string, field: "name" | "amount", value: string) {
    setFixedCosts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "amount" ? Number(String(value || 0).replace(",", ".")) : value.toUpperCase(),
            }
          : item,
      ),
    );
  }

  async function saveFixedCost(item: FixedCost) {
    try {
      const updated = await apiFetch(`/coach/fixed-costs/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: item.name,
          amount: item.amount,
        }),
      });

      setFixedCosts((prev) =>
        prev.map((cost) => (cost.id === item.id ? updated : cost)),
      );

      setMessage("✅ Costo fisso salvato.");
    } catch (error: any) {
      setMessage(error.message || "Errore salvataggio costo fisso");
      await loadCoachData();
    }
  }


  function suggestedActionForAppointment(appointment: CoachAppointment) {
    const service = String(appointment.note || "").toLowerCase();

    if (service.includes("colore") || service.includes("gloss") || service.includes("tonalizzante") || service.includes("meches") || service.includes("balayage")) {
      return {
        next: "Riprenota tra 30/45 giorni",
        extra: "Proponi trattamento colore o Plex",
        product: "Proponi shampoo/mask mantenimento colore",
        phrase: "Ti blocco già il prossimo appuntamento colore, così manteniamo il risultato bello e non rischi di trovare tutto pieno.",
      };
    }

    if (service.includes("piega") || service.includes("styling")) {
      return {
        next: "Riprenota tra 10/15 giorni",
        extra: "Proponi finish o trattamento express",
        product: "Proponi termoprotettore o prodotto styling",
        phrase: "Ti preparo già la prossima piega, così resti sempre in ordine e non devi pensarci all’ultimo.",
      };
    }

    if (service.includes("ricostruzione") || service.includes("plex") || service.includes("repair")) {
      return {
        next: "Riprenota controllo tra 30 giorni",
        extra: "Proponi mantenimento ricostruzione",
        product: "Proponi maschera repair a casa",
        phrase: "Ti fisso già il controllo, così continuiamo il percorso e manteniamo il capello forte nel tempo.",
      };
    }

    return {
      next: "Riprenota tra 30 giorni",
      extra: "Proponi trattamento adatto al servizio",
      product: "Proponi prodotto mantenimento a casa",
      phrase: "Ti preparo già il prossimo appuntamento, così manteniamo il risultato e sei tranquilla per le prossime settimane.",
    };
  }

  function copyPrebookingPhrase(appointment: CoachAppointment) {
    const client = appointment.clientTenant?.clientGlobal?.name || "cliente";
    const action = suggestedActionForAppointment(appointment);
    navigator.clipboard.writeText(`${client}, ${action.phrase}`);
    setMessage("✅ Frase prebooking copiata.");
  }

  async function setPrebookingResult(appointment: CoachAppointment, status: PrebookingStatus) {
    const appointmentId = appointment.id;
    const clientName = appointment.clientTenant?.clientGlobal?.name || "Cliente";
    const clientPhone = appointment.clientTenant?.clientGlobal?.phone || "";
    const serviceName = appointment.note || "Appuntamento";
    const note = prebookingNotes[appointmentId] || "";

    setPrebookingStatus((prev) => ({
      ...prev,
      [appointmentId]: status,
    }));

    try {
      await apiFetch(`/coach/prebooking/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({
          dateKey: new Date(appointment.date).toISOString().slice(0, 10),
          clientName,
          clientPhone,
          serviceName,
          status,
          note,
        }),
      });

      setMessage("✅ Esito prebooking salvato.");
    } catch (error: any) {
      setMessage(error.message || "Errore salvataggio prebooking");
      await loadCoachData();
    }
  }

  const prebookingDone = todayAppointments.filter(
    (appointment) => prebookingStatus[appointment.id] === "PRENOTATO",
  ).length;

  const prebookingRejected = todayAppointments.filter(
    (appointment) => prebookingStatus[appointment.id] === "NON_INTERESSATA",
  ).length;

  const prebookingToCall = todayAppointments.filter(
    (appointment) => prebookingStatus[appointment.id] === "DA_RICHIAMARE",
  ).length;

  const prebookingNotProposed = todayAppointments.filter(
    (appointment) => (prebookingStatus[appointment.id] || "NON_PROPOSTO") === "NON_PROPOSTO",
  ).length;

  const prebookingRate =
    todayAppointments.length > 0 ? Math.round((prebookingDone / todayAppointments.length) * 100) : 0;

  async function removeCost(id: string) {
    try {
      await apiFetch(`/coach/fixed-costs/${id}`, {
        method: "DELETE",
      });

      setFixedCosts((prev) => prev.filter((item) => item.id !== id));
      setMessage("✅ Costo fisso eliminato.");
    } catch (error: any) {
      setMessage(error.message || "Errore eliminazione costo fisso");
    }
  }

  return (
    <main className="sp-page">
      <div className="sp-shell" style={{ maxWidth: 1580 }}>
        <header style={pageHeader}>
          <div>
            <p style={eyebrow}>Dashboard Coach</p>
            <h1 className="sp-title">Controllo profitto reale</h1>
            <p className="sp-muted" style={{ marginTop: 8 }}>
              Numeri, margine, fiscalità, obiettivi e azioni giornaliere per il salone.
            </p>
          </div>
        </header>

        {message ? <div style={messageBox}>{message}</div> : null}

        <section style={statsGrid}>
          <StatCard label="Fatturato lordo" value={euro(report.fatturatoLordo)} />
          <StatCard label="Netto IVA" value={euro(report.netto)} />
          <StatCard label="Costi fissi" value={euro(report.costiFissi)} />
          <StatCard label="Utile reale" value={euro(report.utileReale)} danger={report.utileReale < 0} />
        </section>

        <section style={card}>
          <SectionTitle title="DASHBOARD STRATEGICA" />

          <div style={twoGrid}>
            <select style={input} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <select style={input} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div style={summaryBox}>
            <Metric label="Fatturato Lordo" value={euro(report.fatturatoLordo)} />
            <Metric label="Servizi" value={euro(report.servizi)} />
            <Metric label="Rivendita" value={euro(report.rivendita)} />
            <Metric label="Vendite registrate" value={String(report.vendite)} />
            <Metric label="IVA stimata" value={euro(report.iva)} />
            <Metric label="Fatturato Netto IVA" value={euro(report.netto)} />
            <Metric label="Commissioni POS" value={euro(report.commissioni)} />
            <Metric label="Costo personale mese" value={euro(report.costoPersonale)} />
            <Metric label="Costo prodotti mese" value={euro(report.costoProdotti)} />
            <Metric label="Costi fissi" value={euro(report.costiFissi)} />
            <Metric label="Utile operativo" value={euro(report.utileOperativo)} />
            <Metric label="Riserva tasse" value={euro(report.riserva)} />
            <Metric label="UTILE REALE" value={euro(report.utileReale)} highlight />
            <Metric label="Fish Media" value={euro(report.fishMedio)} />
            <Metric label="Crescita" value={report.crescita > 0 ? `+${report.crescita.toFixed(1)}%` : `${report.crescita.toFixed(1)}%`} />
          </div>
        </section>

        <section style={coachSection}>
          <p style={quote}>"IL REPORT TI DICE COSA FARE OGGI"</p>
          <SectionTitle title="REPORT OPERATIVO" />

          <div style={reportToolbar}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                style={coachRange === "TODAY" ? primaryButton : smallButton}
                onClick={() => setCoachRange("TODAY")}
              >
                OGGI
              </button>
              <button
                style={coachRange === "LAST_7" ? primaryButton : smallButton}
                onClick={() => setCoachRange("LAST_7")}
              >
                ULTIMI 7 GIORNI
              </button>
              <button
                style={coachRange === "MONTH" ? primaryButton : smallButton}
                onClick={() => setCoachRange("MONTH")}
              >
                MESE SELEZIONATO
              </button>
            </div>

            <label style={checkLabel}>
              <input
                type="checkbox"
                checked={focusCrm}
                onChange={(e) => setFocusCrm(e.target.checked)}
              />{" "}
              Focus clienti CRM + WhatsApp
            </label>
          </div>

          <div style={reportCardsGrid}>
            <div style={briefStat}>
              <span>Clienti {coachRangeLabel}</span>
              <strong>{coachReportData.appointmentsCount}</strong>
            </div>
            <div style={briefStat}>
              <span>Incasso periodo</span>
              <strong>{euro(coachReportData.revenue)}</strong>
            </div>
            <div style={briefStat}>
              <span>Fish medio</span>
              <strong>{euro(coachReportData.fish)}</strong>
            </div>
            <div style={briefStat}>
              <span>Extra consigliato</span>
              <strong>{euro(coachReportData.expectedExtra)}</strong>
            </div>
          </div>

          <div style={coachBox}>
            <strong>Piano operativo {coachRangeLabel}</strong>
            <ul style={{ marginBottom: 0 }}>
              {coachReportData.actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
              {focusCrm ? (
                <li>Usa WhatsApp per confermare prebooking e recuperare clienti senza appuntamento.</li>
              ) : null}
            </ul>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="REPORT FISCALE / NON FISCALE" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={smallButton}>ESPORTA CSV — FISCALE</button>
            <button style={smallButton}>ESPORTA CSV — NON FISCALE</button>
            <button style={smallButton}>ESPORTA CSV — TUTTO</button>
          </div>
        </section>

        <section style={coachSection}>
          <p style={quote}>"LA MATTINA DECIDE IL FATTURATO"</p>
          <SectionTitle title="BRIEF OPERATIVO DEL GIORNO" />

          <div style={briefStatsGrid}>
            <div style={briefStat}>
              <span>Clienti oggi</span>
              <strong>{todayAppointments.length}</strong>
            </div>

            <div style={briefStat}>
              <span>Fish medio mese</span>
              <strong>{euro(effectiveFishBase)}</strong>
            </div>

            <div style={briefStat}>
              <span>Target oggi</span>
              <strong>{euro(target)}</strong>
            </div>

            <div style={briefStat}>
              <span>Extra da fare</span>
              <strong>{euro(Math.max(0, target - baseline))}</strong>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={label}>
              Obiettivo del giorno
              <select style={input} value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option value="+10%">Tranquillo +10%</option>
                <option value="+20%">Spinta +20%</option>
                <option value="+30%">Forte +30%</option>
              </select>
            </label>
          </div>

          <div style={briefPlanBox}>
            <strong>Piano semplice di oggi</strong>
            <ul style={{ marginBottom: 0 }}>
              <li>A ogni cliente proponi il prossimo appuntamento prima che esca.</li>
              <li>A ogni colore proponi trattamento/Plex o mantenimento colore.</li>
              <li>A ogni piega proponi prodotto styling o termoprotettore.</li>
            </ul>
          </div>

          <div style={prebookingHeader}>
            <div>
              <h3 style={{ margin: 0, color: "#d4af37" }}>Lista clienti da riprenotare</h3>
              <p className="sp-muted" style={{ marginTop: 6 }}>
                Prenotati: {prebookingDone}/{todayAppointments.length} · Tasso: {prebookingRate}%
                {prebookingToCall ? ` · Da richiamare: ${prebookingToCall}` : ""}
                {prebookingRejected ? ` · Non interessate: ${prebookingRejected}` : ""}
                {prebookingNotProposed ? ` · Non proposti: ${prebookingNotProposed}` : ""}
              </p>
            </div>

            <button style={smallButton} onClick={printPrebookingList}>
              STAMPA LISTA
            </button>
          </div>

          <div style={prebookingBox}>
            {todayAppointments.length === 0 ? (
              <div style={emptyBox}>Nessun appuntamento previsto oggi.</div>
            ) : (
              todayAppointments.map((appointment) => {
                const action = suggestedActionForAppointment(appointment);
                const status = prebookingStatus[appointment.id] || "NON_PROPOSTO";

                return (
                  <div key={appointment.id} style={prebookingClientCard}>
                    <div style={prebookingTopRow}>
                      <div>
                        <strong style={{ color: "#fff" }}>
                          {new Date(appointment.date).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {appointment.clientTenant?.clientGlobal?.name || "Cliente"}
                        </strong>
                        <div className="sp-muted" style={{ marginTop: 4 }}>
                          {appointment.note || "Appuntamento"}
                        </div>
                      </div>

                      <Tag>
                        {status === "PRENOTATO"
                          ? "Prenotato"
                          : status === "DA_RICHIAMARE"
                            ? "Da richiamare"
                            : status === "NON_INTERESSATA"
                              ? "Non interessata"
                              : "Non proposto"}
                      </Tag>
                    </div>

                    <div style={actionGrid}>
                      <div>
                        <span style={miniLabel}>Prossimo passo</span>
                        <strong>{action.next}</strong>
                      </div>
                      <div>
                        <span style={miniLabel}>Extra</span>
                        <strong>{action.extra}</strong>
                      </div>
                      <div>
                        <span style={miniLabel}>Prodotto</span>
                        <strong>{action.product}</strong>
                      </div>
                    </div>

                    <div style={phraseBox}>“{action.phrase}”</div>

                    <input
                      style={input}
                      placeholder="Note fine giornata: es. preferisce sabato mattina"
                      value={prebookingNotes[appointment.id] || ""}
                      onChange={(e) =>
                        setPrebookingNotes((prev) => ({
                          ...prev,
                          [appointment.id]: e.target.value,
                        }))
                      }
                    />

                    <div style={buttonRow}>
                      <button style={primaryMini} onClick={() => copyPrebookingPhrase(appointment)}>
                        Copia frase
                      </button>
                      <button style={smallButton} onClick={() => setPrebookingResult(appointment, "PRENOTATO")}>
                        Prenotato
                      </button>
                      <button style={smallButton} onClick={() => setPrebookingResult(appointment, "DA_RICHIAMARE")}>
                        Da richiamare WhatsApp
                      </button>
                      <button style={deleteButton} onClick={() => setPrebookingResult(appointment, "NON_INTERESSATA")}>
                        Non interessata
                      </button>
                      <button style={primaryMini} onClick={() => setPrebookingResult(appointment, "NON_PROPOSTO")}>
                        Non proposto
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <button style={primaryMini} onClick={resetMorningBrief}>
              RESET BRIEF
            </button>
          </div>
        </section>

        <section style={card}>
          <SectionTitle title="IMPOSTAZIONI PROFITTO REALE" />

          <div style={threeGrid}>
            <Field label="IVA Servizi %" value={ivaServizi} setValue={setIvaServizi} />
            <Field label="IVA Rivendita %" value={ivaRivendita} setValue={setIvaRivendita} />
            <Field label="Ore produttive/mese" value={oreProd} setValue={setOreProd} />
            <Field label="Fee POS %" value={feePos} setValue={setFeePos} />
            <Field label="Fee POS fisso €" value={feePosFisso} setValue={setFeePosFisso} />
            <Field label="Overhead variabile %" value={overhead} setValue={setOverhead} />
            <Field label="Riserva tasse %" value={riservaTasse} setValue={setRiservaTasse} />

          </div>

          <div style={infoBox}>
            Qui lasciamo solo le leve economiche che incidono sul profitto reale:
            IVA, POS, overhead, riserva tasse, ore produttive e costi fissi mensili.
            Agenda, domini e impostazioni tecniche card verranno gestiti nelle sezioni dedicate.
          </div>

          <button style={primaryMini} onClick={saveCoachSettings}>
            SALVA IMPOSTAZIONI PROFITTO
          </button>
        </section>

        <section style={card}>
          <SectionTitle title="COSTI FISSI MENSILI" />

          <div style={twoGrid}>
            <input
              style={input}
              placeholder="Nome costo"
              value={costName}
              onChange={(e) => setCostName(e.target.value)}
            />

            <input
              style={input}
              placeholder="€ al mese"
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
            />
          </div>

          <button style={primaryButtonFull} onClick={addFixedCost}>
            AGGIUNGI COSTO
          </button>

          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <Th>Voce</Th>
                  <Th>€/mese</Th>
                  <Th>Azioni</Th>
                </tr>
              </thead>
              <tbody>
                {fixedCosts.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <input
                        style={tableInput}
                        value={item.name}
                        onChange={(e) => updateFixedCost(item.id, "name", e.target.value)}
                      />
                    </Td>

                    <Td>
                      <input
                        style={tableInput}
                        value={String(item.amount || 0)}
                        onChange={(e) => updateFixedCost(item.id, "amount", e.target.value)}
                      />
                    </Td>
                    <Td>
                      <button style={primaryMini} onClick={() => saveFixedCost(item)}>
                        Salva
                      </button>{" "}
                      <button style={deleteButton} onClick={() => removeCost(item.id)}>
                        X
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 style={sectionTitle}>
      <span style={purpleLine}>|</span> {title}
    </h2>
  );
}

function Field(props: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label style={label}>
      {props.label}
      <input
        style={input}
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
      />
    </label>
  );
}

function StatCard({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div style={statCard}>
      <p>{label}</p>
      <strong style={{ color: danger ? "#fca5a5" : "#fff" }}>{value}</strong>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={metricRow}>
      <span>{label}</span>
      <strong style={{ color: highlight ? "#d4af37" : "#fff" }}>{value}</strong>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={th}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={td}>{children}</td>;
}

const pageHeader: React.CSSProperties = {
  marginBottom: 24,
};

const eyebrow: React.CSSProperties = {
  color: "#d4af37",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  margin: 0,
};

const infoBox: React.CSSProperties = {
  marginTop: 14,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#d7d7e7",
  fontWeight: 800,
  lineHeight: 1.45,
};

const messageBox: React.CSSProperties = {
  marginBottom: 18,
  padding: 16,
  borderRadius: 18,
  background: "rgba(139,92,246,0.14)",
  border: "1px solid rgba(139,92,246,0.32)",
  color: "#fff",
  fontWeight: 900,
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 22,
  padding: 20,
  background:
    "radial-gradient(circle at top right, rgba(212,175,55,0.16), transparent 38%), rgba(255,255,255,0.06)",
  color: "#fff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.24)",
  borderRadius: 26,
  padding: 24,
  marginBottom: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
  color: "#fff",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const coachSection: React.CSSProperties = {
  ...card,
  background:
    "radial-gradient(circle at top right, rgba(139,92,246,0.22), transparent 36%), rgba(255,255,255,0.055)",
};

const sectionTitle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 20,
  color: "#d4af37",
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: "uppercase",
};

const purpleLine: React.CSSProperties = {
  color: "#8b5cf6",
  fontWeight: 900,
  marginRight: 10,
};

const quote: React.CSSProperties = {
  color: "#a78bfa",
  fontWeight: 900,
  letterSpacing: 2,
  marginBottom: 8,
};


const reportCardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 18,
  marginBottom: 18,
};

const briefStatsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(160px, 1fr))",
  gap: 12,
};

const briefStat: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(212,175,55,0.18)",
  display: "grid",
  gap: 8,
};

const briefPlanBox: React.CSSProperties = {
  marginTop: 16,
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 800,
};

const prebookingHeader: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const prebookingClientCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  gap: 14,
};

const prebookingTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const actionGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(160px, 1fr))",
  gap: 10,
};

const miniLabel: React.CSSProperties = {
  display: "block",
  color: "#d4af37",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginBottom: 4,
};

const phraseBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(212,175,55,0.08)",
  border: "1px solid rgba(212,175,55,0.18)",
  color: "#fff",
  fontWeight: 900,
};

const buttonRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const emptyBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#d7d7e7",
  fontWeight: 800,
};

const prebookingBox: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gap: 8,
};

const prebookingRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px 1fr",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const tableInput: React.CSSProperties = {
  width: "100%",
  minWidth: 160,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(212,175,55,0.25)",
  background: "rgba(0,0,0,0.42)",
  color: "#fff",
  fontWeight: 800,
  outline: "none",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.28)",
  background: "rgba(0,0,0,0.48)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 15,
  outline: "none",
};

const label: React.CSSProperties = {
  color: "#fff",
  fontWeight: 900,
};

const twoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const threeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const summaryBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  borderRadius: 18,
  padding: 16,
  display: "grid",
  gap: 8,
};

const metricRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "#d7d7de",
  fontWeight: 800,
};

const reportToolbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const checkLabel: React.CSSProperties = {
  fontWeight: 900,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 14,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
};

const primaryButtonFull: React.CSSProperties = {
  width: "100%",
  margin: "14px 0 0",
  border: 0,
  borderRadius: 16,
  padding: "15px 20px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
};

const primaryMini: React.CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  color: "#fff",
  fontWeight: 900,
  marginTop: 10,
};

const smallButton: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,0.28)",
  borderRadius: 14,
  padding: "10px 16px",
  background: "rgba(212,175,55,0.10)",
  color: "#f5d76e",
  fontWeight: 900,
};

const coachBox: React.CSSProperties = {
  marginTop: 18,
  padding: 18,
  borderRadius: 18,
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  color: "#fff",
  fontWeight: 800,
  lineHeight: 1.5,
};

const morningBox: React.CSSProperties = {
  background: "rgba(0,0,0,0.34)",
  border: "1px solid rgba(212,175,55,0.20)",
  borderRadius: 18,
  padding: 18,
  marginTop: 10,
  color: "#fff",
  fontWeight: 800,
};

const tag: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.28)",
  color: "#f5d76e",
  borderRadius: 999,
  fontWeight: 900,
};

const hr: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid rgba(255,255,255,0.10)",
  margin: "12px 0",
};

const tableWrap: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  marginTop: 18,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
};

const table: React.CSSProperties = {
  width: "100%",
  minWidth: 900,
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#d4af37",
  fontWeight: 900,
  borderBottom: "1px solid rgba(212,175,55,0.18)",
  background: "rgba(0,0,0,0.35)",
};

const td: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
  color: "#fff",
};

const deleteButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  background: "linear-gradient(135deg,#ef4444,#dc2626)",
  color: "#fff",
  fontWeight: 900,
};