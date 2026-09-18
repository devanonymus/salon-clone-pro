"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "../components/AppIcon";
import { apiFetch } from "@/src/lib/api";
import styles from "./dashboard.module.css";

type ClientItem = {
  id: string;
  clientGlobal: { id: string; name: string; phone: string };
};

type AppointmentItem = {
  id: string;
  date: string;
  duration: number;
  note: string | null;
  sale?: { id: string } | null;
  staff?: { name: string; color?: string } | null;
  clientTenant: { clientGlobal: { name: string; phone: string } };
};

type SaleItem = {
  id: string;
  total: number;
  paymentMethod: string | null;
  fiscalStatus?: string;
  createdAt: string;
  clientGlobal: { name: string; phone: string };
  items?: {
    id: string;
    name: string;
    price: number;
    cost?: number;
    technicalCost?: number;
    laborCost?: number;
    quantity: number;
  }[];
};

type TrendDay = { key: string; label: string; value: number };

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const compactEuro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function sameDay(value: string, date: Date) {
  const item = new Date(value);
  return item.getDate() === date.getDate()
    && item.getMonth() === date.getMonth()
    && item.getFullYear() === date.getFullYear();
}

function sameMonth(value: string, date: Date) {
  const item = new Date(value);
  return item.getMonth() === date.getMonth() && item.getFullYear() === date.getFullYear();
}

