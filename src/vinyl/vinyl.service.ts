import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VinylRecord } from './entities/vinyl.entity';
import { CreateVinylDto } from './dto/create-vinyl.dto';
import { UpdateVinylDto } from './dto/update-vinyl.dto';
import { VinylQueryDto } from './dto/vinyl-query.dto';
import { paginate, PaginatedResult } from '../common/dto/pagination.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

@Injectable()
export class VinylService {
  constructor(
    @InjectRepository(VinylRecord)
    private readonly vinylRepository: Repository<VinylRecord>,
    private readonly logsService: LogsService,
  ) {}

  async findAll(query: VinylQueryDto, currentUserId?: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', order = 'DESC' } = query;

    const qb = this.vinylRepository
      .createQueryBuilder('vinyl')
      .leftJoinAndSelect('vinyl.reviews', 'review')
      .leftJoinAndSelect('review.user', 'reviewer');

    if (search) {
      qb.where(
        'LOWER(vinyl.name) LIKE LOWER(:search) OR LOWER(vinyl.authorName) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const sortField = ['price', 'name', 'authorName'].includes(sortBy)
      ? `vinyl.${sortBy}`
      : 'vinyl.createdAt';
    qb.orderBy(sortField, order);

    qb.skip((page - 1) * limit).take(limit);

    const [records, total] = await qb.getManyAndCount();

    const data = records.map((vinyl) => {
      const reviews = vinyl.reviews || [];

      const avgScore =
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length : null;

      const firstReview = currentUserId
        ? reviews.find((r) => r.user?.id !== currentUserId) || reviews[0]
        : reviews[0];

      return {
        ...vinyl,
        reviews: undefined,
        avgScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
        reviewsCount: reviews.length,
        firstReview: firstReview
          ? {
              id: firstReview.id,
              comment: firstReview.comment,
              score: firstReview.score,
              user: {
                firstName: firstReview.user?.firstName,
                lastName: firstReview.user?.lastName,
                avatar: firstReview.user?.avatar,
              },
              createdAt: firstReview.createdAt,
            }
          : null,
      };
    });

    return paginate(data as any, total, page, limit);
  }

  async findOne(id: string): Promise<VinylRecord> {
    const vinyl = await this.vinylRepository.findOne({
      where: { id },
      relations: ['reviews', 'reviews.user'],
    });
    if (!vinyl) throw new NotFoundException(`Vinyl #${id} not found`);
    return vinyl;
  }

  async create(dto: CreateVinylDto, userId: string): Promise<VinylRecord> {
    const vinyl = this.vinylRepository.create(dto);
    const savedVinyl = await this.vinylRepository.save(vinyl);

    this.logsService.log(LogAction.CREATE, LogEntity.VINYL, savedVinyl.id, userId, {
      name: savedVinyl.name,
    });

    return this.vinylRepository.save(vinyl);
  }

  async update(id: string, dto: UpdateVinylDto, userId: string): Promise<VinylRecord> {
    const vinyl = await this.findOne(id);
    Object.assign(vinyl, dto);
    const updatedVinyl = await this.vinylRepository.save(vinyl);

    this.logsService.log(
      LogAction.UPDATE,
      LogEntity.VINYL,
      id,
      userId,
      dto as unknown as Record<string, unknown>,
    );

    return updatedVinyl;
  }

  async delete(id: string, userId: string): Promise<void> {
    const vinyl = await this.findOne(id);
    const vinylName = vinyl.name;
    await this.vinylRepository.remove(vinyl);

    this.logsService.log(LogAction.DELETE, LogEntity.VINYL, id, userId, { name: vinylName });
  }

  async count(): Promise<number> {
    return this.vinylRepository.count();
  }

  async bulkCreate(records: Partial<VinylRecord>[], userId: string): Promise<VinylRecord[]> {
    const vinyls = this.vinylRepository.create(records);
    const savedVinyls = await this.vinylRepository.save(vinyls);

    this.logsService.log(LogAction.CREATE, LogEntity.VINYL, 'bulk', userId, {
      count: savedVinyls.length,
    });

    return savedVinyls;
  }
}
