import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { LearningPathEnrollmentsService } from './learning-path-enrollments.service';
import { CreateLearningPathEnrollmentDto } from './dto/create-learning-path-enrollment.dto';
import { LearningPathEnrollmentResponseDto } from './dto/learning-path-enrollment-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('learning-path-enrollments')
export class LearningPathEnrollmentsController {
  constructor(
    private readonly pathEnrollmentsService: LearningPathEnrollmentsService,
  ) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLearningPathEnrollmentDto,
  ): Promise<LearningPathEnrollmentResponseDto> {
    return this.pathEnrollmentsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  findAllForUser(
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningPathEnrollmentResponseDto[]> {
    return this.pathEnrollmentsService.findAllForUser(req.user.id);
  }
}
