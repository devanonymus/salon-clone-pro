import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(tenantId: string, body: CreateStaffDto) {
    return this.prisma.staff.create({
      data: {
        tenantId,
        name: body.name,
        role: body.role ?? 'COLLABORATORE',
        color: body.color ?? '#8b5cf6',
        active: body.active ?? true,
        monthlyCost: Number(String(body.monthlyCost ?? 0).replace(',', '.')),
        productiveHours: Number(
          String(body.productiveHours ?? 140).replace(',', '.'),
        ),
        monthlyTarget: Number(
          String(body.monthlyTarget ?? 0).replace(',', '.'),
        ),
      },
    });
  }

  async update(tenantId: string, id: string, body: UpdateStaffDto) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, tenantId },
    });

    if (!staff) throw new NotFoundException('Dipendente non trovato');

    return this.prisma.staff.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        color: body.color,
        active: body.active,
        monthlyCost:
          body.monthlyCost === undefined
            ? undefined
            : Number(String(body.monthlyCost).replace(',', '.')),
        productiveHours:
          body.productiveHours === undefined
            ? undefined
            : Number(String(body.productiveHours).replace(',', '.')),
        monthlyTarget:
          body.monthlyTarget === undefined
            ? undefined
            : Number(String(body.monthlyTarget).replace(',', '.')),
      },
    });
  }
}
