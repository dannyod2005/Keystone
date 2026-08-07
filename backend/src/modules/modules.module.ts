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
  ],
  controllers: [ModulesController],
  providers: [ModulesService, RequireTrainerGuard],
})
export class ModulesModule {}