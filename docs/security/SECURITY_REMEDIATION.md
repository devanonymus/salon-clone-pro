# Sicurezza e protezione dati

Aggiornamento del 28 ottobre 2026. Società indicata: Univibe Group S.r.l.s., P.IVA 03473490732; referente Brian Laddomada.

## Ambito e valore delle verifiche

Questo intervento corregge problemi verificati nel codice e predispone evidenze ripetibili. Non costituisce un penetration test indipendente, una certificazione GDPR o ISO 27001, né una garanzia di assenza di vulnerabilità. Lo stato di pubblicazione di ciascuna fase deve essere registrato separatamente.

La certificazione ai sensi degli articoli 42 e 43 GDPR riguarda trattamenti specifici e richiede uno schema approvato e un organismo accreditato. Il fascicolo tecnico, i test e i registri sono evidenze, non un certificato. Fonte: https://www.garanteprivacy.it/regolamentoue/certificazione-e-accreditamento

## Correzioni senza migrazione dei dati

- Aggiornamenti delle dipendenze applicative e degli strumenti di sviluppo, con controlli di build e audit.
- Rimozione del caricamento globale di Google Analytics e Meta Pixel. I tracker restano disabilitati fino alla presenza di una gestione del consenso verificata, anche per il sito pubblico.
- Intestazioni contro incorporamento in frame, interpretazione impropria dei contenuti e dispersione del referrer; policy limitativa di fotocamera, microfono e posizione.
- CSP parziale per base URI, oggetti, frame e invio di form. Non è una CSP completa contro XSS: nonce e script-src richiedono un intervento dedicato.
- Risposte API con Cache-Control no-store.
- Controllo CI che impedisce di ignorare nuovi avvisi alti o critici sulle dipendenze.

Gli avvisi delle dipendenze vanno valutati per versione, percorso e funzionalità effettivamente esposta. Un audit del lockfile non verifica da solo la composizione dell'immagine di produzione o i componenti gestiti dall'hosting.

Il controllo locale del lockfile aggiornato non segnala avvisi nelle dipendenze dichiarate di produzione. Il controllo di tutte le dipendenze rileva un avviso basso su deepmerge 4.3.1, richiamato dagli strumenti Jest e fork-ts-checker-webpack-plugin. Non è disponibile una versione corretta indicata dall'advisory. Non sono stati individuati import diretti nell'applicazione; mantenere il monitoraggio e non eseguire configurazioni o test di provenienza non fidata. Riferimento: https://github.com/advisories/GHSA-gcqx-w48m-w2h4

La build Railway dell'API attuale usa npm install, mentre le correzioni transitive e gli esiti sopra si riferiscono al lockfile pnpm. È stata predisposta, senza applicarla, la modifica dei servizi Railway per installare dalla radice con pnpm 10.33.0 e --frozen-lockfile. Il frontend Railway è predisposto allo stesso criterio. Netlify riceve PNPM_FLAGS=--frozen-lockfile. Dopo la pubblicazione verificare i log di build e le versioni effettivamente installate; non attribuire il risultato dell'audit locale al runtime precedente.

## Correzioni che richiedono migrazione

Le identità ClientGlobal diventano di proprietà di un solo salone tramite ownerTenantId. Le identità precedentemente condivise vengono copiate per ogni salone che vi fa riferimento; vendite, premi e collegamenti ai clienti vengono aggiornati, mantenendo dati e identificativi degli altri record. Le identità senza collegamenti sono conservate senza attribuirle arbitrariamente a un salone.

Un vincolo univoco limita il telefono al singolo salone. Chiavi esterne composite impediscono di collegare vendite, premi o ClientTenant a un'identità appartenente a un salone diverso. La creazione rapida usa una transazione e la coppia salone e telefono.

