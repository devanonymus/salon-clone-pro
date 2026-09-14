"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "../components/AppIcon";
import { loginApi } from "@/src/lib/api";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [tenantCode, setTenantCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantCode.trim() || !username.trim() || !pin.trim()) {
      setError("Inserisci codice salone, utente e PIN.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await loginApi({
        tenantCode: tenantCode.trim().toUpperCase(),
        username: username.trim(),
        pin,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Accesso non riuscito. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandTop}>
          <span className={styles.brandMark}>
            <Image alt="" height={72} src="/acquaviva-strategic-logo.png" width={144} />
          </span>
          <span className={styles.brandName}>
            <strong>Salon Pro</strong>
            <small>Business Operating System</small>
          </span>
        </div>

        <div className={styles.brandMessage}>
          <span className={styles.kicker}><AppIcon name="sparkle" size={16} /> Gestione evoluta</span>
          <h1>Più controllo.<br />Più margine.<br /><em>Più salone.</em></h1>
          <p>
            Agenda, clienti, vendite, team e crescita in un unico spazio di lavoro pensato per decidere meglio, ogni giorno.
          </p>
        </div>

        <div className={styles.featureRow}>
          <div><AppIcon name="dashboard" /><span><strong>Controllo</strong><small>KPI sempre leggibili</small></span></div>
          <div><AppIcon name="trend" /><span><strong>Crescita</strong><small>Azioni guidate dai dati</small></span></div>
          <div><AppIcon name="check" /><span><strong>Semplicità</strong><small>Tutto in un solo sistema</small></span></div>
        </div>

        <p className={styles.brandFooter}>Salon Pro · Powered by Acquaviva Strategic</p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <div className={styles.formHeading}>
            <span className={styles.secureBadge}><span /> Accesso protetto</span>
            <h2>Bentornato</h2>
            <p>Accedi al workspace del tuo salone.</p>
          </div>

          <form className={styles.form} onSubmit={login}>
            <label>
              <span>Codice salone</span>
              <div className={styles.field}>
                <AppIcon name="dashboard" size={18} />
                <input
                  autoCapitalize="characters"
                  autoComplete="organization"
                  autoFocus
                  onChange={(event) => setTenantCode(event.target.value)}
                  placeholder="Es. TENDENZE"
                  value={tenantCode}
                />
              </div>
            </label>

            <label>
              <span>Nome utente</span>
              <div className={styles.field}>
                <AppIcon name="clients" size={18} />
                <input
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Il tuo nome utente"
                  value={username}
                />
              </div>
            </label>

            <label>
              <span>PIN</span>
              <div className={styles.field}>
                <AppIcon name="settings" size={18} />
                <input
                  autoComplete="current-password"
                  inputMode="numeric"
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="Inserisci il PIN"
                  type={showPin ? "text" : "password"}
                  value={pin}
                />
                <button onClick={() => setShowPin((value) => !value)} type="button">
                  {showPin ? "Nascondi" : "Mostra"}
                </button>
              </div>
            </label>

            {error ? <div className={styles.error} role="alert">{error}</div> : null}

            <button className={styles.submit} disabled={loading} type="submit">
              <span>{loading ? "Accesso in corso…" : "Accedi al workspace"}</span>
              {!loading ? <AppIcon name="arrow" size={18} /> : <span className={styles.spinner} />}
            </button>
          </form>

          <div className={styles.help}>
            <span><AppIcon name="chat" size={17} /></span>
            <p><strong>Hai bisogno di assistenza?</strong><small>Contatta l’amministratore del tuo salone.</small></p>
          </div>
        </div>
      </section>
    </main>
  );
}
