import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepo: Repository<Enrollment>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
  ) {}

  async create(userId: string, dto: CreateEnrollmentDto): Promise<Enrollment> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const course = await this.coursesRepo.findOne({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException(`Course with id "${dto.courseId}" not found`);
    }

    const enrollment = this.enrollmentsRepo.create({
      user: profile,
      course,
    });

    try {
      return await this.enrollmentsRepo.save(enrollment);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as any).code === '23505'
      ) {
        throw new ConflictException('Already enrolled in this course');
      }
      throw err;
    }
  }

  async findAllForUser(userId: string): Promise<EnrollmentResponseDto[]> {
    // Only load the course relation to read its id — no need to pull
    // the full nested course object, since the frontend already fetches
    // all courses separately via GET /courses and joins client-side
    // (same pattern the old ENROLLED_DEFAULT mock used).
    const enrollments = await this.enrollmentsRepo.find({
      where: { user: { id: userId } },
      relations: { course: true },
      order: { createdAt: 'DESC' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      courseId: e.course.id,
      progress: e.progress,
      status: e.status,
      lastAccessed: e.lastAccessed,
      createdAt: e.createdAt,
    }));
  }
}