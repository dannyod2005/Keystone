import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from './entities/enrollment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { ActivityModule } from '../activity/activity.module';
import { ModulesModule } from '../modules/modules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Profile, Course]),
    ActivityModule,
    // #205 — reuses ModulesService.getQuizResultsForCourse to validate
    // quiz completion server-side, same cross-module pattern CoursesModule
    // already uses this export for (GET /courses/:id/quiz-results, #82).
    ModulesModule,
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  // #228 — CoursesModule reuses getReviewsForCourse for the public
  // GET /courses/:id/reviews endpoint, same cross-module pattern
  // ModulesModule already uses (see #205/#82).
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}