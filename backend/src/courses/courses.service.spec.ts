import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

describe('CoursesService', () => {
  let service: CoursesService;
  let repo: Repository<Course>;

  const mockManager = {
    delete: jest.fn(),
    save: jest.fn(),
  };

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn((cb) => cb(mockManager)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    repo = module.get<Repository<Course>>(getRepositoryToken(Course));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all courses with ordered relations', async () => {
      const courses = [{ id: 'c1', title: 'Test Course' }] as Course[];
      mockRepo.find.mockResolvedValue(courses);

      const result = await service.findAll();

      expect(result).toEqual(courses);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { modules: true, credits: true, faqs: true },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a course when found', async () => {
      const course = { id: 'c1', title: 'Test Course' } as Course;
      mockRepo.findOne.mockResolvedValue(course);

      const result = await service.findOne('c1');
      expect(result).toEqual(course);
    });

    it('throws NotFoundException when course does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('builds a course with positioned modules/credits/faqs and saves it', async () => {
      const dto: CreateCourseDto = {
        title: 'New Course',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [{ title: 'Module One' }, { title: 'Module Two' }],
        credits: [{ line: 'Credit One' }],
        faqs: [{ question: 'Q1', answer: 'A1' }],
      };

      const builtCourse = { title: dto.title } as Course;
      mockRepo.create.mockReturnValue(builtCourse);
      mockRepo.save.mockResolvedValue({ ...builtCourse, id: 'new-id' });

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Course',
          modules: [
            { position: 0, title: 'Module One', videoUrl: null },
            { position: 1, title: 'Module Two', videoUrl: null },
          ],
          credits: [{ position: 0, line: 'Credit One' }],
          faqs: [{ position: 0, question: 'Q1', answer: 'A1' }],
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(builtCourse);
    });
  });

  describe('update', () => {
    const existingModules = [
      { id: 'm1', position: 0, title: 'Module One', videoUrl: null },
      { id: 'm2', position: 1, title: 'Module Two', videoUrl: null },
    ] as CourseModule[];

    const existingCourse = {
      id: 'c1',
      title: 'Old Title',
      modules: existingModules,
      credits: [] as CourseCredit[],
      faqs: [] as CourseFaq[],
    } as Course;

    beforeEach(() => {
      mockRepo.findOne.mockResolvedValue(existingCourse);
      mockManager.save.mockImplementation((_entity, course) =>
        Promise.resolve(course),
      );
    });

    it('throws NotFoundException when course does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing-id', {} as UpdateCourseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deletes modules whose id is no longer present in the incoming array', async () => {
      const dto: UpdateCourseDto = {
        title: 'Old Title',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [{ id: 'm1', title: 'Module One' }], // m2 dropped
      };

      await service.update('c1', dto);

      expect(mockManager.delete).toHaveBeenCalledWith(
        CourseModule,
        { id: In(['m2']) },
      );
    });

    it('does NOT delete anything when all existing ids are still present', async () => {
      const dto: UpdateCourseDto = {
        title: 'Old Title',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [
          { id: 'm1', title: 'Module One' },
          { id: 'm2', title: 'Module Two' },
        ],
      };

      await service.update('c1', dto);

      expect(mockManager.delete).not.toHaveBeenCalledWith(
        CourseModule,
        expect.anything(),
      );
    });

    it('preserves the existing id when updating a module in place', async () => {
      const dto: UpdateCourseDto = {
        title: 'Old Title',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [{ id: 'm1', title: 'Module One Renamed' }],
      };

      const result = await service.update('c1', dto);

      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].id).toBe('m1'); // same id, not regenerated
      expect(result.modules[0].title).toBe('Module One Renamed');
    });

    it('adds a new module with no id as a fresh entry', async () => {
      const dto: UpdateCourseDto = {
        title: 'Old Title',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [
          { id: 'm1', title: 'Module One' },
          { title: 'Module Three' }, // no id -> new
        ],
      };

      const result = await service.update('c1', dto);

      expect(result.modules).toHaveLength(2);
      expect(result.modules[1].id).toBeUndefined();
      expect(result.modules[1].title).toBe('Module Three');
    });

    it('runs deletes and save inside a single transaction', async () => {
      const dto: UpdateCourseDto = {
        title: 'Old Title',
        provider: 'Provider',
        category: 'Technical',
        level: 'Beginner',
        hours: 5,
        projects: 1,
        color: 'gold',
        modules: [{ id: 'm1', title: 'Module One' }],
      };

      await service.update('c1', dto);

      expect(repo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.save).toHaveBeenCalledWith(Course, existingCourse);
    });
  });
});