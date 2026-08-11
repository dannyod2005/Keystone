import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { Profile } from '../profiles/entities/profile.entity';

// #137 — course update/delete used to be gated purely on RequireTrainerGuard
// (any trainer could edit any course). This adds the actual ownership check
// on top of that: the caller must be the course's owner, or a member of the
// provider the course is scoped to. A NULL course.ownerId means the course
// predates ownership tracking (the original seed data) and is exempted
// rather than retroactively assigned to anyone — see the
// AddCourseAndProfileOwnership migration for the full reasoning.
@Injectable()
export class RequireCourseOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Relies on SupabaseAuthGuard (sets req.user) and RequireTrainerGuard
    // having already run — must be listed after both in @UseGuards().
    const userId = request.user?.id;
    const courseId = request.params?.id;

    const course = await this.coursesRepo.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });

    if (!course) {
      throw new NotFoundException(`Course with id "${courseId}" not found`);
    }

    if (course.ownerId === null) {
      return true; // legacy course, predates ownership tracking — exempted
    }

    if (course.ownerId === userId) {
      return true;
    }

    if (course.providerId) {
      const profile = await this.profilesRepo.findOne({ where: { id: userId } });
      if (profile?.providerId && profile.providerId === course.providerId) {
        return true;
      }
    }

    throw new ForbiddenException('You do not have permission to modify this course');
  }
}
