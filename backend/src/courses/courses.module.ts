// courses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, CourseCredit, CourseFaq]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}