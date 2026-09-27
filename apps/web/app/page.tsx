import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppIcon, { type AppIconName } from "./components/AppIcon";
import LandingAnalytics from "./components/LandingAnalytics";
import LeadForm from "./components/LeadForm";
import StickyConversionBar from "./components/StickyConversionBar";
import VerifiedProofSection, {
  type VerifiedSalonStory,
} from "./components/VerifiedProofSection";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Il sistema operativo del tuo salone",
  description:
    "Agenda, clienti, team, vendite, magazzino e marketing in un unico sistema. Scopri Salon Pro con una demo gratuita o calcola il tuo Salon Score.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Salon Pro · Gestisci. Controlla. Cresci.",
    description:
      "Più controllo sul salone, meno strumenti e informazioni sparse. Scopri il sistema operativo progettato per parrucchieri e saloni.",
    url: "https://gestionalesalonpro.com",
    siteName: "Salon Pro",
    locale: "it_IT",
    type: "website",
  },
};

const problems = [
  "Appuntamenti tra telefono, WhatsApp e agenda",
  "Clienti che spariscono senza che nessuno se ne accorga",
  "Magazzino controllato a memoria",
  "Difficoltà nel leggere il lavoro di ogni collaboratore",
  "Marketing fatto senza sapere chi contattare",
];

const modules: Array<{ icon: AppIconName; title: string; copy: string }> = [
  {
    icon: "agenda",
    title: "Agenda",
    copy: "Un’unica agenda per sapere chi arriva, quando e con quale collaboratore.",
  },
  {
    icon: "clients",
    title: "Clienti",
    copy: "Individua chi non torna e crea azioni di recupero partendo dallo storico reale.",
  },
  {
    icon: "team",
    title: "Team",
    copy: "Confronta carico di lavoro e produttività senza aspettare la fine del mese.",
  },
  {
    icon: "cash",
    title: "Vendite e POS",
    copy: "Servizi, prodotti e incassi restano collegati nello stesso flusso.",
  },
  {
    icon: "package",
    title: "Magazzino",
    copy: "Riduci rotture di stock e acquisti alla cieca controllando scorte e movimenti.",
  },
  {
    icon: "marketing",
    title: "Marketing",
    copy: "Contatta i clienti giusti invece di inviare messaggi a caso.",
  },
  {
    icon: "trend",
    title: "Analytics",
    copy: "Trasforma i numeri del salone in informazioni semplici da usare.",
  },
];

const metrics = [
  "Fatturato",
  "Ticket medio",
  "Servizi più venduti",
  "Prodotti più venduti",
  "Ritorno clienti",
  "Clienti inattivi",
  "Clienti nuovi",
  "Performance collaboratori",
  "Appuntamenti",
  "Andamento nel tempo",
];

const objections = [
  {
    question: "Ho già un gestionale.",
    answer:
      "Perfetto. La demo serve anche a capire se Salon Pro può offrirti qualcosa che oggi ti manca. Nessun obbligo di cambiare.",
  },
  {
    question: "Non ho tempo per imparare un nuovo software.",
    answer:
      "Salon Pro è progettato per ridurre passaggi, non aggiungerne. Configurazione e onboarding sono guidati.",
  },
  {
    question: "Il mio salone è piccolo.",
    answer:
      "Può essere usato sia da chi lavora da solo sia da team strutturati. La demo parte dalla tua dimensione reale.",
  },
  {
    question: "I collaboratori riusciranno a usarlo?",
    answer:
      "L’interfaccia rende semplici le operazioni quotidiane e separa ciò che serve al team da ciò che serve al titolare.",
  },
  {
    question: "Devo spostare tutti i clienti?",
    answer:
      "Valutiamo l’importazione assistita dei dati quando tecnicamente possibile, senza promettere migrazioni che prima non abbiamo verificato.",
  },
];

