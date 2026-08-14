import { LearnerAnalyticsRowDto } from './learner-analytics-row.dto';

export class CourseAnalyticsDto {
  enrollmentCount: number;
  averageCompletionPct: number; // 0-100, rounded; 0 when enrollmentCount is 0
  // null when nobody enrolled in this course has ever submitted a quiz —
  // distinct from 0%, which would understate a course with quizzes nobody
  // has attempted yet.
  averageQuizScorePct: number | null;
  learners: LearnerAnalyticsRowDto[];
}
