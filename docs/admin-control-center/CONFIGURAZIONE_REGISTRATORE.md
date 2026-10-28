# Registratore telematico

## Prerequisiti

Accesso amministrativo o assegnazione tecnica al salone. Documentazione autentica del dispositivo/provider e disponibilità fisica del tecnico. Salvare una configurazione non certifica l’attivazione.

## Dati richiesti

Produttore, modello, matricola, seriale, firmware, protocollo, collegamento, IP/porta se previsti, postazione, reparti e aliquote.

## Configurazione software

1. Aprire Saloni → scheda → Registratore telematico.
2. Raccogliere i dati prima di compilarli. Non inserire password nelle note.
3. Per le credenziali usare esclusivamente il campo riservato, quando disponibile: la lettura non le restituisce. Vuoto mantiene il segreto esistente.
4. Selezionare Salva modifiche e verificare il messaggio. I dati non vengono salvati automaticamente.
5. Il salvataggio invalida il collaudo precedente e può riportare un salone attivo a DA_COLLAUDARE.

## Configurazione fisica

Verificare alimentazione, rete o porta seriale/USB, configurazione sul dispositivo e documentazione ufficiale per modello e firmware. Per LAN remota può servire un bridge locale.

## Collaudo

Eseguire la procedura del produttore con personale autorizzato. Registrare separatamente test comunicazione, emissione commerciale ed esito fiscale con riferimento verificabile.

## Problemi frequenti

IP errato, porta chiusa, firmware incompatibile, protocollo diverso, reparti non coerenti, bridge assente. Non riprovare emissioni fiscali senza riconciliare l’esito.

## Limitazioni

RCH, Custom, Epson e Ditron sono candidati, senza driver verificati. Non condividono necessariamente il protocollo. Nessuna emissione fiscale operativa dal pannello.

Se non usato dal salone, impostare NA nella relativa verifica con una motivazione. L’ultimo collaudo è registrato nella checklist con data, tecnico, esito e note, non dedotto dal salvataggio della configurazione.


## Archivio dispositivi

La sezione consente Aggiungi dispositivo per ogni unità presente nel salone. Le schede precedenti possono essere importate esplicitamente; completare i dati richiesti senza cancellare la fonte. Per modifiche, collaudo fisico, archiviazione e scadenze seguire DISPOSITIVI_E_SCADENZE.md. Il controllo della versione evita sovrascritture tra operatori concorrenti.
