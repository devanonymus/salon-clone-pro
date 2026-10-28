import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../apps/api/prisma/migrations/', import.meta.url));
const db = new PGlite();
let server;
try {
  for (const name of (await readdir(root)).filter(n => /^\d/.test(n)).sort()) {
    if (name === '20261028120000_tenant_clients_and_authentication') {
      await db.exec(await readFile(new URL('./security-fixture.sql', import.meta.url), 'utf8'));
    }
    await db.exec(await readFile(root + '/' + name + '/migration.sql', 'utf8'));
  }
  const links = (await db.query('SELECT t.id,t."tenantId",t.notes,c.id AS client_id,c."ownerTenantId",c.name,c.phone,c.email FROM app."ClientTenant" t JOIN app."ClientGlobal" c ON c.id=t."clientGlobalId" ORDER BY t.id')).rows;
  assert.equal(links.length, 2);
  assert.notEqual(links[0].client_id, links[1].client_id);
  assert(links.every(l => l.ownerTenantId === l.tenantId));
  assert.equal(links[0].notes, 'Private A');
  assert.equal(links[1].notes, 'Private B');
  const sales = (await db.query('SELECT id,total,"requestHash","clientGlobalId" FROM app."Sale" ORDER BY id')).rows;
  assert.equal(sales[0].total, 125.5);
  assert.equal(sales[1].total, 79);
  assert.equal(sales[1].clientGlobalId, links[1].client_id);
  assert.equal(sales[1].requestHash, 'historical-request-b');
  assert.equal((await db.query('SELECT "clientGlobalId" FROM app."ClientAward" WHERE id=$1', ['award-b'])).rows[0].clientGlobalId, links[1].client_id);
  assert.equal((await db.query('SELECT "clientTenantId" FROM app."Appointment" WHERE id=$1', ['appointment-b'])).rows[0].clientTenantId, 'link-b');
  assert.equal((await db.query('SELECT stock FROM app."InventoryProduct" WHERE id=$1', ['product-a'])).rows[0].stock, 25);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM app."ClientGlobal"')).rows[0].n, 3);
  assert.equal((await db.query('SELECT "ownerTenantId" FROM app."ClientGlobal" WHERE id=$1', ['orphan'])).rows[0].ownerTenantId, null);
  await assert.rejects(() => db.query(
    'INSERT INTO app."Sale" (id,"tenantId","clientGlobalId",total) VALUES ($1,$2,$3,10)',
    ['cross-tenant-sale', 'a', links[1].client_id],
  ));
  await assert.rejects(() => db.query(
    'INSERT INTO app."ClientTenant" (id,"tenantId","clientGlobalId") VALUES ($1,$2,$3)',
    ['cross-tenant-link', 'c', links[1].client_id],
  ));
  console.log('PASS migrated shared identities with historical sales, awards, appointments, notes and inventory preserved');
  console.log('PASS database rejects cross-tenant client links and sales; unlinked archive preserved');
  server = new PGLiteSocketServer({ db, host: '127.0.0.1', port: 55459 });
  await server.start();
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL('./security-integration-smoke.cjs', import.meta.url))], {
      stdio: 'inherit',
      env: { ...process.env, SECURITY_TEST_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55459/postgres' },
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('Security integration failed')));
  });
} finally {
  if (server) await server.stop();
  await db.close();
}
