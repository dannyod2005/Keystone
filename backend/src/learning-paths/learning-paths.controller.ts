import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LearningPathsService } from './learning-paths.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireLearningPathOwnerGuard } from './require-learning-path-owner.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  findAll(): Promise<LearningPathResponseDto[]> {
    return this.learningPathsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<LearningPathResponseDto> {
    return this.learningPathsService.findOne(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateLearningPathDto,
  ): Promise<LearningPathResponseDto> {
    return this.learningPathsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(
    SupabaseAuthGuard,
    RequireTrainerGuard,
    RequireLearningPathOwnerGuard,
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
  ): Promise<LearningPathResponseDto> {
    return this.learningPathsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(
    SupabaseAuthGuard,
    RequireTrainerGuard,
    RequireLearningPathOwnerGuard,
  )
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.learningPathsService.remove(id);
  }
}
