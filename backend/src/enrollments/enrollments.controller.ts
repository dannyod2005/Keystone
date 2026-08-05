import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Enrollment } from './entities/enrollment.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<Enrollment> {
    return this.enrollmentsService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  findAllForUser(@Req() req: AuthenticatedRequest): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentsService.findAllForUser(req.user.id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  updateProgress(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.updateProgress(req.user.id, id, dto);
  }
}