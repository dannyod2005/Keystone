import {
  ConflictException,
  ForbiddenException,
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
import { UpdateProgressDto } from './dto/update-progress.dto';

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

  async updateProgress(
    userId: string,
    enrollmentId: string,
    dto: UpdateProgressDto,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentsRepo.findOne({
      where: { id: enrollmentId },
      relations: { user: true, course: { modules: true } },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with id "${enrollmentId}" not found`);
    }

    // Ownership check: a user can only update their own enrollment. Never
    // trust that the client only ever sends its own enrollment id —
    // verify against the token-derived userId, same principle as create().
    if (enrollment.user.id !== userId) {
      throw new ForbiddenException('This enrollment does not belong to you');
    }

    const totalModules = enrollment.course.modules.length;
    // Clamp: a client sending a stale/bad value shouldn't be able to push
    // completedModules past the real module count.
    const completedModules = Math.min(dto.completedModules, totalModules);

    enrollment.progress = totalModules > 0 ? completedModules / totalModules : 0;
    enrollment.status = completedModules >= totalModules && totalModules > 0
      ? 'complete'
      : 'in-progress';
    enrollment.lastAccessed = new Date();

    const saved = await this.enrollmentsRepo.save(enrollment);

    return {
      id: saved.id,
      courseId: enrollment.course.id,
      progress: saved.progress,
      status: saved.status,
      lastAccessed: saved.lastAccessed,
      createdAt: saved.createdAt,
    };
  }
}