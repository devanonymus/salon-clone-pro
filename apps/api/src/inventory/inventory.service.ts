import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  products(tenantId: string) {
    return this.prisma.inventoryProduct.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "desc" },
    });
  }

  createProduct(tenantId: string, body: any) {
    return this.prisma.inventoryProduct.create({
      data: {
        tenantId,
        name: body.name,
        category: body.category || "Generale",
        productType: body.productType || "INTERNAL",
        unit: body.unit || "pz",
        stock: Number(body.stock || 0),
        minStock: Number(body.minStock || 0),
        cost: Number(body.cost || 0),
        sellPrice: Number(body.sellPrice || 0),
        supplier: body.supplier || null,
      },
    });
  }

  updateProduct(tenantId: string, id: string, body: any) {
    return this.prisma.inventoryProduct.updateMany({
      where: { id, tenantId },
      data: {
        name: body.name,
        category: body.category,
        productType: body.productType,
        unit: body.unit,
        stock: body.stock !== undefined ? Number(body.stock) : undefined,
        minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
        cost: body.cost !== undefined ? Number(body.cost) : undefined,
        sellPrice: body.sellPrice !== undefined ? Number(body.sellPrice) : undefined,
        supplier: body.supplier,
      },
    });
  }

  deleteProduct(tenantId: string, id: string) {
    return this.prisma.inventoryProduct.updateMany({
      where: { id, tenantId },
      data: { active: false },
    });
  }

  async adjustStock(tenantId: string, id: string, delta: number) {
    const product = await this.prisma.inventoryProduct.findFirst({
      where: { id, tenantId, active: true },
    });

    if (!product) throw new NotFoundException("Prodotto non trovato");

    const nextStock = Math.max(0, product.stock + delta);

    const updated = await this.prisma.inventoryProduct.update({
      where: { id },
      data: { stock: nextStock },
    });

    await this.prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId: id,
        reason: "ADJUSTMENT",
        movementType: delta >= 0 ? "IN" : "OUT",
        quantityBefore: product.stock,
        quantityChange: delta,
        quantityAfter: nextStock,
      },
    });

    return updated;
  }

  recipes(tenantId: string) {
    return this.prisma.serviceRecipeItem.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { serviceName: "asc" },
    });
  }

  saveRecipe(
    tenantId: string,
    body: { serviceName: string; productId: string; quantity: number | string },
  ) {
    return this.prisma.serviceRecipeItem.create({
      data: {
        tenantId,
        serviceName: body.serviceName,
        productId: body.productId,
        quantity: Number(body.quantity || 0),
      },
      include: { product: true },
    });
  }

  deleteRecipe(tenantId: string, id: string) {
    return this.prisma.serviceRecipeItem.deleteMany({
      where: { id, tenantId },
    });
  }

  async consumeForSale(
    tenantId: string,
    saleId: string,
    items: { name: string; type?: string; quantity: number }[],
  ) {
    for (const item of items) {
      if (item.type === "product") {
        const product = await this.prisma.inventoryProduct.findFirst({
          where: {
            tenantId,
            active: true,
            productType: "RETAIL",
            name: item.name,
          },
        });

        if (product) {
          await this.consumeProduct(
            tenantId,
            product.id,
            saleId,
            item.quantity,
            "SALE_RETAIL",
          );
        }

        continue;
      }

      const recipes = await this.prisma.serviceRecipeItem.findMany({
        where: {
          tenantId,
          serviceName: item.name,
        },
        include: { product: true },
      });

      for (const recipe of recipes) {
        await this.consumeProduct(
          tenantId,
          recipe.productId,
          saleId,
          recipe.quantity * item.quantity,
          `SERVICE_${item.name}`,
        );
      }
    }
  }

  private async consumeProduct(
    tenantId: string,
    productId: string,
    saleId: string,
    quantity: number,
    reason: string,
  ) {
    const product = await this.prisma.inventoryProduct.findFirst({
      where: { id: productId, tenantId, active: true },
    });

    if (!product) return;

    const nextStock = Math.max(0, product.stock - quantity);

    await this.prisma.inventoryProduct.update({
      where: { id: productId },
      data: { stock: nextStock },
    });

    await this.prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        saleId,
        reason,
        movementType: "OUT",
        quantityBefore: product.stock,
        quantityChange: -quantity,
        quantityAfter: nextStock,
      },
    });
  }
}