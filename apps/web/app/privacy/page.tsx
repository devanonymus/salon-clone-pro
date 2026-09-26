import type { Metadata } from "next";
import Link from "next/link";
import styles from "../info.module.css";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description: "Informativa sul trattamento dei dati inviati tramite il sito Salon Pro.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className={styles.infoPage}>
      <article className={styles.legalCard}>
        <Link className={styles.backLink} href="/">← Torna a Salon Pro</Link>
        <span className={styles.eyebrow}>Informativa privacy</span>
        <h1>Dati inviati tramite richieste demo e Salon Score</h1>
        <p className={styles.updated}>Ultimo aggiornamento: 27 settembre 2026</p>

        <section>
          <h2>1. Titolare del trattamento</h2>
          <p>
            Il titolare del trattamento è Univibe Group S.r.l.s., proprietaria
            del prodotto Salon Pro. Per richieste relative ai dati personali:
            <a href="mailto:sales.salonpro@univibegroup.it"> sales.salonpro@univibegroup.it</a>.
          </p>
        </section>

        <section>
          <h2>2. Dati trattati</h2>
          <p>
            Trattiamo i dati inseriti volontariamente nei moduli: nome, salone,
            telefono, email, dimensione del team, modalità di gestione e, nel
            caso del Salon Score, risposte e punteggi della diagnosi. Possiamo
            inoltre registrare provenienza della visita, parametri UTM e data
            della richiesta per capire da quale campagna è arrivato il contatto.
          </p>
        </section>

        <section>
          <h2>3. Finalità e base giuridica</h2>
          <p>
            Usiamo i dati per rispondere alla richiesta, fornire il Salon Score,
            organizzare la demo e svolgere le attività precontrattuali richieste
            dall’interessato. I dati non vengono usati per inviare comunicazioni
            promozionali estranee alla richiesta senza una separata base giuridica.
          </p>
        </section>

        <section>
          <h2>4. Conservazione e destinatari</h2>
          <p>
            I dati sono conservati per il tempo necessario a gestire la richiesta
            e gli eventuali rapporti successivi, salvo obblighi di legge. Possono
            essere trattati da fornitori tecnici che supportano hosting, moduli,
            database e comunicazioni, nominati o valutati secondo la normativa
            applicabile.
          </p>
        </section>

        <section>
          <h2>5. Diritti</h2>
          <p>
            Puoi chiedere accesso, rettifica, cancellazione, limitazione,
            opposizione o portabilità dei dati, quando applicabile, scrivendo
            all’indirizzo indicato sopra. Resta il diritto di proporre reclamo
            all’Autorità Garante per la protezione dei dati personali.
          </p>
        </section>
      </article>
    </main>
  );
}
