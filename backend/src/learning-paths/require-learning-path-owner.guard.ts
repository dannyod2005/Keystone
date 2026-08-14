import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { Profile } from '../profiles/entities/profile.entity';

// #224 — direct copy of RequireCourseOwnerGuard's shape against LearningPath
// instead of Course; see that guard for the full reasoning (owner_id null =
// legacy/exempt, provider_id = opt-in shared team edit rights).
@Injectable()
export class RequireLearningPathOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(LearningPath)
    private readonly pathsRepo: Repository<LearningPath>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Relies on SupabaseAuthGuard (sets req.user) and RequireTrainerGuard
    // having already run — must be listed after both in @UseGuards().
    const userId = request.user?.id;
    const pathId = request.params?.id;

    const path = await this.pathsRepo.findOne({
      where: { id: pathId, deletedAt: IsNull() },
    });
    if (!path) {
      throw new NotFoundException(
        `Learning path with id "${pathId}" not found`,
      );
    }
    if (path.ownerId === null) return true; // legacy/unowned, exempted
    if (path.ownerId === userId) return true;

    if (path.providerId) {
      const profile = await this.profilesRepo.findOne({
        where: { id: userId },
      });
      if (profile?.providerId && profile.providerId === path.providerId)
        return true;
    }

    throw new ForbiddenException(
      'You do not have permission to modify this learning path',
    );
  }
}
