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

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, CourseCredit, CourseFaq, Profile]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, RequireTrainerGuard],
})
export class CoursesModule {}