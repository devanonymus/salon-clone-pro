import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { CreateLeadDto } from './leads.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateLeadDto) {
    if (body.website) {
      return { accepted: true };
    }

    const lead = await this.prisma.lead.create({
      data: {
        source: body.leadSource,
        stage: 'NEW',
        name: body.name,
        salon: body.salon,
        phone: body.phone,
        email: body.email.toLowerCase(),
        teamSize: body.teamSize || null,
        currentManagement: body.currentManagement || null,
        answers: body.answers,
        score: body.score,
        categoryScores: body.categoryScores,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
        utmContent: body.utmContent || null,
        utmTerm: body.utmTerm || null,
        referrer: body.referrer || null,
        privacyAccepted: body.privacyAccepted,
      },
      select: {
        id: true,
        source: true,
        stage: true,
        createdAt: true,
      },
    });

    return { accepted: true, lead };
  }
}
