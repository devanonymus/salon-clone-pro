# Gestione tecnici

1. Un amministratore apre Tecnici e accessi → Invita account, indica nome/email e ruolo TECHNICIAN.
2. ADMIN può invitare soltanto tecnici. SUPER_ADMIN può invitare anche ADMIN e SUPER_ADMIN.
3. Configurare la consegna email ed eseguire il worker. Il tecnico apre il link, imposta password e registra una chiave TOTP nell’autenticatore; verifica con il codice a sei cifre.
4. Dalla scheda del salone, Panoramica → Assegna tecnico, selezionare un tecnico attivo. È possibile assegnare più tecnici allo stesso salone.
5. Il tecnico vede soltanto i tenant assegnati e può salvare schede tecniche, checklist e interventi. Non vede clienti, incassi o storico fiscale.
6. Per rimuovere un salone usare Rimuovi assegnazione. La verifica server a ogni richiesta revoca subito l’accesso successivo.
7. Per disabilitare l’account scegliere Revoca e confermare. Tutte le sessioni del tecnico vengono revocate; riattivare l’account non ripristina le sessioni precedenti.
8. Rinnova invito è disponibile per account non ancora attivati. Un nuovo invito invalida quello precedente.

I permessi attuali sono definiti dai ruoli e dalle assegnazioni, non da un editor di privilegi personalizzati. Un tecnico non può gestire utenti amministrativi, stati del salone o assegnazioni. ADMIN non può modificare amministratori, Super Admin o i propri privilegi. Non è consentito disabilitare sé stessi o un Super Admin dal pannello.

