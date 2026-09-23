import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppIcon, { type AppIconName } from "./components/AppIcon";
import LeadForm from "./components/LeadForm";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Gestionale per parrucchieri e saloni",
  description:
    "Salon Pro collega agenda, clienti, cassa, magazzino, team e performance in un unico gestionale per parrucchieri e saloni.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Salon Pro · Il sistema operativo del tuo salone",
    description:
      "Più controllo, più clienti, più margine. Scopri il gestionale completo pensato per parrucchieri e saloni.",
    url: "https://gestionalesalonpro.com",
    siteName: "Salon Pro",
    locale: "it_IT",
    type: "website",
  },
};

const modules: Array<{
  icon: AppIconName;
  title: string;
  copy: string;
  accent: string;
}> = [
  {
    icon: "agenda",
    title: "Agenda e staff",
    copy: "Appuntamenti, disponibilità e lavoro del team in una vista chiara.",
    accent: "01",
  },
  {
    icon: "clients",
    title: "Clienti e storico",
    copy: "Preferenze, servizi e relazione con ogni cliente sempre a portata di mano.",
    accent: "02",
  },
  {
    icon: "cash",
    title: "Cassa e vendite",
    copy: "Incassi, pagamenti e andamento commerciale senza passaggi inutili.",
    accent: "03",
  },
  {
    icon: "package",
    title: "Magazzino",
    copy: "Scorte, prodotti e marginalità per acquistare con maggiore consapevolezza.",
    accent: "04",
  },
  {
    icon: "team",
    title: "Team e performance",
    copy: "Numeri leggibili per valorizzare persone, servizi e risultati.",
    accent: "05",
  },
  {
    icon: "marketing",
    title: "Crescita e loyalty",
    copy: "Azioni mirate per riattivare clienti e aumentare la frequenza di ritorno.",
    accent: "06",
  },
];

const painPoints = [
  {
    title: "Numeri sparsi",
    copy: "Agenda, incassi e informazioni vivono in strumenti diversi e non raccontano la stessa storia.",
    icon: "dashboard" as AppIconName,
  },
  {
    title: "Clienti che si perdono",
    copy: "Senza uno storico leggibile diventa difficile capire chi non torna e quando intervenire.",
    icon: "clients" as AppIconName,
  },
  {
    title: "Margini poco chiari",
    copy: "Un salone pieno non basta se costi, prodotti e performance restano invisibili.",
    icon: "trend" as AppIconName,
  },
];

const faqs = [
  {
    question: "Salon Pro è soltanto un’agenda online?",
    answer:
      "No. L’agenda è uno dei moduli. Salon Pro collega appuntamenti, clienti, vendite, magazzino, team, marketing e controllo di gestione.",
  },
  {
    question: "Posso usarlo anche da tablet?",
    answer:
      "Sì. L’interfaccia è progettata per essere utilizzata da desktop e tablet, anche nelle operazioni quotidiane di cassa e agenda.",
  },
  {
    question: "La demo è adatta al mio tipo di salone?",
    answer:
      "Durante la demo partiamo dal tuo modo di lavorare e mostriamo i moduli più utili per dimensione, team e obiettivi del salone.",
  },
  {
    question: "Devo cambiare tutto subito?",
    answer:
      "No. Il percorso viene impostato per rendere il passaggio ordinato e comprensibile, senza complicare il lavoro quotidiano.",
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`${styles.brand} ${compact ? styles.brandCompact : ""}`}>
      <span className={styles.brandMark}>
        <Image alt="" height={1152} src="/salon-pro-logo-official.png" width={2048} />
      </span>
      <span className={styles.brandText}>
        <strong><span>Salon</span><span>Pro</span></strong>
        {!compact ? <small>Business Operating System</small> : null}
      </span>
    </span>
  );
}

