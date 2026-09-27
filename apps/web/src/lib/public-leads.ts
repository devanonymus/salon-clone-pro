export type LeadSource = "demo" | "salon_score";

export const PUBLIC_LEAD_FORM_NAME = "salonpro-lead";

export type LeadAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
};

export type PublicLeadPayload = LeadAttribution & {
  leadSource: LeadSource;
  name: string;
  salon: string;
  phone: string;
  email: string;
  teamSize?: string;
  currentManagement?: string;
  answers?: Record<string, string>;
  score?: number;
  categoryScores?: Record<string, number>;
  privacyAccepted: true;
  website?: string;
};

const ATTRIBUTION_KEY = "salonpro_lead_attribution";

function clean(value: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, 500) : undefined;
}
export function getLeadAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};

  let stored: LeadAttribution = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}") as LeadAttribution;
  } catch {
    stored = {};
  }

  const params = new URLSearchParams(window.location.search);
  const current: LeadAttribution = {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmContent: clean(params.get("utm_content")),
    utmTerm: clean(params.get("utm_term")),
    referrer: clean(document.referrer) || stored.referrer,
  };

  const merged = Object.fromEntries(
    Object.entries({ ...stored, ...current }).filter(([, value]) => Boolean(value)),
  ) as LeadAttribution;

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(merged));
  } catch {
    // Attribution is useful, but it must never block a lead submission.
  }

  return merged;
}

function netlifyFields(payload: PublicLeadPayload) {
  return {
    "lead-source": payload.leadSource,
    stage: "NEW",
    nome: payload.name,
    salone: payload.salon,
    telefono: payload.phone,
    email: payload.email,
    team: payload.teamSize || "",
    "gestione-attuale": payload.currentManagement || "",
    risposte: payload.answers ? JSON.stringify(payload.answers) : "",
    score: typeof payload.score === "number" ? String(payload.score) : "",
    "score-categorie": payload.categoryScores
      ? JSON.stringify(payload.categoryScores)
      : "",
    utm_source: payload.utmSource || "",
    utm_medium: payload.utmMedium || "",
    utm_campaign: payload.utmCampaign || "",
    utm_content: payload.utmContent || "",
    utm_term: payload.utmTerm || "",
    referrer: payload.referrer || "",
    "data-creazione": new Date().toISOString(),
    "privacy-accettata": payload.privacyAccepted ? "si" : "no",
    "bot-field": payload.website || "",
  };
}

async function submitToNetlify(payload: PublicLeadPayload) {
  const body = new URLSearchParams({
    "form-name": PUBLIC_LEAD_FORM_NAME,
    subject:
      payload.leadSource === "salon_score"
        ? "Nuovo Salon Score completato"
        : "Nuova richiesta demo Salon Pro",
    ...netlifyFields(payload),
  });

  const response = await fetch("/__forms.html", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) throw new Error("Invio del contatto non riuscito");
}

export async function submitPublicLead(payload: PublicLeadPayload) {
  await submitToNetlify(payload);
}
