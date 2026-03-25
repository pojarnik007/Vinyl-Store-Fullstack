import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { DataSource } from 'typeorm';

describe('Vinyl API — Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let usersService: UsersService;
  let userToken: string;
  let dataSource: DataSource;
  let adminToken: string;
  let createdVinylId: string;

  before(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    dataSource = moduleFixture.get<DataSource>(DataSource);

    await dataSource.synchronize(false);
    try {
      await dataSource.query('TRUNCATE TABLE "system_log" CASCADE');
      await dataSource.query('TRUNCATE TABLE "user" CASCADE');
      await dataSource.query('TRUNCATE TABLE "vinyl" CASCADE');
    } catch (e) {
      console.log(`Tables were already empty or not yet created, continuing... ${e}`);
    }

    const user = await usersService.create({
      email: 'test-user@example.com',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    });

    const admin = await usersService.create({
      email: 'test-admin@example.com',
      firstName: 'Test',
      lastName: 'Admin',
      isAdmin: true,
    });

    userToken = jwtService.sign({ sub: user.id, email: user.email, isAdmin: false });
    adminToken = jwtService.sign({ sub: admin.id, email: admin.email, isAdmin: true });
  });

  after(async () => {
    await app.close();
  });

  describe('GET /api/vinyl', () => {
    it('should return paginated list without authentication', async () => {
      const response = await request(app.getHttpServer()).get('/api/vinyl');

      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(response.body.data), 'data should be array');
      assert.ok(response.body.meta !== undefined, 'meta should exist');
      assert.ok(typeof response.body.meta.total === 'number', 'total should be number');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/vinyl')
        .query({ page: 1, limit: 5 });

      assert.strictEqual(response.status, 200);
      assert.ok(response.body.data.length <= 5);
    });
  });

  describe('POST /api/vinyl', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vinyl')
        .send({ name: 'Test Album', authorName: 'Artist', price: 25.99, description: 'Test' });

      assert.strictEqual(response.status, 401);
    });

    it('should return 403 for regular user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vinyl')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Album', authorName: 'Artist', price: 25.99, description: 'Test' });

      assert.strictEqual(response.status, 403);
    });

    it('should create vinyl for admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vinyl')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration Test Album',
          authorName: 'Test Artist',
          price: 25.99,
          description: 'Created during integration test',
        });

      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.name, 'Integration Test Album');
      assert.ok(response.body.id, 'should have id');
      createdVinylId = response.body.id;
    });

    it('should return 400 for invalid price', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/vinyl')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', authorName: 'Artist', price: -5, description: 'Test' });

      assert.strictEqual(response.status, 400);
    });
  });

  describe('PATCH /api/vinyl/:id', () => {
    it('should update vinyl for admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/vinyl/${createdVinylId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 35.99 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(Number(response.body.price), 35.99);
    });
  });

  describe('DELETE /api/vinyl/:id', () => {
    it('should delete vinyl for admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/vinyl/${createdVinylId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(response.status, 200);
    });
  });
});
