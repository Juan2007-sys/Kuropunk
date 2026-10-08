import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('contact_messages')
export class ContactMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 80, default: 'general' })
  type: string; // 'general' | 'commission' | 'inquiry'

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'NEW' })
  status: string; // 'NEW' | 'REVIEWED' | 'REPLIED'

  @CreateDateColumn()
  createdAt: Date;
}
