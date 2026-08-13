import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ActivityService } from './activity.service';
import { ActivitySummaryResponseDto } from './dto/activity-summary-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('summary')
  @UseGuards(SupabaseAuthGuard)
  getSummary(
    @Req() req: AuthenticatedRequest,
    // #183 — how many 7-day weeks to page from the current week for the
    // calendar card (-1 = last week, 1 = next week). Optional/loose
    // query-string parsing rather than a DTO + ValidationPipe: a single
    // small integer with an obvious safe fallback doesn't carry its
    // weight. Anything that doesn't parse to a finite number (missing,
    // garbage, whatever) just falls back to 0 — the current week, same
    // as before this param existed.
    @Query('weekOffset') weekOffsetRaw?: string,
  ): Promise<ActivitySummaryResponseDto> {
    const parsed = parseInt(weekOffsetRaw ?? '', 10);
    const weekOffset = Number.isFinite(parsed) ? parsed : 0;
    return this.activityService.getSummary(req.user.id, weekOffset);
  }
}
