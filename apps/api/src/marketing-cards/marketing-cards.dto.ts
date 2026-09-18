import { Transform, Type } from 'class-transformer';
import type { Prisma } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMarketingCardSaleDto {
  @IsOptional()
  @IsUUID()
  clientTenantId?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  clientName!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  cardName!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  total!: number;

  @IsOptional()
  @IsArray()
  sessions?: Prisma.InputJsonArray;

  @IsOptional()
  @IsArray()
  appointments?: Prisma.InputJsonArray;

  @IsOptional()
  @IsIn(['RATE_SEDUTE', 'INTERO_PRIMA_SEDUTA'])
  paymentMode?: string;
}

export class AddMarketingCardPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsIn(['RATA_SEDUTA', 'SALDO_INTERO'])
  paymentType?: string;

  @IsOptional()
  @IsIn(['CONTANTI', 'CARTA', 'BONIFICO', 'ALTRO'])
  method?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateMarketingCardDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sessionsCount!: number;

  @IsOptional()
  @IsArray()
  sessions?: Prisma.InputJsonArray;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  increaseTotal?: number;
}

export class UpdateMarketingCardDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  sessionsCount?: number;

  @IsOptional()
  @IsArray()
  sessions?: Prisma.InputJsonArray;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  increaseTotal?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SaveMarketingCardTemplateDto {
  @IsOptional() @IsString() @MaxLength(2_000_000) logoUrl?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(160) salonName?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  templateStyle?: string;
  @IsOptional() @IsString() @MaxLength(20) primaryColor?: string;
  @IsOptional() @IsString() @MaxLength(20) accentColor?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(240) title?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) subtitle?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  promiseText?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  valueText?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  bonusText?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  urgencyText?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  guaranteeText?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) ctaText?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  footerText?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(240) signature?: string;
  @IsOptional() @IsString() @MaxLength(5000) promoMessageTemplate?: string;
  @IsOptional() @IsString() @MaxLength(5000) confirmMessageTemplate?: string;
}
