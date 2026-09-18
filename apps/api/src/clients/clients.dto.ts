import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value;

export class CreateQuickClientDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @Transform(normalizePhone)
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/)
  phone!: string;
}

export class UpdateClientDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(normalizePhone)
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  notes?: string;
}

export class UpdateClientNotesDto {
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  notes!: string;
}