const faqs = [
  {
    question: "Quanto costa?",
    answer:
      "Dipende dalla configurazione e dalle esigenze del salone. La demo serve anche a capire quale soluzione ha senso per la tua realtà, senza impegno.",
  },
  {
    question: "Salon Pro è soltanto un’agenda online?",
    answer:
      "No. L’agenda è uno dei moduli. Salon Pro collega appuntamenti, clienti, vendite, magazzino, team, marketing e controllo di gestione.",
  },
  {
    question: "Posso usarlo anche da tablet?",
    answer:
      "Sì. L’interfaccia è progettata per desktop e tablet, anche nelle attività quotidiane di agenda e vendita.",
  },
  {
    question: "Quanto dura la prima demo?",
    answer:
      "La prima presentazione richiede circa 6 minuti. Se il prodotto è adatto, possiamo approfondire in un secondo momento le aree più importanti per il salone.",
  },
  {
    question: "È prevista assistenza nella configurazione?",
    answer:
      "Sì. L’avvio comprende configurazione iniziale e onboarding per titolare e team.",
  },
  {
    question: "Salon Pro sostituisce il registratore telematico?",
    answer:
      "No. Organizza il flusso di vendita, gli incassi e il controllo operativo, ma non sostituisce il registratore telematico o gli adempimenti fiscali previsti.",
  },
  {
    question: "Il marketing WhatsApp è già automatico?",
    answer:
      "I flussi e i template possono essere configurati, ma l’invio tramite WhatsApp richiede attivazione e collaudo del canale Meta, oltre ai consensi necessari.",
  },
];

