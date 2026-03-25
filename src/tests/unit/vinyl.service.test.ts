import { describe, it, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import { VinylService } from '../../vinyl/vinyl.service';

describe('VinylService — Unit Tests', () => {
  let service: VinylService;
  let mockRepo: Record<string, ReturnType<typeof mock.fn>>;
  let mockLogsService: Record<string, ReturnType<typeof mock.fn>>;

  const createMockQueryBuilder = (result: [unknown[], number] = [[], 0]) => {
    const qb: Record<string, unknown> = {};
    qb.leftJoinAndSelect = mock.fn(() => qb);
    qb.leftJoin = mock.fn(() => qb);
    qb.addSelect = mock.fn(() => qb);
    qb.where = mock.fn(() => qb);
    qb.andWhere = mock.fn(() => qb);
    qb.orderBy = mock.fn(() => qb);
    qb.skip = mock.fn(() => qb);
    qb.take = mock.fn(() => qb);
    qb.getManyAndCount = mock.fn(async () => result);
    qb.getOne = mock.fn(async () => null);
    return qb;
  };

  before(() => {
    mockRepo = {
      findAndCount: mock.fn(async () => [[], 0]),
      findOne: mock.fn(async () => null),
      create: mock.fn((dto) => ({ id: 'test-uuid', ...dto })),
      save: mock.fn(async (entity) => entity),
      remove: mock.fn(async () => {}),
      count: mock.fn(async () => 0),
      createQueryBuilder: mock.fn(() => createMockQueryBuilder()),
    };

    mockLogsService = {
      log: mock.fn(async () => {}),
    };

    service = new VinylService(mockRepo as never, mockLogsService as never);
  });

  describe('findAll', () => {
    it('should return paginated result with empty data', async () => {
      mockRepo.createQueryBuilder = mock.fn(() => createMockQueryBuilder([[], 0]));

      const result = await service.findAll({ page: 1, limit: 10 });

      assert.ok(result.data !== undefined, 'data should exist');
      assert.ok(result.meta !== undefined, 'meta should exist');
      assert.strictEqual(result.meta.total, 0);
      assert.strictEqual(result.meta.page, 1);
      assert.strictEqual(result.meta.limit, 10);
    });

    it('should calculate totalPages correctly', async () => {
      const mockVinyls = Array(10).fill({ id: 'uuid', name: 'Test', reviews: [] });
      mockRepo.createQueryBuilder = mock.fn(() => createMockQueryBuilder([mockVinyls, 25]));

      const result = await service.findAll({ page: 1, limit: 10 });
      assert.strictEqual(result.meta.totalPages, 3);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when vinyl not found', async () => {
      mockRepo.findOne = mock.fn(async () => null);

      await assert.rejects(() => service.findOne('non-existent-uuid'), {
        name: 'NotFoundException',
      });
    });

    it('should return vinyl when found', async () => {
      const mockVinyl = { id: 'uuid', name: 'Abbey Road', reviews: [] };
      mockRepo.findOne = mock.fn(async () => mockVinyl);

      const result = await service.findOne('uuid');
      assert.deepStrictEqual(result, mockVinyl);
    });
  });

  describe('create', () => {
    it('should create and return a vinyl record', async () => {
      const dto = {
        name: 'Test Album',
        authorName: 'Test Artist',
        price: 25.99,
        description: 'Test',
      };
      mockRepo.save = mock.fn(async (entity) => ({ ...entity, id: 'new-uuid' }));

      const result = await service.create(dto, 'user-uuid');

      assert.strictEqual(result.name, dto.name);
      assert.ok(result.id, 'should have an id');
    });

    it('should call logsService.log after creation', async () => {
      const logSpy = mock.fn(async (..._args: any[]) => {});
      mockLogsService.log = logSpy;

      await service.create(
        { name: 'Test', authorName: 'Artist', price: 10, description: 'Desc' },
        'user-uuid',
      );

      assert.strictEqual(logSpy.mock.calls.length, 1);
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], 'CREATE');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when deleting non-existent vinyl', async () => {
      mockRepo.findOne = mock.fn(async () => null);

      await assert.rejects(() => service.delete('non-existent-uuid', 'user-uuid'), {
        name: 'NotFoundException',
      });
    });

    it('should delete vinyl successfully', async () => {
      const mockVinyl = { id: 'uuid', name: 'Abbey Road' };
      mockRepo.findOne = mock.fn(async () => mockVinyl);
      mockRepo.remove = mock.fn(async () => {});

      await assert.doesNotReject(() => service.delete('uuid', 'user-uuid'));
    });
  });
});
