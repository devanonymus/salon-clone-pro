"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../landing.module.css";

export default function StickyConversionBar() {
  const [showDesktopBar, setShowDesktopBar] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowDesktopBar(!entry.isIntersecting),
      { threshold: 0.05 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className={styles.mobileCta}>
        <a data-analytics-event="hero_demo_click" data-analytics-location="mobile_sticky" href="#demo">Richiedi demo</a>
        <Link data-analytics-event="hero_score_click" data-analytics-location="mobile_sticky" href="/salon-score">Salon Score</Link>
      </div>

      {showDesktopBar ? (
        <aside aria-label="Azioni rapide Salon Pro" className={styles.desktopCta}>
          <strong>Salon Pro</strong>
          <span />
          <a data-analytics-event="hero_demo_click" data-analytics-location="desktop_sticky" href="#demo">Demo gratuita</a>
          <Link data-analytics-event="hero_score_click" data-analytics-location="desktop_sticky" href="/salon-score">Salon Score</Link>
        </aside>
      ) : null}
    </>
  );
}
