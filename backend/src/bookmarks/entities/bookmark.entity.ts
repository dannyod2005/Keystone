import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Course } from '../../courses/entities/course.entity';

// #230 — a learner "saving" a course without enrolling in it. Deliberately
// a thin join table, same shape as Enrollment minus progress/status/rating
// (a bookmark carries no state of its own beyond "this learner flagged
// this course"). Unique(user, course) so bookmarking is naturally
// idempotent at the DB level, same as Enrollment.
@Entity('bookmarks')
@Unique(['user', 'course'])
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
