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
        <div
          style={{
            minHeight: "100vh",
            borderTop: "4px solid #8b5cf6",
            background:
              "radial-gradient(circle at top left, rgba(139,92,246,0.18), transparent 32%), radial-gradient(circle at top right, rgba(212,175,55,0.12), transparent 30%), #050505",
          }}
        >
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              background: "rgba(5,5,5,0.82)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(212,175,55,0.18)",
            }}
          >
            <div
              style={{
                height: 82,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                padding: "0 clamp(14px, 2vw, 26px)",
              }}
            >
              <Link href="/dashboardcoach" style={{ display: "flex", alignItems: "center" }}>
                <img
                  src="/salon-pro-logo.png"
                  alt="Salon Pro"
                  style={{
                    width: 142,
                    maxWidth: "38vw",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </Link>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(212,175,55,0.22)",
                    fontWeight: 900,
                    color: "#d4af37",
                    fontSize: 13,
                  }}
                >
                  TENDENZE | Titolare
                </div>

                <button
                  style={{
                    padding: "11px 18px",
                    borderRadius: 999,
                    border: 0,
                    background: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  CAMBIA SALONE
                </button>
              </div>
            </div>

            <nav
              style={{
                display: "flex",
                gap: 10,
                overflowX: "auto",
                padding: "0 18px 14px",
                scrollbarWidth: "none",
              }}
            >
              {navItems.map((item) => (
                <Nav key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </header>

          {children}
        </div>

        <WhatsappChatWidget />
      </body>
    </html>
  );
}

function Nav({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        whiteSpace: "nowrap",
        padding: "13px 18px",
        borderRadius: 16,
        color: "#f4f4f5",
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.07)",
        fontSize: 12,
        fontWeight: 900,
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}