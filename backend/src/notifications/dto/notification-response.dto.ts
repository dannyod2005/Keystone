import { NotificationType } from '../entities/notification.entity';

// #229/#257 — flattens whichever relation chain a given notification type
// actually populates into one shape, same convention as
// LearningPathResponseDto flattening path->pathCourses->course. Every
// field below is optional except the always-present base ones (id, read,
// createdAt, type, actorName) — which of the type-specific fields are set
// depends entirely on `type`, mirroring the entity's own one-column-per-
// type + CHECK-constraint shape. courseId/moduleId (forum_reply) and
// courseId (course_completed) are what the topbar's click-through
// navigates to; everything else is purely for display.
export class NotificationResponseDto {
  id: string;
  read: boolean;
  createdAt: Date;
  type: NotificationType;
  actorName: string;

  // forum_reply
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  excerpt?: string;

  // badge_earned
  badgeLabel?: string;
  badgeDescription?: string;
}
