import { describe, it, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ReviewsService } from '../../reviews/reviews.service';
import { LogAction, LogEntity } from '../../logs/entities/system-log.entity';

describe('ReviewsService — Unit Tests', () => {
  let service: ReviewsService;
  let mockRepo: Record<string, ReturnType<typeof mock.fn>>;
  let mockLogsService: Record<string, ReturnType<typeof mock.fn>>;

  before(() => {
    mockRepo = {
      findOne: mock.fn(async () => null),
      create: mock.fn((dto) => dto),
      save: mock.fn(async (entity) => ({ id: 'new-review-id', ...entity })),
      findAndCount: mock.fn(async () => [[], 0]),
      remove: mock.fn(async () => {}),
    };

    mockLogsService = {
      log: mock.fn(async (..._args: any[]) => {}),
    };

    service = new ReviewsService(mockRepo as never, mockLogsService as never);
  });

  describe('create', () => {
    it('should throw ConflictException if user already reviewed this vinyl', async () => {
      mockRepo.findOne = mock.fn(async () => ({ id: 'existing-review' }));

      await assert.rejects(
        () => service.create('vinyl-id', 'user-id', { score: 5, comment: 'Great!' }),
        { name: 'ConflictException' },
      );
    });

    it('should create, save, and log a new review successfully', async () => {
      mockRepo.findOne = mock.fn(async () => null);

      const logSpy = mock.fn(async (..._args: any[]) => {});
      mockLogsService.log = logSpy;

      const dto = { score: 4, comment: 'Nice record' };
      const result = await service.create('vinyl-id', 'user-id', dto);

      assert.strictEqual(result.id, 'new-review-id');
      assert.strictEqual(result.score, 4);

      assert.strictEqual(logSpy.mock.calls.length, 1);
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], LogAction.CREATE);
      assert.strictEqual(logSpy.mock.calls[0].arguments[1], LogEntity.REVIEW);
      assert.strictEqual(logSpy.mock.calls[0].arguments[2], 'new-review-id');
      assert.strictEqual(logSpy.mock.calls[0].arguments[3], 'user-id');
    });
  });

  describe('findByVinyl', () => {
    it('should return paginated reviews for a vinyl', async () => {
      const mockReviews = [{ id: 'review-1', score: 5, comment: 'Test' }];
      mockRepo.findAndCount = mock.fn(async () => [mockReviews, 1]);

      const result = await service.findByVinyl('vinyl-id', { page: 1, limit: 10 });

      assert.strictEqual(result.meta.total, 1);
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].id, 'review-1');
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if review does not exist', async () => {
      mockRepo.findOne = mock.fn(async () => null);

      await assert.rejects(() => service.delete('invalid-id', { id: 'admin-id', isAdmin: true }), {
        name: 'NotFoundException',
      });
    });

    it('should throw ForbiddenException if user is not an admin', async () => {
      mockRepo.findOne = mock.fn(async () => ({ id: 'review-id' }));

      await assert.rejects(() => service.delete('review-id', { id: 'user-id', isAdmin: false }), {
        name: 'ForbiddenException',
      });
    });

    it('should delete review and log the action if user is an admin', async () => {
      const reviewToDelete = {
        id: 'review-id',
        comment: 'A very long comment that should be truncated in logs',
      };
      mockRepo.findOne = mock.fn(async () => reviewToDelete);

      const logSpy = mock.fn(async (..._args: any[]) => {});
      mockLogsService.log = logSpy;

      await assert.doesNotReject(() =>
        service.delete('review-id', { id: 'admin-id', isAdmin: true }),
      );
      assert.strictEqual(logSpy.mock.calls.length, 1);
      assert.strictEqual(logSpy.mock.calls[0].arguments[0], LogAction.DELETE);
      assert.strictEqual(logSpy.mock.calls[0].arguments[1], LogEntity.REVIEW);
      assert.strictEqual(logSpy.mock.calls[0].arguments[2], 'review-id');
      assert.strictEqual(logSpy.mock.calls[0].arguments[3], 'admin-id');
      assert.strictEqual(
        logSpy.mock.calls[0].arguments[4].comment,
        reviewToDelete.comment.substring(0, 50),
      );
    });
  });
});
