import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';

const NO_XSS_REGEX = /^[^<>]*$/;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(NO_XSS_REGEX)
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(NO_XSS_REGEX)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(NO_XSS_REGEX)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  @Matches(NO_XSS_REGEX)
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(NO_XSS_REGEX)
  category: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Matches(NO_XSS_REGEX)
  series?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  type?: string;

  @IsNumber()
  @Min(0)
  @Max(50000000)
  price: number;

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
  @Matches(NO_XSS_REGEX)
  badge?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  badgeType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  badgeVol?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  edition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  height?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX)
  yarn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Matches(NO_XSS_REGEX)
  origin?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @Matches(NO_XSS_REGEX)
  description?: string;

  @IsArray()
  @IsOptional()
  specs?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(60000)
  @Matches(NO_XSS_REGEX)
  image: string;

  @IsString()
  @IsOptional()
  @MaxLength(60000)
  @Matches(NO_XSS_REGEX)
  altImage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(NO_XSS_REGEX)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX)
  fabric?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX)
  gridSize?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  @Matches(NO_XSS_REGEX)
  dmcPalette?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  stitchesCount?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  hookSize?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  pages?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX)
  stitches?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  estimatedTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX)
  difficulty?: string;
}
