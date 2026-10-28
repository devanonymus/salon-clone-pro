# Installazione, staging e deploy

## Ambiente

Il codice richiede Node compatibile con Next 16 e Prisma 7 e pnpm 10.33.0. Eseguire dalla radice del repository:

```sh
pnpm install --frozen-lockfile
pnpm prisma:validate
pnpm prisma:generate
pnpm check:migrations
pnpm build:api
pnpm build:web
pnpm test
pnpm test:e2e
pnpm test:admin-db
```

La generazione del client e il controllo dello schema non applicano migration. In una sandbox, se la cache Prisma non è scrivibile, impostare `XDG_CACHE_HOME` su una cartella temporanea scrivibile.

## Variabili

- `DATABASE_URL`: connessione PostgreSQL dell’ambiente scelto; schema applicativo `app`. Non copiarla nei report.
- `PLATFORM_ENCRYPTION_KEY`: 32 byte casuali codificati come 64 caratteri esadecimali. Configurarla nel secret manager, mai nel frontend. Conservare una copia sicura per il ripristino. La rotazione richiede ricifratura dei segreti già salvati.
- `PLATFORM_WEB_URL`: origine pubblica del frontend, ad esempio `http://localhost:3000` nello sviluppo; HTTPS obbligatorio per gli inviti in produzione. Usata anche per il controllo Origin delle mutazioni.
- `PLATFORM_API_URL`: URL del backend usato dai rewrite Next; locale `http://127.0.0.1:8080`. È risolto durante la build del frontend: configurare prima della build Railway.
- `PLATFORM_MAIL_GATEWAY_URL`: endpoint HTTPS del servizio di consegna email.
- `PLATFORM_MAIL_GATEWAY_TOKEN`: token riservato del gateway.
- Mantenere `JWT_SECRET`, `CORS_ORIGINS` e le variabili dei moduli esistenti. Non modificare quelle reali senza valutazione.
- `NODE_ENV=production` in produzione; cookie Secure e seed demo disabilitato anche se il flag demo è true.

## Staging e migration

1. Individuare ambiente Railway e database realmente collegato. Il file locale punta a Supabase; ciò non prova quali variabili usi Railway.
2. Verificare backup e ripristinare una copia in un database di staging separato. Annotare durata ed esito del ripristino.
3. Ispezionare `20261023120000_admin_control_center/migration.sql`: crea tabelle, enum, relazioni e indici nuovi, senza cancellare righe o cambiare tenant preesistenti. Ispezionare anche `20261023150000_platform_devices/migration.sql`, che aggiunge l’archivio dispositivi senza migrare automaticamente le schede esistenti.
4. Controllare eventuale baseline e drift rispetto alle migration precedenti. Non segnare migration come applicate senza la verifica dello schema.
5. Sul solo staging selezionato, applicare con `pnpm --filter api exec prisma migrate deploy --config ../../prisma.config.ts`.
6. Avviare backend con `pnpm dev:api` e frontend con `pnpm dev:web`. Per produzione usare gli script start esistenti dopo build. Aprire `/admin/login`.
7. Eseguire bootstrap e checklist funzionale. Provare anche cassa, scarico ricette, agenda, clienti e storico con dati della copia di staging.
8. Solo dopo backup ripristinabile e autorizzazione esplicita applicare la migration in produzione. Non sono state applicate migration al database remoto durante questo intervento.

## Gateway email e worker

Eseguire `pnpm admin:deliver-mail` come job controllato. Non è schedulato automaticamente dal repository. Elabora fino a 50 messaggi, ritenta fino a 10 tentativi; timeout 15 secondi. Nessun token viene stampato. Dopo consegna elimina il payload cifrato dal messaggio.

Contratto richiesto al gateway: POST JSON con `{id,to,purpose,url}`, header `Authorization: Bearer …` e `Idempotency-Key: id`. Il gateway deve inviare una vera email di invito/recupero, deduplicare persistentemente per `id` e restituire 2xx solo dopo accettazione durabile della consegna. Il token di invito è nel frammento URL, dura 24 ore ed è monouso. Il worker non fornisce un servizio SMTP integrato. Verificare email effettivamente ricevuta prima di dichiarare operativo l’onboarding. Gli errori restano nella coda e il processo termina con codice 1; controllare la tabella tramite strumenti autorizzati evitando di esportare payload e destinatari.

## Rollback

La migration è additiva. In caso di problema fermare worker e traffico amministrativo e ripristinare le versioni precedenti di frontend/backend senza eliminare nuove tabelle o dati. I vecchi moduli non dipendono dalle tabelle nuove nelle versioni precedenti. Valutare lo stato dei saloni sospesi prima del rollback: il vecchio codice non applica il blocco. Una cancellazione delle tabelle nuove perderebbe audit/configurazioni: richiede piano e autorizzazione separati. Il ripristino del backup è riservato al recupero concordato, non va eseguito alla cieca su un database che ha ricevuto nuove vendite.

## Limiti di verifica

Le prove locali non sostituiscono restore, migration e collaudo su PostgreSQL/Supabase/Railway reali, consegna email o test con dispositivi fisici. Il rate limiter Nest standard è in memoria per processo: per più repliche predisporre uno storage condiviso e verificare la configurazione proxy/IP prima del rilascio.


## Test locale isolato riproducibile

`pnpm test:admin-db` applica tutte le migration a un database PGlite in memoria, verifica conservazione di tenant/vendita/scorte di prova, vincoli e persistenza; avvia un socket locale sulla porta 55439 e prova i servizi con il client Prisma reale. Non usa DATABASE_URL di produzione. Richiede la porta libera; si interrompe se occupata. Le dipendenze PGlite sono solo di sviluppo. La suite chiude server e database a fine esecuzione. Non certifica concorrenza, replica, rete o comportamento operativo di PostgreSQL/Supabase. Documentazione dello strumento: https://pglite.dev/docs/pglite-socket .

## Ordine di aggiornamento dispositivi

Prima applicare entrambe le migration amministrative al database di staging revisionato, poi aggiornare il backend e infine il frontend. Il nuovo backend legge la tabella PlatformDevice anche per la dashboard e le verifiche di attivazione: la migration deve precedere il codice. Il rollback applicativo può conservare la tabella aggiuntiva senza cancellarla; le schede nuove non sono visibili al frontend precedente. Non applicare rollback distruttivi.
