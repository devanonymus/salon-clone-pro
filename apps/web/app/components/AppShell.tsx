"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import AppIcon, { type AppIconName } from "./AppIcon";
import LogoutButton from "./LogoutButton";
import WhatsappChatWidget from "./WhatsappChatWidget";
import styles from "./AppShell.module.css";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: AppIconName;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type StoredSession = {
  tenant?: { name?: string; code?: string };
  user?: { username?: string; role?: string };
};

const navigation: NavSection[] = [
  {
    label: "Panoramica",
    items: [
      { href: "/dashboard", label: "Dashboard", description: "Numeri e priorità", icon: "dashboard" },
      { href: "/agenda", label: "Agenda", description: "Appuntamenti e staff", icon: "agenda" },
    ],
  },
  {
    label: "Operazioni",
    items: [
      { href: "/vendite", label: "Cassa e vendite", description: "Checkout e incassi", icon: "cash" },
      { href: "/clienti", label: "Clienti", description: "CRM e storico", icon: "clients" },
      { href: "/magazzino", label: "Magazzino", description: "Scorte e marginalità", icon: "package" },
    ],
  },
  {
    label: "Crescita",
    items: [
      { href: "/marketing", label: "Marketing", description: "Card e campagne", icon: "marketing" },
      { href: "/ruota", label: "Loyalty", description: "Premi e fidelizzazione", icon: "wheel" },
      { href: "/team", label: "Team", description: "Persone e KPI", icon: "team" },
      { href: "/dashboardcoach", label: "Business coach", description: "Costi e performance", icon: "coach" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/chat", label: "WhatsApp", description: "Conversazioni clienti", icon: "chat" },
      { href: "/configurazione", label: "Configurazione", description: "Servizi e integrazioni", icon: "settings" },
    ],
  },
];

const pageMeta = navigation.flatMap((section) => section.items);

function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("salonpro-session", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("salonpro-session", callback);
  };
}

function getSessionSnapshot() {
  return window.localStorage.getItem("salonpro_session") || "";
}

function getServerSessionSnapshot() {
  return "";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const sessionRaw = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const session = useMemo<StoredSession>(() => {
    if (!sessionRaw) return {};
    try {
      return JSON.parse(sessionRaw) as StoredSession;
    } catch {
      return {};
    }
  }, [sessionRaw]);

  const currentPage = pageMeta.find((item) => pathname.startsWith(item.href));
  const filteredItems = query.trim()
    ? pageMeta.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  useEffect(() => {
    if (pathname !== "/login" && !window.localStorage.getItem("salonpro_token") && !window.localStorage.getItem("token")) {
      window.location.replace("/login");
      return;
    }

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const tenantName = session.tenant?.name || "Acquaviva Strategic";
  const tenantCode = session.tenant?.code || "TENDENZE";
  const username = session.user?.username || "Admin";
  const role = session.user?.role === "OWNER" ? "Titolare" : session.user?.role || "Operatore";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className={`${styles.shell} ${collapsed ? styles.isCollapsed : ""}`}>
      <button
        aria-label="Chiudi menu"
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMobileOpen(false)}
        type="button"
      />

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.brandRow}>
          <Link aria-label="Vai alla dashboard" className={styles.brand} href="/dashboard" onClick={() => setMobileOpen(false)}>
            <span className={styles.logoMark}>
              <Image
                alt=""
                className={styles.logoImage}
                height={1152}
                src="/salon-pro-logo-official.png"
                width={2048}
              />
            </span>
            <span className={styles.brandCopy}>
              <strong className={styles.brandWordmark}>
                <span>Salon</span><span>Pro</span>
              </strong>
              <small>Business Operating System</small>
            </span>
          </Link>
          <button
            aria-label="Chiudi menu"
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <AppIcon name="x" />
          </button>
        </div>

        <div className={styles.tenantCard}>
          <span className={styles.tenantMonogram}>{tenantName.slice(0, 1).toUpperCase()}</span>
          <span className={styles.tenantCopy}>
            <small>Workspace</small>
            <strong>{tenantName}</strong>
          </span>
          <span className={styles.liveDot} title="Sistema online" />
        </div>

        <nav aria-label="Navigazione principale" className={styles.navigation}>
          {navigation.map((section) => (
            <div className={styles.navSection} key={section.label}>
              <p className={styles.navSectionLabel}>{section.label}</p>
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                    href={item.href}
                    key={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}><AppIcon name={item.icon} /></span>
                    <span className={styles.navCopy}>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    {active ? <span className={styles.activeIndicator} /> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.profile}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.profileCopy}>
              <strong>{username}</strong>
              <small>{role}</small>
            </span>
            <LogoutButton compact={collapsed} />
          </div>
          <button
            aria-label={collapsed ? "Espandi menu" : "Comprimi menu"}
            className={styles.collapseButton}
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            <AppIcon className={collapsed ? styles.rotated : ""} name="arrow" size={17} />
            <span>Comprimi menu</span>
          </button>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarStart}>
            <button
              aria-label="Apri menu"
              className={styles.menuButton}
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <AppIcon name="menu" />
            </button>
            <div className={styles.pageIdentity}>
              <span>{currentPage?.label || "Salon Pro"}</span>
              <small>{tenantCode} · {role}</small>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <AppIcon className={styles.searchIcon} name="search" size={18} />
            <input
              aria-label="Cerca un modulo"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca moduli e funzioni…"
              ref={searchRef}
              value={query}
            />
            <kbd>⌘ K</kbd>
            {filteredItems.length > 0 ? (
              <div className={styles.searchResults}>
                {filteredItems.slice(0, 5).map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setQuery("")}>
                    <span><AppIcon name={item.icon} size={18} /></span>
                    <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    <AppIcon name="arrow" size={16} />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.topbarActions}>
            <span aria-label="Sistema operativo" className={styles.iconButton} role="status" title="Sistema operativo">
              <AppIcon name="bell" size={19} />
              <span className={styles.notificationDot} />
            </span>
            <Link className={styles.primaryAction} href="/agenda">
              <AppIcon name="plus" size={18} />
              <span>Nuovo appuntamento</span>
            </Link>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>

      <WhatsappChatWidget />
    </div>
  );
}
