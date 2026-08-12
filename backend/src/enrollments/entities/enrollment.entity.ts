import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('enrollments')
@Unique(['user', 'course'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'decimal', default: 0 })
  progress: number;

  @Column({ type: 'text', default: 'in-progress' })
  status: string; // in-progress | complete

  @Column({ name: 'last_accessed', type: 'timestamp', nullable: true })
  lastAccessed: Date | null;

  // #106 — the learner's own 1-5 star rating for this course, submitted
  // after completion (see EnrollmentsService.submitRating). Null until
  // rated; re-submitting just updates this same column, since an
  // enrollment is already unique per (user, course) — no separate
  // ratings table needed. Deliberately not aggregated back into
  // Course.rating/learners — see the migration comment.
  @Column({ type: 'smallint', nullable: true })
  rating: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}