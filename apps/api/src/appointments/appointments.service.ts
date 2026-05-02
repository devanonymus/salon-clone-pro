import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

const SERVICE_DURATIONS: Record<string, number> = {
  Piega: 35,
  "Piega Atelier Extra Styling": 45,
  "Taglio Donna": 35,
  "Taglio Donna + Piega": 60,
  "Shampoo + Taglio Uomo": 30,
  "Barba Rifinitura": 10,
  "Colore Base": 35,
  "Colore Base + Piega": 80,
  "Colore Base + Taglio + Piega": 105,
  "Tonalizzante/Gloss": 25,
  "Tonalizzante + Piega": 70,
  "Decapaggio Colore": 45,
  "Decapaggio + Piega": 140,
  "Schiariture Parziali Meches Light": 90,
  "Colpi di Sole/Meches + Piega": 120,
};

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
        date: "asc",
      },
    });
  }

  async create(
    tenantId: string,
    input: {
      clientTenantId: string;
      date: string;
      services: string[];
      staffId?: string | null;
    },
  ) {
    const clientTenant = await this.prisma.clientTenant.findFirst({
      where: {
        id: input.clientTenantId,
        tenantId,
      },
    });

    if (!clientTenant) {
      throw new NotFoundException("Cliente non trovato nel salone");
    }

    if (input.staffId) {
      await this.assertStaffTenant(tenantId, input.staffId);
    }

    const duration = this.calculateDuration(input.services);
    const note = input.services.join(" + ");

    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientTenantId: input.clientTenantId,
        staffId: input.staffId || null,
        date: new Date(input.date),
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

  async update(
    tenantId: string,
    id: string,
    input: {
      clientTenantId?: string;
      date?: string;
      services?: string[];
      staffId?: string | null;
    },
  ) {
    await this.assertAppointmentTenant(tenantId, id);

    const data: any = {};

    if (input.clientTenantId) {
      const clientTenant = await this.prisma.clientTenant.findFirst({
        where: {
          id: input.clientTenantId,
          tenantId,
        },
      });

      if (!clientTenant) {
        throw new NotFoundException("Cliente non trovato nel salone");
      }

      data.clientTenantId = input.clientTenantId;
    }

    if (input.staffId !== undefined) {
      if (input.staffId) {
        await this.assertStaffTenant(tenantId, input.staffId);
      }

      data.staffId = input.staffId || null;
    }

    if (input.date) {
      data.date = new Date(input.date);
    }

    if (input.services && input.services.length > 0) {
      data.note = input.services.join(" + ");
      data.duration = this.calculateDuration(input.services);
    }

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

  async move(tenantId: string, id: string, date: string, staffId?: string | null) {
    await this.assertAppointmentTenant(tenantId, id);

    const data: any = {
      date: new Date(date),
    };

    if (staffId !== undefined) {
      if (staffId) {
        await this.assertStaffTenant(tenantId, staffId);
      }

      data.staffId = staffId || null;
    }

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
      throw new NotFoundException("Appuntamento non trovato");
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
      throw new NotFoundException("Dipendente non trovato nel salone");
    }

    return staff;
  }

  private calculateDuration(services: string[]) {
    return services.reduce((sum, service) => {
      return sum + (SERVICE_DURATIONS[service] || 30);
    }, 0);
  }
}