import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Patch('products/:id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('stock') stock: number,
  ) {
    const numericStock = Number(stock);
    if (!Number.isInteger(numericStock) || numericStock < 0 || numericStock > 1000) {
      throw new BadRequestException('El stock debe ser un número entero entre 0 y 1000.');
    }
    return this.adminService.updateStock(id, numericStock);
  }
}
