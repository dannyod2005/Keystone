import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockCoursesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
      ],
    }).compile();

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