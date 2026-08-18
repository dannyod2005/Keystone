import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  function baseFields(overrides: Partial<Notification> = {}): Notification {
    return {
      id: 'n1',
      recipient: { id: 'user-1' },
      actor: { id: 'user-2', name: 'Actor Name' },
      type: 'forum_reply',
      forumPost: null,
      badgeKey: null,
      course: null,
      read: false,
      createdAt: new Date('2026-08-01T00:00:00Z'),
      ...overrides,
    } as Notification;
  }

  describe('findAllForUser', () => {
    it('maps a well-formed forum_reply notification to its full response shape', async () => {
      const n = baseFields({
        type: 'forum_reply',
        forumPost: {
          content: 'A reply with some content',
          module: {
            id: 'm1',
            title: 'Module One',
            course: { id: 'c1', title: 'Course One' },
          },
        },
      } as Partial<Notification>);
      mockRepo.find.mockResolvedValue([n]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'n1',
          courseId: 'c1',
          courseTitle: 'Course One',
          moduleId: 'm1',
          moduleTitle: 'Module One',
          excerpt: 'A reply with some content',
        }),
      ]);
    });

    it('maps a well-formed course_completed notification to its full response shape', async () => {
      const n = baseFields({
        type: 'course_completed',
        course: { id: 'c2', title: 'Course Two' },
      } as Partial<Notification>);
      mockRepo.find.mockResolvedValue([n]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'n1',
          courseId: 'c2',
          courseTitle: 'Course Two',
        }),
      ]);
    });

    it('maps a well-formed badge_earned notification, falling back for a retired badge key', async () => {
      const n = baseFields({
        type: 'badge_earned',
        badgeKey: 'not-a-real-badge-key',
      });
      mockRepo.find.mockResolvedValue([n]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'n1',
          badgeLabel: 'New badge',
          badgeDescription: '',
        }),
      ]);
    });

    // #278 — the core regression this file exists for: a single malformed
    // row must never take the whole list down.
    it('drops a forum_reply row with a missing forumPost relation instead of throwing, keeping other rows', async () => {
      const bad = baseFields({
        id: 'bad',
        type: 'forum_reply',
        forumPost: null,
      });
      const good = baseFields({
        id: 'good',
        type: 'course_completed',
        course: { id: 'c3', title: 'Course Three' },
      } as Partial<Notification>);
      mockRepo.find.mockResolvedValue([bad, good]);

      const result = await service.findAllForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'good', courseId: 'c3' }),
      );
    });

    it('drops a course_completed row with a missing course relation instead of throwing', async () => {
      const bad = baseFields({
        id: 'bad',
        type: 'course_completed',
        course: null,
      });
      mockRepo.find.mockResolvedValue([bad]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([]);
    });

    it('drops a row with an unrecognized type value instead of throwing', async () => {
      const bad = baseFields({
        id: 'bad',
        type: 'not_a_real_type' as Notification['type'],
      });
      mockRepo.find.mockResolvedValue([bad]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('markRead', () => {
    it('throws NotFoundException when the notification does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.markRead('user-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the notification belongs to someone else', async () => {
      mockRepo.findOne.mockResolvedValue(
        baseFields({
          recipient: { id: 'someone-else' },
        } as Partial<Notification>),
      );

      await expect(service.markRead('user-1', 'n1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('marks the notification read and returns its full response shape when well-formed', async () => {
      const n = baseFields({
        type: 'course_completed',
        course: { id: 'c4', title: 'Course Four' },
        read: false,
      } as Partial<Notification>);
      mockRepo.findOne.mockResolvedValue(n);
      mockRepo.save.mockResolvedValue(n);

      const result = await service.markRead('user-1', 'n1');

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ id: 'n1', courseId: 'c4', read: true }),
      );
    });

    // #278 — marking read is a side effect on the row itself; it must
    // succeed even if that row's payload relation is malformed.
    it('still marks a malformed notification read, falling back to base fields instead of throwing', async () => {
      const n = baseFields({
        type: 'course_completed',
        course: null,
        read: false,
      });
      mockRepo.findOne.mockResolvedValue(n);
      mockRepo.save.mockResolvedValue(n);

      const result = await service.markRead('user-1', 'n1');

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'n1',
        read: true,
        createdAt: n.createdAt,
        type: 'course_completed',
        actorName: 'Actor Name',
      });
    });
  });
});
