import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntryDto } from './dto/leaderboard-entry.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

// #231 — auth-gated rather than public: this exposes other learners'
// names, same "logged-in learner context" posture as badges/notifications/
// bookmarks, unlike e.g. the public course catalogue.
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  getRankings(
    @Req() req: AuthenticatedRequest,
  ): Promise<LeaderboardEntryDto[]> {
    return this.leaderboardService.getRankings(req.user.id);
  }
}
