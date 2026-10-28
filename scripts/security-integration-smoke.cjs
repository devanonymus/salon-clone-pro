const assert = require('node:assert/strict');
require('../apps/api/node_modules/reflect-metadata');
const { PrismaClient } = require('../apps/api/node_modules/@prisma/client');
const { PrismaPg } = require('../apps/api/node_modules/@prisma/adapter-pg');
const { ClientsService } = require('../apps/api/dist/src/clients/clients.service');
const { AuthService } = require('../apps/api/dist/src/auth/auth.service');
const { JwtGuard } = require('../apps/api/dist/src/auth/jwt.guard');
const bcrypt = require('../apps/api/node_modules/bcryptjs');

(async () => {
  const url = process.env.SECURITY_TEST_DATABASE_URL;
  if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).port !== '55459') throw Error('Disposable local database required');
  process.env.JWT_SECRET = require('node:crypto').randomBytes(32).toString('hex');
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 1 }) });
  try {
    const clients = new ClientsService(db), auth = new AuthService(db), guard = new JwtGuard(db);
    const a = await db.clientTenant.findUniqueOrThrow({ where: { id: 'link-a' } });
    const b = await db.clientTenant.findUniqueOrThrow({ where: { id: 'link-b' } });
    await clients.updateClient('a', a.clientGlobalId, { name: 'Only salon A', phone: '393337777777' });
    assert.equal((await db.clientGlobal.findUniqueOrThrow({ where: { id: b.clientGlobalId } })).name, 'Shared name');
    await assert.rejects(() => clients.updateClient('a', b.clientGlobalId, { name: 'Unauthorized' }));
    const c = await clients.createQuick('c', 'Salon C independent', '393331234567');
    assert.notEqual(c.clientGlobalId, b.clientGlobalId);
    const ownB = await clients.createQuick('b', 'Only salon B', '393331234567');
    assert.equal(ownB.clientGlobalId, b.clientGlobalId);
    assert.equal((await db.clientGlobal.findUniqueOrThrow({ where: { id: c.clientGlobalId } })).name, 'Salon C independent');
    await clients.createQuick('a', 'Another A', '393336666666');
    await assert.rejects(() => clients.updateClient('a', a.clientGlobalId, { phone: '393336666666' }));
    const race = await Promise.all([
      clients.createQuick('c', 'Concurrent record', '393335555555'),
      clients.createQuick('c', 'Concurrent record', '393335555555'),
    ]);
    assert.equal(race[0].clientGlobalId, race[1].clientGlobalId);
    console.log('PASS actual client service isolates edits, same-phone registrations, duplicate handling and concurrent creation');
    await db.user.create({ data: { id: 'test-owner-a', username: 'owner', role: 'OWNER', tenantId: 'a', pinHash: await bcrypt.hash('12345678', 12) } });
    const login = await auth.login('SALONA', 'owner', '12345678');
    const ctx = token => ({ switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: 'Bearer ' + token } }) }) });
    await guard.canActivate(ctx(login.token));
    const actor = { userId: 'test-owner-a', tenantId: 'a', username: 'owner', role: 'OWNER' };
    await assert.rejects(() => auth.changePin(actor, '87654321', '00000000'));
    await guard.canActivate(ctx(login.token));
    await auth.changePin(actor, '87654321', '12345678');
    await assert.rejects(() => guard.canActivate(ctx(login.token)));
    const newLogin = await auth.login('SALONA', 'owner', '87654321');
    await guard.canActivate(ctx(newLogin.token));
    for (let n = 0; n < 5; n++) await assert.rejects(() => auth.login('SALONA', 'owner', '00000000'));
    const locked = await db.user.findUniqueOrThrow({ where: { id: 'test-owner-a' } });
    assert.equal(locked.loginFailedAttempts, 5);
    assert(locked.loginLockedUntil > new Date());
    await assert.rejects(() => auth.login('SALONA', 'owner', '87654321'));
    console.log('PASS persisted login lockout and immediate JWT revocation after PIN change');
  } finally { await db.$disconnect(); }
})().catch(error => { console.error('Security smoke failed:', error.name, error.code || '', error.message); process.exitCode = 1; });
