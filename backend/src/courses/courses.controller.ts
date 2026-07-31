import { Controller, Get } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';

@Controller('courses')
export class CoursesController {
  // NestJS's dependency injection: because CoursesService has @Injectable()
  // and is listed in CoursesModule's providers, Nest automatically creates
  // an instance of it and hands it to us here — we don't call `new
  // CoursesService()` ourselves anywhere.
  constructor(private readonly coursesService: CoursesService) {}

  // @Get() with no argument, combined with @Controller('courses') above,
  // means this method handles GET requests to /courses.
  @Get()
  findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }
}