// #224 — a slim embedded course snapshot (id/title only), same "own
// courses.find(...) lookup can't be trusted for a resource that might
// later be soft-deleted" reasoning as EnrolledCourseDto, but even slimmer
// since the dashboard only needs enough to link back to each course, not
// its full module list.
export class LearningPathEnrolledCourseDto {
  id: string;
  title: string;
}

export class LearningPathEnrollmentResponseDto {
  id: string;
  pathId: string;
  title: string;
  description: string | null;
  courses: LearningPathEnrolledCourseDto[];
  // #224 — completedCount/totalCount/status are all computed live from the
  // learner's Enrollment rows against this path's constituent courses on
  // every read, never stored — see LearningPathEnrollment's entity comment.
  completedCount: number;
  totalCount: number;
  status: string; // 'in-progress' | 'complete'
  createdAt: Date;
}
