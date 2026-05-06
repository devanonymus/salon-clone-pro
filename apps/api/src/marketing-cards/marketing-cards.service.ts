import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class MarketingCardsService {
  constructor(private prisma: PrismaService) {}


  async getTemplate(tenantId: string) {
    const existing = await this.prisma.marketingCardTemplate.findUnique({
      where: {
        tenantId,
      },
    });

    if (existing) return existing;

    return this.prisma.marketingCardTemplate.create({
      data: {
        tenantId,
      },
    });
  }

  async saveTemplate(
    tenantId: string,
    body: {
      logoUrl?: string;
      salonName?: string;
      templateStyle?: string;
      primaryColor?: string;
      accentColor?: string;
      title?: string;
      subtitle?: string;
      promiseText?: string;
      valueText?: string;
      bonusText?: string;
      urgencyText?: string;
      guaranteeText?: string;
      ctaText?: string;
      footerText?: string;
      signature?: string;
      promoMessageTemplate?: string;
      confirmMessageTemplate?: string;
    },
  ) {
    return this.prisma.marketingCardTemplate.upsert({
      where: {
        tenantId,
      },
      update: {
        logoUrl: body.logoUrl,
        salonName: body.salonName,
        templateStyle: body.templateStyle,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
        title: body.title,
        subtitle: body.subtitle,
        promiseText: body.promiseText,
        valueText: body.valueText,
        bonusText: body.bonusText,
        urgencyText: body.urgencyText,
        guaranteeText: body.guaranteeText,
        ctaText: body.ctaText,
        footerText: body.footerText,
        signature: body.signature,
        promoMessageTemplate: body.promoMessageTemplate,
        confirmMessageTemplate: body.confirmMessageTemplate,
      },
      create: {
        tenantId,
        logoUrl: body.logoUrl,
        salonName: body.salonName || "Acquaviva Strategic",
        templateStyle: body.templateStyle || "LUXURY_GOLD",
        primaryColor: body.primaryColor || "#080808",
        accentColor: body.accentColor || "#d4af37",
        title: body.title || "Il tuo percorso bellezza personalizzato",
        subtitle: body.subtitle || "Una card pensata per mantenere il risultato nel tempo.",
        promiseText: body.promiseText || "Non è una semplice promozione: è un percorso guidato.",
        valueText: body.valueText || "Una proposta chiara, comoda e ad alto valore.",
        bonusText: body.bonusText || "Bonus inclusi per aumentare il risultato.",
        urgencyText: body.urgencyText || "Posti limitati per garantire continuità e qualità.",
        guaranteeText: body.guaranteeText || "Ti guideremo passo dopo passo.",
        ctaText: body.ctaText || "Blocca oggi il tuo percorso.",
        footerText: body.footerText || "Card personale, non convertibile in denaro.",
        signature: body.signature || "Il tuo salone di fiducia",
        promoMessageTemplate:
          body.promoMessageTemplate ||
          "Ciao {nome_cliente} 💛\n\nAbbiamo preparato una proposta speciale pensata per mantenere il risultato nel tempo:\n*{nome_card}*\n\nPrezzo card: € {prezzo_card}\nSedute incluse: {sedute}\nPrezzo medio per seduta: € {prezzo_seduta}\n\nVuoi che ti blocchiamo questa possibilità?\n\n{firma}",
        confirmMessageTemplate:
          body.confirmMessageTemplate ||
          "Ciao {nome_cliente} 💛\n\nTi confermiamo la tua card:\n*{nome_card}*\n\nPrezzo card: € {prezzo_card}\nSedute incluse: {sedute}\nPrezzo medio per seduta: € {prezzo_seduta}\n\nTi aspettiamo in salone.\n\n{firma}",
      },
    });
  }

  list(tenantId: string) {
    return this.prisma.marketingCard.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(
    tenantId: string,
    body: {
      name: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
    },
  ) {
    if (!body.name?.trim()) {
      throw new BadRequestException("Nome card mancante");
    }

    return this.prisma.marketingCard.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: body.name.trim(),
        },
      },
      update: {
        price: Number(body.price || 0),
        sessionsCount: Number(body.sessionsCount || 4),
        sessions: body.sessions || [],
        increaseTotal: Number(body.increaseTotal || 0),
        active: true,
      },
      create: {
        tenantId,
        name: body.name.trim(),
        price: Number(body.price || 0),
        sessionsCount: Number(body.sessionsCount || 4),
        sessions: body.sessions || [],
        increaseTotal: Number(body.increaseTotal || 0),
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    body: {
      name?: string;
      price?: number;
      sessionsCount?: number;
      sessions?: any;
      increaseTotal?: number;
      active?: boolean;
    },
  ) {
    const existing = await this.prisma.marketingCard.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Card non trovata");
    }

    return this.prisma.marketingCard.update({
      where: {
        id,
      },
      data: {
        name: body.name?.trim() || existing.name,
        price: body.price === undefined ? existing.price : Number(body.price || 0),
        sessionsCount: body.sessionsCount === undefined ? existing.sessionsCount : Number(body.sessionsCount || 4),
        sessions: body.sessions === undefined ? existing.sessions : body.sessions,
        increaseTotal: body.increaseTotal === undefined ? existing.increaseTotal : Number(body.increaseTotal || 0),
        active: body.active === undefined ? existing.active : Boolean(body.active),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.marketingCard.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existing) {
      throw new NotFoundException("Card non trovata");
    }

    return this.prisma.marketingCard.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }
}
