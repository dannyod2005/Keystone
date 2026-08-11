import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';
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
}
