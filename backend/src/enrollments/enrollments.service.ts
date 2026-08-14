import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, QueryFailedError, Repository } from 'typeorm';
import { PDFDocument, rgb } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Enrollment } from './entities/enrollment.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrolledCourseDto, EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
import { CourseReviewDto } from './dto/course-review.dto';
import { ActivityService } from '../activity/activity.service';
import { ModulesService } from '../modules/modules.service';
import { BadgesService } from '../badges/badges.service';

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
    private readonly modulesService: ModulesService,
    private readonly badgesService: BadgesService,
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

    // #205 — server-side mirror of LearningScreen's Mark Complete gate: a
    // module with a quiz can't be counted as complete until that quiz has
    // actually been submitted, so a client can't bypass the frontend gate
    // by just calling this endpoint directly with a bumped
    // completedModules. Only checked when progress is actually advancing
    // (a same-or-lower value has nothing newly "completed" to validate).
    // getQuizResultsForCourse is the same lookup CoursesModule's
    // GET /courses/:id/quiz-results already uses, so "taken" here means
    // exactly what the frontend's quizResultsOverview shows.
    if (completedModules > oldCompletedModules) {
      const newlyCompletedModules = enrollment.course.modules.slice(
        oldCompletedModules,
        completedModules,
      );
      const quizResults = await this.modulesService.getQuizResultsForCourse(
        userId,
        enrollment.course.id,
      );
      const quizStatusByModuleId = new Map(
        quizResults.map((r) => [r.moduleId, r]),
      );
      const blockedModule = newlyCompletedModules.find((m) => {
        const status = quizStatusByModuleId.get(m.id);
        return status?.hasQuiz && !status.taken;
      });
      if (blockedModule) {
        throw new BadRequestException(
          `Complete the quiz for "${blockedModule.title}" before marking it as done`,
        );
      }
    }

    // #225 — captured before the assignment below so the badge check
    // after save() can tell "just became complete" apart from "was
    // already complete" (e.g. a no-op re-save from a stale/duplicate
    // client call shouldn't re-evaluate the completion badges).
    const wasComplete = enrollment.status === 'complete';

    enrollment.progress = totalModules > 0 ? completedModules / totalModules : 0;
    enrollment.status = completedModules >= totalModules && totalModules > 0
      ? 'complete'
      : 'in-progress';
    enrollment.lastAccessed = new Date();

    const saved = await this.enrollmentsRepo.save(enrollment);

    // #225 — course-completion badges, only on a genuine in-progress ->
    // complete transition. completedCourseCount is this learner's total
    // completed enrollments *including* the one just saved, since
    // BadgesService.evaluateCourseCompletion checks against the exact
    // count at which each badge is first earned (see that method).
    if (!wasComplete && saved.status === 'complete') {
      const completedCourseCount = await this.enrollmentsRepo.count({
        where: { user: { id: userId }, status: 'complete' },
      });
      await this.badgesService.evaluateCourseCompletion(
        userId,
        completedCourseCount,
      );
    }

    const newlyCompleted = Math.max(completedModules - oldCompletedModules, 0);
    if (newlyCompleted > 0 && totalModules > 0) {
      // Estimate: this course's total hours spread evenly across its
      // modules. Not a measured duration — see #37.
      const minutesPerModule = Math.round(
        (enrollment.course.hours * 60) / totalModules,
      );

      // #124 — log per specific module rather than one lump sum for
      // "however many modules got completed this call", so each module's
      // estimated minutes can be split across the distinct days *that*
      // module was actually viewed (see ActivityService.logModuleCompletion)
      // instead of all landing on whichever day this request happened to
      // fire. enrollment.course.modules is already ordered by position
      // (see the query above), and modules are always completed in that
      // same order, so this slice is exactly the newly-completed ones.
      const newlyCompletedModules = enrollment.course.modules.slice(
        oldCompletedModules,
        completedModules,
      );
      for (const module of newlyCompletedModules) {
        await this.activityService.logModuleCompletion(
          userId,
          module.id,
          minutesPerModule,
        );
      }
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
      rating: enrollment.rating,
      reviewText: enrollment.reviewText,
    };
  }

  // #106 — only a learner who has actually completed this course can rate
  // it (mirrors generateCertificate's same status check just below).
  // Re-submitting overwrites the previous rating rather than erroring,
  // since there's no reason to force a learner through "delete then
  // re-add" just to change their mind.
  async submitRating(
    userId: string,
    enrollmentId: string,
    dto: SubmitRatingDto,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.enrollmentsRepo.findOne({
      where: { id: enrollmentId },
      relations: { user: true, course: { modules: true } },
      order: { course: { modules: { position: 'ASC' } } },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with id "${enrollmentId}" not found`);
    }

    if (enrollment.user.id !== userId) {
      throw new ForbiddenException('This enrollment does not belong to you');
    }

    if (enrollment.status !== 'complete') {
      throw new BadRequestException('You can only rate a course after completing it');
    }

    enrollment.rating = dto.rating;
    // #228 — normalize "" / whitespace-only to null rather than storing it
    // as-is, so an empty textarea submission reads the same as never
    // having left a review (and doesn't show up as a blank entry in
    // getReviewsForCourse below, which filters on reviewText IS NOT NULL).
    const trimmedReview = dto.reviewText?.trim();
    enrollment.reviewText = trimmedReview ? trimmedReview : null;
    const saved = await this.enrollmentsRepo.save(enrollment);

    return this.toResponseDto(saved);
  }

  // #228 — public, course-scoped reviews list for CourseDetailModal: every
  // enrollment against this course that has actual review text, most
  // recent first. Ordered by the enrollment's createdAt (when the learner
  // enrolled) rather than a dedicated "rated at" timestamp, since #106
  // never added one — an enrollment only ever has one rating/review at a
  // time (re-rating overwrites, see submitRating above), so this is the
  // closest existing timestamp and good enough for "most recent reviews
  // first" without adding a new column just for ordering.
  async getReviewsForCourse(courseId: string): Promise<CourseReviewDto[]> {
    const enrollments = await this.enrollmentsRepo.find({
      where: { course: { id: courseId }, reviewText: Not(IsNull()) },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return enrollments.map((e) => ({
      authorName: e.user.name || 'Keystone Learner',
      rating: e.rating as number,
      reviewText: e.reviewText as string,
      createdAt: e.createdAt,
    }));
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

    // #177 — pdf-lib's built-in StandardFonts only support WinAnsi
    // encoding (Latin-1), so any learner name with Vietnamese
    // diacritics (or other extended-Latin characters) threw an
    // uncaught "cannot encode" error here, surfacing to the frontend
    // as a plain 500. DejaVu Sans has full Vietnamese/extended-Latin
    // coverage; it's bundled under src/assets/fonts (copied to
    // dist/assets/fonts by nest-cli's asset config, see
    // nest-cli.json) and embedded via fontkit instead of relying on
    // the limited standard 14 fonts.
    pdfDoc.registerFontkit(fontkit);
    const fontsDir = join(__dirname, '../assets/fonts');
    const [regularBytes, boldBytes] = await Promise.all([
      readFile(join(fontsDir, 'DejaVuSans.ttf')),
      readFile(join(fontsDir, 'DejaVuSans-Bold.ttf')),
    ]);

    const page = pdfDoc.addPage([842, 595]); // A4 landscape, in points
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(boldBytes);
    const fontRegular = await pdfDoc.embedFont(regularBytes);

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