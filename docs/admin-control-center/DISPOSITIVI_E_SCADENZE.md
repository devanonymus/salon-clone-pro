# Dispositivi e scadenze tecniche

## Più dispositivi nello stesso salone

1. Aprire la scheda del salone e scegliere Registratore telematico, POS e pagamenti oppure Stampanti.
2. Selezionare Aggiungi dispositivo, assegnare un nome riconoscibile e compilare i campi obbligatori. Ogni dispositivo ha una scheda separata.
3. Indicare facoltativamente la data della prossima verifica tecnica. È una data di calendario, interpretata in Europe/Rome, non una certificazione di validità fiscale.
4. Salvare esplicitamente. Configurazione e scadenza sono persistenti; il dispositivo parte da collaudare.
5. Inserire le credenziali tecniche nel campo riservato del POS: il backend le cifra e non le restituisce in lettura. Lasciarlo vuoto mantiene il valore esistente; la casella Rimuovi elimina esplicitamente il segreto dalla scheda. Non inserire password nei campi liberi.

## Schede della versione precedente

La migration `20261023150000_platform_devices` crea una tabella e nuovi vincoli. Non modifica, sposta o cancella le configurazioni precedenti.

Quando una scheda precedente è disponibile compare Importa configurazione precedente. Compilare un nome e completare eventuali dati mancanti. Al salvataggio il server copia il segreto cifrato senza inviarlo al browser e collega la nuova scheda alla fonte. L’importazione è consentita una volta sola. La fonte rimane nel database; successive modifiche non sincronizzano automaticamente le due copie.

Per lo stesso salone non è possibile duplicare il nome della scheda o l’identità fisica. Per POS l’identità comprende provider e Terminal ID; per registratori comprende produttore e matricola. I dati del produttore/provider sono normalizzati per il confronto, gli identificativi conservano le maiuscole/minuscole. Per stampanti si confronta il nome della scheda senza distinzione di maiuscole. I vincoli comprendono i dispositivi archiviati: ripristinare la scheda originale invece di crearne una copia.

## Collaudo fisico e versioni

Selezionare Registra collaudo sul dispositivo. Indicare una verifica realmente effettuata, l’esito e le evidenze. Il backend registra data, tecnico e versione. Un esito manuale non attiva driver software, stampa, pagamenti o emissioni fiscali.

Ogni modifica incrementa la versione. Il backend rifiuta salvataggi o collaudi basati su una versione precedente con conflitto 409: annullare l’operazione, ricaricare l’elenco, verificare le modifiche dell’altro operatore e ripetere. Non sovrascrivere alla cieca.

La modifica della configurazione, l’archiviazione, il ripristino o un nuovo esito invalidano la checklist della sezione e il collaudo finale. Se il salone era ATTIVO viene riportato a DA_COLLAUDARE. Le evidenze dei collaudi rimangono nel Registro interventi anche dopo verifiche successive.

La sezione non può essere NA se contiene dispositivi non archiviati. Per PASS devono essere collaudati tutti i dispositivi attivi della sezione e le loro scadenze non devono essere superate. Il collaudo finale e il passaggio ad ATTIVO applicano la stessa verifica a tutti i dispositivi.

## Scadenze e dashboard

La dashboard mostra il numero di schede dispositivo non archiviate, verifiche con data precedente a oggi, verifiche da oggi ai prossimi 30 giorni inclusi e anomalie con esito fisico FAIL. L’elenco mostra fino a 20 dispositivi ordinati per data e nome. Il giorno corrente è calcolato in Europe/Rome; il tecnico vede solo i saloni assegnati.

Una verifica che scade evidenzia la necessità di intervento e impedisce un nuovo collaudo PASS finché la scadenza non viene aggiornata. La semplice lettura della dashboard non cambia lo stato del salone e non interrompe la cassa. Non è presente un monitor hardware automatico: i numeri derivano esclusivamente dalle schede e dagli esiti manuali salvati.

## Archiviazione e ripristino

Archivia richiede conferma e conserva scheda, segreti cifrati e storico. Attivare Mostra archiviati per trovare la scheda e selezionare Ripristina. Il ripristino richiede un nuovo collaudo; nessun dato viene eliminato. I dispositivi archiviati sono esclusi dalle scadenze e dai controlli di attivazione.
