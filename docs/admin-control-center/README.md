# SalonPro Control Center

Pannello amministrativo separato in `/admin`, destinato a Univibe Group. Le API sono sotto `/platform` e usano sessioni opache in cookie HttpOnly. Non sono accettati i JWT dei saloni.

## Funzioni implementate

- Dashboard alimentata dal database, elenco saloni con ricerca/filtri/ordinamento e scheda tecnica.
- Account SUPER_ADMIN, ADMIN e TECHNICIAN; MFA TOTP obbligatoria per tutti gli account della piattaforma.
- Provisioning transazionale di tenant, account OWNER inattivo, checklist e invito. Nessun dato dimostrativo.
- Assegnazioni tecniche verificate dal backend a ogni richiesta. Nessun endpoint tecnico per clienti o vendite.
- Salvataggio esplicito di configurazioni, cifratura delle credenziali, checklist persistente, note e audit.
- Più registratori, POS e stampanti per salone, ciascuno con scheda, scadenza, collaudo fisico e storico. Archiviazione e ripristino conservano i dati.
- Dashboard con dispositivi censiti, verifiche scadute/in scadenza e anomalie registrate manualmente, sempre limitata ai saloni autorizzati.
- Sospensione controllata nel login e nei token già emessi per gli utenti dei saloni.
- Intervallo agenda e aliquote servizi/rivendita applicati tramite CoachService esistente, nella stessa transazione del salvataggio tecnico.

## Stato reale e limiti

Le configurazioni hardware sono schede amministrative: **nessun driver fiscale, POS o stampante operativo**. Il test restituisce esplicitamente `supported:false, success:false`. Il collaudo manuale documenta una verifica fisica; non abilita protocolli software. Non vengono inviati pagamenti o documenti commerciali. I pagamenti integrati dispongono di un contratto di adattatore; idempotenza, riconciliazione e webhook reali vanno implementati e certificati per ciascun provider prima di abilitarli.

L’archivio PlatformDevice gestisce più dispositivi per salone. Le schede della versione precedente in PlatformConfiguration sono conservate e possono essere importate esplicitamente, senza duplicazioni o esposizione dei segreti. Gli altri parametri operativi sono documentazione tecnica; non sostituiscono servizi, operatori, magazzino e marketing esistenti. Le integrazioni WhatsApp esistenti restano nel relativo modulo; questa scheda non riconfigura automaticamente il servizio attivo. Le scadenze e gli esiti dei collaudi fisici sono disponibili nella dashboard. Monitoraggio automatico degli errori dei provider, permessi granulari oltre i ruoli e visibilità amministrativa della consegna email non sono ancora implementati.

Gli inviti vengono accodati, **non consegnati automaticamente**: configurare e verificare il gateway e il worker descritto in INSTALLAZIONE. I tenant esistenti non vengono modificati dalla migration. Completare esplicitamente la scheda anagrafica per avviarne l’adozione. Un account OWNER già attivo viene riconosciuto senza duplicarlo; la migration non invia inviti ai saloni esistenti.

Non è un rilascio certificato per la produzione: servono staging PostgreSQL, backup con prova di ripristino, verifica sessioni e proxy Railway, servizio email reale e collaudo operativo con il cliente.

## Guide

- [Installazione e deploy](INSTALLAZIONE.md)
- [Primo Super Admin](SUPER_ADMIN.md)
- [Attivazione salone](ATTIVAZIONE_SALONE.md)
- [Registratore telematico](CONFIGURAZIONE_REGISTRATORE.md)
- [POS](CONFIGURAZIONE_POS.md)
- [Stampanti](CONFIGURAZIONE_STAMPANTI.md)
- [Tecnici](GESTIONE_TECNICI.md)
- [Dispositivi e scadenze](DISPOSITIVI_E_SCADENZE.md)
- [Collaudo](COLLAUDO.md)
- [Sicurezza](SICUREZZA.md)

