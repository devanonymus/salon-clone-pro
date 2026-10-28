import {
  assertDevicesReady,
  deviceSections,
  deviceChecks,
  technicalToday,
} from './device-policy';
import { isIP } from 'node:net';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, PlatformAdmin } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CoachService } from '../coach/coach.service';
import { PrismaService } from '../prisma.service';
import {
  decrypt,
  digest,
  encrypt,
  hashPassword,
  newToken,
  verifyPassword,
  verifyTotp,
} from './security';
import {
  ActivateDto,
  AdminDto,
  ConfigurationDto,
  LoginDto,
  SalonDto,
  StatusDto,
  CheckDto,
} from './platform.dto';

export type Actor = Pick<PlatformAdmin, 'id' | 'name' | 'email' | 'role'>;
export const checks = [
  'ANAGRAFICA',
  'TENANT',
  'TITOLARE',
  'OPERATIVITA',
  'REGISTRATORE',
  'POS',
  'STAMPANTE',
  'INTEGRAZIONI',
  'COLLAUDO',
];
export const sections = [
  'registratore',
  'pos',
  'stampanti',
  'fiscalita',
  'integrazioni',
  'operativita',
];
const dummyPasswordHash = hashPassword('invalid-placeholder-password');
const publicAdmin = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  createdAt: true,
} as const;
@Injectable()
export class PlatformService {
  constructor(
    private readonly db: PrismaService,
    private readonly coach: CoachService,
  ) {}
  private audit(
    tx: Prisma.TransactionClient,
    actor: Actor | null,
    action: string,
    tenantId?: string,
  ) {
    return tx.platformAuditLog.create({
      data: { adminId: actor?.id, action, tenantId },
    });
  }
  manage(actor: Actor) {
    if (actor.role === 'TECHNICIAN')
      throw new ForbiddenException('Operazione riservata agli amministratori');
  }
  async scope(actor: Actor, tenantId: string) {
    if (
      actor.role === 'TECHNICIAN' &&
      !(await this.db.technicianAssignment.findUnique({
        where: { adminId_tenantId: { adminId: actor.id, tenantId } },
      }))
    )
      throw new ForbiddenException('Salone non assegnato');
    if (
      !(await this.db.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Salone non trovato');
  }
  async session(raw: string | undefined) {
    if (!raw) throw new UnauthorizedException();
    const s = await this.db.platformSession.findUnique({
      where: { tokenHash: digest(raw) },
      include: { admin: true },
    });
    if (!s || s.revokedAt || s.expiresAt <= new Date() || !s.admin.active)
      throw new UnauthorizedException();
    return {
      actor: {
        id: s.admin.id,
        name: s.admin.name,
        email: s.admin.email,
        role: s.admin.role,
      },
      sessionId: s.id,
    };
  }
  async login(body: LoginDto) {
    const admin = await this.db.platformAdmin.findUnique({
      where: { email: body.email.toLowerCase().trim() },
    });
    const valid = admin?.passwordHash
      ? verifyPassword(body.password, admin.passwordHash)
      : (verifyPassword(body.password, dummyPasswordHash), false);
    const step = admin?.totpEncrypted
      ? verifyTotp(decrypt(admin.totpEncrypted), body.totp, admin.lastTotpStep)
      : null;
    if (
      !admin ||
      !admin.active ||
      !valid ||
      step === null ||
      (admin.lockedUntil && admin.lockedUntil > new Date())
    ) {
      await this.db.$transaction(async (tx) => {
        if (admin)
          await tx.platformAdmin.update({
            where: { id: admin.id },
            data: {
              failedAttempts: { increment: 1 },
              ...(admin.failedAttempts >= 4
                ? { lockedUntil: new Date(Date.now() + 900000) }
                : {}),
            },
          });
        await this.audit(tx, null, 'LOGIN_FAILED');
      });
      throw new UnauthorizedException('Credenziali o codice MFA non validi');
    }
    const token = newToken();
    await this.db.$transaction(async (tx) => {
      const claimed = await tx.platformAdmin.updateMany({
        where: { id: admin.id, lastTotpStep: admin.lastTotpStep, active: true },
        data: { lastTotpStep: step, failedAttempts: 0, lockedUntil: null },
      });
      if (claimed.count !== 1)
        throw new UnauthorizedException('Codice MFA già utilizzato');
      await tx.platformSession.create({
        data: {
          adminId: admin.id,
          tokenHash: digest(token),
          expiresAt: new Date(Date.now() + 8 * 3600000),
        },
      });
      await this.audit(tx, admin, 'LOGIN_SUCCESS');
    });
    return token;
  }
  async logout(actor: Actor, sessionId: string, all = false) {
    await this.db.$transaction(async (tx) => {
      await tx.platformSession.updateMany({
        where: all
          ? { adminId: actor.id }
          : { id: sessionId, adminId: actor.id },
        data: { revokedAt: new Date() },
      });
      await this.audit(tx, actor, all ? 'SESSIONS_REVOKED' : 'LOGOUT');
    });
    return { ok: true };
  }
  private async invite(
    tx: Prisma.TransactionClient,
    email: string,
    purpose: string,
    adminId?: string,
    tenantId?: string,
  ) {
    const base = process.env.PLATFORM_WEB_URL;
    if (
      !base ||
      (process.env.NODE_ENV === 'production' && !base.startsWith('https://'))
    )
      throw new BadRequestException('PLATFORM_WEB_URL non configurato');
    const token = newToken();
    await tx.platformInvitation.updateMany({
      where: {
        adminId: adminId ?? null,
        tenantId: tenantId ?? null,
        purpose,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
    await tx.platformInvitation.create({
      data: {
        tokenHash: digest(token),
        adminId,
        tenantId,
        purpose,
        expiresAt: new Date(Date.now() + 24 * 3600000),
      },
    });
    await tx.platformMailOutbox.create({
      data: {
        recipient: email,
        payloadEncrypted: encrypt(
          JSON.stringify({
            purpose,
            url: `${base.replace(/\/$/, '')}/admin/activate#${token}`,
          }),
        ),
      },
    });
  }
  async recover(email: string) {
    const admin = await this.db.platformAdmin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (admin?.active)
      await this.db.$transaction(async (tx) => {
        await this.invite(tx, admin.email, 'RESET', admin.id);
        await this.audit(tx, null, 'RESET_REQUESTED');
      });
    return { message: 'Se l’account esiste, riceverai le istruzioni.' };
  }
  async activate(body: ActivateDto) {
    const invitation = await this.db.platformInvitation.findUnique({
      where: { tokenHash: digest(body.token) },
    });
    if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date())
      throw new BadRequestException('Invito scaduto o non valido');
    const admin = invitation.adminId
      ? await this.db.platformAdmin.findUnique({
          where: { id: invitation.adminId },
        })
      : null;
    if (invitation.adminId && !admin?.active)
      throw new BadRequestException('Account non disponibile');
    let step: bigint | null = null;
    if (admin) {
      const secret =
        invitation.purpose === 'RESET'
          ? admin.totpEncrypted
            ? decrypt(admin.totpEncrypted)
            : ''
          : body.totpSecret;
      step =
        secret && body.totp
          ? verifyTotp(secret, body.totp, admin.lastTotpStep)
          : null;
      if (step === null)
        throw new BadRequestException('MFA richiesta e non valida');
    }
    if (
      !admin &&
      (body.password.length > 64 ||
        Buffer.byteLength(body.password, 'utf8') > 72)
    )
      throw new BadRequestException(
        'Password titolare: massimo 64 caratteri e 72 byte',
      );
    const passwordHash = admin
      ? hashPassword(body.password)
      : await bcrypt.hash(body.password, 12);
    return this.db.$transaction(async (tx) => {
      const claimed = await tx.platformInvitation.updateMany({
        where: {
          id: invitation.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1)
        throw new BadRequestException('Invito già utilizzato');
      if (admin) {
        const updated = await tx.platformAdmin.updateMany({
          where: {
            id: admin.id,
            active: true,
            lastTotpStep: admin.lastTotpStep,
          },
          data: {
            passwordHash,
            lastTotpStep: step!,
            ...(invitation.purpose === 'RESET'
              ? {}
              : { totpEncrypted: encrypt(body.totpSecret!) }),
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
        if (updated.count !== 1)
          throw new BadRequestException('Codice MFA già utilizzato');
        await tx.platformSession.updateMany({
          where: { adminId: admin.id },
          data: { revokedAt: new Date() },
        });
      } else if (invitation.tenantId) {
        const profile = await tx.salonProfile.findUniqueOrThrow({
          where: { tenantId: invitation.tenantId },
        });
        await tx.user.update({
          where: {
            tenantId_username: {
              tenantId: invitation.tenantId,
              username: profile.ownerEmail,
            },
          },
          data: {
            pinHash: passwordHash, active: true,
            authVersion: { increment: 1 },
            loginFailedAttempts: 0,
            loginLockedUntil: null,
          },
        });
        await tx.salonOnboarding.update({
          where: {
            tenantId_key: { tenantId: invitation.tenantId, key: 'TITOLARE' },
          },
          data: {
            result: 'PASS',
            checkedAt: new Date(),
            notes: 'Invito accettato dal titolare',
          },
        });
      }
      await this.audit(
        tx,
        admin,
        'INVITATION_ACCEPTED',
        invitation.tenantId ?? undefined,
      );
      return { ok: true };
    });
  }
  async list(actor: Actor) {
    return this.db.tenant.findMany({
      where:
        actor.role === 'TECHNICIAN'
          ? { technicianAssignments: { some: { adminId: actor.id } } }
          : {},
      select: {
        id: true,
        name: true,
        code: true,
        salonProfile: true,
        technicianAssignments: { select: { admin: { select: publicAdmin } } },
      },
      orderBy: { name: 'asc' },
    });
  }
  async dashboard(actor: Actor) {
    const salons = await this.list(actor),
      ids = salons.map((s) => s.id);
    const [activities, configurations, pending, technicians] =
      await Promise.all([
        this.db.platformAuditLog.findMany({
          where: actor.role === 'TECHNICIAN' ? { tenantId: { in: ids } } : {},
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.db.platformConfiguration.count({
          where: {
            tenantId: { in: ids },
            section: { in: ['registratore', 'pos', 'stampanti'] },
          },
        }),
        this.db.salonOnboarding.count({
          where: {
            tenantId: { in: ids },
            key: 'COLLAUDO',
            result: { not: 'PASS' },
          },
        }),
        this.db.platformAdmin.count({
          where: {
            role: 'TECHNICIAN',
            active: true,
            ...(actor.role === 'TECHNICIAN' ? { id: actor.id } : {}),
          },
        }),
      ]);
    const today = technicalToday(),
      horizon = new Date(today.getTime() + 30 * 86400000);
    const deviceScope = { tenantId: { in: ids }, archivedAt: null };
    const [
      deviceCount,
      legacyCount,
      overdue,
      upcoming,
      deviceFailures,
      deadlines,
    ] = await Promise.all([
      this.db.platformDevice.count({ where: deviceScope }),
      this.db.platformConfiguration.count({
        where: {
          tenantId: { in: ids },
          section: { in: [...deviceSections] },
          importedDevice: { is: null },
        },
      }),
      this.db.platformDevice.count({
        where: { ...deviceScope, dueDate: { lt: today } },
      }),
      this.db.platformDevice.count({
        where: { ...deviceScope, dueDate: { gte: today, lte: horizon } },
      }),
      this.db.platformDevice.count({
        where: { ...deviceScope, physicalCheck: 'FAIL' },
      }),
      this.db.platformDevice.findMany({
        where: { ...deviceScope, dueDate: { lte: horizon } },
        select: {
          id: true,
          tenantId: true,
          label: true,
          section: true,
          dueDate: true,
          physicalCheck: true,
          tenant: { select: { name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { label: 'asc' }],
        take: 20,
      }),
    ]);
    return {
      devices: deviceCount,
      legacyConfigurations: legacyCount,
      overdue,
      upcoming,
      deviceFailures,
      deadlines,
      salons: salons.length,
      active: salons.filter((s) => s.salonProfile?.status === 'ATTIVO').length,
      suspended: salons.filter((s) => s.salonProfile?.status === 'SOSPESO')
        .length,
      configuring: salons.filter(
        (s) => s.salonProfile?.status === 'IN_CONFIGURAZIONE',
      ).length,
      unprofiled: salons.filter((s) => !s.salonProfile).length,
      configurations,
      pending,
      technicians,
      activities,
    };
  }
  async createSalon(actor: Actor, body: SalonDto) {
    this.manage(actor);
    if (body.ownerEmail.length > 64)
      throw new BadRequestException(
        'Email titolare: massimo 64 caratteri per compatibilità accesso',
      );
    const { name, code, ...profile } = body;
    try {
      return await this.db.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name,
            code,
            salonProfile: {
              create: {
                ...profile,
                ownerEmail: body.ownerEmail.toLowerCase().trim(),
              },
            },
          },
        });
        await tx.user.create({
          data: {
            tenantId: tenant.id,
            username: body.ownerEmail.toLowerCase().trim(),
            pinHash: await bcrypt.hash(newToken(), 12),
            role: 'OWNER',
            active: false,
          },
        });
        await tx.salonOnboarding.createMany({
          data: checks.map((key) => ({
            tenantId: tenant.id,
            key,
            result: ['ANAGRAFICA', 'TENANT'].includes(key) ? 'PASS' : 'PENDING',
            checkedBy: actor.id,
            checkedAt: new Date(),
          })),
        });
        await this.invite(tx, body.ownerEmail, 'OWNER', undefined, tenant.id);
        await this.audit(tx, actor, 'SALON_CREATED', tenant.id);
        return tenant;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Codice salone o partita IVA già presente');
      throw error;
    }
  }
  async detail(actor: Actor, id: string) {
    await this.scope(actor, id);
    const [tenant, configurations, onboarding, interventions] =
      await Promise.all([
        this.db.tenant.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            code: true,
            salonProfile: true,
            technicianAssignments: {
              select: { admin: { select: publicAdmin } },
            },
          },
        }),
        this.db.platformConfiguration.findMany({
          where: { tenantId: id },
          select: {
            section: true,
            data: true,
            verifiedAt: true,
            updatedAt: true,
          },
        }),
        this.db.salonOnboarding.findMany({ where: { tenantId: id } }),
        this.db.technicalIntervention.findMany({
          where: { tenantId: id },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ]);
    return { tenant, configurations, onboarding, interventions };
  }
  async editSalon(actor: Actor, id: string, body: SalonDto) {
    this.manage(actor);
    await this.scope(actor, id);
    const current = await this.db.salonProfile.findUnique({
      where: { tenantId: id },
    });
    if (current && current.ownerEmail !== body.ownerEmail.toLowerCase().trim())
      throw new BadRequestException(
        'Cambio titolare richiede una procedura dedicata',
      );
    const { name, code, ...profile } = body;
    return this.db.$transaction(async (tx) => {
      await tx.tenant.update({ where: { id }, data: { name, code } });
      await tx.salonProfile.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...profile,
          ownerEmail: body.ownerEmail.toLowerCase().trim(),
        },
        update: {
          ...profile,
          ownerEmail: body.ownerEmail.toLowerCase().trim(),
        },
      });
      if (!current) {
        const owner = await tx.user.findFirst({
          where: { tenantId: id, role: 'OWNER', active: true },
          select: { id: true },
        });
        await tx.salonOnboarding.createMany({
          data: checks.map((key) => ({
            tenantId: id,
            key,
            result:
              ['ANAGRAFICA', 'TENANT'].includes(key) ||
              (key === 'TITOLARE' && owner)
                ? 'PASS'
                : 'PENDING',
            checkedBy: actor.id,
            checkedAt: new Date(),
            notes:
              key === 'TITOLARE' && owner
                ? 'Account titolare preesistente verificato'
                : '',
          })),
          skipDuplicates: true,
        });
      }
      await tx.salonOnboarding.updateMany({
        where: { tenantId: id, key: 'COLLAUDO' },
        data: { result: 'PENDING', checkedAt: null },
      });
      await tx.salonProfile.updateMany({
        where: { tenantId: id, status: 'ATTIVO' },
        data: { status: 'DA_COLLAUDARE' },
      });
      await this.audit(tx, actor, 'SALON_UPDATED', id);
      return { ok: true };
    });
  }
  async status(actor: Actor, id: string, body: StatusDto) {
    this.manage(actor);
    await this.scope(actor, id);
    return this.db.$transaction(
      async (tx) => {
        if (body.status === 'ATTIVO') {
          await assertDevicesReady(tx, id);
          for (const section of deviceSections) {
            const row = await tx.salonOnboarding.findUnique({
              where: {
                tenantId_key: { tenantId: id, key: deviceChecks[section] },
              },
            });
            if (row?.result === 'NA')
              await assertDevicesReady(tx, id, deviceChecks[section], 'NA');
          }
          const rows = await tx.salonOnboarding.findMany({
            where: { tenantId: id },
          });
          if (
            checks.some(
              (k) =>
                !rows.some(
                  (r) =>
                    r.key === k &&
                    (r.result === 'PASS' ||
                      ([
                        'REGISTRATORE',
                        'POS',
                        'STAMPANTE',
                        'INTEGRAZIONI',
                      ].includes(k) &&
                        r.result === 'NA')),
                ),
            )
          )
            throw new BadRequestException('Checklist incompleta');
        }
        await tx.salonProfile.update({
          where: { tenantId: id },
          data: { status: body.status },
        });
        await this.audit(tx, actor, `STATUS_${body.status}`, id);
        return { ok: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async resend(actor: Actor, targetId: string, kind: 'admin' | 'owner') {
    this.manage(actor);
    return this.db.$transaction(async (tx) => {
      if (kind === 'admin') {
        const target = await tx.platformAdmin.findUnique({
          where: { id: targetId },
        });
        if (!target || !target.active || target.passwordHash)
          throw new BadRequestException(
            'Account già attivato o non disponibile',
          );
        if (actor.role !== 'SUPER_ADMIN' && target.role !== 'TECHNICIAN')
          throw new ForbiddenException();
        await this.invite(tx, target.email, 'ADMIN', target.id);
      } else {
        const profile = await tx.salonProfile.findUnique({
          where: { tenantId: targetId },
        });
        if (!profile) throw new NotFoundException();
        const owner = await tx.user.findUnique({
          where: {
            tenantId_username: {
              tenantId: targetId,
              username: profile.ownerEmail,
            },
          },
        });
        if (!owner || owner.active)
          throw new BadRequestException(
            'Titolare già attivo o account non disponibile',
          );
        await this.invite(tx, profile.ownerEmail, 'OWNER', undefined, targetId);
      }
      await this.audit(
        tx,
        actor,
        'INVITATION_REQUEUED',
        kind === 'owner' ? targetId : undefined,
      );
      return {
        ok: true,
        message: 'Nuovo invito accodato. Il precedente è stato invalidato.',
      };
    });
  }
  async admins(actor: Actor) {
    this.manage(actor);
    return this.db.platformAdmin.findMany({
      where: actor.role === 'SUPER_ADMIN' ? {} : { role: 'TECHNICIAN' },
      select: { ...publicAdmin, assignments: { select: { tenantId: true } } },
      orderBy: { name: 'asc' },
    });
  }
  async createAdmin(actor: Actor, body: AdminDto) {
    this.manage(actor);
    if (actor.role !== 'SUPER_ADMIN' && body.role !== 'TECHNICIAN')
      throw new ForbiddenException('Privilegio Super Admin richiesto');
    try {
      return await this.db.$transaction(async (tx) => {
        const admin = await tx.platformAdmin.create({
          data: { ...body, email: body.email.toLowerCase().trim() },
          select: publicAdmin,
        });
        await this.invite(tx, admin.email, 'ADMIN', admin.id);
        await this.audit(tx, actor, 'ADMIN_INVITED');
        return admin;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email già presente');
      throw error;
    }
  }
  async activeAdmin(actor: Actor, id: string, active: boolean) {
    this.manage(actor);
    const target = await this.db.platformAdmin.findUnique({ where: { id } });
    if (!target) throw new NotFoundException();
    if (
      target.id === actor.id ||
      target.role === 'SUPER_ADMIN' ||
      (actor.role !== 'SUPER_ADMIN' && target.role !== 'TECHNICIAN')
    )
      throw new ForbiddenException('Modifica non consentita');
    return this.db.$transaction(async (tx) => {
      await tx.platformAdmin.update({ where: { id }, data: { active } });
      if (!active)
        await tx.platformSession.updateMany({
          where: { adminId: id },
          data: { revokedAt: new Date() },
        });
      await this.audit(tx, actor, active ? 'ADMIN_ENABLED' : 'ADMIN_DISABLED');
      return { ok: true };
    });
  }
  async assign(actor: Actor, id: string, adminId: string, remove = false) {
    this.manage(actor);
    await this.scope(actor, id);
    const admin = await this.db.platformAdmin.findFirst({
      where: { id: adminId, role: 'TECHNICIAN', active: true },
    });
    if (!admin) throw new BadRequestException('Tecnico non valido');
    return this.db.$transaction(async (tx) => {
      if (remove)
        await tx.technicianAssignment.deleteMany({
          where: { tenantId: id, adminId },
        });
      else
        await tx.technicianAssignment.upsert({
          where: { adminId_tenantId: { adminId, tenantId: id } },
          create: { adminId, tenantId: id },
          update: {},
        });
      await tx.technicalIntervention.create({
        data: {
          tenantId: id,
          adminId: actor.id,
          action: remove ? 'TECHNICIAN_UNASSIGNED' : 'TECHNICIAN_ASSIGNED',
          notes: `Tecnico: ${admin.id}`,
        },
      });
      await this.audit(
        tx,
        actor,
        remove ? 'TECHNICIAN_UNASSIGNED' : 'TECHNICIAN_ASSIGNED',
        id,
      );
      return { ok: true };
    });
  }
  async saveConfig(
    actor: Actor,
    id: string,
    section: string,
    body: ConfigurationDto,
  ) {
    await this.scope(actor, id);
    if (!sections.includes(section))
      throw new BadRequestException('Sezione non valida');
    validateConfiguration(section, body.data);
    return this.db.$transaction(async (tx) => {
      const data = body.data as Prisma.InputJsonObject;
      if (section === 'operativita' && body.data.agendaInterval) {
        await this.coach.updateSettings(
          id,
          { agendaGridMinutes: Number(body.data.agendaInterval) },
          tx,
        );
      }
      if (section === 'fiscalita') {
        await this.coach.updateSettings(
          id,
          {
            ...(body.data.vatServices !== undefined &&
            body.data.vatServices !== ''
              ? { vatServicesPercent: Number(body.data.vatServices) }
              : {}),
            ...(body.data.vatResale !== undefined && body.data.vatResale !== ''
              ? { vatResalePercent: Number(body.data.vatResale) }
              : {}),
          },
          tx,
        );
      }

      const secret =
        body.secret !== undefined
          ? { secretsEncrypted: body.secret ? encrypt(body.secret) : null }
          : {};
      await tx.platformConfiguration.upsert({
        where: { tenantId_section: { tenantId: id, section } },
        create: { tenantId: id, section, data, ...secret },
        update: { data, ...secret, verifiedAt: null },
      });
      await tx.salonOnboarding.updateMany({
        where: {
          tenantId: id,
          key: {
            in: [
              {
                registratore: 'REGISTRATORE',
                pos: 'POS',
                stampanti: 'STAMPANTE',
                integrazioni: 'INTEGRAZIONI',
                operativita: 'OPERATIVITA',
                fiscalita: 'REGISTRATORE',
              }[section]!,
              'COLLAUDO',
            ],
          },
        },
        data: { result: 'PENDING', checkedAt: null },
      });
      await tx.salonProfile.updateMany({
        where: { tenantId: id, status: 'ATTIVO' },
        data: { status: 'DA_COLLAUDARE' },
      });
      await tx.technicalIntervention.create({
        data: {
          tenantId: id,
          adminId: actor.id,
          action: 'CONFIGURATION_SAVED',
          notes: `Configurazione ${section} salvata; collegamento non verificato`,
        },
      });
      await this.audit(tx, actor, `CONFIG_${section.toUpperCase()}`, id);
      return {
        ok: true,
        supported: false,
        message:
          'Configurazione salvata. Integrazione non operativa; collaudo tecnico richiesto.',
      };
    });
  }
  async check(actor: Actor, id: string, key: string, body: CheckDto) {
    await this.scope(actor, id);
    if (
      !checks.includes(key) ||
      ['ANAGRAFICA', 'TENANT', 'TITOLARE'].includes(key)
    )
      throw new BadRequestException('Verifica automatica o non valida');
    if (
      body.result === 'NA' &&
      !['REGISTRATORE', 'POS', 'STAMPANTE', 'INTEGRAZIONI'].includes(key)
    )
      throw new BadRequestException('Verifica obbligatoria');
    if (
      ['PASS', 'FAIL', 'NA'].includes(body.result) &&
      body.notes.trim().length < 5
    )
      throw new BadRequestException('Specificare evidenza o motivazione');
    return this.db.$transaction(async (tx) => {
      await assertDevicesReady(tx, id, key, body.result);
      await tx.salonOnboarding.upsert({
        where: { tenantId_key: { tenantId: id, key } },
        create: {
          tenantId: id,
          key,
          ...body,
          checkedBy: actor.id,
          checkedAt: new Date(),
        },
        update: { ...body, checkedBy: actor.id, checkedAt: new Date() },
      });
      if (body.result === 'FAIL' || body.result === 'PENDING')
        await tx.salonProfile.updateMany({
          where: { tenantId: id, status: 'ATTIVO' },
          data: { status: 'DA_COLLAUDARE' },
        });
      await tx.technicalIntervention.create({
        data: {
          tenantId: id,
          adminId: actor.id,
          action: `CHECK_${key}_${body.result}`,
          notes: body.notes,
        },
      });
      await this.audit(tx, actor, `CHECK_${key}_${body.result}`, id);
      return { ok: true };
    });
  }
  async intervention(actor: Actor, id: string, notes: string) {
    await this.scope(actor, id);
    return this.db.$transaction(async (tx) => {
      const result = await tx.technicalIntervention.create({
        data: { tenantId: id, adminId: actor.id, action: 'NOTE', notes },
      });
      await this.audit(tx, actor, 'INTERVENTION_ADDED', id);
      return result;
    });
  }
  async testDevice(actor: Actor, id: string, section: string) {
    await this.scope(actor, id);
    if (!sections.includes(section)) throw new BadRequestException();
    await this.db.$transaction((tx) =>
      this.audit(tx, actor, 'DEVICE_TEST_UNSUPPORTED', id),
    );
    return {
      supported: false,
      success: false,
      message:
        'Nessun adattatore verificato installato. Eseguire il collaudo fisico seguendo la documentazione del produttore.',
    };
  }
}

const configFields: Record<string, string[]> = {
  registratore: [
    'manufacturer',
    'model',
    'registration',
    'serial',
    'firmware',
    'protocol',
    'connection',
    'ip',
    'port',
    'station',
    'departments',
    'vatRates',
    'notes',
  ],
  pos: [
    'provider',
    'brand',
    'model',
    'terminalId',
    'merchantId',
    'connection',
    'ip',
    'port',
    'mode',
    'pairing',
    'notes',
  ],
  stampanti: [
    'name',
    'manufacturer',
    'model',
    'connection',
    'ip',
    'port',
    'paper',
    'station',
    'notes',
  ],
  fiscalita: ['vatServices', 'vatResale', 'departments', 'notes'],
  integrazioni: ['provider', 'accountId', 'mode', 'notes'],
  operativita: [
    'openingHours',
    'closedDays',
    'stations',
    'appointmentDuration',
    'agendaInterval',
    'paymentMethods',
    'notes',
  ],
};
export function validateConfiguration(
  section: string,
  data: Record<string, unknown>,
) {
  if (!configFields[section])
    throw new BadRequestException('Sezione non valida');
  for (const [key, value] of Object.entries(data)) {
    if (
      !configFields[section].includes(key) ||
      typeof value !== 'string' ||
      value.length > 2000
    )
      throw new BadRequestException(`Campo non valido: ${key}`);
  }
  const required: Record<string, string[]> = {
    registratore: [
      'manufacturer',
      'model',
      'registration',
      'protocol',
      'connection',
    ],
    pos: ['provider', 'terminalId', 'connection', 'mode'],
    stampanti: ['name', 'manufacturer', 'model', 'connection', 'paper'],
    fiscalita: ['vatServices', 'vatResale'],
    integrazioni: ['provider', 'mode'],
    operativita: ['openingHours', 'appointmentDuration', 'agendaInterval'],
  };
  for (const key of required[section] || [])
    if (typeof data[key] !== 'string' || !data[key].trim())
      throw new BadRequestException(`Campo obbligatorio: ${key}`);
  if (
    typeof data.connection === 'string' &&
    data.connection.toUpperCase() === 'LAN' &&
    (!data.ip || typeof data.ip !== 'string' || !isIP(data.ip))
  )
    throw new BadRequestException('Indirizzo IP LAN non valido');
  if (
    data.appointmentDuration &&
    (!Number.isInteger(Number(data.appointmentDuration)) ||
      Number(data.appointmentDuration) < 5 ||
      Number(data.appointmentDuration) > 1440)
  )
    throw new BadRequestException('Durata appuntamenti non valida');
  if (
    typeof data.port === 'string' &&
    data.port &&
    (!/^\d+$/.test(String(data.port)) ||
      Number(data.port) < 1 ||
      Number(data.port) > 65535)
  )
    throw new BadRequestException('Porta non valida');
  if (
    typeof data.mode === 'string' &&
    data.mode &&
    section === 'pos' &&
    !['MANUALE', 'INTEGRATA', 'CLOUD_API'].includes(String(data.mode))
  )
    throw new BadRequestException('Modalità POS non valida');
  if (
    data.agendaInterval &&
    (!Number.isInteger(Number(data.agendaInterval)) ||
      Number(data.agendaInterval) < 5 ||
      Number(data.agendaInterval) > 120)
  )
    throw new BadRequestException('Intervallo agenda: da 5 a 120 minuti');
  for (const key of ['vatServices', 'vatResale'])
    if (
      data[key] &&
      (!Number.isFinite(Number(data[key])) ||
        Number(data[key]) < 0 ||
        Number(data[key]) > 100)
    )
      throw new BadRequestException('Aliquota non valida');
}
