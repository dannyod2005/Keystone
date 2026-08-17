import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { CourseModule } from '../courses/entities/course-module.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizOption } from '../quiz/entities/quiz-option.entity';
import { QuizSubmission } from '../quiz/entities/quiz-submission.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ModuleNote } from '../notes/entities/module-note.entity';
import { ForumPost } from '../forum/entities/forum-post.entity';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { ActivityModule } from '../activity/activity.module';
import { BadgesModule } from '../badges/badges.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseModule,
      QuizQuestion,
      QuizOption,
      QuizSubmission,
      Profile,
      ModuleNote,
      ForumPost,
    ]),
    ActivityModule,
    // #225 — reuses BadgesService.evaluateQuizSubmission/evaluateForumPost
    // from submitQuiz/createPost below.
    BadgesModule,
    // #229 — reuses NotificationsService.createForReply from createPost
    // below, same cross-module pattern as BadgesModule above.
    NotificationsModule,
  ],
  controllers: [ModulesController],
  providers: [ModulesService, RequireTrainerGuard],
  // Exported so CoursesModule can inject it for GET /courses/:id/quiz-results
  // (#82) — same cross-module pattern already used for ActivityModule.
  exports: [ModulesService],
})
export class ModulesModule {}
