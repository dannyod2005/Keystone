import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Enrollment } from './entities/enrollment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrolledCourseDto, EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepo: Repository<Enrollment>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
    private readonly activityService: ActivityService,
  ) {}

  async create(userId: string, dto: CreateEnrollmentDto): Promise<Enrollment> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    // deletedAt filter: a soft-deleted course shouldn't be enrollable —
    // same NotFoundException as a genuinely missing course, since from the
    // learner's perspective it no longer exists.
    const course = await this.coursesRepo.findOne({
      where: { id: dto.courseId, deletedAt: IsNull() },
    });
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
      // course.modules loaded (and embedded below) so the dashboard/
      // learning screen work off this snapshot rather than re-looking the
      // course up in the catalogue list, which omits soft-deleted courses
      // (#41) — see EnrolledCourseDto.
      relations: { course: { modules: true } },
      order: { createdAt: 'DESC', course: { modules: { position: 'ASC' } } },
    });

    return enrollments.map((e) => this.toResponseDto(e));
  }

  async updateProgress(
    userId: string,
    enrollmentId: string,
    dto: UpdateProgressDto,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentsRepo.findOne({
      where: { id: enrollmentId },
      relations: { user: true, course: { modules: true } },
      order: { course: { modules: { position: 'ASC' } } },
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

    // Captured before we overwrite progress below — needed to work out how
    // many *new* modules this call actually completed, for activity
    // logging (#37). Rounding a fraction back to a module count is a bit
    // lossy, but progress is always derived from a module count in the
    // first place, so it round-trips cleanly in practice.
    const oldCompletedModules =
      totalModules > 0 ? Math.round(enrollment.progress * totalModules) : 0;

    enrollment.progress = totalModules > 0 ? completedModules / totalModules : 0;
    enrollment.status = completedModules >= totalModules && totalModules > 0
      ? 'complete'
      : 'in-progress';
    enrollment.lastAccessed = new Date();

    const saved = await this.enrollmentsRepo.save(enrollment);

    const newlyCompleted = Math.max(completedModules - oldCompletedModules, 0);
    if (newlyCompleted > 0 && totalModules > 0) {
      // Estimate: this course's total hours spread evenly across its
      // modules, scaled by how many modules were newly completed this
      // call. Not a measured duration — see #37.
      const minutesPerModule = Math.round(
        (enrollment.course.hours * 60) / totalModules,
      );
      await this.activityService.logEvent(
        userId,
        'module_complete',
        newlyCompleted * minutesPerModule,
      );
    }

    // save() returns the same entity reference with its already-loaded
    // relations intact, so saved.course.modules (fetched above for the
    // totalModules calc) is still there — no need to re-query.
    return this.toResponseDto(saved);
  }

  private toResponseDto(enrollment: Enrollment): EnrollmentResponseDto {
    return {
      id: enrollment.id,
      courseId: enrollment.course.id,
      progress: enrollment.progress,
      status: enrollment.status,
      lastAccessed: enrollment.lastAccessed,
      createdAt: enrollment.createdAt,
      course: this.toEnrolledCourseDto(enrollment.course),
    };
  }

  private toEnrolledCourseDto(course: Course): EnrolledCourseDto {
    return {
      id: course.id,
      title: course.title,
      modules: (course.modules ?? []).map((m) => ({
        id: m.id,
        position: m.position,
        title: m.title,
        videoUrl: m.videoUrl,
      })),
    };
  }

  async generateCertificate(userId: string, enrollmentId: string): Promise<Buffer> {
    const enrollment = await this.enrollmentsRepo.findOne({
      where: { id: enrollmentId },
      relations: { user: true, course: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with id "${enrollmentId}" not found`);
    }

    if (enrollment.user.id !== userId) {
      throw new ForbiddenException('This enrollment does not belong to you');
    }

    if (enrollment.status !== 'complete') {
      throw new BadRequestException('Certificate is only available for completed courses');
    }

    const learnerName = enrollment.user.name || 'Keystone Learner';
    const courseTitle = enrollment.course.title;
    const completionDate = (enrollment.lastAccessed ?? new Date()).toLocaleDateString(
      'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' },
    );

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape, in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const ink = rgb(0.086, 0.137, 0.239); // matches --ink from the app's design tokens
    const gold = rgb(0.78, 0.6, 0.16);
    const slate = rgb(0.4, 0.44, 0.52);

    // Border
    page.drawRectangle({
      x: 24,
      y: 24,
      width: width - 48,
      height: height - 48,
      borderColor: gold,
      borderWidth: 2,
    });

    const centerText = (text: string, y: number, font = fontRegular, size = 14, color = ink) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    };

    centerText('CERTIFICATE OF COMPLETION', height - 120, fontBold, 22, ink);
    centerText('This certifies that', height - 180, fontRegular, 14, slate);
    centerText(learnerName, height - 220, fontBold, 30, ink);
    centerText('has successfully completed', height - 265, fontRegular, 14, slate);
    centerText(courseTitle, height - 300, fontBold, 20, gold);
    centerText(`Completed on ${completionDate}`, height - 350, fontRegular, 12, slate);
    centerText('Keystone Learning', height - 80, fontBold, 14, ink);

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}