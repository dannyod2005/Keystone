export class EnrolledCourseModuleDto {
  id: string;
  position: number;
  title: string;
  videoUrl: string | null;
}

// A snapshot of the course as embedded on an enrollment — NOT the same
// object as the catalogue's Course. The catalogue (GET /courses) excludes
// soft-deleted courses (#41), but a learner's own enrollment must keep
// working regardless: this embed is how the frontend still has a course
// to render on the dashboard and learning screen after a trainer deletes
// it out from under them. Deliberately a small subset of fields — just
// what the learner-facing screens need, not the full catalogue shape
// (no credits/faqs/rating/learners, which only the pre-enrollment
// browsing views use).
export class EnrolledCourseDto {
  id: string;
  title: string;
  modules: EnrolledCourseModuleDto[];
}

export class EnrollmentResponseDto {
  id: string;
  courseId: string;
  progress: number;
  status: string;
  lastAccessed: Date | null;
  createdAt: Date;
  course: EnrolledCourseDto;
  // #106 — this learner's own submitted rating for this course, or null
  // if they haven't rated it (yet, or their status isn't 'complete' yet).
  rating: number | null;
}