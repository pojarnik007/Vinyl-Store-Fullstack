import { Module } from '@nestjs/common';
import { SeedRunnerService } from './seed-runner.service';
import { DiscogsVinylSeedService } from './discogs.vinyl.seed.service';
import { VinylModule } from '../vinyl/vinyl.module';
import { DiscogsModule } from '../discogs/discogs.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [VinylModule, DiscogsModule, UsersModule],
  providers: [SeedRunnerService, DiscogsVinylSeedService],
})
export class SeedsModule {}
