import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown => {
  const input = value as unknown;
  return typeof input === 'string' ? input.trim() : input;
};

const normalizePhone = ({ value }: TransformFnParams): unknown => {
  const input = value as unknown;
  return typeof input === 'string' ? input.replace(/[\s()-]/g, '') : input;
};

export class SaveWhatsappConfigDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  phoneNumberId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  businessAccountId?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(4096)
  accessToken?: string;

  @IsOptional()
  @IsString()
  @Matches(/^v\d+\.\d+$/)
  apiVersion?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SendWhatsappMessageDto {
  @Transform(normalizePhone)
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  to!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  message?: string;
}

export class SendConversationMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;
}
