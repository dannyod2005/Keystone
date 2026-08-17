import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LearningPathCourse } from './learning-path-course.entity';

// #224 — bundles existing Courses into an ordered, guided sequence. Deliberately
// no new course-authoring here: a path only ever references Courses that
// already exist (see LearningPathCourse), it never owns module/quiz content
// itself. ownerId/providerId follow the exact same pattern as Course
// (see that entity's comments) — a trainer/provider-scoped resource, nullable
// only for a hypothetical legacy/unowned row (none exist at launch, but kept
// nullable for consistency with Course rather than assuming that can never
// happen).
@Entity('learning_paths')
export class LearningPath {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Plain column, not @DeleteDateColumn — same reasoning as Course.deletedAt:
  // TypeORM's built-in soft-delete would auto-filter this out of a learner's
  // already-enrolled path lookups. Filtering is applied explicitly in
  // LearningPathsService, only where it belongs.
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId: string | null;

  @OneToMany(() => LearningPathCourse, (pc) => pc.learningPath, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  pathCourses: LearningPathCourse[];
}
