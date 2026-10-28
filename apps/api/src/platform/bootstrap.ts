import 'reflect-metadata';
import { writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaService } from '../prisma.service';
import { encrypt, hashPassword, newTotpSecret, verifyTotp } from './security';
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
function hidden(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Terminale interattivo richiesto');
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const handler = (b: Buffer) => {
      const text = b.toString('utf8');
      for (const c of text) {
        if (c === '\u0003') {
          cleanup();
          reject(new Error('Annullato'));
          return;
        }
        if (c === '\r' || c === '\n') {
          cleanup();
          resolve(value);
          return;
        }
        if (c === '\u007f') {
          value = value.slice(0, -1);
        } else if (c >= ' ') value += c;
      }
    };
    function cleanup() {
      process.stdin.off('data', handler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    }
    process.stdin.on('data', handler);
  });
}
async function main() {
  const target = process.argv.slice(2).find((arg) => arg !== '--');
  if (!target)
    throw new Error(
      'Specificare il percorso assoluto del file privato per la configurazione MFA',
    );
  if (!target.startsWith('/')) throw new Error('Percorso assoluto richiesto');
  const email = (await hidden('Email Super Admin (input nascosto): '))
    .toLowerCase()
    .trim();
  const name = await hidden('Nome (input nascosto): ');
  const password = await hidden(
    'Password (12–128 caratteri, input nascosto): ',
  );
  const confirm = await hidden('Ripeti password: ');
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !name.trim() ||
    password.length < 12 ||
    password.length > 128 ||
    password !== confirm
  )
    throw new Error('Dati non validi');
  const secret = newTotpSecret();
  const encryptedSecret = encrypt(secret);
  const db = new PrismaService();
  const uri = `otpauth://totp/${encodeURIComponent('SalonPro:' + email)}?secret=${secret}&issuer=SalonPro&algorithm=SHA1&digits=6&period=30`;
  await writeFile(
    target,
    `Importa questo URI nell’autenticatore tramite un dispositivo sicuro. Elimina il file dopo la verifica.\n${uri}\n`,
    { mode: 0o600, flag: 'wx' },
  );
  let committed = false;
  try {
    console.log(
      'Configurazione MFA scritta nel file privato indicato. Importala prima di continuare.',
    );
    const code = await hidden('Codice MFA (input nascosto): '),
      step = verifyTotp(secret, code);
    if (step === null) throw new Error('Verifica MFA non riuscita');
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(781204621)`;
      if (await tx.platformAdmin.count({ where: { role: 'SUPER_ADMIN' } }))
        throw new Error(
          'Super Admin già presente: utilizzare gli inviti dal pannello',
        );
      const admin = await tx.platformAdmin.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
          role: 'SUPER_ADMIN',
          totpEncrypted: encryptedSecret,
          lastTotpStep: step,
        },
      });
      await tx.platformAuditLog.create({
        data: { adminId: admin.id, action: 'SUPER_ADMIN_BOOTSTRAPPED' },
      });
    });
    committed = true;
    console.log(
      'Super Admin creato. Accedi a /admin/login usando il prossimo codice MFA.',
    );
  } finally {
    try {
      await db.$disconnect();
    } finally {
      await unlink(target).catch(() => {});
    }
    if (!committed) console.log('Bootstrap non completato.');
  }
}
main().catch(() => {
  console.error(
    'Bootstrap non riuscito: controllare dati, variabili ambiente e migration. Nessuna credenziale viene registrata.',
  );
  process.exitCode = 1;
});
