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
import { CoursesService } from './courses.service';
import { CourseAnalyticsService } from './course-analytics.service';
import { ModulesService } from '../modules/modules.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseAnalyticsDto } from './dto/course-analytics.dto';
import { ModuleQuizResultDto } from '../quiz/dto/module-quiz-result.dto';
import { CourseReviewDto } from '../enrollments/dto/course-review.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireCourseOwnerGuard } from './require-course-owner.guard';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseAnalyticsService: CourseAnalyticsService,
    private readonly modulesService: ModulesService,
    private readonly enrollmentsService: EnrollmentsService,
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

  // #228 — public like findOne() above: CourseDetailModal shows reviews to
  // anyone browsing the catalogue, enrolled or not, same as it already
  // shows the aggregate star rating.
  @Get(':id/reviews')
  getReviews(@Param('id') id: string): Promise<CourseReviewDto[]> {
    return this.enrollmentsService.getReviewsForCourse(id);
  }

  // #227 — trainer + owner only, unlike the public routes above: this
  // exposes individual learners' names and progress, which is legitimately
  // sensitive in a way the aggregate course rating/reviews above aren't.
  // Same guard stack as PUT/DELETE.
  @Get(':id/analytics')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard, RequireCourseOwnerGuard)
  getAnalytics(@Param('id') id: string): Promise<CourseAnalyticsDto> {
    return this.courseAnalyticsService.getAnalyticsForCourse(id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCourseDto,
  ): Promise<Course> {
    return this.coursesService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard, RequireCourseOwnerGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RequireTrainerGuard, RequireCourseOwnerGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}
