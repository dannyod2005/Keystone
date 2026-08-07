import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

// One row per real learning action (module completed, quiz submitted,
// note saved, forum post made) — see #37. There is no session
// heartbeat/timer; `minutes` is a weighted estimate assigned by whichever
// service logs the event, not a measured duration.
@Entity('activity_events')
export class ActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  // 'module_complete' | 'quiz_submit' | 'note_save' | 'forum_post'.
  // Server-side only — not exposed to the client, just useful for
  // debugging/analytics later.
  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'int' })
  minutes: number;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
