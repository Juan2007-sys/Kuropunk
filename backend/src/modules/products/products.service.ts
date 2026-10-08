import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsOrder } from 'typeorm';
import { ProductEntity } from '../../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async findAll(query: QueryProductsDto): Promise<{ products: ProductEntity[]; total: number }> {
    const qb = this.productRepo.createQueryBuilder('product');

    // Type filter
    if (query.type) {
      qb.andWhere('product.type = :type', { type: query.type });
    }

    // Category filter
    if (query.category && query.category !== 'all') {
      qb.andWhere('product.category = :category', { category: query.category });
    }

    // Series filter
    if (query.series && query.series !== 'ALL') {
      qb.andWhere('product.series = :series', { series: query.series });
    }

    // Size filter
    if (query.size && query.size !== 'ALL') {
      qb.andWhere('product.size = :size', { size: query.size });
    }

    // Availability filter
    if (query.availability === 'IN_STOCK') {
      qb.andWhere('product.stock > 0 AND (product.badge IS NULL OR product.badge != :soldOut)', {
        soldOut: 'SOLD OUT',
      });
    } else if (query.availability === 'LIMITED') {
      qb.andWhere('product.badge IN (:...badges)', {
        badges: ['LIMITED DROP', 'FLAGSHIP', 'LAST ONE', 'LIMITED'],
      });
    } else if (query.availability === 'SOLD_OUT') {
      qb.andWhere('product.stock = 0 OR product.badge = :soldOut', {
        soldOut: 'SOLD OUT',
      });
    }

    // Search query
    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        '(LOWER(product.title) LIKE LOWER(:term) OR LOWER(product.sku) LIKE LOWER(:term) OR LOWER(product.description) LIKE LOWER(:term) OR LOWER(product.category) LIKE LOWER(:term))',
        { term },
      );
    }

    // Sorting
    switch (query.sortBy) {
      case 'price-asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'rating':
        qb.orderBy('product.rating', 'DESC');
        break;
      case 'newest':
        qb.orderBy('product.createdAt', 'DESC');
        break;
      case 'featured':
      default:
        qb.orderBy('product.isHero', 'DESC')
          .addOrderBy('product.isFeatured', 'DESC')
          .addOrderBy('product.createdAt', 'DESC');
        break;
    }

    // Pagination
    if (query.limit) {
      const limit = Number(query.limit) || 20;
      const page = Number(query.page) || 1;
      qb.take(limit).skip((page - 1) * limit);
    }

    const [products, total] = await qb.getManyAndCount();
    return { products, total };
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({
      where: [{ id }, { sku: id }],
      relations: ['reviews'],
    });

    if (!product) {
      throw new NotFoundException(`Product with identifier '${id}' not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    const product = this.productRepo.create(createProductDto);
    return await this.productRepo.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepo.save(product);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
    return { deleted: true, id };
  }

  async getSummary(): Promise<any> {
    const total = await this.productRepo.count();
    const lowStock = await this.productRepo.createQueryBuilder('p')
      .where('p.stock > 0 AND p.stock <= 3')
      .getCount();
    const soldOut = await this.productRepo.createQueryBuilder('p')
      .where('p.stock = 0 OR p.badge = :badge', { badge: 'SOLD OUT' })
      .getCount();

    return { total, lowStock, soldOut };
  }
}
