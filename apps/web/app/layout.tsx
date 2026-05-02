import './globals.css';
import Link from 'next/link';
import WhatsappChatWidget from './components/WhatsappChatWidget';

export const metadata = {
  title: 'Salon Pro',
  description: 'Premium salon management system',
};

const navItems = [
  { href: '/agenda', label: 'AGENDA APPUNTAMENTI' },
  { href: '/vendite', label: 'CASSA & CHECKOUT' },
  { href: '/clienti', label: 'CRM STORICO CLIENTI' },
  { href: '/marketing', label: 'MARKETING & CARD' },
  { href: '/ruota', label: 'RUOTA DELLA FORTUNA' },
  { href: '/magazzino', label: 'MAGAZZINO PROFITTO' },
  { href: '/team', label: 'TEAM KPI' },
  { href: '/dashboard', label: 'DASHBOARD COACH' },
  { href: '/configurazione', label: 'CONFIGURAZIONE' },
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
            minHeight: '100vh',
            borderTop: '4px solid #8b5cf6',
          }}
        >
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              background: 'rgba(5,5,5,0.78)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(212,175,55,0.18)',
            }}
          >
            <div
              style={{
                height: 82,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                padding: '0 26px',
              }}
            >
              <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src="/salon-pro-logo.png"
                  alt="Salon Pro"
                  style={{
                    width: 142,
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </Link>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(212,175,55,0.22)',
                    fontWeight: 900,
                    color: '#d4af37',
                  }}
                >
                  TENDENZE | Titolare
                </div>

                <button
                  style={{
                    padding: '11px 18px',
                    borderRadius: 999,
                    border: 0,
                    background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
                    color: '#fff',
                    fontWeight: 900,
                  }}
                >
                  CAMBIA SALONE
                </button>
              </div>
            </div>

            <nav
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                padding: '0 18px 14px',
                scrollbarWidth: 'none',
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
        whiteSpace: 'nowrap',
        padding: '14px 22px',
        borderRadius: 16,
        color: '#f4f4f5',
        background: 'rgba(255,255,255,0.045)',
        border: '1px solid rgba(255,255,255,0.07)',
        fontSize: 13,
        fontWeight: 900,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Link>
  );
}