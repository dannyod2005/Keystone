import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, QueryFailedError, Repository } from 'typeorm';
import { LearningPathEnrollment } from './entities/learning-path-enrollment.entity';
import { LearningPath } from './entities/learning-path.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateLearningPathEnrollmentDto } from './dto/create-learning-path-enrollment.dto';
import { LearningPathEnrollmentResponseDto } from './dto/learning-path-enrollment-response.dto';

@Injectable()
export class LearningPathEnrollmentsService {
  constructor(
    @InjectRepository(LearningPathEnrollment)
    private readonly pathEnrollmentsRepo: Repository<LearningPathEnrollment>,
    @InjectRepository(LearningPath)
    private readonly pathsRepo: Repository<LearningPath>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepo: Repository<Enrollment>,
    // #224 — reuses EnrollmentsService.create to cascade-enroll the learner
    // in each of the path's constituent courses, same cross-module pattern
    // CoursesModule already uses for getReviewsForCourse (#228).
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async create(
    userId: string,
    dto: CreateLearningPathEnrollmentDto,
  ): Promise<LearningPathEnrollmentResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const path = await this.pathsRepo.findOne({
      where: { id: dto.pathId, deletedAt: IsNull() },
      relations: { pathCourses: { course: true } },
      order: { pathCourses: { position: 'ASC' } },
    });
    if (!path) {
      throw new NotFoundException(
        `Learning path with id "${dto.pathId}" not found`,
      );
    }

    const pathEnrollment = this.pathEnrollmentsRepo.create({
      user: profile,
      learningPath: path,
    });

    try {
      await this.pathEnrollmentsRepo.save(pathEnrollment);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Already enrolled in this learning path');
      }
      throw err;
    }

    // #224 — enrolling in a path also enrolls the learner in each of its
    // constituent courses, so path progress rides on the exact same
    // Enrollment rows/updateProgress flow a standalone course enrollment
    // already uses — no second progress-tracking mechanism to keep in sync.
    // A learner may already be individually enrolled in one of these
    // courses (e.g. started it before this path existed, or via another
    // overlapping path) — EnrollmentsService.create throws ConflictException
    // for that case, which is a no-op here, not an error.
    for (const pc of path.pathCourses) {
      try {
        await this.enrollmentsService.create(userId, {
          courseId: pc.course.id,
        });
      } catch (err) {
        if (!(err instanceof ConflictException)) throw err;
      }
    }

    return this.toResponseDto(pathEnrollment, userId);
  }

  async findAllForUser(
    userId: string,
  ): Promise<LearningPathEnrollmentResponseDto[]> {
    const pathEnrollments = await this.pathEnrollmentsRepo.find({
      where: { user: { id: userId } },
      relations: { learningPath: { pathCourses: { course: true } } },
      order: {
        createdAt: 'DESC',
        learningPath: { pathCourses: { position: 'ASC' } },
      },
    });

    return Promise.all(
      pathEnrollments.map((pe) => this.toResponseDto(pe, userId)),
    );
  }

  private async toResponseDto(
    pathEnrollment: LearningPathEnrollment,
    userId: string,
  ): Promise<LearningPathEnrollmentResponseDto> {
    const path = pathEnrollment.learningPath;
    const orderedCourses = (path.pathCourses ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((pc) => pc.course);
    const courseIds = orderedCourses.map((c) => c.id);

    // #224 — never stored, recomputed live from the learner's own
    // Enrollment rows against this path's constituent courses — see
    // LearningPathEnrollment's entity comment for why.
    const completedCount =
      courseIds.length > 0
        ? await this.enrollmentsRepo.count({
            where: {
              user: { id: userId },
              course: { id: In(courseIds) },
              status: 'complete',
            },
          })
        : 0;
    const totalCount = courseIds.length;

    return {
      id: pathEnrollment.id,
      pathId: path.id,
      title: path.title,
      description: path.description,
      courses: orderedCourses.map((c) => ({ id: c.id, title: c.title })),
      completedCount,
      totalCount,
      status:
        totalCount > 0 && completedCount >= totalCount
          ? 'complete'
          : 'in-progress',
      createdAt: pathEnrollment.createdAt,
    };
  }
}
