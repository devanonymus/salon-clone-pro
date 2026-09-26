export type SalonScoreArea =
  | "organization"
  | "clients"
  | "team"
  | "inventory"
  | "marketing";

export type SalonScoreAnswer = {
  id: string;
  label: string;
  points?: number;
};

export type SalonScoreQuestion = {
  id: string;
  question: string;
  helper?: string;
  area?: SalonScoreArea;
  answers: SalonScoreAnswer[];
};

export type SalonScoreAreaResult = {
  key: SalonScoreArea;
  label: string;
  score: number;
  status: string;
  explanation: string;
  advice: string;
};

export type SalonScoreResult = {
  score: number;
  summary: string;
  areas: SalonScoreAreaResult[];
};

export const salonScoreQuestions: SalonScoreQuestion[] = [
  {
    id: "team_size",
    question: "Quante persone lavorano nel tuo salone?",
    answers: [
      { id: "solo", label: "Solo io" },
      { id: "2_3", label: "2–3" },
      { id: "4_6", label: "4–6" },
      { id: "7_plus", label: "7+" },
    ],
  },
  {
    id: "appointments",
    question: "Come gestisci oggi gli appuntamenti?",
    area: "organization",
    answers: [
      { id: "paper", label: "Agenda cartacea", points: 0 },
      { id: "whatsapp_phone", label: "WhatsApp / telefono", points: 1 },
      { id: "google_calendar", label: "Google Calendar", points: 2 },
      { id: "management", label: "Gestionale", points: 4 },
      { id: "mixed", label: "Più strumenti insieme", points: 1 },
    ],
  },
  {
    id: "inactive_clients",
    question: "Riesci a capire facilmente quali clienti non tornano da tempo?",
    area: "clients",
    answers: [
      { id: "yes", label: "Sì", points: 4 },
      { id: "partly", label: "In parte", points: 2 },
      { id: "no", label: "No", points: 0 },
    ],
  },
  {
    id: "staff_performance",
    question: "Sai quanto produce ogni collaboratore?",
    helper: "Se lavori da solo, considera quanto facilmente misuri i tuoi risultati.",
    area: "team",
    answers: [
      { id: "always", label: "Sì, sempre", points: 4 },
      { id: "month_end", label: "Solo a fine mese", points: 2 },
      { id: "roughly", label: "Più o meno", points: 1 },
      { id: "no", label: "No", points: 0 },
    ],
  },
  {
    id: "inventory",
    question: "Come controlli il magazzino?",
    area: "inventory",
    answers: [
      { id: "management", label: "Gestionale", points: 4 },
      { id: "sheets", label: "Excel / fogli", points: 2 },
      { id: "manual", label: "Manuale", points: 1 },
      { id: "imprecise", label: "Non lo controllo con precisione", points: 0 },
    ],
  },
  {
    id: "reactivation",
    question: "Ricontatti i clienti che non tornano?",
    area: "marketing",
    answers: [
      { id: "automatic", label: "Automaticamente", points: 4 },
      { id: "manual", label: "Manuale", points: 3 },
      { id: "rarely", label: "Raramente", points: 1 },
      { id: "never", label: "Mai", points: 0 },
    ],
  },
  {
    id: "client_marketing",
    question: "Fai marketing sui tuoi clienti?",
    area: "marketing",
    answers: [
      { id: "structured", label: "Sì, in modo strutturato", points: 4 },
      { id: "sometimes", label: "Ogni tanto", points: 2 },
      { id: "generic", label: "Solo promozioni generiche", points: 1 },
      { id: "no", label: "No", points: 0 },
    ],
  },
  {
    id: "loyalty",
    question: "Hai un sistema di fidelizzazione?",
    area: "clients",
    answers: [
      { id: "yes", label: "Sì", points: 4 },
      { id: "simple", label: "Molto semplice", points: 2 },
      { id: "no", label: "No", points: 0 },
    ],
  },
];

const areaContent: Record<
  SalonScoreArea,
  {
    label: string;
    explanations: [string, string, string, string];
    advice: [string, string, string, string];
  }
