import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { CourseModule } from '../../courses/entities/course-module.entity';

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

  // 'module_complete' | 'quiz_submit' | 'note_save' | 'forum_post' |
  // 'module_view'. Server-side only — not exposed to the client, just
  // useful for debugging/analytics later.
  @Column({ type: 'text' })
  source: string;

  @Column({ type: 'int' })
  minutes: number;

  // #124 — which module this event is about, when relevant. Only actually
  // populated for 'module_view' and 'module_complete' (used to work out
  // which distinct days a module was engaged with, to split completion
  // minutes across them — see ActivityService.logModuleCompletion).
  // Nullable: 'quiz_submit'/'note_save'/'forum_post' don't set it, and an
  // older event predating this column won't have it either.
  @ManyToOne(() => CourseModule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule | null;

  // #124 — normally the moment the event is logged (DB default now()),
  // but logModuleCompletion explicitly backdates this to the day a
  // module was actually viewed, rather than always today. TypeORM only
  // auto-fills this when it's left undefined at insert time, so an
  // explicit assignment beforehand (see ActivityService.logEvent) takes
  // precedence over the column default.
  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
