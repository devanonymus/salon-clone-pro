"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppIcon from "./AppIcon";
import { trackEvent } from "../../src/lib/analytics";
import {
  getLeadAttribution,
  PUBLIC_LEAD_FORM_NAME,
  submitPublicLead,
} from "../../src/lib/public-leads";
import styles from "../landing.module.css";

type SubmitState = "idle" | "submitting" | "error";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export default function LeadForm() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const started = useRef(false);

  function trackStart() {
    if (started.current) return;
    started.current = true;
    trackEvent("demo_form_start", { form: PUBLIC_LEAD_FORM_NAME, source: "demo" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setState("submitting");
      await submitPublicLead({
        leadSource: "demo",
        name: readString(formData, "nome"),
        salon: readString(formData, "salone"),
        phone: readString(formData, "telefono"),
        email: readString(formData, "email"),
        teamSize: readString(formData, "team"),
        currentManagement: readString(formData, "gestione-attuale"),
        website: readString(formData, "bot-field"),
        privacyAccepted: true,
        ...getLeadAttribution(),
      });

      trackEvent("demo_form_submit", { form: PUBLIC_LEAD_FORM_NAME, source: "demo" });
      form.reset();
      router.push("/grazie?source=demo");
    } catch {
      setState("error");
    }
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formHeading}>
        <span><i /> Demo riservata ai professionisti</span>
        <h3>Raccontaci come lavori oggi.</h3>
        <p>Ti mostriamo solo ciò che può servirti davvero.</p>
      </div>

      <form
        action="/__forms.html"
        className={styles.leadForm}
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        method="POST"
        name={PUBLIC_LEAD_FORM_NAME}
        onFocusCapture={trackStart}
        onSubmit={handleSubmit}
      >
        <input name="form-name" type="hidden" value={PUBLIC_LEAD_FORM_NAME} />
        <input data-remove-prefix="" name="subject" type="hidden" value="Nuova richiesta demo Salon Pro" />
        <input name="lead-source" type="hidden" value="demo" />
        <input name="stage" type="hidden" value="NEW" />
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
            <span>Email *</span>
            <input autoComplete="email" inputMode="email" name="email" placeholder="nome@salone.it" required type="email" />
          </label>
          <label>
            <span>Numero collaboratori *</span>
            <select defaultValue="" name="team" required>
              <option disabled value="">Seleziona</option>
              <option value="Solo io">Solo io</option>
              <option value="2-3">2–3</option>
              <option value="4-6">4–6</option>
              <option value="7+">7+</option>
            </select>
          </label>
          <label>
            <span>Come gestisci oggi il salone?</span>
            <select defaultValue="" name="gestione-attuale">
              <option value="">Facoltativo</option>
              <option value="Agenda cartacea">Agenda cartacea</option>
              <option value="WhatsApp e telefono">WhatsApp e telefono</option>
              <option value="Fogli o calendari">Fogli o calendari</option>
              <option value="Altro gestionale">Altro gestionale</option>
              <option value="Piu strumenti">Più strumenti</option>
            </select>
          </label>
        </div>

        <label className={styles.consent}>
          <input name="privacy-accettata" required type="checkbox" value="si" />
          <span>
            Ho letto l’<a href="/privacy" target="_blank">informativa privacy</a> e chiedo di
            essere ricontattato in merito alla demo.
          </span>
        </label>

        {state === "error" ? (
          <p className={styles.formError} role="alert">
            Non siamo riusciti a inviare la richiesta. Riprova tra qualche istante.
          </p>
        ) : null}

        <button className={styles.formSubmit} disabled={state === "submitting"} type="submit">
          <span>{state === "submitting" ? "Invio in corso…" : "Voglio vedere Salon Pro"}</span>
          <AppIcon name={state === "submitting" ? "sparkle" : "arrow"} size={18} />
        </button>
        <small className={styles.formMicrocopy}>Demo gratuita · Nessun impegno · Nessuna chiamata automatica</small>
      </form>
    </div>
  );
}
