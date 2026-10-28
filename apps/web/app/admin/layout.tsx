"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { platform, type Admin } from "./api";
import "./platform.css";
export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    [actor, setActor] = useState<Admin | null>(null);
  const publicPage = path === "/admin/login" || path === "/admin/activate";
  useEffect(() => {
    if (!publicPage)
      platform<Admin>("me")
        .then(setActor)
        .catch(() => {});
  }, [publicPage]);
  if (publicPage) return <div className="platform public">{children}</div>;
  return (
    <div className="platform">
      <aside>
        <Link href="/admin" className="brand">
          SalonPro <small>CONTROL CENTER</small>
        </Link>
        <p className="muted">UNIVIBE GROUP</p>
        <nav>
          {[
            ["/admin", "Panoramica"],
            ["/admin/salons", "Saloni"],
            ...(actor?.role !== "TECHNICIAN"
              ? [["/admin/technicians", "Tecnici e accessi"]]
              : []),
          ].map(([href, label]) => (
            <Link
              aria-current={path === href ? "page" : undefined}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <footer>
          {actor ? (
            <>
              <strong>{actor.name}</strong>
              <small>{actor.role}</small>
              <button
                onClick={async () => {
                  await platform("logout", {});
                  location.href = "/admin/login";
                }}
              >
                Esci
              </button>
              <button
                onClick={async () => {
                  if (confirm("Revocare tutte le tue sessioni?")) {
                    await platform("revoke-sessions", {});
                    location.href = "/admin/login";
                  }
                }}
              >
                Revoca le mie sessioni
              </button>
            </>
          ) : (
            <p role="status">Verifica accesso…</p>
          )}
        </footer>
      </aside>
      <main>
        <header>
          <span>Amministrazione piattaforma</span>
          <span className="muted">
            SalonPro / {path.split("/").slice(2).join(" / ") || "Panoramica"}
          </span>
        </header>
        {actor ? (
          children
        ) : (
          <div className="skeleton" role="status">
            Caricamento accesso…
          </div>
        )}
      </main>
    </div>
  );
}
