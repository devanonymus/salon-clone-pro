import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { code: 'SALON1' },
    });

    if (existingTenant) {
      return {
        message: 'Seed già eseguito',
        tenant: existingTenant,
        login: {
          tenantCode: 'SALON1',
          username: 'admin',
          pin: '1234',
        },
      };
    }

    const pinHash = await bcrypt.hash('1234', 10);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: 'Salon Test',
        code: 'SALON1',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        username: 'admin',
        pinHash,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    return {
      message: 'Seed completato',
      tenant,
      user,
      login: {
        tenantCode: 'SALON1',
        username: 'admin',
        pin: '1234',
      },
    };
  }


  async createSalon(
    currentUser: {
      role: string;
      username: string;
      tenantId: string;
    },
    body: {
      name: string;
      code: string;
      ownerUsername?: string;
      ownerPin: string;
    },
  ) {
    if (currentUser.role !== 'OWNER') {
      throw new UnauthorizedException('Solo il titolare può creare nuovi saloni');
    }

    if (!body.name?.trim()) {
      throw new UnauthorizedException('Nome salone mancante');
    }

    if (!body.code?.trim()) {
      throw new UnauthorizedException('Codice salone mancante');
    }

    if (!body.ownerPin?.trim()) {
      throw new UnauthorizedException('PIN owner mancante');
    }

    const code = body.code.trim().toUpperCase();
    const ownerUsername = body.ownerUsername?.trim() || 'admin';

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { code },
    });

    if (existingTenant) {
      throw new ConflictException('Codice salone già esistente');
    }

    const pinHash = await bcrypt.hash(body.ownerPin, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.name.trim(),
          code,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          username: ownerUsername,
          pinHash,
          role: 'OWNER',
          active: true,
        },
      });

      await tx.staff.createMany({
        data: [
          { tenantId: tenant.id, name: ownerUsername, role: 'TITOLARE', color: '#d4af37' },
        ],
      });

      return { tenant, user };
    });

    return {
      message: 'Salone creato',
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        code: result.tenant.code,
      },
      owner: {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
      },
      login: {
        tenantCode: result.tenant.code,
        username: result.user.username,
      },
    };
  }

  async login(tenantCode: string, username: string, pin: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET mancante nel file .env');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { code: tenantCode },
    });

    if (!tenant) {
      throw new UnauthorizedException('Salone non trovato');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        username,
        active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utente non trovato');
    }

    const valid = await bcrypt.compare(pin, user.pinHash);

    if (!valid) {
      throw new UnauthorizedException('PIN non valido');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
      },
    };
  }
}