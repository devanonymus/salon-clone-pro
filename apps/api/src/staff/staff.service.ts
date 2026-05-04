import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

const DEFAULT_STAFF = [
  { name: "Pamela", role: "COLLABORATORE", color: "#22c55e" },
  { name: "Katia", role: "COLLABORATORE", color: "#3b82f6" },
  { name: "Stefania", role: "COLLABORATORE", color: "#f97316" },
  { name: "Sonia", role: "TITOLARE", color: "#d4af37" },
  { name: "Brian Laddomada", role: "COLLABORATORE", color: "#8b5cf6" },
];

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    const existing = await this.prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) return existing;

    await this.prisma.staff.createMany({
      data: DEFAULT_STAFF.map((member) => ({
        tenantId,
        name: member.name,
        role: member.role,
        color: member.color,
      })),
    });

    return this.prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(
    tenantId: string,
    id: string,
    body: {
      name?: string;
      role?: string;
      color?: string;
      active?: boolean;
    },
  ) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, tenantId },
    });

    if (!staff) throw new NotFoundException("Dipendente non trovato");

    return this.prisma.staff.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        color: body.color,
        active: body.active,
      },
    });
  }
}