import { Transform, Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateLeadDto {
  @IsIn(['demo', 'salon_score'])
  leadSource!: 'demo' | 'salon_score';

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  salon!: string;

  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phone!: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(240)
  email!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  teamSize?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  currentManagement?: string;

  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsObject()
  categoryScores?: Record<string, number>;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(240)
  utmSource?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(240)
  utmMedium?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(240)
  utmCampaign?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(240)
  utmContent?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(240)
  utmTerm?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  referrer?: string;

  @IsBoolean()
  @Equals(true)
  privacyAccepted!: true;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  website?: string;
}
