import { Transform } from 'class-transformer';
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
import {
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEmail,
  IsString,
  Length,
  IsOptional,
  IsIn,
  IsBoolean,
  IsObject,
  Matches,
  MaxLength,
} from 'class-validator';
export class LoginDto {
  @IsEmail() email: string;
  @IsString() @Length(1, 128) password: string;
  @Matches(/^\d{6}$/) totp: string;
}
export class EmailDto {
  @IsEmail() email: string;
}
export class ActivateDto {
  @IsString() @Length(40, 128) token: string;
  @IsString() @Length(12, 128) password: string;
  @IsOptional() @Matches(/^[A-Z2-7]{32}$/) totpSecret?: string;
  @IsOptional() @Matches(/^\d{6}$/) totp?: string;
}
export class SalonDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;
  @Matches(/^[A-Z0-9_-]{3,32}$/) code: string;
  @Transform(trim)
  @IsString()
  @Length(2, 150)
  businessName: string;
  @Matches(/^\d{11}$/) vatNumber: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(32)
  taxCode?: string;
  @Transform(trim)
  @IsString()
  @Length(2, 200)
  address: string;
  @Matches(/^\d{5}$/) postalCode: string;
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  city: string;
  @Matches(/^[A-Z]{2}$/) province: string;
  @IsEmail() email: string;
  @Transform(trim)
  @IsString()
  @Length(5, 30)
  phone: string;
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  ownerName: string;
  @IsEmail() ownerEmail: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  plan?: string;
}
export class StatusDto {
  @IsIn(['BOZZA', 'IN_CONFIGURAZIONE', 'DA_COLLAUDARE', 'ATTIVO', 'SOSPESO'])
  status:
    | 'BOZZA'
    | 'IN_CONFIGURAZIONE'
    | 'DA_COLLAUDARE'
    | 'ATTIVO'
    | 'SOSPESO';
}
export class AdminDto {
  @IsEmail() email: string;
  @IsString() @Length(2, 100) name: string;
  @IsIn(['ADMIN', 'TECHNICIAN', 'SUPER_ADMIN']) role:
    | 'ADMIN'
    | 'TECHNICIAN'
    | 'SUPER_ADMIN';
}
export class ActiveDto {
  @IsBoolean() active: boolean;
}
export class AssignmentDto {
  @IsString() @Length(1, 100) adminId: string;
}
export class ConfigurationDto {
  @IsObject() data: Record<string, unknown>;
  @IsOptional() @IsString() @MaxLength(8000) secret?: string;
}
export class CheckDto {
  @IsIn(['PENDING', 'PASS', 'FAIL', 'NA']) result: string;
  @IsString() @MaxLength(2000) notes: string;
}
export class InterventionDto {
  @IsString() @Length(3, 2000) notes: string;
}

export class DeviceDto extends ConfigurationDto {
  @Transform(trim) @IsString() @Length(2, 100) label: string;
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string | null;
}
export class DeviceUpdateDto extends DeviceDto {
  @IsInt() @Min(1) @Max(2147483647) version: number;
}
export class DeviceVersionDto {
  @IsInt() @Min(1) @Max(2147483647) version: number;
}
export class DeviceCheckDto extends DeviceVersionDto {
  @IsIn(['PENDING', 'PASS', 'FAIL']) result: 'PENDING' | 'PASS' | 'FAIL';
  @Transform(trim) @IsString() @Length(5, 2000) notes: string;
}
