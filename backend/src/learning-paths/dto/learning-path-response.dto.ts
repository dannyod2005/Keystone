import { Course } from '../../courses/entities/course.entity';

// #224 — flattens the LearningPath -> LearningPathCourse -> Course chain
// into a plain, position-ordered `courses` array so the frontend never has
// to deal with the join-table shape. No dedicated per-course DTO here: the
// full Course entity is already what CoursesController's GET routes return
// directly (no response DTO there either), so re-using it keeps the shape
// identical to what the frontend already renders for a standalone course.
export class LearningPathResponseDto {
  id: string;
  title: string;
  description: string | null;
  ownerId: string | null;
  providerId: string | null;
  courses: Course[];
  createdAt: Date;
}
