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

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Max' })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({ example: 'Durden' })
  @Column({ nullable: true })
  lastName: string;

  @ApiProperty({ example: 'Max.durden@gmail.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'MegaPassword' })
  @Column({ type: 'varchar', nullable: true, select: false })
  password: string | null;

  @ApiProperty({ example: '1990-01-15' })
  @Column({ type: 'date', nullable: true })
  birthdate: Date;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/...' })
  @Column({ nullable: true })
  avatar: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, unique: true })
  googleId: string;
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
