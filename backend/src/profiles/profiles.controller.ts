import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

// #143 — the trainer course form needs the caller's own profile.name (the
// provider-field autofill fallback for trainers with no Provider
// membership). Deliberately general-purpose rather than trainer-only:
// "read your own profile" is a broadly useful primitive, not a Trainer
// Studio concept, so this only requires SupabaseAuthGuard (matches the
// profiles_select_own RLS policy — any authenticated user reading their
// own row).
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMine(@Req() req: AuthenticatedRequest): Promise<Profile> {
    return this.profilesService.getMine(req.user.id);
  }

  // #107/#189 — onboarding modal calls this once a learner or trainer
  // picks their interest category. Guard is the same as getMine (any
  // authenticated user acting on their own row, regardless of role) — the
  // profiles_update_own RLS policy mirrors this for direct-Supabase access.
  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  updateMine(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateGoal(req.user.id, dto.goal);
  }

  // #186 — RoleOnboardingModal calls this once, right after a Google
  // sign-up picks learner or trainer. Separate route (rather than folding
  // role into PATCH /profiles/me alongside goal) so this endpoint's single
  // job — writing the value RequireTrainerGuard authorizes against — stays
  // easy to reason about on its own. Same guard as the rest of this
  // controller: any authenticated user acting on their own row.
  @Patch('me/role')
  @UseGuards(SupabaseAuthGuard)
  updateRole(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRoleDto,
  ): Promise<Profile> {
    return this.profilesService.updateRole(req.user.id, dto.role);
  }
}
