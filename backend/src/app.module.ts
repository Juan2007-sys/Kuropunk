import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ProductEntity,
  OrderEntity,
  OrderItemEntity,
  ReviewEntity,
  ContactMessageEntity,
} from './database/entities';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ContactModule } from './modules/contact/contact.module';
import { CartModule } from './modules/cart/cart.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DB_TYPE') || (config.get<string>('DATABASE_URL') ? 'postgres' : 'sqlite');
        const isPostgres = dbType === 'postgres';
        const shouldSynchronize = config.get<string>('DB_SYNCHRONIZE', 'true') !== 'false';

        if (isPostgres) {
          const databaseUrl = config.get<string>('DATABASE_URL');
          return {
            type: 'postgres',
            ...(databaseUrl
              ? { url: databaseUrl }
              : {
                  host: config.get<string>('DB_HOST', 'localhost'),
                  port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
                  username: config.get<string>('DB_USERNAME', 'crochet_user'),
                  password: config.get<string>('DB_PASSWORD', 'crochet_pass'),
                  database: config.get<string>('DB_DATABASE', 'tienda_crochet'),
                }),
            ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
            entities: [
              ProductEntity,
              OrderEntity,
              OrderItemEntity,
              ReviewEntity,
              ContactMessageEntity,
            ],
            synchronize: shouldSynchronize,
            logging: false,
          };
        }

        return {
          type: 'sqlite',
          database: config.get<string>('DATABASE_PATH', './tienda.sqlite'),
          entities: [
            ProductEntity,
            OrderEntity,
            OrderItemEntity,
            ReviewEntity,
            ContactMessageEntity,
          ],
          synchronize: shouldSynchronize,
          logging: false,
        };
      },
    }),
    ProductsModule,
    OrdersModule,
    ReviewsModule,
    ContactModule,
    CartModule,
    AdminModule,
  ],
})
export class AppModule {}
