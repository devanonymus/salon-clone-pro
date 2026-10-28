INSERT INTO app."Tenant" (id,name,code) VALUES ('a','Salon A','SALONA'),('b','Salon B','SALONB'),('c','Salon C','SALONC');
INSERT INTO app."ClientGlobal" (id,name,phone,email) VALUES
  ('shared','Shared name','393331234567','original@example.test'),
  ('orphan','Unlinked archive','393339999999',NULL);
INSERT INTO app."ClientTenant" (id,"tenantId","clientGlobalId",notes) VALUES
  ('link-a','a','shared','Private A'),('link-b','b','shared','Private B');
INSERT INTO app."Appointment" (id,"tenantId","clientTenantId",date,duration)
  VALUES ('appointment-b','b','link-b',CURRENT_TIMESTAMP,30);
INSERT INTO app."Sale" (id,"tenantId","clientGlobalId",total,"requestHash")
  VALUES ('sale-a','a','shared',125.5,'historical-request-a'),('sale-b','b','shared',79,'historical-request-b');
INSERT INTO app."ClientAward" (id,"tenantId","clientGlobalId","prizeName","updatedAt")
  VALUES ('award-b','b','shared','Existing prize',CURRENT_TIMESTAMP);
INSERT INTO app."InventoryProduct" (id,"tenantId",name,category,stock,"updatedAt")
  VALUES ('product-a','a','Existing stock','Shampoo',25,CURRENT_TIMESTAMP);