Gli utenti dei saloni ricevono una versione delle credenziali. Il cambio PIN richiede la conferma del PIN attuale, oltre alla sessione del titolare. Cambio PIN e reset del titolare incrementano la versione; i JWT precedenti vengono rifiutati. I vecchi JWT senza versione restano compatibili solo con account mai ruotati, la cui versione è zero. Login e verifica del PIN attuale registrano tentativi falliti nel database e bloccano l'account per 15 minuti dopo almeno cinque errori. I nuovi PIN richiedono almeno sei cifre; i PIN esistenti restano utilizzabili fino al cambio.

La migrazione non elimina tabelle, colonne o dati, ma modifica relazioni e identificativi delle anagrafiche condivise. Non è compatibile con il vecchio codice di creazione clienti. Non applicarla con una pubblicazione ordinaria non coordinata.

## Procedura di pubblicazione della migrazione

1. Verificare commit, schema, regioni e database effettivo. Prendere un backup aggiornato e provarne il ripristino, mantenendo chiavi e configurazioni necessarie.
2. Sulla copia, misurare durata, numero di identità condivise, nuove copie e riferimenti aggiornati. Verificare vendite, articoli, movimenti, scorte, appuntamenti e dati dei clienti per ogni salone, senza riportarli nei log.
3. Concordare una breve finestra che impedisca accessi e scritture durante il cambio di schema e API. Non affidarsi a un cambio frontend come unico blocco: considerare chiamate dirette e integrazioni.
4. Applicare la migrazione versionata e attivare la nuova API nella stessa finestra. I timeout bloccano l'operazione se non riesce ad acquisire i lock o se una singola istruzione supera il limite previsto.
5. Verificare login, creazione/modifica clienti, separazione tra saloni, storico, cassa e magazzino con procedure approvate. Chiedere agli utenti di ricaricare la pagina per aggiornare eventuali identificativi in memoria.
6. Riaprire le scritture dopo i controlli. Non tornare al vecchio codice sul nuovo schema. Se necessario usare una correzione in avanti o un ripristino approvato che consideri i dati successivi al backup.

## Controlli ripetibili

- pnpm test e pnpm test:e2e verificano comportamento applicativo e rotte.
- pnpm test:admin-db verifica migrazioni e funzioni amministrative con Prisma reale su PGlite.
- pnpm test:security-db verifica separazione delle identità condivise, conservazione dello storico, vincoli e revoca JWT al cambio PIN.
- pnpm audit --prod e pnpm audit verificano dipendenze di produzione e intero ambiente. Conservare entrambi gli esiti con data e versione del lockfile.
- Le prove PGlite usano database e porte locali dedicati. Non attestano carico, replica e concorrenza del PostgreSQL di produzione; serve una prova su staging nativo prima del cambio dei dati reali.

## Attività operative ancora da completare

1. Backup automatici con conservazione, custodia separata, prove periodiche e RPO/RTO misurati.
2. Revisione dell'incidente Railway: rotazioni effettive, log dei fornitori, possibile accesso ai dati e decisioni sulle notifiche. Nessun effetto dell'incidente va presunto né escluso solo in base ai nuovi test.
3. Contratti con fornitori, elenco dei subresponsabili, localizzazioni e basi dei trasferimenti. La regione osservata su Railway è negli Stati Uniti; un trasferimento verso UE richiede pianificazione e non elimina da solo la verifica dei fornitori.
4. Email sicure di invito e recupero, gestione della perdita del secondo fattore e accessi aziendali nominativi.
5. Esportazione per singolo cliente/salone, cancellazione e tempi di conservazione approvati; nessun dump multi-tenant consegnato ai clienti.
6. Verifica di controllo accessi su tutte le rotte, registrazione e riesame degli accessi infrastrutturali, contenimento XSS e revisione dell'uso di JWT nel browser.
7. Valutazione del rischio e dell'eventuale DPIA, DPA con i saloni e informative coerenti. Dati sanitari o note particolari non devono essere inseriti senza aver definito necessità, base giuridica e protezioni.
8. Verifica esterna del servizio dopo le correzioni e scelta dell'eventuale percorso di certificazione.
