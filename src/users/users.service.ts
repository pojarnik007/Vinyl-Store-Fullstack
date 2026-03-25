import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction, LogEntity } from '../logs/entities/system-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logsService: LogsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findAdmin(): Promise<User | null> {
    return this.usersRepository.findOne({ where: { isAdmin: true } as any });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    const savedUser = await this.usersRepository.save(user);

    this.logsService.log(LogAction.CREATE, LogEntity.USER, savedUser.id, savedUser.id, {
      email: savedUser.email,
    });
    return savedUser;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, data);
    const updatedUser = await this.findById(id);

    this.logsService.log(LogAction.UPDATE, LogEntity.USER, id, id, data as Record<string, unknown>);

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    const userEmail = user.email;
    await this.usersRepository.remove(user);

    this.logsService.log(LogAction.DELETE, LogEntity.USER, id, id, { email: userEmail });
  }

  async findProfile(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['reviews', 'reviews.vinyl', 'orders', 'orders.vinyl'],
      order: {
        reviews: { createdAt: 'DESC' },
        orders: { createdAt: 'DESC' },
      },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }
}
