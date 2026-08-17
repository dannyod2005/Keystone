// #229 — flattens Notification -> ForumPost -> CourseModule -> Course into
// a single response shape so the frontend never has to walk the relation
// chain itself, same convention as LearningPathResponseDto flattening the
// path->pathCourses->course join. courseId/moduleId are what the topbar's
// click-through navigates to; courseTitle/moduleTitle/excerpt are purely
// for display.
export class NotificationResponseDto {
  id: string;
  read: boolean;
  createdAt: Date;
  actorName: string;
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  excerpt: string;
}
