import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const normalizeServices = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? (value as unknown[]).map((item) =>
        typeof item === 'string' ? item.trim() : item,
      )
    : value;

export class CreateAppointmentDto {
  @IsUUID()
  clientTenantId!: string;

  @IsISO8601()
  date!: string;

  @Transform(normalizeServices)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  services!: string[];

  @IsOptional()
  @IsUUID()
  staffId?: string | null;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsUUID()
  clientTenantId?: string;

  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @Transform(normalizeServices)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  services?: string[];

  @IsOptional()
  @IsUUID()
  staffId?: string | null;
}

export class MoveAppointmentDto {
  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsUUID()
  staffId?: string | null;
}
