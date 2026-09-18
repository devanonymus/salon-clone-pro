import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsHexColor,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const numeric = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value.replace(',', '.')) : value;

export class CreateStaffDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsIn(['TITOLARE', 'MANAGER', 'RECEPTION', 'COLLABORATORE'])
  role?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyCost?: number;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(744)
  productiveHours?: number;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyTarget?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateStaffDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(['TITOLARE', 'MANAGER', 'RECEPTION', 'COLLABORATORE'])
  role?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyCost?: number;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(744)
  productiveHours?: number;

  @IsOptional()
  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyTarget?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
