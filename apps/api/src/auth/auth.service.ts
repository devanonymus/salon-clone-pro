import { Injectable, UnauthorizedException } from '@nestjs/common';
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