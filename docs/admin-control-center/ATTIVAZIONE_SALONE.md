# Attivazione salone

1. Accedere come ADMIN o SUPER_ADMIN. Aprire Saloni → Crea salone.
2. Compilare nome e codice univoco (3–32 caratteri A–Z, numeri, `_`, `-`), anagrafica, partita IVA a 11 cifre, indirizzo, CAP, comune, provincia e contatti.
3. Inserire nome ed email del titolare. L’email viene usata come username nel gestionale: massimo 64 caratteri per compatibilità con il login attuale. Il controllo formale non certifica validità o titolarità della partita IVA.
4. Confermare: vengono creati tenant, scheda BOZZA, OWNER inattivo e checklist nella stessa transazione. Codice/partita IVA duplicati producono conflitto, senza tenant parziali.
5. Eseguire il worker email configurato. Il salvataggio del salone da solo non garantisce la consegna. In caso di scadenza usare Utenti e personale → Invia nuovo invito titolare.
6. Il titolare imposta le credenziali dal collegamento ricevuto. Per compatibilità del gestionale: password da 12 a 64 caratteri, massimo 72 byte. L’account diventa attivo e la verifica TITOLARE è aggiornata.
7. Il titolare accede a `/login` con codice salone, email nel campo Nome utente e credenziale impostata nel campo PIN. Nessun accesso amministrativo centrale è concesso al titolare.
8. Assegnare un tecnico dalla Panoramica della scheda e passare a IN_CONFIGURAZIONE.
9. Compilare configurazioni, salvare esplicitamente e documentare il collaudo. Segnare NA per i dispositivi non utilizzati, con motivazione.
10. Passare a DA_COLLAUDARE, completare la checklist e attivare. ATTIVO è consentito solo con tutte le verifiche obbligatorie PASS e opzionali PASS/NA.

SOSPESO blocca login e richieste con JWT già emessi. La riattivazione ATTIVO richiede ancora una checklist valida. I saloni preesistenti rimangono senza profilo amministrativo finché un amministratore completa esplicitamente l’anagrafica. In questa adozione il titolare attivo viene riconosciuto senza creare utenti; eventuali trasferimenti di titolarità richiedono una procedura dedicata.

