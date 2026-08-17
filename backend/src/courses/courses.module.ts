import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseAnalyticsService } from './course-analytics.service';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizSubmission } from '../quiz/entities/quiz-submission.entity';
import { LearningPath } from '../learning-paths/entities/learning-path.entity';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireCourseOwnerGuard } from './require-course-owner.guard';
import { ModulesModule } from '../modules/modules.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    // #227 — Enrollment/QuizQuestion/QuizSubmission registered here too
    // (each already registered in their own owning module) so
    // CourseAnalyticsService can inject their repositories directly — the
    // same cross-module entity-registration pattern EnrollmentsModule
    // already uses for the Course entity.
    TypeOrmModule.forFeature([
      Course,
      CourseModule,
      CourseCredit,
      CourseFaq,
      Profile,
      Enrollment,
      QuizQuestion,
      QuizSubmission,
      // #259 — registered directly here (not via LearningPathsModule,
      // which doesn't export its service) so CourseAnalyticsService can
      // read LearningPath rows for the trainer-overview rollup, same
      // cross-module direct-registration pattern LearningPathsModule
      // already uses for the Course entity above.
      LearningPath,
    ]),
    ModulesModule,
    // #228 — reuses EnrollmentsService.getReviewsForCourse for
    // GET /courses/:id/reviews, same pattern as the ModulesModule import
    // above (#82).
    EnrollmentsModule,
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CourseAnalyticsService,
    RequireTrainerGuard,
    RequireCourseOwnerGuard,
  ],
})
export class CoursesModule {}
