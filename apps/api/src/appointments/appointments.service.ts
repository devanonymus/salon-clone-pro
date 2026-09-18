import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Prisma } from '@prisma/client';
import type {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointments.dto';

const DEFAULT_SERVICE_DURATION_MINUTES = 30;

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  getAll(tenantId: string) {
    return this.prisma.appointment.findMany({
      where: { tenantId },
      include: {
        clientTenant: {
          include: {
            clientGlobal: true,
          },
        },
        staff: true,
        sale: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async create(tenantId: string, input: CreateAppointmentDto) {
    const clientTenant = await this.prisma.clientTenant.findFirst({
      where: {
        id: input.clientTenantId,
        tenantId,
      },
    });

    if (!clientTenant) {
      throw new NotFoundException('Cliente non trovato nel salone');
    }

    if (input.staffId) {
      await this.assertStaffTenant(tenantId, input.staffId);
    }

    const date = this.parseDate(input.date);
    const duration = await this.calculateDuration(tenantId, input.services);
    await this.assertNoStaffOverlap(
      tenantId,
      input.staffId || null,
      date,
      duration,
    );
    const note = input.services.join(' + ');

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientTenantId: input.clientTenantId,
        staffId: input.staffId || null,
        date,
        duration,
        note,
      },
      include: {
        clientTenant: {
          include: {
            clientGlobal: true,
          },
        },
        staff: true,
        sale: true,
      },
    });
  }

  async update(tenantId: string, id: string, input: UpdateAppointmentDto) {
    const existing = await this.assertAppointmentTenant(tenantId, id);

    const data: Prisma.AppointmentUncheckedUpdateInput = {};

    if (input.clientTenantId) {
      const clientTenant = await this.prisma.clientTenant.findFirst({
        where: {
          id: input.clientTenantId,
          tenantId,
        },
      });

      if (!clientTenant) {
        throw new NotFoundException('Cliente non trovato nel salone');
      }

      data.clientTenantId = input.clientTenantId;
    }

    if (input.staffId !== undefined) {
      if (input.staffId) {
        await this.assertStaffTenant(tenantId, input.staffId);
      }

      data.staffId = input.staffId || null;
    }

    const nextDate = input.date ? this.parseDate(input.date) : existing.date;
    const nextStaffId =
      input.staffId !== undefined ? input.staffId || null : existing.staffId;
    let nextDuration = existing.duration;

    if (input.date) {
      data.date = nextDate;
    }

    if (input.services && input.services.length > 0) {
      data.note = input.services.join(' + ');
      nextDuration = await this.calculateDuration(tenantId, input.services);
      data.duration = nextDuration;
    }

    await this.assertNoStaffOverlap(
      tenantId,
      nextStaffId,
      nextDate,
      nextDuration,
      id,
    );

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        clientTenant: {
          include: {
            clientGlobal: true,
          },
        },
        staff: true,
        sale: true,
      },
    });
  }

  async move(
    tenantId: string,
    id: string,
    date: string,
    staffId?: string | null,
  ) {
    const existing = await this.assertAppointmentTenant(tenantId, id);

    const nextDate = this.parseDate(date);
    const nextStaffId =
      staffId !== undefined ? staffId || null : existing.staffId;

    const data: Prisma.AppointmentUncheckedUpdateInput = {
      date: nextDate,
    };

    if (staffId !== undefined) {
      if (staffId) {
        await this.assertStaffTenant(tenantId, staffId);
      }

      data.staffId = staffId || null;
    }

    await this.assertNoStaffOverlap(
      tenantId,
      nextStaffId,
      nextDate,
      existing.duration,
      id,
    );

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        clientTenant: {
          include: {
            clientGlobal: true,
          },
        },
        staff: true,
        sale: true,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.assertAppointmentTenant(tenantId, id);

    await this.prisma.appointment.delete({
      where: { id },
    });

    return {
      ok: true,
    };
  }

  private async assertAppointmentTenant(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appuntamento non trovato');
    }

    return appointment;
  }

  private async assertStaffTenant(tenantId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        tenantId,
        active: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Dipendente non trovato nel salone');
    }

    return staff;
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Data appuntamento non valida');
    }
    return date;
  }

  private async calculateDuration(tenantId: string, services: string[]) {
    const names = [...new Set(services.map((service) => service.trim()))];
    const configured = await this.prisma.servicePrice.findMany({
      where: {
        tenantId,
        active: true,
        name: { in: names },
      },
      select: { name: true, duration: true },
    });
    const durations = new Map(
      configured.map((service) => [service.name, service.duration]),
    );

    return services.reduce(
      (sum, service) =>
        sum +
        (durations.get(service.trim()) || DEFAULT_SERVICE_DURATION_MINUTES),
      0,
    );
  }

  private async assertNoStaffOverlap(
    tenantId: string,
    staffId: string | null,
    start: Date,
    duration: number,
    excludeAppointmentId?: string,
  ) {
    if (!staffId) return;

    const end = new Date(start.getTime() + duration * 60_000);
    const lookback = new Date(start.getTime() - 7 * 24 * 60 * 60_000);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        staffId,
        date: { gte: lookback, lt: end },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { id: true, date: true, duration: true },
    });

    const conflict = appointments.find((appointment) => {
      const appointmentEnd = new Date(
        appointment.date.getTime() + appointment.duration * 60_000,
      );
      return appointmentEnd > start;
    });

    if (conflict) {
      throw new ConflictException(
        'Il collaboratore ha già un appuntamento in questa fascia oraria',
      );
    }
  }
}
