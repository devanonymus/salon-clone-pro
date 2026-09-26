export type SalonAnalyticsEvent =
  | "hero_demo_click"
  | "hero_score_click"
  | "feature_demo_click"
  | "salon_score_start"
  | "salon_score_step"
  | "salon_score_complete"
  | "salon_score_lead"
  | "demo_form_start"
  | "demo_form_submit"
  | "whatsapp_click"
  | "pricing_interest"
  | "faq_interaction";

type EventParameters = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      eventName: string,
      parameters?: EventParameters,
    ) => void;
    fbq?: (
      command: "trackCustom",
      eventName: string,
      parameters?: EventParameters,
    ) => void;
  }
}
export function trackEvent(
  event: SalonAnalyticsEvent,
  parameters: EventParameters = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...parameters });
  window.gtag?.("event", event, parameters);
  window.fbq?.("trackCustom", event, parameters);
}
