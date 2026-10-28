"use client";
import { useEffect, useState } from "react";
import { platform, type Admin } from "../api";
export default function Technicians() {
  const [rows, setRows] = useState<Admin[]>([]),
    [actor, setActor] = useState<Admin | null>(null),
    [message, setMessage] = useState(""),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  function load() {
    platform<Admin[]>("technicians")
      .then(setRows)
      .catch((e) => setMessage(e.message));
  }
  useEffect(() => {
    load();
    platform<Admin>("me")
      .then(setActor)
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">PERSONE E AUTORIZZAZIONI</p>
          <h1>Tecnici e accessi</h1>
        </div>
        <button onClick={() => setOpen(true)}>Invita account</button>
      </div>
      <p role="status">{message}</p>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Saloni assegnati</th>
              <th>Accesso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.role}</td>
                <td>{a.assignments?.length || 0}</td>
                <td>
                  {a.active ? "Attivo" : "Disattivato"}{" "}
                  <button
                    className="secondary"
                    onClick={async () => {
                      try {
                        const r = await platform<{ message: string }>(
                          `technicians/${a.id}/resend-invite`,
                          {},
                        );
                        setMessage(r.message);
                      } catch (e) {
                        setMessage((e as Error).message);
                      }
                    }}
                  >
                    Rinnova invito
                  </button>{" "}
                  {a.id !== actor?.id && a.role !== "SUPER_ADMIN" && (
                    <button
                      className="secondary"
                      onClick={async () => {
                        if (
                          confirm(
                            `${a.active ? "Revocare" : "Riattivare"} l’accesso di ${a.name}?`,
                          )
                        )
                          try {
                            await platform(
                              `technicians/${a.id}`,
                              { active: !a.active },
                              "PATCH",
                            );
                            load();
                            setMessage("Accesso aggiornato");
                          } catch (e) {
                            setMessage((e as Error).message);
                          }
                      }}
                    >
                      {a.active ? "Revoca" : "Riattiva"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p>Nessun account disponibile.</p>}
      </section>
      {open && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
          >
            <h2 id="invite-title">Invita account</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await platform(
                    "technicians",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                  setOpen(false);
                  load();
                  setMessage(
                    "Account creato. Invito accodato per la consegna email.",
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Nome
                <input name="name" required />
              </label>
              <label>
                Email
                <input type="email" name="email" required />
              </label>
              <label>
                Ruolo
                <select name="role">
                  <option>TECHNICIAN</option>
                  {actor?.role === "SUPER_ADMIN" && (
                    <>
                      <option>ADMIN</option>
                      <option>SUPER_ADMIN</option>
                    </>
                  )}
                </select>
              </label>
              <p role="alert">{message}</p>
              <div className="actions">
                <button disabled={busy}>Prepara invito</button>
                <button
                  type="button"
                  className="secondary"
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
