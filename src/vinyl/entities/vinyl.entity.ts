import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../../reviews/entities/review.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('vinyl_records')
export class VinylRecord {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Abbey Road' })
  @Column()
  name: string;

  @ApiProperty({ example: 'The Beatles' })
  @Column()
  authorName: string;

  @ApiProperty({ example: 'Девятый студийный альбом The Beatles...' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 'https://example.com/abbey-road.jpg' })
  @Column({ nullable: true })
  image: string;

  @ApiProperty({ example: 29.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  discogsId: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  discogsScore: number;

  @OneToMany(() => Review, (review) => review.vinyl)
  reviews: Review[];

  @OneToMany(() => Order, (order) => order.vinyl)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
