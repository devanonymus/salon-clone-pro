import type { Metadata } from "next";
import Link from "next/link";
import AppIcon from "../components/AppIcon";
import styles from "../info.module.css";

export const metadata: Metadata = {
  title: "Richiesta ricevuta",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className={styles.infoPage}>
      <section className={styles.thankYouCard}>
        <span className={styles.successIcon}><AppIcon name="check" size={30} /></span>
        <span className={styles.eyebrow}>Richiesta ricevuta</span>
        <h1>Perfetto. Prepariamo una demo utile per il tuo salone.</h1>
        <p>
          Durante il primo contatto capiremo come gestisci oggi il salone e
          quali aree vuoi migliorare. In questo modo la demo sarà focalizzata
          su ciò che può esserti realmente utile.
        </p>
        <div className={styles.nextSteps}>
          <div><b>01</b><span><strong>Ti ricontattiamo</strong><small>Concordiamo insieme il momento migliore.</small></span></div>
          <div><b>02</b><span><strong>Partiamo dal tuo metodo</strong><small>Niente presentazioni generiche.</small></span></div>
          <div><b>03</b><span><strong>Valuti senza pressione</strong><small>La demo è gratuita e senza impegno.</small></span></div>
        </div>
        <div className={styles.infoActions}>
          <Link className={styles.primaryAction} href="/">Torna al sito <AppIcon name="arrow" size={18} /></Link>
          <Link className={styles.secondaryAction} href="/salon-score">Scopri il tuo Salon Score</Link>
        </div>
      </section>
    </main>
  );
}
