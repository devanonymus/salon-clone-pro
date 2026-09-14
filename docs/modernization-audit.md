# Salon Pro — audit tecnico e piano di modernizzazione

Aggiornato: 14 settembre 2026  
Branch di lavoro: `feat/premium-erp-ui`

## Sintesi

Salon Pro è un ERP verticale multi-tenant per saloni. Il perimetro funzionale è già ampio: agenda, CRM, cassa, inventario, team, controllo di gestione, card marketing, loyalty, WhatsApp e fiscalità demo.

La priorità non è aggiungere altri moduli. Prima occorre consolidare sicurezza multi-tenant, contratti API, transazioni economiche e componentizzazione frontend. Il restyling introdotto nel branch crea la nuova fondazione visiva e operativa senza alterare i flussi legacy.

## Stato fase 2 — backend hardening

Implementato nel branch `feat/backend-hardening`, basato sulla fondazione ERP:

- `PrismaService` centralizzato in un modulo globale con lifecycle controllato.
- `ValidationPipe` globale e DTO tipizzati per autenticazione, vendita, inventario, fiscalità e WhatsApp.
- Helmet, CORS configurabile e rate limiting globale/login.
- JWT ridotto a 8 ore per default, algoritmo/issuer/audience vincolati e payload verificato.
- Seed demo e provisioning di nuovi tenant disabilitati per default tramite variabili d'ambiente.
- RBAC minimo `OWNER`, `MANAGER`, `OPERATOR` sulle configurazioni e operazioni amministrative.
- Checkout e scarico magazzino nella stessa transazione Prisma, con blocco delle scorte negative.
- Verifica tenant esplicita su cliente, appuntamento e collaboratori durante la vendita.
- Emissione fiscale atomica e protetta dalla doppia emissione concorrente.
- WhatsApp protetto dal JWT, configurato per tenant, token cifrato AES-256-GCM e messaggi persistiti.
- Suite Nest ripristinata e nuovi test per JWT, validazione annidata e totale vendita.

Per il deploy diventano obbligatorie `JWT_SECRET` e `WHATSAPP_ENCRYPTION_KEY`; valori e flag sicuri sono documentati in `.env.example`.

## Mappa del prodotto

| Area | Frontend | Backend | Stato rilevato |
| --- | --- | --- | --- |
| Dashboard | `/dashboard`, `/dashboardcoach` | aggregazione client-side da più API | Funziona, ma manca un endpoint analytics dedicato |
| Agenda | `/agenda` | `appointments` | Flusso principale presente |
| Cassa | `/vendite` | `sales`, `fiscal`, `inventory` | Presente; consistenza economica da irrobustire |
| CRM | `/clienti` | `clients` | Presente; modello globale/tenant interessante ma delicato |
| Magazzino | `/magazzino` | `inventory` | Presente; aggiornamenti stock non atomici |
| Team | `/team` | `staff` | Presente; autorizzazioni per ruolo assenti |
| Marketing | `/marketing`, `/ruota` | `marketing-cards` | Ampio, ma molto accoppiato alla singola pagina |
| WhatsApp | `/chat`, widget | `whatsapp` | Contratto frontend/backend non allineato |
| Fiscalità | cassa | `fiscal` | Modulo scritto ma non registrato nell'app principale |
| Configurazione | `/configurazione` | più moduli | Presente; richiede RBAC owner/admin |

## Criticità backend

### P0 — prima di scalare o acquisire nuovi tenant

1. **Endpoint di seed pubblico con credenziali note**
   - `GET /auth/seed` è accessibile senza autenticazione.
   - Il codice contiene PIN demo e tenant predefiniti.
   - Soluzione: rimuovere la rotta in produzione; usare un comando CLI/idempotente protetto dall'ambiente.

2. **WhatsApp non isolato per tenant**
   - `GET /whatsapp/chats` e `POST /whatsapp/send` non hanno `JwtGuard`.
   - Il servizio usa token globali da environment, ignorando la configurazione tenant salvata nel database.
   - Il campo `accessTokenEncrypted` contiene attualmente il token in chiaro.
   - Soluzione: guard a livello controller, `tenantId` obbligatorio dal JWT, cifratura envelope/KMS, token per tenant e audit degli invii.

3. **Contratto chat rotto**
   - Frontend: `/whatsapp/conversations` e `/whatsapp/conversations/:id/send`.
   - Backend: `/whatsapp/chats` e `/whatsapp/send`.
   - Lo schema Prisma contiene conversazioni e messaggi, ma il service restituisce un array vuoto e non persiste webhook o invii.
   - Soluzione: definire OpenAPI come fonte unica, implementare persistenza inbound/outbound e generare un client tipizzato.

4. **Modulo fiscale non registrato — corretto nel branch**
   - Su `main`, `FiscalModule` non è importato da `AppModule` e le rotte `/fiscal/*` non vengono registrate.
   - Il branch aggiunge l'import del modulo; resta da aggiungere un test e2e di bootstrap/route discovery.

5. **Autorizzazione incompleta**
   - Quasi tutte le operazioni verificano il tenant, ma non il ruolo.
   - Un qualunque `OWNER` può creare altri saloni; configurazione, costi, staff e WhatsApp non hanno policy granulari.
   - La creazione vendita non verifica in modo esplicito che cliente, appuntamento e operatori appartengano allo stesso tenant.
   - Soluzione: enum dei ruoli, decorator `@Roles`, guard RBAC e invarianti multi-tenant nel service.

