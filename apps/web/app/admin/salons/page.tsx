"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { platform, type Admin, type Salon } from "../api";
import { SalonFields } from "../salon-form";
export default function Salons() {
  const [salons, setSalons] = useState<Salon[] | null>(null),
    [actor, setActor] = useState<Admin | null>(null),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("name"),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  function load() {
    platform<Salon[]>("salons")
      .then(setSalons)
      .catch((e) => setMessage(e.message));
  }
  useEffect(() => {
    load();
    platform<Admin>("me")
      .then(setActor)
      .catch(() => {});
  }, []);
  const rows = (salons || [])
    .filter(
      (s) =>
        `${s.name} ${s.code} ${s.salonProfile?.city || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || s.salonProfile?.status === status),
    )
    .sort((a, b) =>
      (sort === "name" ? a.name : a.code).localeCompare(
        sort === "name" ? b.name : b.code,
      ),
    );
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">RETE SALONPRO</p>
          <h1>Saloni</h1>
          <p className="muted">Anagrafiche e attivazioni sotto controllo.</p>
        </div>
        {actor && actor.role !== "TECHNICIAN" && (
          <button onClick={() => setOpen(true)}>Crea salone</button>
        )}
      </div>
      <p role="status">{message}</p>
      <div className="toolbar">
        <input
          aria-label="Cerca saloni"
          placeholder="Cerca nome, città o codice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtra stato"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tutti gli stati</option>
          {[
            "BOZZA",
            "IN_CONFIGURAZIONE",
            "DA_COLLAUDARE",
            "ATTIVO",
            "SOSPESO",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Ordina"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Nome</option>
          <option value="code">Codice</option>
        </select>
      </div>
      <section className="panel table-wrap">
        {!salons ? (
          <p role="status">Caricamento saloni…</p>
        ) : rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Salone</th>
                <th>Codice</th>
                <th>Comune</th>
                <th>Stato</th>
                <th>Tecnici</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/admin/salons/${s.id}`}>{s.name} →</Link>
                  </td>
                  <td>{s.code}</td>
                  <td>{s.salonProfile?.city || "—"}</td>
                  <td>
                    <span className="badge">
                      {s.salonProfile?.status || "Scheda da completare"}
                    </span>
                  </td>
                  <td>
                    {s.technicianAssignments
                      .map((t) => t.admin.name)
                      .join(", ") || "Non assegnato"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nessun salone corrisponde alla ricerca.</p>
        )}
      </section>
      {open && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-title"
          >
            <h2 id="create-title">Nuovo salone</h2>
            <p>
              Il salone nasce in bozza. Il titolare riceverà un invito dal
              servizio email configurato.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  const data = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  const result = await platform<{ id: string }>("salons", data);
                  setOpen(false);
                  location.href = `/admin/salons/${result.id}`;
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <SalonFields />
              <p role="alert">{message}</p>
              <div className="actions">
                <button disabled={busy}>Crea e prepara invito</button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Annulla
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
