import { Injectable } from '@nestjs/common';
import { Course } from './entities/course.entity';
import { MOCK_COURSES } from './mock-courses.data';

@Injectable()
export class CoursesService {
  // TEMPORARY: returns hardcoded data. Once TypeORM is connected, this
  // becomes something like:
  //   constructor(
  //     @InjectRepository(Course) private coursesRepo: Repository<Course>,
  //   ) {}
  //   findAll(): Promise<Course[]> {
  //     return this.coursesRepo.find();
  //   }
  // The method signature (returns Promise<Course[]>) is already written to
  // match that future shape, so the controller below won't need to change
  // at all when the database is wired up.
  findAll(): Promise<Course[]> {
    return Promise.resolve(MOCK_COURSES);
  }
}