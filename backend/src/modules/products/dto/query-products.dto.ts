export class QueryProductsDto {
  category?: string;
  series?: string;
  type?: string; // 'amigurumi' | 'punto_cruz' | 'patron'
  availability?: string; // 'ALL' | 'IN_STOCK' | 'LIMITED' | 'SOLD_OUT'
  size?: string;
  search?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  limit?: number;
  page?: number;
}
