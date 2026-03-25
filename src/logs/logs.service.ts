import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogAction, LogEntity, SystemLog } from './entities/system-log.entity';
import { paginate, PaginatedResult, PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logsRepository: Repository<SystemLog>,
  ) {}

  async log(
    action: LogAction,
    entity: LogEntity,
    entityId: string,
    userId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const logEntry = this.logsRepository.create({
      action,
      entity,
      entityId,
      userId,
      details,
    });

    this.logsRepository.save(logEntry).catch(console.error);
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<SystemLog>> {
    const { page = 1, limit = 10 } = query;

    const [logs, total] = await this.logsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(logs, total, page, limit);
  }
}
