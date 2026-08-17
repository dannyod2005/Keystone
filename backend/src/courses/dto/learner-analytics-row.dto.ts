// #227 — one row per enrolled learner, for the trainer analytics table.
export class LearnerAnalyticsFlagsDto {
  // Hasn't opened the course in INACTIVITY_THRESHOLD_DAYS (see
  // CourseAnalyticsService) — never true for a completed enrollment.
  inactive: boolean;
  // Current progress is meaningfully below where a learner following their
  // own daily-goal pace should be by now — see CourseAnalyticsService for
  // the exact math. Never true for a completed enrollment.
  behindPace: boolean;
}

export class LearnerAnalyticsRowDto {
  enrollmentId: string;
  userId: string;
  name: string;
  progressPct: number; // 0-100, rounded
  status: string; // 'in-progress' | 'complete'
  lastAccessed: Date | null;
  enrolledAt: Date;
  // null when this learner has never submitted a quiz for this course.
  quizAverageScorePct: number | null;
  flags: LearnerAnalyticsFlagsDto;
}
