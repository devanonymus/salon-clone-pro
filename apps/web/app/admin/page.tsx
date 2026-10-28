"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { platform } from "./api";
type Dashboard = {
  devices: number;
  legacyConfigurations: number;
  overdue: number;
  upcoming: number;
  deviceFailures: number;
  deadlines: {
    id: string;
    tenantId: string;
    label: string;
    section: string;
    dueDate: string;
    physicalCheck: string;
    tenant: { name: string };
  }[];
  salons: number;
  active: number;
  suspended: number;
  configuring: number;
  unprofiled: number;
  configurations: number;
  pending: number;
  technicians: number;
  activities: {
    id: string;
    action: string;
    tenantId: string | null;
    createdAt: string;
  }[];
};
export default function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    platform<Dashboard>("dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">CONTROL CENTER</p>
          <h1>La piattaforma, a colpo d’occhio.</h1>
          <p className="muted">
            Attivazioni, configurazioni e attività tecniche dei saloni
            autorizzati.
          </p>
        </div>
        <Link className="button" href="/admin/salons">
          Gestisci saloni →
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {!data ? (
        <div className="skeleton" role="status">
          Caricamento indicatori…
        </div>
      ) : (
        <>
          <div className="metrics">
            {[
              ["Saloni attivi", data.active],
              ["In configurazione", data.configuring],
              ["Saloni sospesi", data.suspended],
              ["Collaudi incompleti", data.pending],
              ["Tecnici attivi", data.technicians],
              ["Dispositivi censiti", data.devices],
              ["Verifiche scadute", data.overdue],
              ["Verifiche entro 30 giorni", data.upcoming],
              ["Collaudi con anomalie", data.deviceFailures],
            ].map(([label, value]) => (
              <article key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <section className="panel">
            <h2>Ultime attività amministrative</h2>
            {data.activities.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Operazione</th>
                      <th>Salone</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.activities.map((a) => (
                      <tr key={a.id}>
                        <td>{a.action}</td>
                        <td>
                          {a.tenantId ? (
                            <Link href={`/admin/salons/${a.tenantId}`}>
                              Apri scheda
                            </Link>
                          ) : (
                            "Piattaforma"
                          )}
                        </td>
                        <td>{new Date(a.createdAt).toLocaleString("it-IT")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Nessuna attività registrata.</p>
            )}
          </section>
          <section className="panel">
            <h2>Scadenze tecniche</h2>
            <p className="muted">
              Date inserite nelle schede dispositivo, calcolate sul calendario
              italiano. Sono mostrati i primi 20 dispositivi in ordine di
              scadenza. Non è un controllo automatico dei dispositivi.
            </p>
            {data.deadlines.length ? (
              <div className="table-wrap">
                <table className="deadline-table">
                  <thead>
                    <tr>
                      <th>Salone</th>
                      <th>Dispositivo</th>
                      <th>Verifica entro</th>
                      <th>Esito fisico registrato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deadlines.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <Link href={`/admin/salons/${d.tenantId}`}>
                            {d.tenant.name}
                          </Link>
                        </td>
                        <td>
                          {d.label} · {d.section}
                        </td>
                        <td>
                          {new Date(d.dueDate).toLocaleDateString("it-IT", {
                            timeZone: "UTC",
                          })}
                        </td>
                        <td>{d.physicalCheck}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Nessuna verifica scaduta o prevista nei prossimi 30 giorni.</p>
            )}
          </section>
          <section className="panel">
            <h2>Stato delle verifiche</h2>
            <p>
              {data.unprofiled} saloni esistenti senza scheda amministrativa.
              Nessuno stato è stato assegnato automaticamente.
            </p>
            <p>
              {data.legacyConfigurations} configurazioni precedenti ancora da
              importare nell’archivio dispositivi. Le anomalie indicate derivano
              dai collaudi manuali registrati. Il monitoraggio automatico delle
              integrazioni rimane non collegato.
            </p>
          </section>
        </>
      )}
    </>
  );
}