6. **Operazioni economiche non atomiche**
   - Vendita e scarico magazzino sono operazioni separate.
   - Lo stock viene portato silenziosamente a zero in caso di quantità insufficiente.
   - Emissione fiscale aggiorna vendita e crea ricevuta in due operazioni separate.
   - Soluzione: transazioni Prisma, controllo concorrenza/versione, idempotency key per checkout e stampa fiscale.

### P1 — stabilità, qualità e manutenzione

1. **Nessuna validazione globale dei payload**
   - Molti controller e service accettano `any` e convertono input liberamente con `Number()`/`Boolean()`.
   - Soluzione: DTO con `class-validator`, `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.

2. **Denaro modellato con `Float`**
   - Totali, costi, IVA e pagamenti usano floating point.
   - Soluzione: `Decimal` Prisma con regole di arrotondamento esplicite, oppure centesimi interi.

3. **Sessione debole per un gestionale**
   - JWT di 7 giorni in `localStorage`, senza refresh, revoca o rotazione.
   - Soluzione: access token breve in cookie `HttpOnly`, refresh rotation, session table e logout server-side.

4. **Hardening HTTP assente**
   - CORS è hardcoded; mancano rate limiting login, Helmet, request ID, logging strutturato e limiti body.
   - Soluzione: configurazione validata per environment, `helmet`, throttling, correlation ID e sanitizzazione log.

5. **Prisma istanziato in ogni modulo**
   - `PrismaService` è registrato ripetutamente nei provider.
   - Soluzione: `PrismaModule` globale con lifecycle di shutdown e una sola dipendenza condivisa.

6. **Migrazioni e indici**
   - Nel repository non è presente la cronologia `prisma/migrations`.
   - Mancano indici espliciti sui filtri più frequenti: tenant/data, tenant/createdAt, tenant/active.
   - Soluzione: baseline migration, deploy tramite `prisma migrate deploy`, indici misurati con query plan.

7. **Test non rappresentativi**
   - La suite contiene soprattutto scaffolding Nest; al controllo iniziale 10 suite falliscono e una passa perché i test non forniscono le dipendenze dei controller/service.
   - Manca copertura di isolamento tenant e invarianti finanziarie.
   - Soluzione: test unitari dei servizi critici e test e2e PostgreSQL per auth, vendite, stock, fiscalità e WhatsApp.

## Criticità frontend

- Pagine monolitiche tra circa 500 e 2.900 righe.
- Stili inline duplicati in ogni modulo; impossibile aggiornare tema e responsive in modo coerente.
- Fetch e URL API duplicati; in più punti è hardcoded `http://localhost:3001`.
- Tipi API copiati nelle pagine e numerosi `any`.
- Nessuna strategia uniforme per loading, error, empty state, toast e conferme.
- Lint iniziale: 150 segnalazioni, di cui 93 errori.
- Build di produzione frontend iniziale: riuscita.

## Fondazione ERP introdotta nel branch

- Shell applicativa con sidebar desktop comprimibile e drawer mobile.
- Navigazione raggruppata per Panoramica, Operazioni, Crescita e Sistema.
- Stato attivo, ricerca moduli e accesso rapido alle operazioni principali.
- Informazioni workspace/sessione persistite al login.
- Login ridisegnato e rimozione delle credenziali demo precompilate.
- Dashboard executive con KPI mensili, trend a 7 giorni, margine stimato, action center, agenda e vendite recenti.
- Client API unico con gestione coerente di 401, parsing errori e compatibilità con i moduli legacy.
- Design token globali: superfici neutrali, un solo accento oro, gerarchia tipografica e responsive coerente.
- Registrazione del modulo fiscale nel runtime Nest.

## Architettura target

### Backend

`controller -> DTO/validation -> application service -> domain policy -> repository/Prisma`

- Ogni richiesta porta `AuthenticatedUser` tipizzato.
- Ogni aggregate applica tenant e policy nello stesso punto.
- Checkout, inventario e fiscalità condividono una transazione applicativa.
- Endpoint analytics restituisce KPI già aggregati, evitando di scaricare tutte le vendite sul browser.
- OpenAPI genera tipi e client frontend.

### Frontend

`route -> feature container -> query/mutation hook -> typed API client -> shared UI`

Struttura suggerita:

```text
apps/web/
  app/
  features/
    agenda/
    clients/
    sales/
    inventory/
  components/
    shell/
    ui/
    data-display/
  lib/
    api/
    auth/
    formatting/
```

## Roadmap consigliata

| Fase | Obiettivo | Risultato verificabile |
| --- | --- | --- |
| 1 | Fondazione UI e audit | Nuova shell, login, dashboard, build pulita dei file nuovi |
| 2 | Sicurezza P0 | Seed rimosso, WhatsApp protetto, FiscalModule attivo, RBAC minimo |
| 3 | Checkout atomico | Vendita/stock/fiscale transazionali e idempotenti |
| 4 | API tipizzata | DTO, OpenAPI, client generato, zero URL hardcoded |
| 5 | Migrazione moduli | Agenda, cassa, CRM, magazzino e marketing su componenti condivisi |
| 6 | Qualità | Test e2e, osservabilità, lint senza errori e budget prestazioni |

## Definition of done per modulo

- Nessun URL API locale hardcoded.
- Nessun `any` nel contratto dati pubblico.
- Loading, empty, error e success state presenti.
- Azioni distruttive con conferma e feedback.
- Layout verificato a 1440 px, 1024 px, 768 px e 390 px.
- Isolamento tenant testato lato backend.
- Build, lint dei file modificati e test relativi verdi.
