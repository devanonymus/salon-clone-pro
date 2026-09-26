"use client";

import { type CSSProperties, type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import AppIcon from "./AppIcon";
import { trackEvent } from "../../src/lib/analytics";
import {
  getLeadAttribution,
  submitPublicLead,
} from "../../src/lib/public-leads";
import {
  calculateSalonScore,
  getAnswerLabels,
  salonScoreQuestions,
  type SalonScoreResult,
} from "../../src/lib/salon-score";
import styles from "../salon-score/score.module.css";

type View = "questions" | "lead" | "result";
type SubmitState = "idle" | "submitting" | "error";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export default function SalonScoreQuiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [view, setView] = useState<View>("questions");
  const [result, setResult] = useState<SalonScoreResult | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const question = salonScoreQuestions[current];
  const progress =
    view === "questions"
      ? Math.round((current / salonScoreQuestions.length) * 100)
      : 100;

  const categoryScores = useMemo(
    () =>
      result
        ? Object.fromEntries(result.areas.map((area) => [area.key, area.score]))
        : {},
    [result],
  );

  function chooseAnswer(answerId: string) {
    const nextAnswers = { ...answers, [question.id]: answerId };
    setAnswers(nextAnswers);

    if (current === 0) {
      trackEvent("salon_score_start", { total_steps: salonScoreQuestions.length });
    }

    trackEvent("salon_score_step", {
      step: current + 1,
      question: question.id,
      answer: answerId,
    });

    if (current === salonScoreQuestions.length - 1) {
      const nextResult = calculateSalonScore(nextAnswers);
      setResult(nextResult);
      trackEvent("salon_score_complete", { score: nextResult.score });
      window.setTimeout(() => setView("lead"), 140);
      return;
    }

    window.setTimeout(() => setCurrent((value) => value + 1), 140);
  }

  function goBack() {
    if (view === "lead") {
      setView("questions");
      setCurrent(salonScoreQuestions.length - 1);
      return;
    }
    setCurrent((value) => Math.max(0, value - 1));
  }

  async function handleLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result) return;
    const formData = new FormData(event.currentTarget);

    try {
      setSubmitState("submitting");
      await submitPublicLead("salon-score", {
        leadSource: "salon_score",
        name: readString(formData, "nome"),
        salon: readString(formData, "salone"),
        phone: readString(formData, "telefono"),
        email: readString(formData, "email"),
        teamSize: getAnswerLabels(answers).team_size,
        answers: getAnswerLabels(answers),
        score: result.score,
        categoryScores,
        website: readString(formData, "bot-field"),
        privacyAccepted: true,
        ...getLeadAttribution(),
      });
      trackEvent("salon_score_lead", { score: result.score });
      setView("result");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <div className={styles.quizShell}>
      <div className={styles.quizTopbar}>
        <Link aria-label="Torna alla home Salon Pro" className={styles.quizBrand} href="/">
          <span>SP</span>
          <strong>Salon<em>Pro</em></strong>
        </Link>
        <div className={styles.quizProgressMeta}>
          <span>
            {view === "questions"
              ? "Domanda " + (current + 1) + " di " + salonScoreQuestions.length
              : view === "lead"
                ? "Diagnosi pronta"
                : "Il tuo risultato"}
          </span>
          <b>{progress}%</b>
        </div>
      </div>

      <div className={styles.progressTrack} aria-label={"Avanzamento " + progress + "%"}>
        <i style={{ "--progress": progress + "%" } as CSSProperties} />
      </div>

      {view === "questions" ? (
        <section className={styles.questionPanel} aria-live="polite">
          <div className={styles.questionCopy}>
            <span className={styles.kicker}>Salon Score gratuito</span>
            <h1>{question.question}</h1>
            {question.helper ? <p>{question.helper}</p> : null}
          </div>

          <div className={styles.answerGrid}>
            {question.answers.map((answer) => {
              const selected = answers[question.id] === answer.id;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? styles.answerSelected : ""}
                  key={answer.id}
                  onClick={() => chooseAnswer(answer.id)}
                  type="button"
                >
                  <span>{answer.label}</span>
                  <i><AppIcon name={selected ? "check" : "arrow"} size={19} /></i>
                </button>
              );
            })}
          </div>

          <div className={styles.quizFooter}>
            <button
              className={styles.backButton}
              disabled={current === 0}
              onClick={goBack}
              type="button"
            >
              ← Indietro
            </button>
            <small>Le risposte servono soltanto a costruire la tua diagnosi.</small>
          </div>
        </section>
      ) : null}

      {view === "lead" && result ? (
        <section className={styles.leadGate}>
          <button className={styles.backButton} onClick={goBack} type="button">← Modifica risposte</button>
          <div className={styles.leadGateGrid}>
            <div className={styles.leadGateCopy}>
              <span className={styles.readyBadge}><AppIcon name="check" size={17} /> Analisi completata</span>
              <h1>Il tuo risultato è pronto.</h1>
              <p>
                Inserisci i tuoi recapiti per vedere punteggio, aree critiche e
                azioni consigliate. Il check-up resta gratuito e non ti obbliga
                a richiedere una demo.
              </p>
              <ul>
                <li><AppIcon name="check" size={17} /> Punteggio complessivo</li>
                <li><AppIcon name="check" size={17} /> Analisi di 5 aree del salone</li>
                <li><AppIcon name="check" size={17} /> Un consiglio pratico per ogni area</li>
              </ul>
            </div>

            <form
              className={styles.scoreLeadForm}
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              method="POST"
              name="salon-score"
              onSubmit={handleLead}
            >
              <input name="form-name" type="hidden" value="salon-score" />
              <input name="lead-source" type="hidden" value="salon_score" />
              <input name="stage" type="hidden" value="NEW" />
              <input name="score" type="hidden" value={result.score} />
              <p className={styles.honeypot}><label>Non compilare <input name="bot-field" /></label></p>

              <div className={styles.leadFields}>
                <label><span>Nome *</span><input autoComplete="name" name="nome" required /></label>
                <label><span>Nome salone *</span><input autoComplete="organization" name="salone" required /></label>
                <label><span>Telefono *</span><input autoComplete="tel" inputMode="tel" name="telefono" required type="tel" /></label>
                <label><span>Email *</span><input autoComplete="email" inputMode="email" name="email" required type="email" /></label>
              </div>

              <label className={styles.scoreConsent}>
                <input name="privacy-accettata" required type="checkbox" value="si" />
                <span>
                  Ho letto l’<a href="/privacy" target="_blank">informativa privacy</a> e
                  chiedo di ricevere il mio Salon Score.
                </span>
              </label>

              {submitState === "error" ? (
                <p className={styles.formError} role="alert">
                  Non siamo riusciti a salvare il risultato. Riprova tra qualche istante.
                </p>
              ) : null}

              <button className={styles.revealButton} disabled={submitState === "submitting"} type="submit">
                <span>{submitState === "submitting" ? "Preparazione risultato…" : "Mostrami il risultato"}</span>
                <AppIcon name="arrow" size={19} />
              </button>
              <small>Nessun impegno · Nessun dato superfluo</small>
            </form>
          </div>
        </section>
      ) : null}

      {view === "result" && result ? (
        <section className={styles.resultPanel}>
          <div className={styles.resultHero}>
            <div
              className={styles.scoreGauge}
              style={{ "--score": result.score * 3.6 + "deg" } as CSSProperties}
            >
              <div><strong>{result.score}</strong><span>/100</span></div>
            </div>
            <div>
              <span className={styles.kicker}>Il tuo Salon Score</span>
              <h1>Una fotografia chiara. Non un voto.</h1>
              <p>{result.summary}</p>
            </div>
          </div>

          <div className={styles.areaList}>
            {result.areas.map((area) => (
              <article className={styles.areaCard} key={area.key}>
                <div className={styles.areaHeader}>
                  <div><span>{area.label}</span><strong>{area.status}</strong></div>
                  <b>{area.score}<small>/100</small></b>
                </div>
                <div className={styles.areaBar}><i style={{ "--area-score": area.score + "%" } as CSSProperties} /></div>
                <p>{area.explanation}</p>
                <div className={styles.areaAdvice}>
                  <AppIcon name="sparkle" size={18} />
                  <span><strong>Prossimo passo</strong>{area.advice}</span>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.resultBridge}>
            <div>
              <span className={styles.kicker}>E se queste attività lavorassero insieme?</span>
              <h2>Salon Pro riunisce ciò che oggi gestisci separatamente.</h2>
              <p>
                Nella demo partiamo dalle aree emerse dal tuo Salon Score e ti
                mostriamo come controllarle da un unico posto.
              </p>
            </div>
            <Link
              className={styles.resultCta}
              data-analytics-event="feature_demo_click"
              data-analytics-location="score_result"
              href="/#demo"
            >
              Voglio vedere Salon Pro sul mio salone <AppIcon name="arrow" size={19} />
            </Link>
            <small>Demo gratuita · Nessun impegno</small>
          </div>
        </section>
      ) : null}
    </div>
  );
}
