import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../database/entities/product.entity';
import { OrderEntity } from '../../database/entities/order.entity';
import { ContactMessageEntity } from '../../database/entities/contact-message.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(ContactMessageEntity)
    private readonly contactRepo: Repository<ContactMessageEntity>,
  ) {}

  async getDashboardStats() {
    const totalProducts = await this.productRepo.count();
    const totalOrders = await this.orderRepo.count();
    const newMessages = await this.contactRepo.count({ where: { status: 'NEW' } });

    const orders = await this.orderRepo.find({ select: ['total', 'status'] });
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const lowStockProducts = await this.productRepo.createQueryBuilder('p')
      .where("p.type = 'amigurumi' AND p.stock > 0 AND p.stock <= 3")
      .getMany();

    const soldOutProducts = await this.productRepo.createQueryBuilder('p')
      .where("p.type = 'amigurumi' AND (p.stock = 0 OR p.badge = 'SOLD OUT')")
      .getMany();

    const recentOrders = await this.orderRepo.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      newMessages,
      lowStockCount: lowStockProducts.length,
      soldOutCount: soldOutProducts.length,
      lowStockProducts,
      soldOutProducts,
      recentOrders,
    };
  }

  async updateStock(id: string, stock: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) return null;

    product.stock = Math.max(0, stock);
    if (product.stock === 0) {
      product.badge = 'SOLD OUT';
      product.badgeType = 'sold-out';
    } else if (product.badge === 'SOLD OUT') {
      product.badge = 'IN STOCK';
      product.badgeType = 'primary';
    }

    return await this.productRepo.save(product);
  }
}
