import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import type { AuthUser } from './auth-user';
import type { CreateSalonDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async seed() {
    if (process.env.ALLOW_DEMO_SEED !== 'true') {
      throw new NotFoundException();
    }

    const tenantCode = (process.env.DEMO_TENANT_CODE || 'SALON1').toUpperCase();
    const username = process.env.DEMO_USERNAME || 'admin';
    const pin = process.env.DEMO_PIN;
    if (!pin || pin.length < 4) {
      throw new Error('DEMO_PIN deve essere configurato per eseguire il seed');
    }

    const existingTenant = await this.prisma.tenant.findUnique({
      where: { code: tenantCode },
    });

    if (existingTenant) {
      return {
        message: 'Seed già eseguito',
        tenant: { id: existingTenant.id, code: existingTenant.code },
      };
    }

    const pinHash = await bcrypt.hash(pin, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: process.env.DEMO_TENANT_NAME || 'Salon Test',
        code: tenantCode,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        username,
        pinHash,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    return {
      message: 'Seed completato',
      tenant: { id: tenant.id, code: tenant.code },
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  async createSalon(currentUser: AuthUser, body: CreateSalonDto) {
    if (currentUser.role !== 'OWNER') {
      throw new ForbiddenException('Solo il titolare può creare nuovi saloni');
    }

    if (process.env.ALLOW_TENANT_PROVISIONING !== 'true') {
      throw new ForbiddenException('Creazione nuovi saloni disabilitata');
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

    const pinHash = await bcrypt.hash(body.ownerPin, 12);

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
          {
            tenantId: tenant.id,
            name: ownerUsername,
            role: 'TITOLARE',
            color: '#d4af37',
          },
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

    const normalizedTenantCode = tenantCode.trim().toUpperCase();
    const normalizedUsername = username.trim();

    const tenant = await this.prisma.tenant.findUnique({
      where: { code: normalizedTenantCode },
    });

    if (!tenant) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        username: normalizedUsername,
        active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const valid = await bcrypt.compare(pin, user.pinHash);

    if (!valid) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: Number(process.env.JWT_TTL_SECONDS || 28_800),
        issuer: process.env.JWT_ISSUER || 'salon-pro-api',
        audience: process.env.JWT_AUDIENCE || 'salon-pro-web',
      },
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
