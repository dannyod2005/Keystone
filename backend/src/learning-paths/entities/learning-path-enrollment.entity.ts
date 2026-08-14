import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { LearningPath } from './learning-path.entity';

// #224 — deliberately carries no progress/status columns of its own. A
// path's "X of Y courses complete" is always computed live by
// LearningPathEnrollmentsService, cross-referencing this row's
// (user, learningPath) against the learner's own Enrollment rows for the
// path's constituent courses — never duplicated/cached here. That avoids a
// second source of truth that would need its own sync trigger (the way
// BadgesService listens for enrollment-completion events) for something
// that's cheap to recompute on every read anyway, since displaying a path's
// progress already requires loading its constituent courses regardless.
@Entity('learning_path_enrollments')
@Unique(['user', 'learningPath'])
export class LearningPathEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ManyToOne(() => LearningPath, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'learning_path_id' })
  learningPath: LearningPath;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
