import 'reflect-metadata';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaService } from '../prisma.service';
import { decrypt } from './security';
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
async function main() {
  const url = process.env.PLATFORM_MAIL_GATEWAY_URL,
    key = process.env.PLATFORM_MAIL_GATEWAY_TOKEN;
  if (!url || !url.startsWith('https://') || !key)
    throw new Error('Gateway email HTTPS e token richiesti');
  const db = new PrismaService();
  let failed = false;
  try {
    const rows = await db.platformMailOutbox.findMany({
      where: { sentAt: null, attempts: { lt: 10 } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    for (const row of rows) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            'Idempotency-Key': row.id,
          },
          body: JSON.stringify({
            id: row.id,
            to: row.recipient,
            ...JSON.parse(decrypt(row.payloadEncrypted)),
          }),
        });
        if (!response.ok) throw new Error('Consegna rifiutata');
        await db.platformMailOutbox.update({
          where: { id: row.id },
          data: {
            sentAt: new Date(),
            attempts: { increment: 1 },
            payloadEncrypted: '',
          },
        });
      } catch {
        failed = true;
        await db.platformMailOutbox.update({
          where: { id: row.id },
          data: { attempts: { increment: 1 } },
        });
      }
    }
    console.log(
      `Messaggi elaborati: ${rows.length}; verificare la coda per gli esiti.`,
    );
  } finally {
    await db.$disconnect();
  }
  if (failed) process.exitCode = 1;
}
main().catch(() => {
  console.error(
    'Consegna email non completata; nessun contenuto sensibile registrato.',
  );
  process.exitCode = 1;
});
