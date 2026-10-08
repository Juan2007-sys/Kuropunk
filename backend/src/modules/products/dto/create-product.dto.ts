import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  series?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @IsOptional()
  originalPrice?: number;

  @IsNumber()
  @IsOptional()
  kitPrice?: number;

  @IsNumber()
  @IsOptional()
  bundlePrice?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isHero?: boolean;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  badgeType?: string;

  @IsString()
  @IsOptional()
  badgeVol?: string;

  @IsString()
  @IsOptional()
  edition?: string;

  @IsString()
  @IsOptional()
  height?: string;

  @IsString()
  @IsOptional()
  yarn?: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  specs?: string[];

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsOptional()
  altImage?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsString()
  @IsOptional()
  fabric?: string;

  @IsString()
  @IsOptional()
  gridSize?: string;

  @IsString()
  @IsOptional()
  dmcPalette?: string;

  @IsString()
  @IsOptional()
  stitchesCount?: string;

  @IsString()
  @IsOptional()
  hookSize?: string;

  @IsString()
  @IsOptional()
  pages?: string;

  @IsString()
  @IsOptional()
  stitches?: string;

  @IsString()
  @IsOptional()
  estimatedTime?: string;

  @IsString()
  @IsOptional()
  difficulty?: string;
}