> = {
  organization: {
    label: "Organizzazione",
    explanations: [
      "Gli appuntamenti dipendono ancora da passaggi manuali o strumenti separati.",
      "La base organizzativa c’è, ma alcune informazioni possono ancora disperdersi.",
      "L’agenda è abbastanza strutturata e offre una visione utile del lavoro.",
      "La gestione degli appuntamenti è centralizzata e facilmente leggibile.",
    ],
    advice: [
      "Porta appuntamenti e disponibilità in un’unica agenda condivisa.",
      "Riduci i canali paralleli e definisci una sola fonte affidabile.",
      "Collega l’agenda a clienti, servizi e incassi per eliminare altri passaggi.",
      "Mantieni il flusso centralizzato e monitora occupazione e prebooking.",
    ],
  },
  clients: {
    label: "Clienti",
    explanations: [
      "Lo storico cliente non aiuta ancora a riconoscere assenze e opportunità di ritorno.",
      "Alcune informazioni esistono, ma non sono sempre immediate o azionabili.",
      "Conosci abbastanza bene il comportamento dei clienti e la loro frequenza.",
      "Storico e fidelizzazione permettono di seguire la relazione nel tempo.",
    ],
    advice: [
      "Costruisci uno storico unico con visite, preferenze e ultima presenza.",
      "Crea segmenti semplici: nuovi, ricorrenti e clienti da recuperare.",
      "Collega lo storico a percorsi loyalty e prossima visita.",
      "Continua a misurare ritorno, frequenza e valore della relazione.",
    ],
  },
  team: {
    label: "Team",
    explanations: [
      "La produttività è difficile da leggere senza ricostruire i dati a mano.",
      "Hai una percezione dei risultati, ma non sempre una lettura tempestiva.",
      "Le performance sono visibili con una periodicità utile per intervenire.",
      "Hai una visione chiara e continua del contributo operativo del team.",
    ],
    advice: [
      "Collega appuntamenti, servizi e vendite alla persona che li ha gestiti.",
      "Controlla indicatori semplici durante il mese, non soltanto alla fine.",
      "Usa i dati per distribuire carichi e obiettivi con maggiore precisione.",
      "Mantieni indicatori comprensibili e condividi priorità concrete.",
    ],
  },
  inventory: {
    label: "Magazzino",
    explanations: [
      "Scorte e consumi possono emergere soltanto quando manca già un prodotto.",
      "Il controllo esiste, ma richiede aggiornamenti manuali e verifiche frequenti.",
      "Le scorte sono abbastanza leggibili e le criticità si possono anticipare.",
      "Prodotti e movimenti sono gestiti in modo strutturato e verificabile.",
    ],
    advice: [
      "Registra carichi, scarichi e soglie minime in un solo sistema.",
      "Riduci gli aggiornamenti duplicati e collega i movimenti alle vendite.",
      "Aggiungi alert sulle scorte e controlla rotazione e prodotti fermi.",
      "Continua a usare soglie, movimenti e costi per acquistare con criterio.",
    ],
  },
  marketing: {
    label: "Marketing",
    explanations: [
      "Le azioni commerciali sono occasionali e non partono dal comportamento reale dei clienti.",
      "Il ricontatto avviene, ma richiede tempo e non segue ancora un metodo costante.",
      "Le attività sono abbastanza organizzate e distinguono alcuni gruppi di clienti.",
      "Ricontatto e campagne seguono regole chiare e dati aggiornati.",
    ],
    advice: [
      "Parti da un flusso semplice per clienti assenti e appuntamenti non riprenotati.",
      "Prepara template e liste automatiche per rendere costante il follow-up.",
      "Collega messaggi, segmenti e risultati per capire cosa funziona.",
      "Continua a personalizzare i flussi e misura ritorni e prenotazioni generate.",
    ],
  },
};

function scoreBand(score: number) {
  if (score >= 80) return 3;
  if (score >= 60) return 2;
  if (score >= 35) return 1;
  return 0;
}

function scoreStatus(score: number) {
  if (score >= 80) return "Sotto controllo";
  if (score >= 60) return "Buona base";
  if (score >= 35) return "Da strutturare";
  return "Priorità alta";
}

export function calculateSalonScore(
  answers: Record<string, string>,
): SalonScoreResult {
  const buckets = new Map<SalonScoreArea, number[]>();

  for (const question of salonScoreQuestions) {
    if (!question.area) continue;
    const selected = question.answers.find(
      (answer) => answer.id === answers[question.id],
    );
    if (typeof selected?.points !== "number") continue;
    const values = buckets.get(question.area) || [];
    values.push(selected.points);
    buckets.set(question.area, values);
  }

  const areaOrder: SalonScoreArea[] = [
    "organization",
    "clients",
    "team",
    "inventory",
    "marketing",
  ];

  const areas = areaOrder.map((key) => {
    const values = buckets.get(key) || [0];
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const score = Math.round((average / 4) * 100);
    const band = scoreBand(score);
    const content = areaContent[key];
    return {
      key,
      label: content.label,
      score,
      status: scoreStatus(score),
      explanation: content.explanations[band],
      advice: content.advice[band],
    };
  });

  const score = Math.round(
    areas.reduce((sum, area) => sum + area.score, 0) / areas.length,
  );

  const summary =
    score >= 80
      ? "Il salone ha processi ben strutturati. Il prossimo passo è collegare meglio dati e azioni per mantenere il controllo mentre cresce."
      : score >= 60
        ? "Il salone ha una buona base organizzativa, ma alcune attività dipendono ancora da controlli manuali o strumenti separati."
        : score >= 35
          ? "Diverse attività funzionano, ma informazioni e responsabilità sono ancora frammentate. Centralizzarle può liberare tempo e rendere le decisioni più semplici."
          : "Oggi molte informazioni dipendono dalla memoria o da passaggi manuali. Creare un unico flusso può aumentare subito visibilità e continuità operativa.";

  return { score, summary, areas };
}

export function getAnswerLabels(answers: Record<string, string>) {
  return Object.fromEntries(
    salonScoreQuestions.map((question) => {
      const selected = question.answers.find(
        (answer) => answer.id === answers[question.id],
      );
      return [question.id, selected?.label || ""];
    }),
  );
}
