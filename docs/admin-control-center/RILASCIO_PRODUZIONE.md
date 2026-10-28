# Attivazione in produzione

Destinazione richiesta: https://gestionalesalonpro.com. Primo Super Admin: info@univibegroup.it.

## Servizi verificati

Il dominio pubblico risponde da Netlify. L'API configurata nel gestionale è https://api-production-6aa5.up.railway.app, progetto Railway thriving-endurance, ambiente production. Il frontend Railway è un servizio distinto: pubblicarlo da solo non dimostra che il dominio pubblico sia aggiornato.

Il login dei titolari rimane /login con codice salone, nome utente e PIN. Il nuovo accesso piattaforma è /admin/login. AppShell mantiene le pagine pubbliche e non richiede il token del titolare per le pagine admin.

## Prima del rilascio

1. Identificare il database realmente usato dall'API mediante il riferimento DATABASE_URL, senza stampare credenziali. Il file .env del vecchio checkout locale non prova la destinazione di produzione.
2. Creare un backup con accesso privato e permessi restrittivi. Ripristinarlo in un database isolato, verificare le tabelle e provare le migration sulla copia. Non ripristinare sopra produzione.
3. Conservare il riferimento alla build precedente di API e frontend, e la configurazione necessaria al ripristino. Le nuove migration sono additive: un ritorno alla vecchia applicazione non deve eliminare le nuove tabelle.
4. Configurare sul backend PLATFORM_WEB_URL=https://gestionalesalonpro.com e una nuova PLATFORM_ENCRYPTION_KEY casuale di 32 byte in esadecimale. Conservarla in modo riservato e includerla nel piano di recupero. Non sostituire WHATSAPP_ENCRYPTION_KEY.
5. Configurare il mittente e il worker della coda email prima di usare inviti e recupero password. Non inserire segreti nel repository o nei log.

## Ordine di pubblicazione

1. Applicare esclusivamente le migration versionate ancora pendenti, con prisma migrate deploy, dopo backup e verifica su copia. Non usare db push o reset.
2. Pubblicare la nuova API e verificare gli endpoint, l'accesso dei titolari e l'integrità delle automazioni di cassa e magazzino.
3. Pubblicare su Netlify lo stesso commit. Il proxy /platform usa PLATFORM_API_URL oppure NEXT_PUBLIC_API_URL; in produzione il fallback è l'API Railway già configurata nel gestionale. Impostare PLATFORM_API_URL esplicitamente se la destinazione cambia.
4. Eseguire admin:bootstrap sul backend di produzione tramite terminale privato. Il titolare dell'account imposta password e associa l'autenticatore; il bootstrap verifica il codice MFA prima di creare l'account. Il file temporaneo di provisioning deve essere protetto ed eliminato. Non disattivare MFA per agevolare il rilascio.
5. Verificare https://gestionalesalonpro.com/admin/login e che il pulsante pubblico Accedi continui ad aprire /login. Verificare sessione, cookie Secure/HttpOnly, controlli Origin e assenza di cache sulle risposte amministrative.
6. Rimuovere eventuali chiavi SSH temporanee e verificare che la revoca sia effettiva. Riportare le verifiche effettuate senza dati dei clienti o credenziali.

Il merge del codice non crea automaticamente l'account e non dimostra che le migration o il bootstrap siano stati eseguiti.
