# Sicurezza e confini

- Account piattaforma separati dai normali User del tenant. I ruoli OWNER/MANAGER/OPERATOR esistenti restano compatibili; SALON_OWNER e SALON_STAFF sono descrizioni di prodotto, non rinominano i ruoli legacy.
- Sessioni opache casuali da 256 bit; SHA-256 a database; cookie HttpOnly, SameSite Strict, Secure in produzione, durata 8 ore. Ogni richiesta verifica account attivo, scadenza, revoca e assegnazioni correnti.
- Le mutazioni richiedono Origin esattamente uguale all’origine frontend configurata e JSON. Il frontend usa un proxy Next della stessa origine, quindi non dipende da cookie di terze parti.
- Password piattaforma con scrypt salato N=32768, r=8, p=1, output 64 byte. Argon2id non è stato aggiunto come dipendenza nativa. Le credenziali dei titolari usano bcrypt costo 12 per compatibilità con il gestionale.
- MFA TOTP SHA-1, 6 cifre, 30 secondi, finestra ±1 step, consumo atomico dello step per impedire replay. Segreto cifrato AES-256-GCM.
- Login limitato a 5 richieste/minuto/IP per processo, lock account di 15 minuti dopo almeno cinque fallimenti; il limiter distribuito richiede storage condiviso. Recupero password non rivela se l’email è registrata e non disabilita MFA.
- Inviti con token casuale, hash SHA-256, scadenza 24 ore, consumo transazionale e invalidazione delle versioni precedenti. URL di invito cifrato nella coda email, token nel frammento e rimosso dalla barra all’apertura.
- Configurazioni ammettono solo campi autorizzati. Le credenziali si inviano separatamente e non vengono restituite dalle API di lettura. Non vengono memorizzati dati di carte. Non inserire segreti nei campi liberi.
- Provisioning e modifiche tecniche registrano un audit nella stessa transazione. I fallimenti del login sono registrati senza password/email/token; non è ancora un registro antimanomissione o un SIEM esterno.
- `/auth/seed` è sempre 404 in produzione, anche con ALLOW_DEMO_SEED=true. Il provisioning legacy dei saloni resta dietro il flag esistente: mantenerlo disabilitato in produzione per centralizzare le nuove attivazioni.
- JWT legacy verificano anche account attivo/ruolo e sospensione tenant. Non cambiano cassa o automazioni di magazzino.

## Bridge locale: progetto da implementare

Per USB/seriale/LAN non raggiungibili da Railway, predisporre un agente locale con connessione esclusivamente in uscita, registrazione esplicita, identità per tenant/dispositivo, credenziali ruotabili, TLS e autenticazione del dispositivo. I comandi devono avere firma, scadenza, nonce, idempotenza e whitelist; mai shell arbitraria o URL forniti dal browser. Limitare i dispositivi consentiti, verificare la firma degli aggiornamenti e conservare esiti tecnici privi di segreti. I driver devono distinguere comunicazione, emissione e verifica dell’esito. **Questo bridge non è implementato o installato.**

## Prima della produzione

Verificare backup ripristinabile, accessi Railway/Supabase, segreti per ambiente, configurazione del proxy e degli IP, test PostgreSQL concorrenti, servizio email, recupero MFA fuori banda e monitoraggio coda. La chiave di cifratura è indispensabile al ripristino: perderla rende inutilizzabili i TOTP e le credenziali tecniche cifrate.


## Archivio dispositivi

Le operazioni su dispositivi verificano il tenant della rotta, l’assegnazione del tecnico e l’appartenenza del dispositivo allo stesso tenant. La versione richiesta dal client è confrontata dal database in ogni aggiornamento, archiviazione, ripristino e collaudo. I vincoli univoci impediscono copie dello stesso dispositivo o importazioni duplicate, incluse quelle concorrenti. La lettura non seleziona segreti cifrati; l’importazione li copia soltanto sul server. Archiviazione e ripristino sono logici, registrati nell’audit e nel registro interventi.
