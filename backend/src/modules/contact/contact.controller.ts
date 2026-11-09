import { Controller, Post, Get, Body, Query, UsePipes, UseGuards, ValidationPipe } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  async findAll(@Query('limit') limit = 50, @Query('page') page = 1) {
    return this.contactService.findAll(
      Math.min(Math.max(1, Number(limit) || 50), 100),
      Math.max(1, Number(page) || 1),
    );
  }
}
