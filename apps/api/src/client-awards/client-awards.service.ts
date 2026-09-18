import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  CreateClientAwardDto,
  ListClientAwardsQueryDto,
  UpdateClientAwardStatusDto,
} from './client-awards.dto';

@Injectable()
export class ClientAwardsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, query: ListClientAwardsQueryDto) {
    return this.prisma.clientAward.findMany({
      where: {
        tenantId,
        clientGlobalId: query.clientGlobalId,
        status: query.status,
      },
      include: {
        clientGlobal: true,
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, body: CreateClientAwardDto) {
    const client = await this.prisma.clientTenant.findFirst({
      where: {
        tenantId,
        clientGlobalId: body.clientGlobalId,
        archived: false,
      },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente non associato a questo salone');
    }

    if (body.appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id: body.appointmentId,
          tenantId,
          clientTenant: { clientGlobalId: body.clientGlobalId },
        },
        select: { id: true },
      });

      if (!appointment) {
        throw new BadRequestException(
          'Appuntamento non valido per il cliente selezionato',
        );
      }
    }

    return this.prisma.clientAward.create({
      data: {
        tenantId,
        clientGlobalId: body.clientGlobalId,
        appointmentId: body.appointmentId || null,
        prizeName: body.prizeName,
        prizeType: body.prizeType || 'WHEEL_PRIZE',
        value: body.value ?? 0,
        source: body.source || 'WHEEL',
        status: body.status || 'ACTIVE',
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        whatsappSent: body.whatsappSent ?? false,
        notes: body.notes || null,
      },
      include: {
        clientGlobal: true,
        appointment: true,
      },
    });
  }

  async updateStatus(
    tenantId: string,
    id: string,
    body: UpdateClientAwardStatusDto,
  ) {
    const updated = await this.prisma.clientAward.updateMany({
      where: { id, tenantId },
      data: {
        status: body.status,
        notes: body.notes,
      },
    });

    if (updated.count !== 1) {
      throw new NotFoundException('Premio cliente non trovato');
    }

    return this.prisma.clientAward.findUniqueOrThrow({ where: { id } });
  }
}
