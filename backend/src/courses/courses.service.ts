import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
  ) {}

  findAll(): Promise<Course[]> {
    return this.coursesRepo.find({
      relations: { modules: true, credits: true, faqs: true },
      order: {
        modules: { position: 'ASC' },
        credits: { position: 'ASC' },
        faqs: { position: 'ASC' },
      },
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({
      where: { id },
      relations: { modules: true, credits: true, faqs: true },
      order: {
        modules: { position: 'ASC' },
        credits: { position: 'ASC' },
        faqs: { position: 'ASC' },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id "${id}" not found`);
    }

    return course;
  }
}