import { Injectable, Logger } from '@nestjs/common';
import { VinylService } from '../vinyl/vinyl.service';
import { DiscogsService } from '../discogs/discogs.service';
import { UsersService } from '../users/users.service';

const SEARCH_QUERIES = [
  'The Beatles',
  'Pink Floyd',
  'Led Zeppelin',
  'Rolling Stones',
  'David Bowie',
  'Queen',
  'The Doors',
  'Jimi Hendrix',
  'Bob Dylan',
  'Fleetwood Mac',
];

@Injectable()
export class DiscogsVinylSeedService {
  private readonly logger = new Logger(DiscogsVinylSeedService.name);

  constructor(
    private readonly vinylService: VinylService,
    private readonly discogsService: DiscogsService,
    private readonly usersService: UsersService,
  ) {}

  async seed(): Promise<void> {
    const admin = await this.usersService.findAdmin();
    if (!admin) {
      this.logger.error('No admin user found for seeding!');
      return;
    }

    const count = await this.vinylService.count();
    if (count > 0) {
      this.logger.log(`Database already has ${count} records. Skipping seed.`);
      return;
    }

    this.logger.log('Fetching data from Discogs...');
    const allRecords: any[] = [];

    for (const query of SEARCH_QUERIES) {
      this.logger.log(`Searching: "${query}"...`);

      try {
        const { results } = await this.discogsService.searchReleases(query, 1, 5);

        if (!results || results.length === 0) {
          this.logger.warn(`No results for "${query}"`);
          continue;
        }

        for (const result of results) {
          try {
            const release = await this.discogsService.getRelease(result.id.toString());
            const mapped = this.discogsService.mapReleaseToVinyl(release);

            allRecords.push(mapped);
            this.logger.log(`+ Added: ${mapped.name}`);

            await new Promise((resolve) => setTimeout(resolve, 1100));
          } catch (error) {
            this.logger.warn(`Failed release ${result.id}: ${error.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Search error for "${query}": ${error.message}`);
      }

      if (allRecords.length >= 50) break;
    }

    this.logger.log(`Attempting to save ${allRecords.length} records to DB...`);

    if (allRecords.length === 0) {
      this.logger.warn('No records were collected to seed.');
      return;
    }

    try {
      await this.vinylService.bulkCreate(allRecords.slice(0, 50), admin.id);
      this.logger.log(`Seeded ${Math.min(allRecords.length, 50)} vinyl records!`);
    } catch (dbError) {
      this.logger.error(`Database Insertion Error: ${dbError.detail || dbError.message}`);
    }
  }
}
