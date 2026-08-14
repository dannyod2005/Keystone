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
import { NotificationResponseDto } from './dto/notification-response.dto';

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
      forumPost,
    });
    await this.notificationsRepo.save(notification);
  }

  async findAllForUser(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepo.find({
      where: { recipient: { id: userId } },
      relations: { actor: true, forumPost: { module: { course: true } } },
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

  private toResponseDto(n: Notification): NotificationResponseDto {
    const course = n.forumPost.module.course;
    const content = n.forumPost.content;
    return {
      id: n.id,
      read: n.read,
      createdAt: n.createdAt,
      actorName: n.actor.name || 'Keystone Learner',
      courseId: course.id,
      courseTitle: course.title,
      moduleId: n.forumPost.module.id,
      moduleTitle: n.forumPost.module.title,
      excerpt:
        content.length > EXCERPT_MAX_LENGTH
          ? `${content.slice(0, EXCERPT_MAX_LENGTH)}…`
          : content,
    };
  }
}
