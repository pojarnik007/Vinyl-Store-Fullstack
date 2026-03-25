import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  LOGIN = 'LOGIN',
  DELETE = 'DELETE',
}

export enum LogEntity {
  USER = 'User',
  VINYL = 'VinylRecord',
  REVIEW = 'Review',
  ORDER = 'Order',
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: LogAction })
  @Column({ type: 'enum', enum: LogAction })
  action: LogAction;

  @ApiProperty({ enum: LogEntity })
  @Column({ type: 'enum', enum: LogEntity })
  entity: LogEntity;

  @ApiProperty()
  @Column({ nullable: true })
  entityId: string;

  @ApiProperty()
  @Column({ nullable: true })
  userId: string;

  @ApiProperty()
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
