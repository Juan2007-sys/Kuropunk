import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  series?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  type?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000000)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000000)
  originalPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000000)
  kitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000000)
  bundlePrice?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(1000)
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isHero?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  badge?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  badgeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  badgeVol?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  edition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  height?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  yarn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @IsOptional()
  specs?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  altImage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  fabric?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  gridSize?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  dmcPalette?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  stitchesCount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  hookSize?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  pages?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  stitches?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  estimatedTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  difficulty?: string;
}
