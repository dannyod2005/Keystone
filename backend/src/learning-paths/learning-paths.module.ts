import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { LearningPathEnrollmentsController } from './learning-path-enrollments.controller';
import { LearningPathEnrollmentsService } from './learning-path-enrollments.service';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathCourse } from './entities/learning-path-course.entity';
import { LearningPathEnrollment } from './entities/learning-path-enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireLearningPathOwnerGuard } from './require-learning-path-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathCourse,
      LearningPathEnrollment,
      Course,
      Profile,
      Enrollment,
    ]),
    // #224 — reuses EnrollmentsService.create to cascade-enroll a learner
    // into a path's constituent courses on path enrollment, same
    // cross-module reuse pattern CoursesModule already uses this module's
    // export for (getReviewsForCourse, #228).
    EnrollmentsModule,
  ],
  controllers: [LearningPathsController, LearningPathEnrollmentsController],
  providers: [
    LearningPathsService,
    LearningPathEnrollmentsService,
    RequireTrainerGuard,
    RequireLearningPathOwnerGuard,
  ],
})
export class LearningPathsModule {}
