import { CreateCourseDto } from './create-course.dto';

// PUT is a full submission of course state (with per-item ids to support
// the diff-based update in CoursesService.update), so it shares the exact
// same required fields and shape as create — hence extending rather than
// duplicating.
export class UpdateCourseDto extends CreateCourseDto {}
