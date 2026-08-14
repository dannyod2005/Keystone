import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireCourseOwnerGuard } from './require-course-owner.guard';
import { ModulesModule } from '../modules/modules.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, CourseCredit, CourseFaq, Profile]),
    ModulesModule,
    // #228 — reuses EnrollmentsService.getReviewsForCourse for
    // GET /courses/:id/reviews, same pattern as the ModulesModule import
    // above (#82).
    EnrollmentsModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService, RequireTrainerGuard, RequireCourseOwnerGuard],
})
export class CoursesModule {}