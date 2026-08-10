import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { JoinProviderDto } from './dto/join-provider.dto';
import { ProviderDetailDto } from './dto/provider-detail.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

// #138 — all routes are trainer-only (SupabaseAuthGuard + RequireTrainerGuard):
// providers are a Trainer Studio concept (#139's "Team" tab), learners have
// no use for them. Static path segments only (invite-code/regenerate,
// join, leave, me) — no :id params, so there's no ordering hazard with
// route matching and no risk of a client-supplied id substituting for the
// server-derived req.user.id the service actually uses.
@Controller('providers')
@UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProviderDto,
  ): Promise<Provider> {
    return this.providersService.create(req.user.id, dto);
  }

  @Post('invite-code/regenerate')
  @HttpCode(200)
  regenerateInviteCode(@Req() req: AuthenticatedRequest): Promise<Provider> {
    return this.providersService.regenerateInviteCode(req.user.id);
  }

  @Post('join')
  @HttpCode(200)
  join(
    @Req() req: AuthenticatedRequest,
    @Body() dto: JoinProviderDto,
  ): Promise<Provider> {
    return this.providersService.join(req.user.id, dto);
  }

  @Post('leave')
  @HttpCode(204)
  leave(@Req() req: AuthenticatedRequest): Promise<void> {
    return this.providersService.leave(req.user.id);
  }

  @Get('me')
  getMine(@Req() req: AuthenticatedRequest): Promise<ProviderDetailDto> {
    return this.providersService.getMine(req.user.id);
  }
}
