import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UsePipes,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ReportPaymentDto,
  VerifyDepositDto,
  UpdateOrderStatusDto,
} from './dto/report-payment.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  async findAll(@Query('limit') limit = 20, @Query('page') page = 1) {
    return this.ordersService.findAll(Number(limit), Number(page));
  }

  @Get('track/:query')
  async trackOrder(@Param('query') query: string) {
    return this.ordersService.trackOrder(query);
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/report-payment')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async reportPayment(
    @Param('id') id: string,
    @Body() reportPaymentDto: ReportPaymentDto,
  ) {
    return this.ordersService.reportPayment(id, reportPaymentDto);
  }

  @Patch(':id/verify-deposit')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async verifyDeposit(
    @Param('id') id: string,
    @Body() verifyDepositDto: VerifyDepositDto,
  ) {
    return this.ordersService.verifyDeposit(id, verifyDepositDto);
  }

  @Patch(':id/status')
  @UseGuards(AdminAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto.status);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Delete()
  @UseGuards(AdminAuthGuard)
  async clearAll() {
    return this.ordersService.clearAll();
  }
}
