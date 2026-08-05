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
    // userId comes from the verified auth.users.id (SupabaseAuthGuard),
    // never from the request body. #23's trigger guarantees profiles.id
    // equals auth.users.id, so this lookup should always succeed for a
    // real logged-in user — but we check explicitly rather than assume.
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
      // Postgres error code 23505 = unique_violation. The (user_id,
      // course_id) constraint from #17 means this is "already enrolled,"
      // an expected case — surface it as a clean 409, not a raw 500.
      if (
        err instanceof QueryFailedError &&
        (err as any).code === '23505'
      ) {
        throw new ConflictException('Already enrolled in this course');
      }
      throw err;
    }
  }
}