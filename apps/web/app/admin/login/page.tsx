"use client";
import { useState } from "react";
import { platform } from "../api";
export default function Login() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="auth-card">
      <p className="eyebrow">UNIVIBE GROUP · SALONPRO</p>
      <h1>Control Center</h1>
      <p className="muted">
        Accesso riservato ad amministratori e tecnici autorizzati.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const f = new FormData(e.currentTarget);
          try {
            await platform("auth/login", Object.fromEntries(f));
            location.href = "/admin";
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Email
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          Codice autenticatore
          <input
            name="totp"
            required
            pattern="[0-9]{6}"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </label>
        <button disabled={busy}>{busy ? "Accesso in corso…" : "Accedi"}</button>
        <button
          type="button"
          className="secondary"
          onClick={async (e) => {
            const form = e.currentTarget.form!;
            const email = (form.elements.namedItem("email") as HTMLInputElement)
              .value;
            try {
              const r = await platform<{ message: string }>("auth/recover", {
                email,
              });
              setMessage(r.message);
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Recupera password
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
