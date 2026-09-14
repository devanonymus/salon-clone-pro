import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown => {
  const input = value as unknown;
  return typeof input === 'string' ? input.trim() : input;
};

const uppercase = ({ value }: TransformFnParams): unknown => {
  const input = value as unknown;
  return typeof input === 'string' ? input.trim().toUpperCase() : input;
};

export class LoginDto {
  @Transform(uppercase)
  @IsString()
  @Length(2, 32)
  tenantCode!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 64)
  username!: string;

  @IsString()
  @Length(4, 64)
  pin!: string;
}

export class CreateSalonDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name!: string;

  @Transform(uppercase)
  @IsString()
  @Matches(/^[A-Z0-9_-]{2,32}$/)
  code!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  ownerUsername?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(64)
  ownerPin!: string;
}