// Popolare soltanto con testimonianze e metriche autorizzate e verificabili.
const verifiedStories: VerifiedSalonStory[] = [];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={[styles.brand, compact ? styles.brandCompact : ""].join(" ")}>
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
      "Sistema operativo per saloni con agenda, clienti, vendite, magazzino, team, marketing e controllo di gestione.",
  };

  return (
    <main className={styles.landing}>
      <LandingAnalytics />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        type="application/ld+json"
      />

      <header className={styles.header}>
        <Link aria-label="Salon Pro, torna alla home" className={styles.headerBrand} href="/">
          <Brand />
        </Link>
        <nav aria-label="Navigazione sito" className={styles.nav}>
          <a href="#prodotto">Prodotto</a>
          <a href="#funzioni">Funzioni</a>
          <Link href="/salon-score">Salon Score</Link>
          <a href="#faq">FAQ</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginLink} href="/login">Accedi</Link>
          <a
            className={styles.headerCta}
            data-analytics-event="hero_demo_click"
            data-analytics-location="navbar"
            href="#demo"
          >
            Richiedi demo
          </a>
        </div>
      </header>

      <section className={styles.hero} data-hero>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <span className={styles.liveDot} />
              Il sistema operativo del tuo salone
            </span>
            <h1>Il tuo salone cresce.<br /><em>Il caos no.</em></h1>
            <p className={styles.heroOutcome}>
              Sai sempre chi arriva, quanto incassi, cosa vende il team e quali
              clienti stanno smettendo di tornare.
            </p>
            <p className={styles.heroSupport}>
              Agenda, clienti, team, vendite, magazzino e marketing lavorano
              finalmente nello stesso sistema.
            </p>
            <div className={styles.heroActions}>
              <a
                className={styles.primaryCta}
                data-analytics-event="hero_demo_click"
                data-analytics-location="hero"
                href="#demo"
              >
                Richiedi una demo gratuita <AppIcon name="arrow" size={18} />
              </a>
              <Link
                className={styles.secondaryCta}
                data-analytics-event="hero_score_click"
                data-analytics-location="hero"
                href="/salon-score"
              >
                Scopri il tuo Salon Score
              </Link>
            </div>
            <div className={styles.heroAssurances}>
              <span><AppIcon name="check" size={15} /> 6 minuti</span>
              <span><AppIcon name="check" size={15} /> Nessun impegno</span>
              <span><AppIcon name="check" size={15} /> Configurazione assistita</span>
            </div>
            <p className={styles.riskReversal}>
              Non devi cambiare subito il tuo modo di lavorare. Prima ti
              mostriamo se Salon Pro può davvero esserti utile.
            </p>
          </div>

          <div className={styles.productVisual} aria-label="Anteprima reale della dashboard Salon Pro">
            <div className={styles.visualTopbar}>
              <span><i /><i /><i /></span>
              <small>Salon Pro · Dashboard</small>
              <b>Prodotto reale</b>
            </div>
            <div className={styles.screenshotWrap}>
              <Image
                alt="Dashboard Salon Pro con agenda, incassi, clienti e priorità operative"
                height={1068}
                priority
                sizes="(max-width: 960px) 92vw, 54vw"
                src="/salon-pro-dashboard.png"
                width={1898}
              />
            </div>
            <div className={[styles.visualBadge, styles.visualBadgeOne].join(" ")}>
              <span><AppIcon name="trend" size={17} /></span>
              <p><small>Controllo</small><strong>Numeri leggibili</strong></p>
            </div>
            <div className={[styles.visualBadge, styles.visualBadgeTwo].join(" ")}>
              <span><AppIcon name="clients" size={17} /></span>
              <p><small>Clienti</small><strong>Storico connesso</strong></p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Elementi collegati in Salon Pro" className={styles.productProofStrip}>
        <div>
          <span><AppIcon name="agenda" size={20} /></span>
          <p><small>Operatività</small><strong>Agenda unica</strong></p>
        </div>
        <div>
          <span><AppIcon name="clients" size={20} /></span>
          <p><small>Relazione</small><strong>Clienti con storico</strong></p>
        </div>
        <div>
          <span><AppIcon name="trend" size={20} /></span>
          <p><small>Controllo</small><strong>Team e vendite collegati</strong></p>
        </div>
      </section>

      <section className={styles.problemSection}>
        <div className={styles.problemCopy}>
          <span className={styles.sectionKicker}>Il problema vero</span>
          <h2>Troppe cose dipendono ancora da te.</h2>
          <p>
            Quando informazioni e attività vivono in strumenti diversi,
            controllare davvero il salone diventa difficile. Anche se lavori
            tutto il giorno.
          </p>
          <a className={styles.inlineCta} href="#prima-dopo">
            Vedi come Salon Pro semplifica tutto <AppIcon name="arrow" size={17} />
          </a>
        </div>
        <div className={styles.problemList}>
          {problems.map((problem) => (
            <div key={problem}><span>!</span><p>{problem}</p></div>
          ))}
        </div>
      </section>

      <section className={styles.beforeAfterSection} id="prima-dopo">
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Da gestire tutto. A vedere tutto.</span>
          <h2>Il lavoro non cambia.<br />Cambia quanto riesci a controllarlo.</h2>
        </div>
        <div className={styles.beforeAfterGrid}>
          <article className={styles.beforeCard}>
            <span className={styles.stateLabel}>Prima</span>
            <h3>Informazioni sparse</h3>
            <div className={styles.toolCloud}>
              {["WhatsApp", "Agenda", "Excel", "Cassa", "Appunti"].map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
            <p>Informazioni da cercare e ricostruire ogni volta.</p>
          </article>
          <div className={styles.transformArrow}><AppIcon name="arrow" size={24} /></div>
          <article className={styles.afterCard}>
            <span className={styles.stateLabel}>Dopo</span>
            <h3>Un solo sistema</h3>
            <div className={styles.unifiedSystem}>
              <span><AppIcon name="dashboard" size={25} /></span>
              <p><small>Tutto collegato</small><strong>Salon Pro</strong></p>
            </div>
            <p>Meno passaggi. Più visione d’insieme.</p>
          </article>
        </div>
        <p className={styles.beforeAfterStatement}>
          Dall’appuntamento all’incasso, ogni operazione aggiorna la stessa
          visione del salone.
        </p>
      </section>

      <section className={styles.benefitSection}>
        <article>
          <span>01</span><AppIcon name="agenda" size={24} />
          <h3>Gestisci</h3>
          <p>Porta appuntamenti, clienti, team e prodotti nello stesso ambiente e riduci il lavoro manuale.</p>
        </article>
        <article>
          <span>02</span><AppIcon name="dashboard" size={24} />
          <h3>Controlla</h3>
          <p>Apri Salon Pro e sai cosa sta succedendo nel salone, senza ricostruire i dati.</p>
        </article>
        <article>
          <span>03</span><AppIcon name="trend" size={24} />
          <h3>Cresci</h3>
          <p>Usa i dati dei clienti per aumentare ritorno, fidelizzazione e valore nel tempo.</p>
        </article>
      </section>

      <section className={styles.productSection} id="prodotto">
        <div className={styles.productHeading}>
          <div>
            <span className={styles.sectionKicker}>Un software vero, un flusso unico</span>
            <h2>Dall’appuntamento alla decisione successiva.</h2>
          </div>
          <p>
            Appuntamento, servizio, incasso, magazzino e storico cliente non
            sono moduli isolati. Ogni operazione aggiorna il sistema.
          </p>
        </div>
        <div className={styles.productStage}>
          <div className={styles.productStageScreen}>
            <Image
              alt="Interfaccia operativa Salon Pro"
              height={1068}
              loading="lazy"
              sizes="(max-width: 900px) 92vw, 68vw"
              src="/salon-pro-dashboard.png"
              width={1898}
            />
          </div>
          <div className={styles.flowRail}>
            {[
              ["agenda", "Appuntamento"],
              ["clients", "Cliente"],
              ["team", "Servizio"],
              ["cash", "Incasso"],
              ["trend", "Decisione"],
            ].map(([icon, label], index) => (
              <div key={label}>
                <span><AppIcon name={icon as AppIconName} size={19} /></span>
                <p><small>{"0" + (index + 1)}</small><strong>{label}</strong></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.functionsSection} id="funzioni">
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Funzioni che cambiano il lavoro</span>
          <h2>Non una lista tecnica.<br />Un modo più semplice di guidare il salone.</h2>
        </div>
        <div className={styles.featureGrid}>
          {modules.map((module, index) => (
            <article className={styles.featureCard} key={module.title}>
              <div><span><AppIcon name={module.icon} size={22} /></span><small>{"0" + (index + 1)}</small></div>
              <h3>{module.title}</h3>
              <p>{module.copy}</p>
            </article>
          ))}
        </div>
        <a
          className={styles.featureCta}
          data-analytics-event="feature_demo_click"
          data-analytics-location="features"
          href="#demo"
        >
          Vedi le funzioni sul tuo salone <AppIcon name="arrow" size={18} />
        </a>
      </section>

      <section className={styles.analyticsSection}>
        <div className={styles.analyticsCopy}>
          <span className={styles.sectionKicker}>Business Coach e Analytics</span>
          <h2>Non guardare solo quanto hai incassato. <em>Capisci perché.</em></h2>
          <strong className={styles.decisionLine}>
            Il punto non è avere più numeri. È sapere quale decisione prendere domani mattina.
          </strong>
          <p>
            Salon Pro trasforma appuntamenti, vendite e costi in informazioni
            semplici. Il Business Coach porta in primo piano priorità e azioni,
            senza sostituire le decisioni del titolare.
          </p>
          <div className={styles.metricCloud}>
            {metrics.map((metric) => <span key={metric}>{metric}</span>)}
          </div>
        </div>
        <div className={styles.coachVisual}>
          <div className={styles.coachHeader}><AppIcon name="coach" size={22} /><span>Business Coach</span><b>Dati del salone</b></div>
          <div className={styles.coachQuestion}>
            <small>La domanda utile</small>
            <strong>Qual è la prossima azione che merita attenzione?</strong>
          </div>
          <div className={styles.coachRows}>
            <div><span>Clienti</span><strong>Chi non sta tornando?</strong></div>
            <div><span>Agenda</span><strong>Dove sono le ore vuote?</strong></div>
            <div><span>Margine</span><strong>Cosa sta rendendo davvero?</strong></div>
          </div>
          <p><AppIcon name="sparkle" size={18} /> Numeri leggibili, senza metriche decorative.</p>
        </div>
      </section>

      <section className={styles.growthSection}>
        <div className={styles.growthHeading}>
          <span className={styles.sectionKicker}>Dal controllo alla crescita</span>
          <h2>Il dato diventa relazione.<br />La relazione diventa ritorno.</h2>
          <p>Business Coach, loyalty e marketing lavorano sugli stessi dati del cliente.</p>
        </div>
        <div className={styles.growthGrid}>
          <article className={styles.growthCard}>
            <span><AppIcon name="coach" size={24} /></span>
            <small>Business Coach</small>
            <h3>Capisci cosa richiede attenzione.</h3>
            <p>Ticket medio, costi, utile e andamento diventano priorità operative comprensibili.</p>
          </article>
          <article className={styles.growthCard}>
            <span><AppIcon name="wheel" size={24} /></span>
            <small>Loyalty</small>
            <h3>Dai al cliente un motivo concreto per tornare.</h3>
            <p>Card, premi e storico restano collegati alla relazione e alla prossima visita.</p>
          </article>
          <article className={styles.growthCard}>
            <span><AppIcon name="marketing" size={24} /></span>
            <small>Marketing automatico</small>
            <h3>Contatta la persona giusta, nel momento giusto.</h3>
            <p>Template e follow-up partono da segmenti e attività configurate, non da liste casuali.</p>
          </article>
        </div>
        <small className={styles.growthDisclaimer}>
          L’invio tramite WhatsApp richiede configurazione e collaudo del canale Meta, oltre al consenso del cliente.
        </small>
      </section>

      <section className={styles.scoreSection}>
        <div className={styles.scoreVisual}>
          <div className={styles.scoreRing}><span>?</span><small>/100</small></div>
          <div className={styles.scoreBars}>
            {["Organizzazione", "Clienti", "Team", "Magazzino", "Marketing"].map((label) => (
              <div key={label}><AppIcon name="check" size={14} /><span>{label}</span></div>
            ))}
          </div>
        </div>
        <div className={styles.scoreCopy}>
          <span className={styles.sectionKicker}>Check-up gratuito</span>
          <h2>In 2 minuti scopri dove stai perdendo controllo, tempo e opportunità.</h2>
          <p>
            Ricevi un punteggio su organizzazione, clienti, team, magazzino e
            marketing, con indicazioni pratiche per ogni area.
          </p>
          <Link
            className={styles.primaryCta}
            data-analytics-event="hero_score_click"
            data-analytics-location="score_section"
            href="/salon-score"
          >
            Calcola il mio Salon Score <AppIcon name="arrow" size={18} />
          </Link>
          <small>Richiede circa 2 minuti · Utile anche se non sei pronto a cambiare software</small>
        </div>
      </section>

      <section className={styles.objectionSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Prima della demo</span>
          <h2>Probabilmente ti stai chiedendo…</h2>
        </div>
        <div className={styles.objectionGrid}>
          {objections.map((item) => (
            <article key={item.question}>
              <span><AppIcon name="check" size={19} /></span>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.fitSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Una scelta consapevole</span>
          <h2>Salon Pro non è per tutti. Ed è un vantaggio.</h2>
        </div>
        <div className={styles.fitGrid}>
          <article className={styles.fitCardPositive}>
            <span className={styles.fitLabel}>Salon Pro fa per te se</span>
            <ul>
              <li><AppIcon name="check" size={18} /><span>Vuoi più controllo su ciò che accade ogni giorno.</span></li>
              <li><AppIcon name="check" size={18} /><span>Hai un team o vuoi far crescere il salone.</span></li>
              <li><AppIcon name="check" size={18} /><span>Vuoi unire strumenti, dati e attività in un unico flusso.</span></li>
            </ul>
          </article>
          <article className={styles.fitCardNegative}>
            <span className={styles.fitLabel}>Probabilmente non fa per te se</span>
            <ul>
              <li><AppIcon name="x" size={18} /><span>Cerchi soltanto un’agenda base gratuita.</span></li>
              <li><AppIcon name="x" size={18} /><span>Non vuoi cambiare alcun processo, anche quando ti fa perdere tempo.</span></li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.demoSection} id="demo">
        <div className={styles.demoCopy}>
          <span className={styles.sectionKicker}>L’offerta iniziale è la demo</span>
          <h2>Vedi Salon Pro applicato al tuo salone.</h2>
          <p>
            Non vogliamo mostrarti 50 funzioni che non userai. Partiamo da come
            lavori oggi e ti facciamo vedere soltanto ciò che può realmente
            semplificarti la gestione.
          </p>
          <div className={styles.demoSteps}>
            <div><span>01</span><p><strong>Conosciamo il salone</strong><small>Team, strumenti e priorità attuali.</small></p></div>
            <div><span>02</span><p><strong>Mostriamo il flusso utile</strong><small>Le funzioni adatte alla tua realtà.</small></p></div>
            <div><span>03</span><p><strong>Valuti senza pressione</strong><small>Si prosegue solo se Salon Pro è adatto.</small></p></div>
          </div>
        </div>
        <LeadForm />
      </section>

      <VerifiedProofSection stories={verifiedStories} />

      <section className={styles.faqSection} id="faq">
        <div className={styles.faqHeading}>
          <span className={styles.sectionKicker}>Domande frequenti</span>
          <h2>Prima di scegliere,<br />è giusto capire.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details data-faq={faq.question} key={faq.question}>
              <summary>{faq.question}<span>+</span></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span className={styles.sectionKicker}>Il prossimo passo</span>
          <h2>Il tuo salone può funzionare meglio senza dipendere da più strumenti.</h2>
          <p>Scopri come Salon Pro può adattarsi al modo in cui lavori oggi.</p>
        </div>
        <div>
          <a
            className={styles.primaryCta}
            data-analytics-event="feature_demo_click"
            data-analytics-location="final_cta"
            href="#demo"
          >
            Richiedi una demo gratuita <AppIcon name="arrow" size={18} />
          </a>
          <Link className={styles.secondaryCta} href="/salon-score">Calcola il mio Salon Score</Link>
          <small>6 minuti · Nessun impegno</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <Brand compact />
        <p>Il sistema operativo del tuo salone. Un prodotto Univibe Group S.r.l.s.</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/login">Accesso clienti</Link>
          <a href="mailto:sales.salonpro@univibegroup.it">Contatti</a>
          <span>© 2026 Salon Pro</span>
        </div>
      </footer>

      <StickyConversionBar />
    </main>
  );
}
