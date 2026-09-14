# Prisma migrations

La prima migration versionata è additiva perché gli ambienti esistenti sono già
stati provisionati prima dell'introduzione della cronologia Prisma.

Prima del deploy:

1. creare un backup PostgreSQL;
2. marcare come baseline lo schema già esistente, se necessario;
3. eseguire `pnpm prisma migrate deploy` dalla root;
4. eseguire `pnpm prisma generate` e riavviare l'API.

La migration aggiunge idempotenza al checkout e indici sui percorsi di query
multi-tenant. Non elimina né converte colonne esistenti.
