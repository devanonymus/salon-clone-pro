"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { platform } from "../api";
export default function Activate() {
  const token = useRef("");
  const [secret, setSecret] = useState(""),
    [message, setMessage] = useState(""),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!token.current) token.current = location.hash.slice(1);
    history.replaceState(null, "", location.pathname);
  }, []);
  function generate() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    setSecret(
      Array.from(bytes, (b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b & 31]).join(
        "",
      ),
    );
  }
  return (
    <section className="auth-card">
      <h1>Imposta le credenziali</h1>
      <p>
        Per un nuovo account amministrativo, registra prima una chiave nell’app
        autenticatore. Per il recupero usa il codice MFA già configurato. Per un
        titolare basta la password: sarà utilizzabile nel campo PIN del
        gestionale.
      </p>
      {!done ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const f = new FormData(e.currentTarget);
              await platform("auth/activate", {
                token: token.current,
                password: f.get("password"),
                ...(f.get("totp") ? { totp: f.get("totp") } : {}),
                ...(secret ? { totpSecret: secret } : {}),
              });
              setDone(true);
              setMessage(
                "Credenziali impostate. Accedi con il percorso del tuo account.",
              );
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Nuova password
            <input
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <button type="button" className="secondary" onClick={generate}>
            Prepara MFA per nuovo amministratore
          </button>
          {secret && (
            <p>
              Chiave TOTP (6 cifre, 30 secondi, SHA-1): <code>{secret}</code>
            </p>
          )}
          <label>
            Codice MFA (solo amministratori)
            <input name="totp" inputMode="numeric" pattern="[0-9]{6}" />
          </label>
          <button disabled={busy}>Imposta credenziali</button>
        </form>
      ) : (
        <>
          <Link href="/admin/login">Accesso amministrativo</Link>
          <br />
          <Link href="/login">Accesso salone</Link>
        </>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
