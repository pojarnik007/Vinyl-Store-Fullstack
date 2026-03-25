import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
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

async function seedFromDiscogs() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vinylService = app.get(VinylService);
  const discogsService = app.get(DiscogsService);
  const usersService = app.get(UsersService);

  const admin = await usersService.findAdmin();
  if (!admin) {
    console.error('No admin user found for seeding!');
    await app.close();
    return;
  }

  const count = await vinylService.count();
  if (count > 0) {
    console.log(`Database already has ${count} records. Skipping seed.`);
    await app.close();
    return;
  }

  console.log('Fetching data from Discogs...');
  const allRecords: any[] = [];

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"...`);

    try {
      const { results } = await discogsService.searchReleases(query, 1, 5);

      if (!results || results.length === 0) {
        console.warn(`No results for "${query}"`);
        continue;
      }

      for (const result of results) {
        try {
          const release = await discogsService.getRelease(result.id.toString());
          const mapped = discogsService.mapReleaseToVinyl(release);

          allRecords.push(mapped);
          console.log(`   + Added: ${mapped.name}`);

          await new Promise((resolve) => setTimeout(resolve, 1100));
        } catch (error) {
          console.warn(`Failed release ${result.id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Search error for "${query}": ${error.message}`);
    }

    if (allRecords.length >= 50) break;
  }

  console.log(`Attempting to save ${allRecords.length} records to DB...`);

  try {
    if (allRecords.length > 0) {
      await vinylService.bulkCreate(allRecords.slice(0, 50), admin.id);
      console.log(`Seeded ${Math.min(allRecords.length, 50)} vinyl records!`);
    } else {
      console.warn('No records were collected to seed.');
    }
  } catch (dbError) {
    console.error('Database Insertion Error:', dbError.detail || dbError.message);

    console.dir(allRecords[0], { depth: null });
  }

  await app.close();
}

seedFromDiscogs().catch(console.error);
