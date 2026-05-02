import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    const existing = await this.prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) return existing;

    const names = ["Pamela", "Katia", "Stefania", "Sonia", "Brian Laddomada"];

    await this.prisma.staff.createMany({
      data: names.map((name) => ({
        tenantId,
        name,
        role: name === "Sonia" ? "TITOLARE" : "COLLABORATORE",
      })),
    });

    return this.prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
    });
  }
}