import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';

@Injectable()
export class RequireTrainerGuard implements CanActivate {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Relies on SupabaseAuthGuard having already run and set req.user —
    // this guard must always be listed AFTER SupabaseAuthGuard in
    // @UseGuards(). It does not re-verify the token itself.
    const userId = request.user?.id;

    const profile = await this.profilesRepo.findOne({ where: { id: userId } });

    if (!profile || profile.role !== 'trainer') {
      throw new ForbiddenException('This action requires a trainer account');
    }

    return true;
  }
}