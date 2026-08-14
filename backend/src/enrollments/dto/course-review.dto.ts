// #228 — one entry per enrollment that has actual review text, for
// GET /courses/:id/reviews (CourseDetailModal's reviews list). Deliberately
// not the full EnrollmentResponseDto shape: this is a public,
// course-scoped list shown to anyone browsing the catalogue (enrolled or
// not), so it only carries what's safe/relevant to show — the reviewer's
// display name, their rating, the review text, and when the enrollment was
// created. No enrollment id, progress, or course snapshot.
export class CourseReviewDto {
  authorName: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
}
