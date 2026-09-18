# Prisma migrations

La migration `20260914000000_initial_schema_baseline` rende la cronologia
riproducibile anche su un database vuoto. È idempotente: sugli ambienti già
provisionati registra la baseline senza ricreare tabelle o modificare dati.

Prima del deploy:

1. creare un backup PostgreSQL;
2. eseguire `pnpm prisma migrate deploy` dalla root;
3. eseguire `pnpm prisma generate` e riavviare l'API.

Le migration successive aggiungono idempotenza al checkout, premi Loyalty e
indici sui percorsi multi-tenant. Non eliminano tabelle o colonne.
