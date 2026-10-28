# Trattamenti e controlli da verificare

Il perimetro è il servizio SalonPro di Univibe Group S.r.l.s., P.IVA 03473490732, offerto a saloni professionali. Questo registro preliminare collega i flussi alle evidenze tecniche e ai controlli organizzativi ancora necessari. Non è una certificazione e non attesta contratti o misure che non sono stati verificati.

## Flussi principali

| Flusso | Dati e finalità | Ruoli da formalizzare | Evidenze e azioni |
| --- | --- | --- | --- |
| Richieste demo e Salon Score | Contatti, risposte, provenienza campagne | Società normalmente titolare | Informativa, base giuridica, conservazione e accessi al modulo Leads e agli eventuali form Netlify |
| Gestionale dei saloni | Clienti, appuntamenti, vendite, personale, note | Salone normalmente titolare e società responsabile | DPA, istruzioni, test di separazione, gestione dei diritti |
| Control Center | Account amministrativi, assegnazioni e interventi | Società titolare per organizzazione propria; istruzioni del salone per assistenza | MFA, sessioni, audit applicativo, autorizzazioni nominative |
| Hosting | Database, contenuti, log e metadati | Da verificare nei contratti con Railway e Netlify | DPA, subfornitori, regioni e trasferimenti; regione Railway osservata negli USA |
| WhatsApp | Destinatari, messaggi e metadati del canale | Da determinare secondo il canale e i contratti Meta/salone | Abilitazione per salone, base giuridica per ogni invio, gestione dei segreti, conservazione |
| Sviluppo | Codice, account tecnici e dati di prova | Società e fornitori secondo gli strumenti impiegati | Nessun dato reale nei test ordinari, segreti fuori dal repository, accessi nominativi |

## Evidenze dei controlli

| Controllo | Evidenza disponibile | Stato e limite |
| --- | --- | --- |
| Accessi piattaforma | TOTP, password elaborate, sessioni revocabili e controlli server già presenti | Verificati nei test; accessi diretti all'infrastruttura richiedono riesame |
| Separazione anagrafiche | Nuova migrazione, vincoli di database e test con identità condivise | Preparato sul ramo di sicurezza; non applicato in produzione |
| Recupero e rotazione accessi salone | Nuova versione credenziali, tentativi e lock persistenti | Preparato e testato; richiede migrazione |
| Tracciamenti | Rimozione del caricamento globale dei tracker | Preparata; non pubblicata. Non equivale a un banner di consenso |
| Sicurezza dipendenze | Lockfile aggiornato, audit e controllo CI | Test locale; richiede build coerente e verifica delle immagini |
| Backup | Backup e ripristino isolato del rilascio precedente | Non sostituisce nuova copia prima della migrazione, automazione e prove periodiche |
| Cifratura | Segreti piattaforma e WhatsApp cifrati a livello applicativo | Non dimostra cifratura integrale del database o corretta custodia di tutte le chiavi |
| Gestione incidenti | Log HTTP minimizzati e audit applicativo | Ruoli, reperibilità, conservazione e risposta incidenti da formalizzare |
| Diritti degli interessati | Procedure da progettare per il singolo tenant | Esportazione, rettifica, cancellazione e backup devono essere testati prima di promettere il servizio |

## Percorso per rendere dimostrabile la conformità

Definire prima categorie di dati, finalità, ruoli e tempi di conservazione. Verificare la catena dei fornitori e i trasferimenti; acquisire i contratti pertinenti senza presumere che la scelta di un datacenter europeo risolva tutti gli accessi extra SEE. Stabilire chi può accedere ai dati, come vengono riesaminati gli accessi e chi approva le estrazioni.

Completare la valutazione del rischio con la società e il referente privacy. Valutare se occorra una DPIA in base ai trattamenti effettivi, senza dichiararla automaticamente obbligatoria o superflua. Applicare gli esiti ai controlli tecnici, poi eseguire una verifica indipendente del servizio e dei processi.

Per un'eventuale certificazione GDPR selezionare uno schema applicabile e un organismo accreditato per quello schema, definendo l'esatto trattamento da certificare. Un certificato ISO 27001 del sistema di gestione e una certificazione GDPR hanno oggetti diversi; non usare diciture o loghi prima del rilascio dell'attestazione pertinente.

## Fonti istituzionali

- Garante, certificazione e accreditamento: https://www.garanteprivacy.it/regolamentoue/certificazione-e-accreditamento
- Garante, registro delle attività: https://www.garanteprivacy.it/registro-delle-attivita-di-trattamento
- Garante, cookie e altri strumenti di tracciamento: https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876
- Commissione europea, accordi tra titolari e responsabili: https://commission.europa.eu/publications/standard-contractual-clauses-controllers-and-processors-eueea_en

Le informazioni societarie derivano da quanto indicato dal rappresentante nella richiesta. Sede legale, PEC e altri dati non forniti devono essere completati nei documenti definitivi; nessuna intestazione del software modifica da sola la titolarità degli asset o i contratti con i fornitori.
