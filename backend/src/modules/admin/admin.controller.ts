import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
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
    return this.adminService.updateStock(id, Number(stock));
  }
}
