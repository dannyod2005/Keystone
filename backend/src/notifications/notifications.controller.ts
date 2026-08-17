import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  findAllForUser(
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAllForUser(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(SupabaseAuthGuard)
  markRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(req.user.id, id);
  }
}
