import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
  getSummary(@Req() req: AuthenticatedRequest): Promise<ActivitySummaryResponseDto> {
    return this.activityService.getSummary(req.user.id);
  }
}
