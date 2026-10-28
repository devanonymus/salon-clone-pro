import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  PlatformService,
  validateConfiguration,
  type Actor,
} from './platform.service';
import { DeviceCheckDto, DeviceDto, DeviceUpdateDto } from './platform.dto';
import {
  deviceSections,
  deviceChecks,
  technicalToday,
  type DeviceSection,
} from './device-policy';
import { encrypt } from './security';
const publicDevice = {
  id: true,
  tenantId: true,
  section: true,
  label: true,
  data: true,
  dueDate: true,
  physicalCheck: true,
  checkedAt: true,
  checkedBy: true,
  checkNotes: true,
  version: true,
  archivedAt: true,
  updatedAt: true,
  legacyConfigurationId: true,
} as const;
@Injectable()
export class PlatformDevicesService {
  constructor(
    private readonly db: PrismaService,
    private readonly platform: PlatformService,
  ) {}
  private section(section: string): DeviceSection {
    if (!deviceSections.includes(section as DeviceSection))
      throw new BadRequestException('Tipo di dispositivo non valido');
    return section as DeviceSection;
  }
  private date(value: string | null | undefined) {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    )
      throw new BadRequestException('Scadenza non valida');
    return parsed;
  }
  private payload(section: DeviceSection, body: DeviceDto) {
    validateConfiguration(section, body.data);
    const identity =
      section === 'pos'
        ? `${(body.data.provider as string).trim().toLowerCase()}:${(body.data.terminalId as string).trim()}`
        : section === 'registratore'
          ? `${(body.data.manufacturer as string).trim().toLowerCase()}:${(body.data.registration as string).trim()}`
          : body.label.trim().toLowerCase();
    return {
      label: body.label.trim(),
      identity,
      data: body.data as Prisma.InputJsonObject,
      ...(body.dueDate !== undefined
        ? { dueDate: this.date(body.dueDate) }
        : {}),
      ...(body.secret !== undefined
        ? { secretsEncrypted: body.secret ? encrypt(body.secret) : null }
        : {}),
    };
  }
  private async changed(
    tx: Prisma.TransactionClient,
    actor: Actor,
    tenantId: string,
    section: DeviceSection,
    action: string,
    deviceId: string,
    notes?: string,
  ) {
    await tx.salonOnboarding.updateMany({
      where: { tenantId, key: { in: [deviceChecks[section], 'COLLAUDO'] } },
      data: { result: 'PENDING', checkedAt: null },
    });
    await tx.salonProfile.updateMany({
      where: { tenantId, status: 'ATTIVO' },
      data: { status: 'DA_COLLAUDARE' },
    });
    await this.log(tx, actor, tenantId, action, deviceId, notes);
  }
  private async log(
    tx: Prisma.TransactionClient,
    actor: Actor,
    tenantId: string,
    action: string,
    deviceId: string,
    notes?: string,
  ) {
    await tx.technicalIntervention.create({
      data: {
        tenantId,
        adminId: actor.id,
        action,
        notes: `Dispositivo ${deviceId}; operazione amministrativa, nessun protocollo hardware abilitato${notes ? `; evidenze: ${notes}` : ''}`,
      },
    });
    await tx.platformAuditLog.create({
      data: { tenantId, adminId: actor.id, action },
    });
  }
  private conflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'Nome, identificativo del dispositivo o importazione già presenti; verificare anche i dispositivi archiviati',
      );
    throw error;
  }
  async list(actor: Actor, tenantId: string, section: string) {
    await this.platform.scope(actor, tenantId);
    this.section(section);
    const [devices, legacy] = await Promise.all([
      this.db.platformDevice.findMany({
        where: { tenantId, section },
        select: publicDevice,
        orderBy: [{ archivedAt: 'asc' }, { label: 'asc' }],
      }),
      this.db.platformConfiguration.findUnique({
        where: { tenantId_section: { tenantId, section } },
        select: { id: true, importedDevice: { select: { id: true } } },
      }),
    ]);
    return { devices, legacyAvailable: !!legacy && !legacy.importedDevice };
  }
  async create(
    actor: Actor,
    tenantId: string,
    section: string,
    body: DeviceDto,
    importLegacy = false,
  ) {
    await this.platform.scope(actor, tenantId);
    const kind = this.section(section),
      payload = this.payload(kind, body);
    try {
      return await this.db.$transaction(async (tx) => {
        const legacy = importLegacy
          ? await tx.platformConfiguration.findUnique({
              where: { tenantId_section: { tenantId, section } },
              select: { id: true, secretsEncrypted: true },
            })
          : null;
        if (importLegacy && !legacy)
          throw new NotFoundException('Configurazione precedente non trovata');
        const device = await tx.platformDevice.create({
          data: {
            tenantId,
            section,
            ...payload,
            ...(legacy
              ? {
                  legacyConfigurationId: legacy.id,
                  ...(body.secret === undefined
                    ? { secretsEncrypted: legacy.secretsEncrypted }
                    : {}),
                }
              : {}),
          },
          select: publicDevice,
        });
        await this.changed(
          tx,
          actor,
          tenantId,
          kind,
          'DEVICE_CREATED',
          device.id,
        );
        return device;
      });
    } catch (error) {
      this.conflict(error);
    }
  }
  private async current(
    tx: Prisma.TransactionClient,
    tenantId: string,
    id: string,
  ) {
    const device = await tx.platformDevice.findFirst({
      where: { id, tenantId },
      select: publicDevice,
    });
    if (!device) throw new NotFoundException('Dispositivo non trovato');
    return device;
  }
  async update(
    actor: Actor,
    tenantId: string,
    id: string,
    body: DeviceUpdateDto,
  ) {
    await this.platform.scope(actor, tenantId);
    try {
      return await this.db.$transaction(async (tx) => {
        const device = await this.current(tx, tenantId, id),
          section = this.section(device.section),
          payload = this.payload(section, body);
        const changed = await tx.platformDevice.updateMany({
          where: { id, tenantId, version: body.version, archivedAt: null },
          data: {
            ...payload,
            version: { increment: 1 },
            physicalCheck: 'PENDING',
            checkedAt: null,
            checkedBy: null,
            checkNotes: '',
          },
        });
        if (changed.count !== 1)
          throw new ConflictException(
            'Dispositivo aggiornato da un altro operatore o archiviato: ricaricare la scheda',
          );
        await this.changed(tx, actor, tenantId, section, 'DEVICE_UPDATED', id);
        return this.current(tx, tenantId, id);
      });
    } catch (error) {
      this.conflict(error);
    }
  }
  async archive(
    actor: Actor,
    tenantId: string,
    id: string,
    version: number,
    restore = false,
  ) {
    await this.platform.scope(actor, tenantId);
    return this.db.$transaction(async (tx) => {
      const device = await this.current(tx, tenantId, id);
      const changed = await tx.platformDevice.updateMany({
        where: {
          id,
          tenantId,
          version,
          archivedAt: restore ? { not: null } : null,
        },
        data: {
          archivedAt: restore ? null : new Date(),
          version: { increment: 1 },
          physicalCheck: 'PENDING',
          checkedAt: null,
          checkedBy: null,
          checkNotes: '',
        },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Stato dispositivo cambiato: ricaricare la scheda',
        );
      await this.changed(
        tx,
        actor,
        tenantId,
        this.section(device.section),
        restore ? 'DEVICE_RESTORED' : 'DEVICE_ARCHIVED',
        id,
      );
      return { ok: true };
    });
  }
  async check(
    actor: Actor,
    tenantId: string,
    id: string,
    body: DeviceCheckDto,
  ) {
    await this.platform.scope(actor, tenantId);
    if (body.notes.trim().length < 5)
      throw new BadRequestException('Indicare le evidenze del collaudo fisico');
    return this.db.$transaction(async (tx) => {
      const device = await this.current(tx, tenantId, id);
      if (
        body.result === 'PASS' &&
        device.dueDate &&
        device.dueDate < technicalToday()
      )
        throw new BadRequestException(
          'Aggiornare la scadenza superata prima del collaudo',
        );
      const changed = await tx.platformDevice.updateMany({
        where: { id, tenantId, version: body.version, archivedAt: null },
        data: {
          physicalCheck: body.result,
          checkedAt: new Date(),
          checkedBy: actor.id,
          checkNotes: body.notes,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Configurazione cambiata o archiviata: ricaricare e ripetere il collaudo',
        );
      await this.changed(
        tx,
        actor,
        tenantId,
        this.section(device.section),
        `DEVICE_CHECK_${body.result}`,
        id,
        body.notes,
      );
      return this.current(tx, tenantId, id);
    });
  }
  async test(actor: Actor, tenantId: string, id: string) {
    await this.platform.scope(actor, tenantId);
    await this.db.$transaction(async (tx) => {
      const device = await this.current(tx, tenantId, id);
      if (device.archivedAt)
        throw new BadRequestException('Dispositivo archiviato');
      await this.log(tx, actor, tenantId, 'DEVICE_TEST_UNSUPPORTED', id);
    });
    return {
      supported: false,
      success: false,
      message:
        'Nessun adattatore hardware verificato. Il collaudo fisico va registrato separatamente e non abilita pagamenti o emissioni fiscali.',
    };
  }
}
