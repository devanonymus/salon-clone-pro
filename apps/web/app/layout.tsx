import "./globals.css";
import AppShell from "./components/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://gestionalesalonpro.com"),
  title: {
    default: "Salon Pro",
    template: "%s · Salon Pro",
  },
  description: "Il sistema operativo per la gestione e la crescita del salone.",
  applicationName: "Salon Pro",
  robots: {
    index: true,
    follow: true,
  },
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
