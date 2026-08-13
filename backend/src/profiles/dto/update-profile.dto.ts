import { IsIn } from 'class-validator';

// #107 — deliberately the same three categories courses already use
// (Course.category / CreateCourseDto's CATEGORIES), so a learner's "goal"
// is really "which track they're here for" and ties into something real
// elsewhere in the app, rather than being a free-text field with no
// bearing on anything.
const GOALS = ['Technical', 'Business', 'Leadership'];

export class UpdateProfileDto {
  @IsIn(GOALS)
  goal: string;
}
