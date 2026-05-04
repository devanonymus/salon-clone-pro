import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

const DEFAULT_SERVICES = [
  { name: "Piega", duration: 35, price: 18, cost: 1.5, category: "Piega" },
  { name: "Piega Atelier Extra Styling", duration: 45, price: 25, cost: 2, category: "Piega" },
  { name: "Taglio Donna", duration: 35, price: 20, cost: 0, category: "Taglio" },
  { name: "Taglio Donna + Piega", duration: 60, price: 32, cost: 2, category: "Taglio" },
  { name: "Shampoo + Taglio Uomo", duration: 30, price: 22, cost: 1, category: "Taglio" },
  { name: "Barba Rifinitura", duration: 10, price: 10, cost: 0.5, category: "Taglio" },
  { name: "Colore Base", duration: 35, price: 28, cost: 7, category: "Colore" },
  { name: "Colore Base + Piega", duration: 80, price: 42, cost: 8.5, category: "Colore" },
  { name: "Colore Base + Taglio + Piega", duration: 105, price: 55, cost: 9.5, category: "Colore" },
  { name: "Tonalizzante/Gloss", duration: 25, price: 22, cost: 4.5, category: "Colore" },
  { name: "Tonalizzante + Piega", duration: 70, price: 35, cost: 6, category: "Colore" },
  { name: "Decapaggio Colore", duration: 45, price: 45, cost: 10, category: "Colore" },
  { name: "Decapaggio + Piega", duration: 140, price: 70, cost: 12, category: "Colore" },
  { name: "Schiariture Parziali Meches Light", duration: 90, price: 65, cost: 18, category: "Colore" },
  { name: "Colpi di Sole/Meches + Piega", duration: 120, price: 85, cost: 24, category: "Colore" },
];

@Injectable()
export class ServicePricesService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    const existing = await this.prisma.servicePrice.findMany({
      where: { tenantId, active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (existing.length > 0) return existing;

    await this.prisma.servicePrice.createMany({
      data: DEFAULT_SERVICES.map((item) => ({
        tenantId,
        ...item,
      })),
      skipDuplicates: true,
    });

    return this.prisma.servicePrice.findMany({
      where: { tenantId, active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  create(tenantId: string, body: any) {
    return this.prisma.servicePrice.create({
      data: {
        tenantId,
        name: String(body.name || "").trim(),
        category: body.category || "Altro",
        duration: Number(body.duration || 30),
        price: Number(body.price || 0),
        cost: Number(body.cost || 0),
      },
    });
  }

  async update(tenantId: string, id: string, body: any) {
    const service = await this.prisma.servicePrice.findFirst({
      where: { id, tenantId },
    });

    if (!service) throw new NotFoundException("Servizio non trovato");

    return this.prisma.servicePrice.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
        price: body.price !== undefined ? Number(body.price) : undefined,
        cost: body.cost !== undefined ? Number(body.cost) : undefined,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const service = await this.prisma.servicePrice.findFirst({
      where: { id, tenantId },
    });

    if (!service) throw new NotFoundException("Servizio non trovato");

    return this.prisma.servicePrice.update({
      where: { id },
      data: { active: false },
    });
  }
}