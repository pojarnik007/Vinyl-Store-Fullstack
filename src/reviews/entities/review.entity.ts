import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { VinylRecord } from '../../vinyl/entities/vinyl.entity';

@Entity('reviews')
export class Review {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Отличный альбом, звук просто великолепный!' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Column({ type: 'int' })
  score: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => VinylRecord, (vinyl) => vinyl.reviews, { onDelete: 'CASCADE' })
  vinyl: VinylRecord;

  @CreateDateColumn()
  createdAt: Date;
}
