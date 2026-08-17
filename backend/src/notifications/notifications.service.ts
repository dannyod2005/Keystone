import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ForumPost } from '../forum/entities/forum-post.entity';
import { Course } from '../courses/entities/course.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { BADGE_DEFINITIONS_BY_KEY } from '../badges/badge-definitions';

const EXCERPT_MAX_LENGTH = 120;

// #229 — how many notifications the topbar shows. Not paginated in v1:
// a learner's reply-notification volume is inherently bounded (one per
// reply to one of their posts), so a flat recent-N cap is enough without
// needing real pagination yet.
const NOTIFICATION_LIST_LIMIT = 50;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  // #229 — takes already-loaded entities rather than ids: ModulesService.
  // createPost already has `profile` (the replier/actor) and the parent
  // post's `user` (the recipient) in hand from the lookups it already had
  // to do to validate/save the reply itself, so re-fetching them here
  // would just be redundant round trips.
  async createForReply(
    recipient: Profile,
    actor: Profile,
    forumPost: ForumPost,
  ): Promise<void> {
    const notification = this.notificationsRepo.create({
      recipient,
      actor,
      type: 'forum_reply',
      forumPost,
    });
    await this.notificationsRepo.save(notification);
  }

  // #257 — called from BadgesService.award, but only past the point where
  // that method has already confirmed this is a genuine new insert (its
  // 23505-caught idempotent-no-op branch returns before ever reaching
  // this call) — so this fires exactly once per learner per badge, same
  // guarantee award() already gives user_badges itself. Takes a bare
  // userId rather than a loaded Profile: award() only ever has the id in
  // hand (it's generic across every evaluate* caller, none of which pass
  // it a full Profile), and a partial `{ id }` reference is enough for
  // TypeORM to write the FK on both recipient and actor — no extra query
  // needed just to satisfy the relation's TypeScript type.
  async createForBadge(recipientId: string, badgeKey: string): Promise<void> {
    const notification = this.notificationsRepo.create({
      recipient: { id: recipientId } as Profile,
      actor: { id: recipientId } as Profile,
      type: 'badge_earned',
      badgeKey,
    });
    await this.notificationsRepo.save(notification);
  }

  // #257 — called from EnrollmentsService.updateProgress right after an
  // enrollment's status transitions to 'complete', which already has both
  // the learner's Profile (`enrollment.user`) and the just-completed
  // Course loaded from the query it needed for the completion check
  // itself — passed as already-loaded entities here rather than ids, same
  // reasoning as createForReply above.
  async createForCourseCompletion(
    recipient: Profile,
    course: Course,
  ): Promise<void> {
    const notification = this.notificationsRepo.create({
      recipient,
      actor: recipient,
      type: 'course_completed',
      course,
    });
    await this.notificationsRepo.save(notification);
  }

  async findAllForUser(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepo.find({
      where: { recipient: { id: userId } },
      relations: {
        actor: true,
        forumPost: { module: { course: true } },
        course: true,
      },
      order: { createdAt: 'DESC' },
      take: NOTIFICATION_LIST_LIMIT,
    });

    return notifications.map((n) => this.toResponseDto(n));
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepo.findOne({
      where: { id: notificationId },
      relations: {
        recipient: true,
        actor: true,
        forumPost: { module: { course: true } },
        course: true,
      },
    });
    if (!notification) {
      throw new NotFoundException(
        `Notification with id "${notificationId}" not found`,
      );
    }
    // Ownership check: a user can only mark their own notifications read —
    // never trust that the client only ever sends its own notification id,
    // same principle as EnrollmentsService.updateProgress.
    if (notification.recipient.id !== userId) {
      throw new ForbiddenException('This notification does not belong to you');
    }

    if (!notification.read) {
      notification.read = true;
      await this.notificationsRepo.save(notification);
    }

    return this.toResponseDto(notification);
  }

  // #257 — branches on `type` rather than just checking which relation
  // happens to be populated: the migration's CHK_notifications_type_payload
  // constraint already guarantees the two never disagree, so `type` is
  // the one honest source of truth to switch on. The non-null assertions
  // below (forumPost!, course!, badgeKey!) are safe for exactly the same
  // reason — Postgres itself won't allow a row where they'd be wrong.
  private toResponseDto(n: Notification): NotificationResponseDto {
    const base = {
      id: n.id,
      read: n.read,
      createdAt: n.createdAt,
      type: n.type,
      actorName: n.actor.name || 'Keystone Learner',
    };

    if (n.type === 'forum_reply') {
      const course = n.forumPost!.module.course;
      const content = n.forumPost!.content;
      return {
        ...base,
        courseId: course.id,
        courseTitle: course.title,
        moduleId: n.forumPost!.module.id,
        moduleTitle: n.forumPost!.module.title,
        excerpt:
          content.length > EXCERPT_MAX_LENGTH
            ? `${content.slice(0, EXCERPT_MAX_LENGTH)}…`
            : content,
      };
    }

    if (n.type === 'badge_earned') {
      const def = BADGE_DEFINITIONS_BY_KEY.get(n.badgeKey!);
      return {
        ...base,
        // Same "definition retired since it was earned" fallback as
        // BadgesService.getBadgesForUser, just surfaced instead of
        // dropped — a notification (unlike the badges list) has no
        // reasonable way to just omit itself.
        badgeLabel: def?.label ?? 'New badge',
        badgeDescription: def?.description ?? '',
      };
    }

    // course_completed
    return {
      ...base,
      courseId: n.course!.id,
      courseTitle: n.course!.title,
    };
  }
}
