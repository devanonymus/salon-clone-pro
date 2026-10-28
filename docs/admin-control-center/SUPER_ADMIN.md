# Primo Super Admin

1. Selezionare esplicitamente un database locale/staging e applicare la migration revisionata.
2. Configurare `PLATFORM_ENCRYPTION_KEY` e `PLATFORM_WEB_URL` sul backend. Usare un terminale privato senza registrazione delle sessioni.
3. Dalla radice eseguire `pnpm admin:bootstrap -- /percorso/assoluto/setup-mfa-privato.txt`. Se il gestore inoltra il separatore `--` al programma, usare direttamente `pnpm --filter api exec ts-node src/platform/bootstrap.ts /percorso/assoluto/setup-mfa-privato.txt`.
4. Inserire email, nome e password due volte. Tutti gli input sono nascosti. Nessuna password o chiave viene stampata. La password deve avere da 12 a 128 caratteri.
5. Aprire in modo riservato il file indicato: contiene l’URI di provisioning TOTP. Il file viene creato esclusivamente se inesistente, con permessi 0600. Importare l’URI nell’autenticatore su un dispositivo controllato.
6. Inserire il codice TOTP per provare il possesso del secondo fattore. Il file viene eliminato a fine operazione. In caso di interruzione forzata eliminarlo manualmente.
7. Accedere a `/admin/login` con email, password e il prossimo codice a sei cifre. Non riutilizzare il codice già consumato dal bootstrap.

Il comando usa un lock transazionale e si rifiuta di creare un secondo Super Admin. Gli account successivi si invitano dalla pagina Tecnici e accessi con un Super Admin esistente. Non esistono credenziali predefinite.

Il recupero password conserva il secondo fattore: richiede l’email con token monouso e il TOTP attuale. La perdita del fattore MFA richiede una procedura di recupero amministrativo verificata fuori banda; non è presente un bypass o un reset MFA via pannello. Non editare direttamente password o chiavi nel database senza una procedura approvata.

