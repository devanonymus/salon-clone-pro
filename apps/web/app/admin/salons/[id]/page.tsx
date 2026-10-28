"use client";
import { use, useEffect, useState } from "react";
import { platform, type Admin, type Salon } from "../../api";
import { DevicePanel } from "../../device-panel";
import {
  configurationFields as fields,
  requiredFields,
} from "../../configuration-fields";
import { SalonFields } from "../../salon-form";
type Detail = {
  tenant: Salon;
  configurations: {
    section: string;
    data: Record<string, string>;
    updatedAt: string;
  }[];
  onboarding: {
    key: string;
    result: string;
    notes: string;
    checkedBy: string;
    checkedAt: string | null;
  }[];
  interventions: {
    id: string;
    action: string;
    notes: string;
    adminId: string;
    createdAt: string;
  }[];
};
const tabs: Record<string, string> = {
  overview: "Panoramica",
  profile: "Anagrafica",
  users: "Utenti e personale",
  registratore: "Registratore telematico",
  pos: "POS e pagamenti",
  stampanti: "Stampanti",
  fiscalita: "Fiscalità",
  integrazioni: "WhatsApp e integrazioni",
  operativita: "Configurazione gestionale",
  checks: "Collaudo",
  history: "Registro interventi",
};
export default function SalonDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    [detail, setDetail] = useState<Detail | null>(null),
    [actor, setActor] = useState<Admin | null>(null),
    [technicians, setTechnicians] = useState<Admin[]>([]),
    [tab, setTab] = useState("overview"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  function load() {
    return platform<Detail>(`salons/${id}`)
      .then(setDetail)
      .catch((e) => setMessage(e.message));
  }
  useEffect(() => {
    platform<Detail>(`salons/${id}`)
      .then(setDetail)
      .catch((e) => setMessage(e.message));
    platform<Admin>("me")
      .then((a) => {
        setActor(a);
        if (a.role !== "TECHNICIAN")
          platform<Admin[]>("technicians")
            .then(setTechnicians)
            .catch(() => {});
      })
      .catch(() => {});
  }, [id]);
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const r = (await fn()) as { message?: string };
      setMessage(r.message || "Modifiche salvate");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!detail)
    return <p role="status">{message || "Caricamento scheda tecnica…"}</p>;
  const salon = detail.tenant,
    manage = actor?.role !== "TECHNICIAN";
  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">SCHEDA TECNICA · {salon.code}</p>
          <h1>{salon.name}</h1>
          <p className="muted">
            {salon.salonProfile?.city || "Anagrafica da completare"}
          </p>
        </div>
        <span className="badge">
          {salon.salonProfile?.status || "Senza scheda amministrativa"}
        </span>
      </div>
      <nav className="tabs" aria-label="Sezioni scheda tecnica">
        {Object.entries(tabs).map(([key, label]) => (
          <button
            className={tab === key ? "selected" : "secondary"}
            key={key}
            onClick={() => {
              setTab(key);
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <p role="status">{message}</p>
      <section
        className="panel"
        key={`${tab}-${detail.configurations.find((c) => c.section === tab)?.updatedAt || ""}`}
      >
        <h2>{tabs[tab]}</h2>
        {tab === "overview" && (
          <>
            <p>Tenant: {salon.id}</p>
            <p>Titolare: {salon.salonProfile?.ownerName || "Non registrato"}</p>
            <h3>Tecnici assegnati</h3>
            {salon.technicianAssignments.map(({ admin }) => (
              <p key={admin.id}>
                {admin.name}{" "}
                {manage && (
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        platform(
                          `salons/${id}/assignments/${admin.id}`,
                          {},
                          "DELETE",
                        ),
                      )
                    }
                  >
                    Rimuovi assegnazione
                  </button>
                )}
              </p>
            ))}
            {manage && (
              <>
                <form
                  className="toolbar"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action(() =>
                      platform(`salons/${id}/assignments`, {
                        adminId: f.get("adminId"),
                      }),
                    );
                  }}
                >
                  <label>
                    Assegna tecnico
                    <select name="adminId" required>
                      <option value="">Seleziona…</option>
                      {technicians
                        .filter((t) => t.role === "TECHNICIAN" && t.active)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button disabled={busy}>Assegna</button>
                </form>
                <h3>Stato di attivazione</h3>
                <form
                  className="toolbar"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    if (
                      confirm(`Confermare il passaggio a ${f.get("status")}?`)
                    )
                      action(() =>
                        platform(
                          `salons/${id}/status`,
                          { status: f.get("status") },
                          "PATCH",
                        ),
                      );
                  }}
                >
                  <select
                    name="status"
                    aria-label="Nuovo stato"
                    defaultValue={salon.salonProfile?.status || "BOZZA"}
                  >
                    {[
                      "BOZZA",
                      "IN_CONFIGURAZIONE",
                      "DA_COLLAUDARE",
                      "ATTIVO",
                      "SOSPESO",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button disabled={busy || !salon.salonProfile}>
                    Aggiorna stato
                  </button>
                </form>
              </>
            )}
          </>
        )}
        {tab === "profile" &&
          (manage ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                action(() => platform(`salons/${id}`, data, "PUT"));
              }}
            >
              <SalonFields
                values={{
                  ...salon.salonProfile,
                  name: salon.name,
                  code: salon.code,
                }}
              />
              <button disabled={busy}>Salva modifiche</button>
            </form>
          ) : (
            <dl>
              {Object.entries(salon.salonProfile || {})
                .filter(
                  ([k]) => !["tenantId", "createdAt", "updatedAt"].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          ))}
        {tab === "users" && (
          <>
            <p>Titolare: {salon.salonProfile?.ownerName || "Non registrato"}</p>
            {manage && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  action(() => platform(`salons/${id}/resend-invite`, {}))
                }
              >
                Invia nuovo invito titolare
              </button>
            )}
            <p>
              Invito:{" "}
              {detail.onboarding.find((c) => c.key === "TITOLARE")?.result ===
              "PASS"
                ? "Accettato"
                : "Da completare"}
            </p>
            <p>
              Il personale, le autorizzazioni del gestionale e gli operatori
              sono gestiti dal titolare nel modulo Team. Il profilo tecnico non
              consente l’accesso ai clienti o agli incassi.
            </p>
          </>
        )}
        {["registratore", "pos", "stampanti"].includes(tab) && (
          <DevicePanel
            key={`${id}-${tab}`}
            tenantId={id}
            section={tab}
            legacyData={
              detail.configurations.find((c) => c.section === tab)?.data
            }
            onChange={load}
          />
        )}
        {fields[tab] && !["registratore", "pos", "stampanti"].includes(tab) && (
          <>
            <p className="notice">
              Configurazione amministrativa. Nessun collegamento al dispositivo
              è attivo e nessuna operazione fiscale o di pagamento viene
              eseguita.
            </p>
            {tab === "fiscalita" && (
              <p>
                Le aliquote servizi e rivendita aggiornano i parametri esistenti
                del gestionale. Il salvataggio non abilita l’emissione fiscale.
              </p>
            )}
            {tab === "operativita" && (
              <p>
                L’intervallo agenda viene applicato al gestionale tramite il
                modulo esistente. Gli altri campi documentano la preparazione
                tecnica; servizi, magazzino, marketing e operatori si gestiscono
                dai rispettivi moduli.
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                const secret = data.secret;
                delete data.secret;
                action(() =>
                  platform(
                    `salons/${id}/configurations/${tab}`,
                    { data, ...(secret ? { secret } : {}) },
                    "PUT",
                  ),
                );
              }}
            >
              <div className="form-grid">
                {Object.entries(fields[tab]).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    {key === "mode" && tab === "pos" ? (
                      <select
                        name={key}
                        defaultValue={
                          detail.configurations.find((c) => c.section === tab)
                            ?.data[key] || "MANUALE"
                        }
                      >
                        {["MANUALE", "INTEGRATA", "CLOUD_API"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={requiredFields[tab]?.includes(key)}
                        name={key}
                        defaultValue={
                          detail.configurations.find((c) => c.section === tab)
                            ?.data[key] || ""
                        }
                        maxLength={2000}
                      />
                    )}
                  </label>
                ))}
                {["pos", "integrazioni"].includes(tab) && (
                  <label>
                    Credenziale tecnica (lascia vuoto per mantenerla)
                    <input
                      name="secret"
                      type="password"
                      autoComplete="new-password"
                      maxLength={8000}
                    />
                  </label>
                )}
              </div>
              <div className="actions">
                <button disabled={busy}>Salva modifiche</button>
                <button
                  disabled={busy}
                  type="button"
                  className="secondary"
                  onClick={() =>
                    action(() => platform(`salons/${id}/test/${tab}`, {}))
                  }
                >
                  Verifica supporto al test
                </button>
              </div>
            </form>
            <p className="muted">
              Esito del collegamento: non verificato. Il salvataggio invalida il
              collaudo precedente.
            </p>
          </>
        )}
        {tab === "checks" && (
          <>
            <p>
              Le prime tre verifiche sono automatiche. Per le altre registrare
              evidenze del collaudo fisico o la motivazione di non
              applicabilità. Un esito manuale non abilita gli adattatori
              software.
            </p>
            {detail.onboarding.length ? (
              detail.onboarding.map((c) => (
                <form
                  key={`${c.key}-${c.checkedAt}`}
                  className="check-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action(() =>
                      platform(
                        `salons/${id}/checks/${c.key}`,
                        Object.fromEntries(f),
                        "PUT",
                      ),
                    );
                  }}
                >
                  <strong>{c.key}</strong>
                  <select
                    aria-label={`Esito ${c.key}`}
                    name="result"
                    defaultValue={c.result}
                    disabled={["ANAGRAFICA", "TENANT", "TITOLARE"].includes(
                      c.key,
                    )}
                  >
                    {[
                      "PENDING",
                      "PASS",
                      "FAIL",
                      ...([
                        "REGISTRATORE",
                        "POS",
                        "STAMPANTE",
                        "INTEGRAZIONI",
                      ].includes(c.key)
                        ? ["NA"]
                        : []),
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <input
                    aria-label={`Evidenze ${c.key}`}
                    name="notes"
                    defaultValue={c.notes}
                    placeholder="Evidenze / motivazione"
                    disabled={["ANAGRAFICA", "TENANT", "TITOLARE"].includes(
                      c.key,
                    )}
                  />
                  {!["ANAGRAFICA", "TENANT", "TITOLARE"].includes(c.key) && (
                    <button disabled={busy}>Salva</button>
                  )}
                  <small>
                    {c.checkedAt
                      ? new Date(c.checkedAt).toLocaleString("it-IT")
                      : "Da verificare"}{" "}
                    · {c.checkedBy || "Sistema"}
                  </small>
                </form>
              ))
            ) : (
              <p>
                Checklist non presente per questo tenant esistente. Occorre
                completare il percorso di adozione prima dell’attivazione.
              </p>
            )}
          </>
        )}
        {tab === "history" && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                action(() =>
                  platform(`salons/${id}/interventions`, {
                    notes: f.get("notes"),
                  }),
                );
              }}
            >
              <label>
                Nuovo intervento
                <textarea
                  name="notes"
                  required
                  minLength={3}
                  maxLength={2000}
                />
              </label>
              <button disabled={busy}>Registra intervento</button>
            </form>
            {detail.interventions.map((i) => (
              <article className="intervention" key={i.id}>
                <small>
                  {new Date(i.createdAt).toLocaleString("it-IT")} · {i.adminId}
                </small>
                <h3>{i.action}</h3>
                <p>{i.notes}</p>
              </article>
            ))}
            {!detail.interventions.length && (
              <p>Nessun intervento registrato.</p>
            )}
          </>
        )}
      </section>
    </>
  );
}
