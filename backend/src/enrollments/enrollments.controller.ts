import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitRatingDto } from './dto/submit-rating.dto';
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
  findAllForUser(
    @Req() req: AuthenticatedRequest,
  ): Promise<EnrollmentResponseDto[]> {
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

  @Patch(':id/rating')
  @UseGuards(SupabaseAuthGuard)
  submitRating(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitRatingDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.submitRating(req.user.id, id, dto);
  }

  @Get(':id/certificate')
  @UseGuards(SupabaseAuthGuard)
  async getCertificate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.enrollmentsService.generateCertificate(
      req.user.id,
      id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="certificate.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
