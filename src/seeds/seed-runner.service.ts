import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscogsVinylSeedService } from './discogs.vinyl.seed.service';

@Injectable()
export class SeedRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedRunnerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly discogsVinylSeedService: DiscogsVinylSeedService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const shouldRun = this.configService.get<string>('RUN_SEEDS') === 'true';

    if (!shouldRun) {
      this.logger.log('RUN_SEEDS != true — skipping seeds');
      return;
    }

    this.logger.log('Running seeds...');
    try {
      await this.discogsVinylSeedService.seed();
    } catch (error) {
      this.logger.error('Seed failed:', error.message);
    }
  }
}
