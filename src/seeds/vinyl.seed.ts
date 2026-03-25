import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VinylService } from '../vinyl/vinyl.service';
import { vinylSeedData } from './data/vinyl.seed.data';

async function runSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const vinylService = app.get(VinylService);

  try {
    const count = await vinylService.count();

    if (count > 0) {
      console.log(`Database already has ${count} vinyl records. Skipping seed.`);
      console.log('To re-seed, clear the vinyl_records table first.');
    } else {
      console.log('Starting seed...');
      await vinylService.bulkCreate(vinylSeedData, 'system');
      console.log(`Successfully seeded ${vinylSeedData.length} vinyl records!`);
    }
  } finally {
    await app.close();
  }
}

runSeed().catch(console.error);
