// #259 — a shallow cross-course rollup for a trainer's "home" view, sitting
// one layer above CourseAnalyticsDto's per-course depth (see that file):
// this counts things, it doesn't profile individual learners.
export class TrainerOverviewDto {
  totalCourses: number;
  totalPaths: number;
  // Distinct learners across every course this trainer owns or shares via
  // their provider — not a sum of each course's enrollmentCount, which
  // would double-count a learner enrolled in more than one of them.
  totalStudents: number;
  // 1 for a solo trainer with no provider (they're their own team of one),
  // otherwise the provider's full member count including the owner.
  teamSize: number;
}
