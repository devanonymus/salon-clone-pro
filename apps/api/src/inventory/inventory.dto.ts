import { Transform, Type } from 'class-transformer';
import {
  IsIn,
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

export class CreateInventoryProductDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsIn(['INTERNAL', 'RETAIL'])
  productType?: 'INTERNAL' | 'RETAIL';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplier?: string;
}

export class UpdateInventoryProductDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsIn(['INTERNAL', 'RETAIL'])
  productType?: 'INTERNAL' | 'RETAIL';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  supplier?: string;
}

export class AdjustStockDto {
  @Type(() => Number)
  @IsNumber()
  delta!: number;
}

export class SaveRecipeDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  serviceName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  productCategory?: string;

  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;
}
