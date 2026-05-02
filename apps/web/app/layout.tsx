import "./globals.css";
import Link from "next/link";
import WhatsappChatWidget from "./components/WhatsappChatWidget";

export const metadata = {
  title: "Salon Pro",
  description: "Premium salon management system",
};

const navItems = [
  { href: "/agenda", label: "AGENDA APPUNTAMENTI" },
  { href: "/vendite", label: "CASSA & CHECKOUT" },
  { href: "/clienti", label: "CRM STORICO CLIENTI" },
  { href: "/marketing", label: "MARKETING & CARD" },
  { href: "/ruota", label: "RUOTA DELLA FORTUNA" },
  { href: "/magazzino", label: "MAGAZZINO PROFITTO" },
  { href: "/team", label: "TEAM KPI" },
  { href: "/dashboardcoach", label: "DASHBOARD COACH" },
  { href: "/configurazione", label: "CONFIGURAZIONE" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <div className="app-root">
          <header className="sp-header">
            <div className="sp-header-top">
              <Link href="/agenda" className="sp-logo-wrap">
                <img
                  src="/salon-pro-logo.png"
                  alt="Salon Pro"
                  className="sp-logo"
                />
              </Link>

              <div className="sp-header-actions">
                <div className="sp-role-badge">
                  TENDENZE <span>| Titolare</span>
                </div>

                <button className="sp-change-button">CAMBIA SALONE</button>
              </div>
            </div>

            <nav className="sp-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="sp-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          {children}

          <WhatsappChatWidget />
        </div>
      </body>
    </html>
  );
}