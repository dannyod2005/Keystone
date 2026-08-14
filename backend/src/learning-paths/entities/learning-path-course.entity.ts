import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { LearningPath } from './learning-path.entity';
import { Course } from '../../courses/entities/course.entity';

// #224 — the ordered join between a LearningPath and an existing Course,
// modeled directly on CourseModule (course.entity.ts's ordered-child
// pattern): a plain int `position`, unique per parent, always re-derived
// from array order server-side rather than trusted from the client (see
// LearningPathsService). Unlike CourseModule, nothing else ever references
// a LearningPathCourse row's own id (no quiz-style child-of-a-child), so
// LearningPathsService.update() can safely replace the whole set on every
// edit instead of the diff/merge dance CoursesService.update() needs for
// modules/credits/faqs.
@Entity('learning_path_courses')
@Unique(['learningPath', 'position'])
export class LearningPathCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LearningPath, (p) => p.pathCourses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'learning_path_id' })
  learningPath: LearningPath;

  @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int' })
  position: number;
}