export default function HomePage() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Salon Pro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://gestionalesalonpro.com",
    description:
      "Gestionale per parrucchieri e saloni con agenda, clienti, cassa, magazzino, team, marketing e controllo di gestione.",
  };

  return (
    <main className={styles.landing}>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        type="application/ld+json"
      />

      <header className={styles.header}>
        <Link aria-label="Salon Pro, torna alla home" className={styles.headerBrand} href="/">
          <Brand />
        </Link>
        <nav aria-label="Navigazione sito" className={styles.nav}>
          <a href="#perche">Perché Salon Pro</a>
          <a href="#prodotto">Funzionalità</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginLink} href="/login">Accedi</Link>
          <a className={styles.headerCta} href="#demo">Richiedi una demo</a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.liveDot} />
              Per saloni che vogliono crescere
            </span>
            <h1>
              Il tuo salone.<br />
              <em>Sotto controllo.</em>
            </h1>
            <p>
              Non il solito gestionale. Salon Pro collega agenda, clienti, vendite,
              magazzino e team per aiutarti a prendere decisioni migliori ogni giorno.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryCta} href="#demo">
                Richiedi una demo <AppIcon name="arrow" size={18} />
              </a>
              <a className={styles.secondaryCta} href="#prodotto">
                Guarda come funziona
              </a>
            </div>
            <div className={styles.heroAssurances}>
              <span><AppIcon name="check" size={15} /> Demo guidata</span>
              <span><AppIcon name="check" size={15} /> Nessun impegno</span>
              <span><AppIcon name="check" size={15} /> Pensato per il lavoro reale</span>
            </div>
          </div>

          <div className={styles.productVisual} aria-label="Anteprima della dashboard Salon Pro">
            <div className={styles.visualTopbar}>
              <span><i /><i /><i /></span>
              <small>gestionalesalonpro.com</small>
              <b>Live</b>
            </div>
            <div className={styles.screenshotWrap}>
              <Image
                alt="Dashboard di Salon Pro con incassi, appuntamenti, vendite e priorità operative"
                height={1068}
                priority
                src="/salon-pro-dashboard.png"
                width={1898}
              />
            </div>
            <div className={`${styles.visualBadge} ${styles.visualBadgeOne}`}>
              <span><AppIcon name="trend" size={17} /></span>
              <p><small>Performance</small><strong>Numeri leggibili</strong></p>
            </div>
            <div className={`${styles.visualBadge} ${styles.visualBadgeTwo}`}>
              <span><AppIcon name="clients" size={17} /></span>
              <p><small>Clienti</small><strong>Relazioni più forti</strong></p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Moduli principali" className={styles.moduleStrip}>
        {[
          ["agenda", "Agenda"],
          ["clients", "Clienti"],
          ["cash", "Cassa"],
          ["package", "Magazzino"],
          ["team", "Team"],
          ["marketing", "Marketing"],
        ].map(([icon, label]) => (
          <span key={label}>
            <AppIcon name={icon as AppIconName} size={18} /> {label}
          </span>
        ))}
      </section>

      <section className={styles.problemSection} id="perche">
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Il problema non è lavorare di più</span>
          <h2>Un salone pieno può nascondere margini fuori controllo.</h2>
          <p>
            Quando i dati sono frammentati, ogni scelta dipende dalla sensazione.
            Salon Pro trasforma il lavoro quotidiano in una visione chiara del business.
          </p>
        </div>
        <div className={styles.painGrid}>
          {painPoints.map((item) => (
            <article className={styles.painCard} key={item.title}>
              <span><AppIcon name={item.icon} size={22} /></span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
        <div className={styles.bridgeStatement}>
          <span>Da strumenti separati</span>
          <AppIcon name="arrow" size={20} />
          <strong>A un unico sistema che lavora con te.</strong>
        </div>
      </section>

      <section className={styles.productSection} id="prodotto">
        <div className={styles.productHeading}>
          <div>
            <span className={styles.sectionKicker}>Tutto connesso</span>
            <h2>Non è un’agenda.<br />È il sistema operativo del tuo salone.</h2>
          </div>
          <p>
            Ogni modulo condivide le stesse informazioni. Meno passaggi, meno errori,
            più tempo per clienti, team e crescita.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {modules.map((module) => (
            <article className={styles.featureCard} key={module.title}>
              <div className={styles.featureTop}>
                <span><AppIcon name={module.icon} size={22} /></span>
                <small>{module.accent}</small>
              </div>
              <h3>{module.title}</h3>
              <p>{module.copy}</p>
              <i />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.outcomeSection}>
        <div className={styles.outcomeVisual}>
          <div className={styles.outcomeOrb}>
            <span><AppIcon name="trend" size={34} /></span>
            <p><small>Direzione</small><strong>Decisioni guidate dai dati</strong></p>
          </div>
          <div className={styles.outcomeLine} />
          <div className={styles.metricPill}><span>01</span><strong>Controllo</strong></div>
          <div className={styles.metricPill}><span>02</span><strong>Clienti</strong></div>
          <div className={styles.metricPill}><span>03</span><strong>Margine</strong></div>
        </div>
        <div className={styles.outcomeCopy}>
          <span className={styles.sectionKicker}>Dal dato alla decisione</span>
          <h2>Più controllo.<br />Più clienti.<br /><em>Più margine.</em></h2>
          <p>
            Salon Pro rende leggibile ciò che succede nel salone e porta in primo piano
            le azioni che meritano davvero la tua attenzione.
          </p>
          <ul>
            <li><AppIcon name="check" size={17} /> Individua rapidamente priorità e anomalie</li>
            <li><AppIcon name="check" size={17} /> Conosci meglio clienti e frequenza di ritorno</li>
            <li><AppIcon name="check" size={17} /> Leggi vendite, scorte e performance insieme</li>
          </ul>
          <a className={styles.textLink} href="#demo">Voglio vedere Salon Pro <AppIcon name="arrow" size={17} /></a>
        </div>
      </section>

      <section className={styles.demoSection} id="demo">
        <div className={styles.demoCopy}>
          <span className={styles.sectionKicker}>Una demo costruita sul tuo salone</span>
          <h2>Scopri dove puoi recuperare controllo e margine.</h2>
          <p>
            Non una presentazione generica: partiamo dal tuo metodo di lavoro e ti mostriamo
            come Salon Pro può semplificarlo.
          </p>
          <div className={styles.demoSteps}>
            <div><span>01</span><p><strong>Conosciamo il salone</strong><small>Team, strumenti e priorità attuali.</small></p></div>
            <div><span>02</span><p><strong>Mostriamo il flusso</strong><small>Le funzioni più utili per la tua realtà.</small></p></div>
            <div><span>03</span><p><strong>Definiamo il passo successivo</strong><small>Solo se Salon Pro è davvero adatto.</small></p></div>
          </div>
          <div className={styles.demoNote}>
            <AppIcon name="sparkle" size={20} />
            <p><strong>Demo guidata, senza impegno.</strong><small>Parli con chi conosce il prodotto, non con un call center.</small></p>
          </div>
        </div>
        <LeadForm />
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.faqHeading}>
          <span className={styles.sectionKicker}>Domande frequenti</span>
          <h2>Prima di scegliere,<br />è giusto capire.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}<span>+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.sectionKicker}>Il prossimo passo</span>
          <h2>Il tuo salone può essere pieno.<br /><em>E finalmente sotto controllo.</em></h2>
        </div>
        <a className={styles.primaryCta} href="#demo">Richiedi la tua demo <AppIcon name="arrow" size={18} /></a>
      </section>

      <footer className={styles.footer}>
        <Brand compact />
        <p>Il sistema operativo per parrucchieri che vogliono più controllo e margine.</p>
        <div>
          <Link href="/login">Accesso clienti</Link>
          <a href="#demo">Richiedi una demo</a>
          <span>© 2026 Salon Pro</span>
        </div>
      </footer>

      <a className={styles.mobileCta} href="#demo">Richiedi una demo</a>
    </main>
  );
}
