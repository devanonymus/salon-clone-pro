# POS e pagamenti

## Prerequisiti

Accesso amministrativo o assegnazione tecnica al salone. Documentazione autentica del dispositivo/provider e disponibilità fisica del tecnico. Salvare una configurazione non certifica l’attivazione.

## Dati richiesti

Provider, marca/modello, Terminal ID, merchant ID se richiesto, connessione, modalità MANUALE/INTEGRATA/CLOUD_API e verifica abbinamento amministrativo POS/RT.

## Configurazione software

1. Aprire Saloni → scheda → POS e pagamenti.
2. Raccogliere i dati prima di compilarli. Non inserire password nelle note.
3. Per le credenziali usare esclusivamente il campo riservato, quando disponibile: la lettura non le restituisce. Vuoto mantiene il segreto esistente.
4. Selezionare Salva modifiche e verificare il messaggio. I dati non vengono salvati automaticamente.
5. Il salvataggio invalida il collaudo precedente e può riportare un salone attivo a DA_COLLAUDARE.

## Configurazione fisica

Controllare contratto esercente, attivazione terminale e connettività. Per cloud verificare credenziali e webhook secondo documentazione del provider.

## Collaudo

In MANUALE verificare l’esito sul POS. Per un futuro adattatore integrato: operation ID persistente, idempotenza, timeout, riconciliazione, firma webhook e gestione esito incerto prima di ritentare. Richiesta pagamento e conferma vendita devono rimanere distinte.

## Problemi frequenti

Terminal ID errato, credenziali non valide, rete assente, esito incerto. Non ripetere l’addebito se la richiesta è andata in timeout senza interrogare lo stato.

## Limitazioni

Nexi, SumUp e Axerve sono possibili candidati, senza adattatori operativi. La selezione INTEGRATA o CLOUD_API salva una scheda e non avvia pagamenti. Nessun numero di carta/CVV viene richiesto. Verificare separatamente le procedure vigenti per abbinamento POS/RT con il soggetto competente.

Se non usato dal salone, impostare NA nella relativa verifica con una motivazione. L’ultimo collaudo è registrato nella checklist con data, tecnico, esito e note, non dedotto dal salvataggio della configurazione.


## Archivio dispositivi

La sezione consente Aggiungi dispositivo per ogni unità presente nel salone. Le schede precedenti possono essere importate esplicitamente; completare i dati richiesti senza cancellare la fonte. Per modifiche, collaudo fisico, archiviazione e scadenze seguire DISPOSITIVI_E_SCADENZE.md. Il controllo della versione evita sovrascritture tra operatori concorrenti.
