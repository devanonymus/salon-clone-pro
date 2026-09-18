import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const CLIENT_AWARD_STATUSES = [
  'ACTIVE',
  'REDEEMED',
  'EXPIRED',
  'CANCELLED',
] as const;

export class CreateClientAwardDto {
  @IsUUID()
  clientGlobalId!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  prizeName!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  prizeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  source?: string;

  @IsOptional()
  @IsIn(CLIENT_AWARD_STATUSES)
  status?: (typeof CLIENT_AWARD_STATUSES)[number];

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string | null;

  @IsOptional()
  @IsBoolean()
  whatsappSent?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ListClientAwardsQueryDto {
  @IsOptional()
  @IsUUID()
  clientGlobalId?: string;

  @IsOptional()
  @IsIn(CLIENT_AWARD_STATUSES)
  status?: (typeof CLIENT_AWARD_STATUSES)[number];
}

export class UpdateClientAwardStatusDto {
  @IsIn(CLIENT_AWARD_STATUSES)
  status!: (typeof CLIENT_AWARD_STATUSES)[number];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
