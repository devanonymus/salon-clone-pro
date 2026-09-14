import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata = {
  title: {
    default: "Salon Pro",
    template: "%s · Salon Pro",
  },
  description: "Il sistema operativo per la gestione e la crescita del salone.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
