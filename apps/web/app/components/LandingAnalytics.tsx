"use client";

import { useEffect } from "react";
import { trackEvent, type SalonAnalyticsEvent } from "../../src/lib/analytics";
import { getLeadAttribution } from "../../src/lib/public-leads";

export default function LandingAnalytics() {
  useEffect(() => {
    getLeadAttribution();

    const handleClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-analytics-event]",
      );
      const eventName = target?.dataset.analyticsEvent as
        | SalonAnalyticsEvent
        | undefined;
      if (!eventName) return;
      trackEvent(eventName, {
        label: target?.dataset.analyticsLabel,
        location: target?.dataset.analyticsLocation,
      });
    };

    const handleToggle = (event: Event) => {
      const details = event.target as HTMLDetailsElement;
      if (!details.open || !details.matches("[data-faq]")) return;
      trackEvent("faq_interaction", {
        question: details.dataset.faq,
      });
    };

    document.addEventListener("click", handleClick);
    document.querySelectorAll("details[data-faq]").forEach((details) => {
      details.addEventListener("toggle", handleToggle);
    });

    return () => {
      document.removeEventListener("click", handleClick);
      document.querySelectorAll("details[data-faq]").forEach((details) => {
        details.removeEventListener("toggle", handleToggle);
      });
    };
  }, []);

  return null;
}
