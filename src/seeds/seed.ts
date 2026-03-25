import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User), { strict: false });

  const dataSource = app.get(DataSource);
  await dataSource.query('TRUNCATE TABLE reviews, vinyl_records, users RESTART IDENTITY CASCADE');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = usersRepo.create({
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    password: adminPassword,
    isAdmin: true,
  });
  await usersRepo.save(admin);
  console.log('Admin created: admin@test.com / admin123');

  const userPassword = await bcrypt.hash('user123', 10);
  const user = usersRepo.create({
    email: 'user@test.com',
    firstName: 'John',
    lastName: 'Doe',
    password: userPassword,
    isAdmin: false,
  });
  await usersRepo.save(user);
  console.log('User created: user@test.com / user123');

  await app.close();
  console.log('Seed completed!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
