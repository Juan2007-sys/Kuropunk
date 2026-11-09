import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEntity } from '../../database/entities/review.entity';
import { ProductEntity } from '../../database/entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepo: Repository<ReviewEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async findByProduct(productId: string): Promise<ReviewEntity[]> {
    return this.reviewRepo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createReviewDto: CreateReviewDto): Promise<ReviewEntity> {
    const product = await this.productRepo.findOne({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${createReviewDto.productId}' not found`);
    }

    const review = this.reviewRepo.create({
      productId: createReviewDto.productId,
      author: createReviewDto.author,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      verifiedBuyer: false,
    });

    const savedReview = await this.reviewRepo.save(review);

    // Recalculate product rating
    const allReviews = await this.reviewRepo.find({
      where: { productId: product.id },
    });

    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    product.rating = Number((sum / allReviews.length).toFixed(1));
    product.reviewsCount = allReviews.length;

    await this.productRepo.save(product);

    return savedReview;
  }
}
