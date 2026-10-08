import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../database/entities/product.entity';

export interface CartValidationItem {
  id: string;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async validateAndCalculate(items: CartValidationItem[]) {
    if (!items || items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        valid: true,
      };
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await this.productRepo.findOne({
        where: { id: item.id },
      });

      if (!product) {
        throw new BadRequestException(`Product with ID '${item.id}' does not exist.`);
      }

      const availableStock = product.stock;
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const isAvailable = product.type !== 'amigurumi' || availableStock >= requestedQty;

      const lineTotal = product.price * requestedQty;
      subtotal += lineTotal;

      validatedItems.push({
        id: product.id,
        sku: product.sku,
        title: product.title,
        price: product.price,
        quantity: requestedQty,
        stock: product.stock,
        isAvailable,
        type: product.type,
        image: product.image,
        lineTotal,
      });
    }

    const shippingCost = subtotal >= 120 ? 0 : 12.0;
    const total = subtotal + shippingCost;

    return {
      items: validatedItems,
      subtotal,
      shippingCost,
      total,
      freeShippingThreshold: 120.0,
      remainingForFreeShipping: Math.max(0, 120.0 - subtotal),
    };
  }
}
