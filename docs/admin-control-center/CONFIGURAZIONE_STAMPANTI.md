# Stampanti

## Prerequisiti

Accesso amministrativo o assegnazione tecnica al salone. Documentazione autentica del dispositivo/provider e disponibilità fisica del tecnico. Salvare una configurazione non certifica l’attivazione.

## Dati richiesti

Nome, produttore, modello, collegamento, IP/porta se presenti, formato carta e postazione. Specificare termica, cortesia, rete, USB o A4 nel collegamento/note.

## Configurazione software

1. Aprire Saloni → scheda → Stampanti.
2. Raccogliere i dati prima di compilarli. Non inserire password nelle note.
3. Per le credenziali usare esclusivamente il campo riservato, quando disponibile: la lettura non le restituisce. Vuoto mantiene il segreto esistente.
4. Selezionare Salva modifiche e verificare il messaggio. I dati non vengono salvati automaticamente.
5. Il salvataggio invalida il collaudo precedente e può riportare un salone attivo a DA_COLLAUDARE.

## Configurazione fisica

Installare e verificare driver sul sistema locale, formato carta, rete e autorizzazioni di stampa. Collegare USB solo alla postazione corretta.

## Collaudo

Eseguire la pagina di prova del sistema operativo o la procedura ufficiale. Il pulsante nel pannello segnala che nessun adattatore di stampa è ancora registrato. Annotare l’esito fisico in Collaudo.

## Problemi frequenti

Stampante offline, coda bloccata, carta errata, indirizzo cambiato, driver incompatibile, porta USB diversa.

## Limitazioni

Nessuna stampa diretta dal browser o da Railway verso dispositivi privati. Bridge locale e driver sono da implementare. Sono supportate più schede stampante per salone, con collaudi e scadenze distinti.

Se non usato dal salone, impostare NA nella relativa verifica con una motivazione. L’ultimo collaudo è registrato nella checklist con data, tecnico, esito e note, non dedotto dal salvataggio della configurazione.


## Archivio dispositivi

La sezione consente Aggiungi dispositivo per ogni unità presente nel salone. Le schede precedenti possono essere importate esplicitamente; completare i dati richiesti senza cancellare la fonte. Per modifiche, collaudo fisico, archiviazione e scadenze seguire DISPOSITIVI_E_SCADENZE.md. Il controllo della versione evita sovrascritture tra operatori concorrenti.
