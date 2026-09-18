import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const numeric = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value.replace(',', '.')) : value;

export class UpdateCoachSettingsDto {
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatServicesPercent?: number;
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(0)
  @Max(100)
  vatResalePercent?: number;
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(0)
  @Max(100)
  posFeePercent?: number;
  @IsOptional() @Transform(numeric) @IsNumber() @Min(0) posFixedFee?: number;
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(0)
  @Max(100)
  variableOverheadPercent?: number;
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxReservePercent?: number;
  @IsOptional()
  @Transform(numeric)
  @IsNumber()
  @Min(1)
  @Max(744)
  productiveHoursMonth?: number;
  @IsOptional()
  @Transform(numeric)
  @IsInt()
  @Min(5)
  @Max(120)
  agendaGridMinutes?: number;
  @IsOptional() @IsBoolean() cardGiftKitInCost?: boolean;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  allowedDomains?: string;
}

export class CreateFixedCostDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;
}

export class UpdateFixedCostDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}

export class ListPrebookingQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey?: string;
}

export class SavePrebookingDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateKey!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  clientName!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  clientPhone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  serviceName?: string;

  @IsIn(['PRENOTATO', 'DA_RICHIAMARE', 'NON_INTERESSATA', 'NON_PROPOSTO'])
  status!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  note?: string;
}
