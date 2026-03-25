import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VinylRecord } from './entities/vinyl.entity';
import { VinylService } from './vinyl.service';
import { VinylController } from './vinyl.controller';
import { AuthModule } from '../auth/auth.module';
import { SearchAuthGuard } from '../auth/guards/search-auth.guard';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([VinylRecord]), AuthModule, TelegramModule],
  providers: [VinylService, SearchAuthGuard],
  controllers: [VinylController],
  exports: [VinylService],
})
export class VinylModule {}
