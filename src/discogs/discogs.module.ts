import { Module } from '@nestjs/common';
import { DiscogsService } from './discogs.service';
import { DiscogsController } from './discogs.controller';
import { ConfigModule } from '@nestjs/config';
import { VinylModule } from '../vinyl/vinyl.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [ConfigModule, VinylModule, LogsModule],
  providers: [DiscogsService],
  controllers: [DiscogsController],
  exports: [DiscogsService],
})
export class DiscogsModule {}
