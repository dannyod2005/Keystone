import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BadgesService } from './badges.service';
import { UserBadgeResponseDto } from './dto/user-badge-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMyBadges(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserBadgeResponseDto[]> {
    return this.badgesService.getBadgesForUser(req.user.id);
  }
}
