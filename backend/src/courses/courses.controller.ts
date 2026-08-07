import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CoursesService } from './courses.service';
import { ModulesService } from '../modules/modules.service';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ModuleQuizResultDto } from '../quiz/dto/module-quiz-result.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly modulesService: ModulesService,
  ) {}

  @Get()
  findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Course> {
    return this.coursesService.findOne(id);
  }

  @Get(':id/quiz-results')
  @UseGuards(SupabaseAuthGuard)
  getQuizResults(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ModuleQuizResultDto[]> {
    return this.modulesService.getQuizResultsForCourse(req.user.id, id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  create(@Body() dto: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}