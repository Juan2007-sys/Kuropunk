import { Controller, Post, Body } from '@nestjs/common';
import { CartService, CartValidationItem } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('validate')
  async validateCart(@Body('items') items: CartValidationItem[]) {
    return this.cartService.validateAndCalculate(items);
  }
}