export default function DashboardPage() {
  const [now] = useState(() => new Date());
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<ClientItem[]>("/clients"),
      apiFetch<AppointmentItem[]>("/appointments"),
      apiFetch<SaleItem[]>("/sales"),
    ])
      .then(([clientsData, appointmentsData, salesData]) => {
        if (!active) return;
        setClients(clientsData);
        setAppointments(appointmentsData);
        setSales(salesData);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Errore nel caricamento dei dati");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const salesToday = sales.filter((sale) => sameDay(sale.createdAt, now));
    const salesMonth = sales.filter((sale) => sameMonth(sale.createdAt, now));
    const salesPreviousMonth = sales.filter((sale) => sameMonth(sale.createdAt, previousMonth));
    const appointmentsMonth = appointments.filter((item) => sameMonth(item.date, now));
    const convertedMonth = appointmentsMonth.filter((item) => item.sale).length;
    const revenueToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);
    const revenueMonth = salesMonth.reduce((sum, sale) => sum + sale.total, 0);
    const previousRevenue = salesPreviousMonth.reduce((sum, sale) => sum + sale.total, 0);
    const trend = previousRevenue > 0 ? ((revenueMonth - previousRevenue) / previousRevenue) * 100 : null;
    const averageTicket = salesMonth.length > 0 ? revenueMonth / salesMonth.length : 0;
    const estimatedCosts = salesMonth.reduce((sum, sale) => sum + (sale.items || []).reduce(
      (itemSum, item) => itemSum + ((item.technicalCost ?? item.cost ?? 0) + (item.laborCost ?? 0)) * item.quantity,
      0,
    ), 0);

    return {
      revenueToday,
      revenueMonth,
      averageTicket,
      appointmentsToday: appointments.filter((item) => sameDay(item.date, now)).length,
      conversion: appointmentsMonth.length > 0 ? (convertedMonth / appointmentsMonth.length) * 100 : 0,
      pendingReceipts: sales.filter((sale) => sale.fiscalStatus !== "ISSUED").length,
      estimatedMargin: revenueMonth - estimatedCosts,
      trend,
      salesMonthCount: salesMonth.length,
    };
  }, [appointments, now, sales]);

  const trendDays = useMemo<TrendDay[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("it-IT", { weekday: "short" }).replace(".", ""),
        value: sales.filter((sale) => sameDay(sale.createdAt, date)).reduce((sum, sale) => sum + sale.total, 0),
      };
    });
  }, [now, sales]);

  const nextAppointments = useMemo(() => appointments
    .filter((item) => new Date(item.date).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5), [appointments, now]);

  const latestSales = useMemo(() => [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [sales]);

  const maxTrend = Math.max(...trendDays.map((item) => item.value), 1);
  const todayLabel = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="sp-page">
      <div className={`sp-shell ${styles.shell}`}>
        <header className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>Executive overview</span>
            <h1>Buongiorno, ecco il tuo salone.</h1>
            <p>{todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} · dati aggiornati in tempo reale</p>
          </div>
          <div className={styles.headingActions}>
            <span className={styles.period}><span /> Mese corrente</span>
            <Link className={styles.secondaryButton} href="/dashboardcoach">Analisi completa <AppIcon name="arrow" size={16} /></Link>
          </div>
        </header>

        {error ? (
          <div className={styles.error} role="alert">
            <div><strong>Dati non disponibili</strong><span>{error}</span></div>
            <button onClick={() => window.location.reload()} type="button">Riprova</button>
          </div>
        ) : null}

        <section aria-label="Indicatori principali" className={styles.kpiGrid}>
          <KpiCard
            detail={`${metrics.salesMonthCount} transazioni nel mese`}
            icon="cash"
            label="Fatturato del mese"
            trend={metrics.trend}
            value={euro.format(metrics.revenueMonth)}
          />
          <KpiCard
            detail={`${metrics.appointmentsToday} appuntamenti in agenda`}
            icon="trend"
            label="Incasso di oggi"
            value={euro.format(metrics.revenueToday)}
          />
          <KpiCard
            detail="Valore medio per cliente"
            icon="clients"
            label="Scontrino medio"
            value={euro.format(metrics.averageTicket)}
          />
          <KpiCard
            detail={`${clients.length} clienti attivi nel CRM`}
            icon="agenda"
            label="Conversione appuntamenti"
            value={`${metrics.conversion.toFixed(0)}%`}
          />
        </section>

        <section className={styles.mainGrid}>
          <article className={`${styles.panel} ${styles.revenuePanel}`}>
            <div className={styles.panelHeading}>
              <div>
                <span>Performance</span>
                <h2>Andamento ultimi 7 giorni</h2>
              </div>
              <strong>{compactEuro.format(trendDays.reduce((sum, item) => sum + item.value, 0))}</strong>
            </div>
            <div className={styles.chart}>
              {trendDays.map((item, index) => (
                <div className={styles.chartColumn} key={item.key}>
                  <div className={styles.barTrack}>
                    <span
                      aria-label={`${item.label}: ${euro.format(item.value)}`}
                      className={index === trendDays.length - 1 ? styles.todayBar : ""}
                      style={{ height: `${Math.max((item.value / maxTrend) * 100, item.value > 0 ? 8 : 2)}%` }}
                      title={`${item.label}: ${euro.format(item.value)}`}
                    />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
            <div className={styles.revenueFooter}>
              <div><span>Margine stimato</span><strong>{euro.format(metrics.estimatedMargin)}</strong></div>
              <div><span>Obiettivo operativo</span><strong>{metrics.conversion >= 70 ? "In linea" : "Da recuperare"}</strong></div>
              <Link href="/dashboardcoach">Apri controllo di gestione <AppIcon name="arrow" size={15} /></Link>
            </div>
          </article>

          <article className={`${styles.panel} ${styles.actionPanel}`}>
            <div className={styles.panelHeading}>
              <div><span>Action center</span><h2>Priorità di oggi</h2></div>
              <span className={styles.counter}>3 azioni</span>
            </div>
            <ActionItem
              href="/fiscale"
              icon="cash"
              status={metrics.pendingReceipts > 0 ? "warning" : "success"}
              text={metrics.pendingReceipts > 0 ? `${metrics.pendingReceipts} vendite richiedono verifica fiscale` : "Situazione fiscale aggiornata"}
              title="Controllo chiusure"
            />
            <ActionItem
              href="/agenda"
              icon="agenda"
              status={metrics.appointmentsToday > 0 ? "active" : "neutral"}
              text={`${metrics.appointmentsToday} appuntamenti previsti nella giornata`}
              title="Agenda operativa"
            />
            <ActionItem
              href="/marketing"
              icon="marketing"
              status={metrics.conversion < 60 ? "warning" : "success"}
              text={metrics.conversion < 60 ? "La conversione può crescere con un follow-up" : "Conversione mensile in buona salute"}
              title="Opportunità clienti"
            />
          </article>
        </section>

        <section className={styles.lowerGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Operatività</span><h2>Prossimi appuntamenti</h2></div>
              <Link className={styles.textLink} href="/agenda">Vedi agenda <AppIcon name="arrow" size={14} /></Link>
            </div>
            <div className={styles.appointmentList}>
              {nextAppointments.length === 0 ? <EmptyState text="Nessun appuntamento imminente." /> : nextAppointments.map((appointment) => {
                const date = new Date(appointment.date);
                return (
                  <div className={styles.appointmentRow} key={appointment.id}>
                    <div className={styles.timeBox}><strong>{date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</strong><small>{date.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</small></div>
                    <span className={styles.staffDot} style={{ background: appointment.staff?.color || "#d2a94d" }} />
                    <div className={styles.rowCopy}><strong>{appointment.clientTenant.clientGlobal.name}</strong><small>{appointment.note || "Servizio da definire"} · {appointment.duration} min</small></div>
                    <span className={appointment.sale ? styles.doneBadge : styles.scheduledBadge}>{appointment.sale ? "Chiuso" : appointment.staff?.name || "Da assegnare"}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Cassa</span><h2>Ultime vendite</h2></div>
              <Link className={styles.textLink} href="/vendite">Apri vendite <AppIcon name="arrow" size={14} /></Link>
            </div>
            <div className={styles.salesTable}>
              {latestSales.length === 0 ? <EmptyState text="Nessuna vendita registrata." /> : latestSales.map((sale) => (
                <div className={styles.saleRow} key={sale.id}>
                  <span className={styles.clientAvatar}>{sale.clientGlobal.name.slice(0, 2).toUpperCase()}</span>
                  <div className={styles.rowCopy}><strong>{sale.clientGlobal.name}</strong><small>{new Date(sale.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} · {paymentLabel(sale.paymentMethod)}</small></div>
                  <span className={sale.fiscalStatus === "ISSUED" ? styles.fiscalOk : styles.fiscalPending}>
                    {sale.fiscalStatus === "ISSUED" ? "Emesso" : sale.fiscalStatus === "DEMO_ISSUED" ? "Demo" : "Da verificare"}
                  </span>
                  <strong className={styles.saleValue}>{euro.format(sale.total)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={styles.quickActions}>
          <div><span>Azioni rapide</span><small>Le operazioni più frequenti</small></div>
          <QuickAction href="/agenda" icon="plus" label="Nuovo appuntamento" />
          <QuickAction href="/vendite" icon="cash" label="Apri cassa" />
          <QuickAction href="/clienti" icon="clients" label="Aggiungi cliente" />
          <QuickAction href="/magazzino" icon="package" label="Carico merce" />
        </section>
      </div>
    </main>
  );
}

function KpiCard({ label, value, detail, icon, trend }: { label: string; value: string; detail: string; icon: AppIconName; trend?: number | null }) {
  return (
    <article className={styles.kpiCard}>
      <div className={styles.kpiTop}><span>{label}</span><i><AppIcon name={icon} size={18} /></i></div>
      <strong>{value}</strong>
      <div className={styles.kpiDetail}>
        {trend !== undefined && trend !== null ? <span className={trend >= 0 ? styles.positive : styles.negative}>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span> : null}
        <small>{detail}</small>
      </div>
    </article>
  );
}

function ActionItem({ title, text, icon, status, href }: { title: string; text: string; icon: AppIconName; status: "warning" | "success" | "active" | "neutral"; href: string }) {
  return (
    <Link className={styles.actionItem} href={href === "/fiscale" ? "/vendite" : href}>
      <span className={`${styles.actionIcon} ${styles[status]}`}><AppIcon name={icon} size={18} /></span>
      <span><strong>{title}</strong><small>{text}</small></span>
      <AppIcon name="arrow" size={16} />
    </Link>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: AppIconName; label: string }) {
  return <Link href={href}><span><AppIcon name={icon} size={17} /></span>{label}<AppIcon name="arrow" size={14} /></Link>;
}

function EmptyState({ text }: { text: string }) {
  return <div className={styles.emptyState}>{text}</div>;
}

function DashboardSkeleton() {
  return (
    <main className="sp-page">
      <div className={`sp-shell ${styles.shell}`}>
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <div className={styles.kpiGrid}>{Array.from({ length: 4 }, (_, index) => <div className={`${styles.kpiCard} ${styles.skeleton}`} key={index} />)}</div>
        <div className={styles.mainGrid}><div className={`${styles.panel} ${styles.skeleton}`} /><div className={`${styles.panel} ${styles.skeleton}`} /></div>
      </div>
    </main>
  );
}

function paymentLabel(value?: string | null) {
  if (value === "card") return "Carta";
  if (value === "cash") return "Contanti";
  if (value === "mixed") return "Misto";
  if (value === "bank") return "Bonifico";
  return "Pagamento";
}
