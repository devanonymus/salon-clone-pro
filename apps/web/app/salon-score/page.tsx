import type { Metadata } from "next";
import SalonScoreQuiz from "../components/SalonScoreQuiz";
import LandingAnalytics from "../components/LandingAnalytics";
import styles from "./score.module.css";

export const metadata: Metadata = {
  title: "Salon Score gratuito",
  description:
    "Scopri quanto è davvero sotto controllo il tuo salone con un check-up gratuito di organizzazione, clienti, team, magazzino e marketing.",
  alternates: { canonical: "/salon-score" },
};

export default function SalonScorePage() {
  return (
    <main className={styles.scorePage}>
      <LandingAnalytics />
      <div className={styles.scoreGlow} />
      <SalonScoreQuiz />
    </main>
  );
}
