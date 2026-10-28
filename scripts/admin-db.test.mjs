import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../apps/api/prisma/migrations',import.meta.url));
const db=new PGlite();const results=[];let server;
try{
 const migrations=(await readdir(root)).filter(n=>/^\d/.test(n)).sort();
 for(const name of migrations){
  if(name==='20261023120000_admin_control_center'){
   await db.exec(`INSERT INTO app."Tenant" (id,name,code) VALUES ('existing','Existing Salon','EXISTING');
   INSERT INTO app."User" (id,username,"pinHash",role,"tenantId") VALUES ('existing-owner','existing','hash','OWNER','existing');
   INSERT INTO app."InventoryProduct" (id,"tenantId",name,category,"updatedAt",stock) VALUES ('existing-product','existing','Product','Shampoo',CURRENT_TIMESTAMP,25);
   INSERT INTO app."ClientGlobal" (id,name,phone) VALUES ('existing-client','Client','12345');
   INSERT INTO app."Sale" (id,"tenantId","clientGlobalId",total) VALUES ('existing-sale','existing','existing-client',100);`);
  }
  if(name==='20261023150000_platform_devices') {
   await db.exec(`INSERT INTO app."PlatformConfiguration" (id,"tenantId",section,data,"secretsEncrypted","updatedAt") VALUES ('pre-device-source','existing','stampanti','{"name":"Legacy printer"}','encrypted-fixture-value',CURRENT_TIMESTAMP);`);
  }
  await db.exec(await readFile(`${root}/${name}/migration.sql`,'utf8'));results.push(`PASS migration ${name}`);
 }
 assert.equal((await db.query('SELECT count(*)::int AS n FROM app."Tenant"')).rows[0].n,1);
 assert.equal((await db.query('SELECT stock FROM app."InventoryProduct" WHERE id=\'existing-product\'')).rows[0].stock,25);
 assert.equal((await db.query('SELECT total FROM app."Sale" WHERE id=\'existing-sale\'')).rows[0].total,100);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM app."SalonProfile"')).rows[0].n,0);
 results.push('PASS existing tenant, owner, sale and inventory preserved; existing tenant receives no automatic profile');
 const prior=(await db.query('SELECT data,"secretsEncrypted" FROM app."PlatformConfiguration" WHERE id=\'pre-device-source\'')).rows[0];
 assert.equal(prior.data.name,'Legacy printer');assert.equal(prior.secretsEncrypted,'encrypted-fixture-value');
 assert.equal((await db.query('SELECT count(*)::int AS n FROM app."PlatformDevice"')).rows[0].n,0);
 results.push('PASS prior technical configuration and encrypted credential preserved; no automatic device migration');
 await db.exec(`INSERT INTO app."PlatformAdmin" (id,email,name,role) VALUES ('technician','tech@example.test','Tech','TECHNICIAN');
 INSERT INTO app."TechnicianAssignment" ("adminId","tenantId") VALUES ('technician','existing');`);
 await assert.rejects(()=>db.exec(`INSERT INTO app."TechnicianAssignment" ("adminId","tenantId") VALUES ('technician','existing');`));
 await assert.rejects(()=>db.exec(`INSERT INTO app."TechnicianAssignment" ("adminId","tenantId") VALUES ('technician','missing');`));
 results.push('PASS assignment uniqueness and tenant foreign key');
 await db.exec(`INSERT INTO app."PlatformConfiguration" (id,"tenantId",section,data,"updatedAt") VALUES ('configuration','existing','pos','{"mode":"MANUALE"}',CURRENT_TIMESTAMP);`);
 assert.equal((await db.query('SELECT data FROM app."PlatformConfiguration" WHERE id=\'configuration\'')).rows[0].data.mode,'MANUALE');
 await assert.rejects(()=>db.exec(`INSERT INTO app."PlatformConfiguration" (id,"tenantId",section,data,"updatedAt") VALUES ('duplicate','existing','pos','{}',CURRENT_TIMESTAMP);`));
 results.push('PASS configuration JSON persistence and tenant/section uniqueness');
 await db.exec(`INSERT INTO app."SalonOnboarding" (id,"tenantId",key,result,notes,"checkedBy","checkedAt") VALUES ('check','existing','COLLAUDO','PASS','Physical commissioning','technician',CURRENT_TIMESTAMP);`);
 assert.equal((await db.query('SELECT result FROM app."SalonOnboarding"')).rows[0].result,'PASS');
 results.push('PASS persistent commissioning');
 console.log(results.join('\n'));
 server=new PGLiteSocketServer({db,port:55439,host:'127.0.0.1'});await server.start();
 await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[fileURLToPath(new URL('./admin-integration-smoke.cjs',import.meta.url))],{stdio:'inherit',env:{...process.env,ADMIN_TEST_DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:55439/postgres'}});
 child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Persistent integration smoke failed')));
 });
}finally{if(server)await server.stop();await db.close();}
