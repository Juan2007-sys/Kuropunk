import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string; // e.g., "VS-592812"

  @Column({ type: 'varchar', length: 150 })
  customerName: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, default: 'Global' })
  country: string;

  @Column({ type: 'float' })
  subtotal: number;

  @Column({ type: 'float', default: 0 })
  shippingCost: number;

  @Column({ type: 'float' })
  total: number;

  @Column({ type: 'boolean', default: false })
  requiresDeposit: boolean;

  @Column({ type: 'float', default: 0 })
  depositBaseAmount: number;

  @Column({ type: 'float', default: 0 })
  depositRequiredAmount: number;

  @Column({ type: 'float', default: 0 })
  remainingBalance: number;

  @Column({ type: 'varchar', length: 50, default: 'NO_REQUIERE' })
  paymentStatus: string; // 'NO_REQUIERE' | 'PENDIENTE_ANTICIPO' | 'VERIFICANDO_ANTICIPO' | 'ANTICIPO_VERIFICADO' | 'RECHAZADO'

  @Column({ type: 'varchar', length: 120, nullable: true })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  paymentProofUrl: string;

  @Column({ type: 'datetime', nullable: true })
  paymentReportedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  queuedAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'CONFIRMED' })
  status: string; // 'ESPERANDO_PAGO' | 'VERIFICANDO_ANTICIPO' | 'EN_COLA' | 'CONFIRMED' | 'IN_PRODUCTION' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'

  @Column({ type: 'varchar', length: 100, nullable: true })
  trackingCode: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true, eager: true })
  items: OrderItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
