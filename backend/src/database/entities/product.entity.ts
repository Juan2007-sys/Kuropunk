import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ReviewEntity } from './review.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  series: string;

  @Column({ type: 'varchar', length: 50, default: 'amigurumi' })
  type: string; // 'amigurumi' | 'punto_cruz' | 'patron'

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'float', nullable: true })
  originalPrice: number;

  @Column({ type: 'float', nullable: true })
  kitPrice: number;

  @Column({ type: 'float', nullable: true })
  bundlePrice: number;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isHero: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badgeType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badgeVol: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  edition: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  height: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  yarn: string;

  @Column({ type: 'text', nullable: true })
  origin: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  specs: string[];

  @Column({ type: 'text' })
  image: string;

  @Column({ type: 'text', nullable: true })
  altImage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string;

  // Specific to Punto Cruz
  @Column({ type: 'varchar', length: 255, nullable: true })
  fabric: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gridSize: string;

  @Column({ type: 'text', nullable: true })
  dmcPalette: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stitchesCount: string;

  // Specific to Patrones
  @Column({ type: 'varchar', length: 100, nullable: true })
  hookSize: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pages: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stitches: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  estimatedTime: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: string;

  @OneToMany(() => ReviewEntity, (review) => review.product, { cascade: true })
  reviews: ReviewEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
