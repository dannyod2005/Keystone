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

// #229 — v1 is forum-reply notifications only, so this is deliberately not
// a generic polymorphic "notification type + payload" table: it always
// points at a specific ForumPost (the reply), and the recipient/actor are
// always Profiles. If a second notification type is ever added, this is
// the point where it'd be worth generalizing — not before, per the
// codebase's general "build for what exists" pattern (see e.g. Course.skills
// choosing a plain column over a join table for the same reason).
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The original post's author — who this notification is for.
  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'recipient_id' })
  recipient: Profile;

  // Whoever posted the reply. Never equal to recipient — creation is
  // skipped entirely for a self-reply (see ModulesService.createPost).
  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'actor_id' })
  actor: Profile;

  // The reply post itself (not the original post being replied to) — its
  // module/course relations are what a click-through navigates to, and its
  // content is what the notification excerpt is drawn from.
  @ManyToOne(() => ForumPost, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'forum_post_id' })
  forumPost: ForumPost;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
