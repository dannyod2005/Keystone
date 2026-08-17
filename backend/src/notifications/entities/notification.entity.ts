import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { ForumPost } from '../../forum/entities/forum-post.entity';
import { Course } from '../../courses/entities/course.entity';

// #257 — generalized from #229's forum-reply-only table (see that turn's
// entity comment for why it started deliberately narrow). Each type owns
// exactly one nullable payload column below; the migration's
// CHK_notifications_type_payload constraint enforces that "type" and
// "which payload column is populated" never drift apart, so a bad insert
// fails loudly in Postgres rather than silently producing a notification
// with no way to render itself. See NotificationsService for how each
// type is created and NotificationResponseDto/toResponseDto for how each
// is flattened for the frontend.
export type NotificationType =
  'forum_reply' | 'badge_earned' | 'course_completed';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who this notification is for. For a self-triggered type (badge_earned,
  // course_completed) this is the same Profile as `actor` — there's no
  // other user involved, but every notification still has both fields set
  // rather than making actor nullable just for these two cases.
  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: Profile;

  // Whoever/whatever caused this. For forum_reply, the replier (never
  // equal to recipient — see ModulesService.createPost's self-reply skip).
  // For badge_earned/course_completed, the same Profile as `recipient`.
  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'actor_id' })
  actor: Profile;

  @Column({ type: 'text' })
  type: NotificationType;

  // forum_reply only — the reply post itself (not the original post being
  // replied to). Its module/course relations are what a click-through
  // navigates to, and its content is what the notification excerpt is
  // drawn from.
  @ManyToOne(() => ForumPost, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'forum_post_id' })
  forumPost: ForumPost | null;

  // badge_earned only — matched against BADGE_DEFINITIONS_BY_KEY at read
  // time, same "plain string, not a foreign key" reasoning as
  // UserBadge.badgeKey (see that entity's comment) — the definition set
  // is fixed application code, not data.
  @Column({ name: 'badge_key', type: 'text', nullable: true })
  badgeKey: string | null;

  // course_completed only — the course the learner just finished.
  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'course_id' })
  course: Course | null;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
