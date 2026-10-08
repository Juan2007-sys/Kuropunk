import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessageEntity } from '../../database/entities/contact-message.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly contactRepo: Repository<ContactMessageEntity>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContactMessageEntity> {
    const contact = this.contactRepo.create({
      name: createContactDto.name,
      email: createContactDto.email,
      type: createContactDto.type || 'general',
      message: createContactDto.message,
      status: 'NEW',
    });

    return await this.contactRepo.save(contact);
  }

  async findAll(limit = 50, page = 1): Promise<{ messages: ContactMessageEntity[]; total: number }> {
    const [messages, total] = await this.contactRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { messages, total };
  }
}
