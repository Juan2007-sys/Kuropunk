import { IsString, IsOptional, MaxLength } from 'class-validator';

export class QueryProductsDto {
  @IsString()
  @IsOptional()
  @MaxLength(60)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  series?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  type?: string; // 'amigurumi' | 'punto_cruz' | 'patron'

  @IsString()
  @IsOptional()
  @MaxLength(30)
  availability?: string; // 'ALL' | 'IN_STOCK' | 'LIMITED' | 'SOLD_OUT'

  @IsString()
  @IsOptional()
  @MaxLength(20)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  search?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}
