import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseAnalyticsService } from './course-analytics.service';
import { VideoDurationService } from './video-duration.service';
import { ModulesService } from '../modules/modules.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Course } from './entities/course.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';
import { RequireCourseOwnerGuard } from './require-course-owner.guard';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  // #275 — the controller has picked up more constructor dependencies over
  // time (CourseAnalyticsService in #227, VideoDurationService here) than
  // this spec's testing module provided; only CoursesService is actually
  // exercised below, so every other collaborator is a bare mock just to
  // satisfy DI resolution.
  const mockCourseAnalyticsService = {
    getOverviewForOwner: jest.fn(),
    getAnalyticsForCourse: jest.fn(),
  };
  const mockVideoDurationService = { lookup: jest.fn() };
  const mockModulesService = {
    getQuizResultsForCourse: jest.fn(),
  };
  const mockEnrollmentsService = { getReviewsForCourse: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
        {
          provide: CourseAnalyticsService,
          useValue: mockCourseAnalyticsService,
        },
        { provide: VideoDurationService, useValue: mockVideoDurationService },
        { provide: ModulesService, useValue: mockModulesService },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    })
      // #275 — findAll/findOne below are the only routes actually exercised
      // (neither is guarded), but Nest's testing module still resolves the
      // guard classes referenced via @UseGuards() on the controller's other
      // routes as part of compiling the module graph. SupabaseAuthGuard in
      // particular needs a real ConfigService to construct, which this bare
      // testing module never provided — overriding all three with an
      // always-allow stub sidesteps that construction entirely rather than
      // wiring up a real/mock ConfigService this spec has no use for.
      .overrideGuard(SupabaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RequireTrainerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RequireCourseOwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to CoursesService.findAll and returns its result', async () => {
      const courses = [{ id: 'c1', title: 'Test Course' }] as Course[];
      mockCoursesService.findAll.mockResolvedValue(courses);

      const result = await controller.findAll();

      expect(result).toEqual(courses);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to CoursesService.findOne with the given id', async () => {
      const course = { id: 'c1', title: 'Test Course' } as Course;
      mockCoursesService.findOne.mockResolvedValue(course);

      const result = await controller.findOne('c1');

      expect(result).toEqual(course);
      expect(service.findOne).toHaveBeenCalledWith('c1');
    });
  });
});
