import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';

describe('CoursesService', () => {
  let service: CoursesService;
  let repo: Repository<Course>;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
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
});