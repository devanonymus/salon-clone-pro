import type { ReactNode } from "react";
import AppIcon, { type AppIconName } from "./AppIcon";
import styles from "./ModuleHeader.module.css";

type MetricTone = "neutral" | "accent" | "success" | "warning" | "danger";

export type ModuleMetric = {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: MetricTone;
};

export function ModuleHeader({
  eyebrow,
  title,
  description,
  icon,
  status = "Operativo",
  statusTone = "success",
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: AppIconName;
  status?: string;
  statusTone?: "success" | "warning" | "danger";
  actions?: ReactNode;
}) {
  const statusClass =
    statusTone === "danger"
      ? styles.statusDanger
      : statusTone === "warning"
        ? styles.statusWarning
        : styles.statusSuccess;

  return (
    <header className={styles.header}>
      <div className={styles.headingGroup}>
        <div className={styles.metaRow}>
          <span className={styles.iconBox}><AppIcon name={icon} size={18} /></span>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <span className={`${styles.status} ${statusClass}`}><i />{status}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}

export function ModuleMetrics({ items }: { items: ModuleMetric[] }) {
  return (
    <section className={styles.metrics} aria-label="Indicatori del modulo">
      {items.map((item) => (
        <article
          className={`${styles.metric} ${styles[item.tone || "neutral"]}`}
          key={item.label}
        >
          <span className={styles.metricLabel}>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </article>
      ))}
    </section>
  );
}
