import { CreateLearningPathDto } from './create-learning-path.dto';

// PUT is a full submission of path state (title/description + the complete
// ordered courseIds list, reorders included), same shape as create — hence
// extending rather than duplicating, matching UpdateCourseDto's convention.
export class UpdateLearningPathDto extends CreateLearningPathDto {}
