import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { paginate, PaginatedResult, PaginationDto } from '../common/dto/pagination.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly logsService: LogsService,
  ) {}

  async create(vinylId: string, userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviewsRepository.findOne({
      where: { vinyl: { id: vinylId }, user: { id: userId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this vinyl record');
    }

    const review = this.reviewsRepository.create({
      ...dto,
      vinyl: { id: vinylId },
      user: { id: userId },
    });

    const savedReview = await this.reviewsRepository.save(review);

    this.logsService.log(LogAction.CREATE, LogEntity.REVIEW, savedReview.id, userId, {
      vinylId,
      score: dto.score,
    });

    return savedReview;
  }

  async findByVinyl(vinylId: string, query: PaginationDto): Promise<PaginatedResult<Review>> {
    const { page = 1, limit = 10 } = query;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { vinyl: { id: vinylId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        comment: true,
        score: true,
        createdAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    });

    return paginate(reviews, total, page, limit);
  }

  async delete(id: string, requestingUser: { id: string; isAdmin: boolean }): Promise<void> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) throw new NotFoundException(`Review #${id} not found`);

    if (!requestingUser.isAdmin) {
      throw new ForbiddenException('Only admins can delete reviews');
    }

    const commentSnippet = review.comment?.substring(0, 50);
    await this.reviewsRepository.remove(review);

    this.logsService.log(LogAction.DELETE, LogEntity.REVIEW, id, requestingUser.id, {
      comment: commentSnippet,
    });
  }
}
