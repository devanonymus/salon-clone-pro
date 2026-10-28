"use client";
import { useEffect, useRef, useState, useId } from "react";
import { platform } from "./api";
import { configurationFields, requiredFields } from "./configuration-fields";
type Device = {
  id: string;
  section: string;
  label: string;
  data: Record<string, string>;
  dueDate: string | null;
  physicalCheck: "PENDING" | "PASS" | "FAIL";
  checkedAt: string | null;
  checkedBy: string | null;
  checkNotes: string;
  version: number;
  archivedAt: string | null;
  legacyConfigurationId: string | null;
};
type DeviceList = { devices: Device[]; legacyAvailable: boolean };
type Props = {
  tenantId: string;
  section: string;
  legacyData?: Record<string, string>;
  onChange: () => Promise<unknown>;
};
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="device-modal"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h3 id={titleId}>{title}</h3>
      {children}
    </dialog>
  );
}
export function DevicePanel({
  tenantId,
  section,
  legacyData,
  onChange,
}: Props) {
  const [data, setData] = useState<DeviceList | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [showArchived, setShowArchived] = useState(false),
    [editor, setEditor] = useState<{
      device?: Device;
      importLegacy?: boolean;
    } | null>(null),
    [checking, setChecking] = useState<Device | null>(null);
  async function load() {
    const next = await platform<DeviceList>(
      `salons/${tenantId}/devices/section/${section}`,
    );
    setData(next);
  }
  useEffect(() => {
    platform<DeviceList>(`salons/${tenantId}/devices/section/${section}`)
      .then(setData)
      .catch((e) => setMessage(e.message));
  }, [tenantId, section]);
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const result = (await fn()) as { message?: string };
      setMessage(result?.message || "Operazione salvata");
      await load();
      await onChange();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const rows = data?.devices.filter((d) => showArchived || !d.archivedAt) || [];
  return (
    <div>
      <p className="notice">
        Ogni dispositivo ha una scheda e un collaudo fisico distinti. Il
        salvataggio e un esito manuale PASS non abilitano protocolli fiscali,
        pagamenti o stampa automatica.
      </p>
      <div className="toolbar">
        <button disabled={busy} onClick={() => setEditor({})}>
          Aggiungi dispositivo
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => action(load)}
        >
          Ricarica elenco
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Mostra archiviati
        </label>
      </div>
      {data?.legacyAvailable && (
        <div className="notice">
          <p>
            È presente una configurazione della versione precedente. Puoi
            importarla e completarla in una scheda dispositivo: la copia
            originale sarà conservata e le credenziali saranno trasferite senza
            mostrarle.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setEditor({ importLegacy: true })}
          >
            Importa configurazione precedente
          </button>
        </div>
      )}
      <p role="status">{message}</p>
      {!data ? (
        <p role="status">Caricamento dispositivi…</p>
      ) : !rows.length ? (
        <p>
          Nessun dispositivo {showArchived ? "registrato" : "attivo"} in questa
          sezione.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Identificazione</th>
                <th>Collaudo fisico</th>
                <th>Scadenza verifica</th>
                <th>Operazioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.label}</strong>
                    <br />
                    <small>
                      {d.archivedAt ? "Archiviato" : "Scheda attiva"} · v
                      {d.version}
                    </small>
                  </td>
                  <td>
                    {d.data.registration || d.data.terminalId || d.data.model}
                    <br />
                    <small>{d.data.station || "Postazione non indicata"}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${d.physicalCheck === "FAIL" ? "badge-error" : ""}`}
                    >
                      {d.physicalCheck === "PASS"
                        ? "Verifica manuale superata"
                        : d.physicalCheck === "FAIL"
                          ? "Anomalia registrata"
                          : "Da collaudare"}
                    </span>
                    {d.checkedAt && (
                      <small className="device-check-meta">
                        {new Date(d.checkedAt).toLocaleString("it-IT", {
                          timeZone: "Europe/Rome",
                        })}{" "}
                        · {d.checkedBy}
                      </small>
                    )}
                    {d.checkNotes && (
                      <p className="device-notes">{d.checkNotes}</p>
                    )}
                  </td>
                  <td>
                    {d.dueDate
                      ? new Date(d.dueDate).toLocaleDateString("it-IT", {
                          timeZone: "UTC",
                        })
                      : "Non impostata"}
                  </td>
                  <td>
                    <div className="device-actions">
                      {d.archivedAt ? (
                        <button
                          disabled={busy}
                          className="secondary"
                          onClick={() => {
                            if (
                              confirm(
                                `Ripristinare ${d.label}? Il collaudo dovrà essere ripetuto.`,
                              )
                            )
                              action(() =>
                                platform(
                                  `salons/${tenantId}/devices/${d.id}/restore`,
                                  { version: d.version },
                                ),
                              );
                          }}
                        >
                          Ripristina
                        </button>
                      ) : (
                        <>
                          <button
                            disabled={busy}
                            className="secondary"
                            onClick={() => setEditor({ device: d })}
                          >
                            Modifica
                          </button>
                          <button
                            disabled={busy}
                            className="secondary"
                            onClick={() => setChecking(d)}
                          >
                            Registra collaudo
                          </button>
                          <button
                            disabled={busy}
                            className="secondary"
                            onClick={() =>
                              action(() =>
                                platform(
                                  `salons/${tenantId}/devices/${d.id}/test`,
                                  {},
                                ),
                              )
                            }
                          >
                            Verifica supporto
                          </button>
                          <button
                            disabled={busy}
                            className="secondary"
                            onClick={() => {
                              if (
                                confirm(
                                  `Archiviare ${d.label}? Lo storico sarà conservato.`,
                                )
                              )
                                action(() =>
                                  platform(
                                    `salons/${tenantId}/devices/${d.id}/archive`,
                                    { version: d.version },
                                  ),
                                );
                            }}
                          >
                            Archivia
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editor && (
        <DeviceEditor
          tenantId={tenantId}
          section={section}
          device={editor.device}
          legacyData={editor.importLegacy ? legacyData : undefined}
          importLegacy={editor.importLegacy}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await load();
            await onChange();
            setMessage(
              "Scheda salvata. Ripetere il collaudo del dispositivo e della sezione.",
            );
          }}
        />
      )}
      {checking && (
        <DeviceCheck
          tenantId={tenantId}
          device={checking}
          onClose={() => setChecking(null)}
          onSaved={async () => {
            setChecking(null);
            await load();
            await onChange();
            setMessage(
              "Esito registrato. Completare anche la verifica di sezione e il collaudo finale.",
            );
          }}
        />
      )}
    </div>
  );
}
function DeviceEditor({
  tenantId,
  section,
  device,
  legacyData,
  importLegacy,
  onClose,
  onSaved,
}: {
  tenantId: string;
  section: string;
  device?: Device;
  legacyData?: Record<string, string>;
  importLegacy?: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const values = device?.data || legacyData || {};
  return (
    <Modal
      title={
        device
          ? `Modifica ${device.label}`
          : importLegacy
            ? "Importa e completa il dispositivo"
            : "Nuovo dispositivo"
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget),
            data: Record<string, string> = {};
          for (const key of Object.keys(configurationFields[section]))
            data[key] = String(form.get(key) || "");
          const secret = String(form.get("secret") || "");
          const body = {
            label: String(form.get("label") || ""),
            dueDate: form.get("dueDate") || null,
            data,
            ...(form.get("removeSecret")
              ? { secret: "" }
              : secret
                ? { secret }
                : {}),
            ...(device ? { version: device.version } : {}),
          };
          try {
            await platform(
              device
                ? `salons/${tenantId}/devices/${device.id}`
                : `salons/${tenantId}/devices/${importLegacy ? "import" : "section"}/${section}`,
              body,
              device ? "PUT" : "POST",
            );
            await onSaved();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label>
            Nome della scheda
            <input
              name="label"
              defaultValue={device?.label || ""}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Prossima verifica tecnica
            <input
              type="date"
              name="dueDate"
              defaultValue={device?.dueDate?.slice(0, 10) || ""}
            />
          </label>
          {Object.entries(configurationFields[section]).map(([key, label]) => (
            <label key={key}>
              {label}
              {key === "mode" && section === "pos" ? (
                <select name={key} defaultValue={values[key] || "MANUALE"}>
                  <option>MANUALE</option>
                  <option>INTEGRATA</option>
                  <option>CLOUD_API</option>
                </select>
              ) : (
                <input
                  name={key}
                  defaultValue={values[key] || ""}
                  required={requiredFields[section].includes(key)}
                  maxLength={2000}
                />
              )}
            </label>
          ))}
          {section === "pos" && (
            <label>
              Credenziale tecnica (vuoto mantiene quella esistente)
              <input
                type="password"
                autoComplete="new-password"
                name="secret"
                maxLength={8000}
              />
            </label>
          )}
          {section === "pos" && (device || importLegacy) && (
            <label className="inline-check">
              <input type="checkbox" name="removeSecret" />
              Rimuovi la credenziale tecnica salvata
            </label>
          )}
        </div>
        <p role="alert">{error}</p>
        <div className="actions">
          <button disabled={busy}>Salva modifiche</button>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  );
}
function DeviceCheck({
  tenantId,
  device,
  onClose,
  onSaved,
}: {
  tenantId: string;
  device: Device;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title={`Collaudo fisico · ${device.label}`} onClose={onClose}>
      <p>
        Registrare una verifica realmente effettuata sul dispositivo. Il
        risultato riguarda la versione {device.version}; non certifica
        un’integrazione software operativa.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          try {
            await platform(`salons/${tenantId}/devices/${device.id}/check`, {
              version: device.version,
              result: form.get("result"),
              notes: form.get("notes"),
            });
            await onSaved();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Esito
          <select name="result" defaultValue={device.physicalCheck}>
            <option value="PENDING">Da verificare</option>
            <option value="PASS">Verifica fisica superata</option>
            <option value="FAIL">Anomalia riscontrata</option>
          </select>
        </label>
        <label>
          Procedura ed evidenze
          <textarea
            name="notes"
            required
            minLength={5}
            maxLength={2000}
            defaultValue={device.checkNotes}
          />
        </label>
        <p role="alert">{error}</p>
        <div className="actions">
          <button disabled={busy}>Registra esito</button>
          <button
            disabled={busy}
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Annulla
          </button>
        </div>
      </form>
    </Modal>
  );
}
