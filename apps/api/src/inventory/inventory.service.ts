import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateInventoryProductDto,
  SaveRecipeDto,
  UpdateInventoryProductDto,
} from './inventory.dto';

const PRODUCT_CATEGORIES = [
  'Shampoo',
  'Maschera',
  'Tonalizzante',
  'Colore',
  'Decolorante',
  'Ossigeno',
  'Fiala',
  'Pre/Post Styling',
  'Pre-shampoo',
  'Prodotti viso',
  'Siero/Tonico',
];

function normalizeProductCategory(value?: string) {
  const category = String(value || 'Shampoo').trim();
  return PRODUCT_CATEGORIES.includes(category) ? category : 'Shampoo';
}

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  products(tenantId: string) {
    return this.prisma.inventoryProduct.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createProduct(tenantId: string, body: CreateInventoryProductDto) {
    const stock = body.stock ?? 0;
    const cost = body.cost ?? 0;

    return this.prisma.inventoryProduct.create({
      data: {
        tenantId,
        name: body.name.trim(),
        category: normalizeProductCategory(body.category),
        productType: body.productType || 'INTERNAL',
        unit: body.unit || 'pz',
        stock,
        minStock: body.minStock ?? 0,
        cost,
        unitCost:
          body.unitCost && body.unitCost > 0
            ? body.unitCost
            : stock > 0
              ? cost / stock
              : 0,
        sellPrice: body.sellPrice ?? 0,
        supplier: body.supplier?.trim() || null,
      },
    });
  }

  async updateProduct(
    tenantId: string,
    id: string,
    body: UpdateInventoryProductDto,
  ) {
    await this.assertProductTenant(this.prisma, tenantId, id);

    return this.prisma.inventoryProduct.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        category:
          body.category !== undefined
            ? normalizeProductCategory(body.category)
            : undefined,
        productType: body.productType,
        unit: body.unit,
        stock: body.stock,
        minStock: body.minStock,
        cost: body.cost,
        unitCost:
          body.unitCost !== undefined
            ? body.unitCost
            : body.cost !== undefined &&
                body.stock !== undefined &&
                body.stock > 0
              ? body.cost / body.stock
              : undefined,
        sellPrice: body.sellPrice,
        supplier: body.supplier,
      },
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.assertProductTenant(this.prisma, tenantId, id);
    await this.prisma.inventoryProduct.update({
      where: { id },
      data: { active: false },
    });
    return { ok: true };
  }

  async adjustStock(tenantId: string, id: string, delta: number) {
    if (delta === 0) {
      throw new BadRequestException(
        'La variazione di stock non può essere zero',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await this.assertProductTenant(tx, tenantId, id);
      const update = await tx.inventoryProduct.updateMany({
        where: {
          id,
          tenantId,
          active: true,
          ...(delta < 0 ? { stock: { gte: Math.abs(delta) } } : {}),
        },
        data: { stock: { increment: delta } },
      });

      if (update.count !== 1) {
        throw new ConflictException(`Scorte insufficienti per ${product.name}`);
      }

      const updated = await tx.inventoryProduct.findUniqueOrThrow({
        where: { id },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: id,
          reason: 'ADJUSTMENT',
          movementType: delta > 0 ? 'IN' : 'OUT',
          quantityBefore: updated.stock - delta,
          quantityChange: delta,
          quantityAfter: updated.stock,
        },
      });

      return updated;
    });
  }

  recipes(tenantId: string) {
    return this.prisma.serviceRecipeItem.findMany({
      where: { tenantId },
      include: { product: true },
      orderBy: { serviceName: 'asc' },
    });
  }

  async saveRecipe(tenantId: string, body: SaveRecipeDto) {
    await this.assertProductTenant(this.prisma, tenantId, body.productId);

    return this.prisma.serviceRecipeItem.create({
      data: {
        tenantId,
        serviceName: body.serviceName.trim(),
        productCategory: normalizeProductCategory(body.productCategory),
        productId: body.productId,
        quantity: body.quantity,
      },
      include: { product: true },
    });
  }

  async deleteRecipe(tenantId: string, id: string) {
    const result = await this.prisma.serviceRecipeItem.deleteMany({
      where: { id, tenantId },
    });
    if (result.count !== 1) throw new NotFoundException('Ricetta non trovata');
    return { ok: true };
  }

  async consumeForSale(
    tenantId: string,
    saleId: string,
    items: { name: string; type?: string; quantity: number }[],
    db: DbClient = this.prisma,
  ) {
    for (const item of items) {
      if (item.type === 'product') {
        const product = await db.inventoryProduct.findFirst({
          where: {
            tenantId,
            active: true,
            productType: 'RETAIL',
            name: item.name,
          },
        });

        if (product) {
          await this.consumeProduct(
            db,
            tenantId,
            product.id,
            saleId,
            item.quantity,
            'SALE_RETAIL',
          );
        }
        continue;
      }

      const recipes = await db.serviceRecipeItem.findMany({
        where: { tenantId, serviceName: item.name },
      });

      for (const recipe of recipes) {
        await this.consumeProduct(
          db,
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
    db: DbClient,
    tenantId: string,
    productId: string,
    saleId: string,
    quantity: number,
    reason: string,
  ) {
    if (quantity <= 0) return;

    const product = await this.assertProductTenant(db, tenantId, productId);
    const update = await db.inventoryProduct.updateMany({
      where: {
        id: productId,
        tenantId,
        active: true,
        stock: { gte: quantity },
      },
      data: { stock: { decrement: quantity } },
    });

    if (update.count !== 1) {
      throw new ConflictException(`Scorte insufficienti per ${product.name}`);
    }

    const updated = await db.inventoryProduct.findUniqueOrThrow({
      where: { id: productId },
    });

    await db.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        saleId,
        reason,
        movementType: 'OUT',
        quantityBefore: updated.stock + quantity,
        quantityChange: -quantity,
        quantityAfter: updated.stock,
      },
    });
  }

  private async assertProductTenant(
    db: DbClient,
    tenantId: string,
    id: string,
  ) {
    const product = await db.inventoryProduct.findFirst({
      where: { id, tenantId, active: true },
    });
    if (!product) throw new NotFoundException('Prodotto non trovato');
    return product;
  }
}
