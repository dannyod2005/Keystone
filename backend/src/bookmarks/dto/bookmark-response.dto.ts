// #230 — deliberately minimal, same reasoning as EnrollmentResponseDto's
// courseId (not the full nested course): the frontend already holds the
// full course list separately (GET /courses) and looks courses up by id
// for enrolled/skills display on the Dashboard — bookmarks reuse that same
// courses.find(...) pattern rather than duplicating course data here.
export class BookmarkResponseDto {
  id: string;
  courseId: string;
  createdAt: Date;
}
