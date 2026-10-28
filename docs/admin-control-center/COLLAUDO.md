# Checklist di collaudo

Aprire la scheda → Collaudo. Le verifiche ANAGRAFICA e TENANT vengono impostate dal provisioning; TITOLARE diventa PASS all’accettazione dell’invito. Nell’adozione di saloni esistenti viene verificata la presenza di un OWNER attivo.

Per OPERATIVITA, REGISTRATORE, POS, STAMPANTE, INTEGRAZIONI e COLLAUDO scegliere PENDING, PASS o FAIL e annotare evidenze concrete: procedura seguita, modello/protocollo, riferimento dell’esito, data della prova e anomalie. Evitare credenziali e dati di carte nelle note. Ogni salvataggio registra data, identificativo tecnico e intervento.

NA è ammesso soltanto per registratore, POS, stampante e integrazioni non utilizzati. Richiede motivazione. Le verifiche obbligatorie non possono essere NA. Il backend impedisce ATTIVO con verifiche mancanti, pendenti o fallite.

Salvare una configurazione invalida le verifiche della sezione e il collaudo finale; un salone ATTIVO passa a DA_COLLAUDARE. Anche una verifica rimessa a PENDING o FAIL impedisce di mantenere l’attivazione amministrativa.

Il pulsante di verifica supporto non esegue una prova fisica: attualmente restituisce integrazione non supportata. Un PASS manuale non attiva i driver. Documentare separatamente collaudo fisico, comunicazione, esito fiscale e pagamento.

Prima del rilascio ripetere su staging: login admin/tecnico, isolamento tra due tenant, invito/recupero monouso, revoca, sospensione con sessione esistente, duplicati, rollback transazionale, riattivazione, stampa supportata, mancato pagamento, cassa, scarico ricette, agenda, clienti e storico. Le prove automatiche con database simulato non certificano il comportamento dei dispositivi o della produzione.


## Verifiche per singolo dispositivo

Per registratori, POS e stampanti completare prima il collaudo fisico di ciascuna scheda attiva. Una sezione con dispositivi attivi non può essere NA. PASS, collaudo finale e attivazione richiedono che ogni dispositivo interessato abbia PASS e nessuna scadenza superata. Una modifica concorrente alla versione della scheda rende non valido un salvataggio o collaudo basato su dati precedenti. Consultare DISPOSITIVI_E_SCADENZE.md per importazione, archiviazione, scadenze e ripristino.
