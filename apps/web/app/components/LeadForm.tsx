"use client";

import { type FormEvent, useState } from "react";
import AppIcon from "./AppIcon";
import styles from "../landing.module.css";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function LeadForm() {
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = new URLSearchParams();

    formData.forEach((value, key) => {
      if (typeof value === "string") body.append(key, value);
    });

    try {
      setState("submitting");
      const response = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) throw new Error("Invio non riuscito");
      form.reset();
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeading}>
        <span><i /> Richiesta riservata</span>
        <h3>Parliamo del tuo salone.</h3>
        <p>Lascia i tuoi dati: ti ricontatteremo per organizzare la demo.</p>
      </div>

      {state === "success" ? (
        <div className={styles.formSuccess} role="status">
          <span><AppIcon name="check" size={28} /></span>
          <h3>Richiesta ricevuta.</h3>
          <p>Ti contatteremo per capire le esigenze del tuo salone e fissare la demo.</p>
          <button onClick={() => setState("idle")} type="button">Invia un’altra richiesta</button>
        </div>
      ) : (
        <form className={styles.leadForm} name="richiesta-demo" onSubmit={handleSubmit}>
          <input name="form-name" type="hidden" value="richiesta-demo" />
          <input name="source" type="hidden" value="landing-salon-pro" />
          <p className={styles.honeypot}>
            <label>Non compilare: <input name="bot-field" tabIndex={-1} /></label>
          </p>

          <div className={styles.formGrid}>
            <label>
              <span>Nome e cognome *</span>
              <input autoComplete="name" name="nome" placeholder="Come ti chiami?" required />
            </label>
            <label>
              <span>Nome del salone *</span>
              <input autoComplete="organization" name="salone" placeholder="Il tuo salone" required />
            </label>
            <label>
              <span>Telefono / WhatsApp *</span>
              <input autoComplete="tel" inputMode="tel" name="telefono" placeholder="Es. 333 123 4567" required type="tel" />
            </label>
            <label>
              <span>Email</span>
              <input autoComplete="email" name="email" placeholder="nome@email.it" type="email" />
            </label>
            <label>
              <span>Città *</span>
              <input autoComplete="address-level2" name="citta" placeholder="Dove si trova?" required />
            </label>
            <label>
              <span>Dimensione del team *</span>
              <select defaultValue="" name="team" required>
                <option disabled value="">Seleziona</option>
                <option value="Solo titolare">Solo titolare</option>
                <option value="2-3 persone">2–3 persone</option>
                <option value="4-6 persone">4–6 persone</option>
                <option value="7+ persone">7+ persone</option>
              </select>
            </label>
          </div>

          <label className={styles.fullField}>
            <span>Come gestisci oggi il salone?</span>
            <select defaultValue="" name="gestione-attuale">
              <option value="">Seleziona una risposta</option>
              <option value="Carta o agenda">Carta o agenda</option>
              <option value="Fogli di calcolo">Fogli di calcolo</option>
              <option value="Altro gestionale">Altro gestionale</option>
              <option value="Più strumenti separati">Più strumenti separati</option>
            </select>
          </label>

          <label className={styles.consent}>
            <input name="consenso-ricontatto" required type="checkbox" value="si" />
            <span>Acconsento a essere ricontattato in merito alla richiesta di demo.</span>
          </label>

          {state === "error" ? (
            <p className={styles.formError} role="alert">
              Non siamo riusciti a inviare la richiesta. Riprova tra qualche istante.
            </p>
          ) : null}

          <button className={styles.formSubmit} disabled={state === "submitting"} type="submit">
            <span>{state === "submitting" ? "Invio in corso…" : "Richiedi la demo"}</span>
            <AppIcon name={state === "submitting" ? "sparkle" : "arrow"} size={18} />
          </button>
          <small className={styles.formMicrocopy}>Nessun impegno. Nessuna chiamata automatica.</small>
        </form>
      )}
    </div>
  );
}
