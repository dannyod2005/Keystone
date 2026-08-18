import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CourseModule } from '../courses/entities/course-module.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizSubmission } from '../quiz/entities/quiz-submission.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ModuleNote } from '../notes/entities/module-note.entity';
import { ForumPost } from '../forum/entities/forum-post.entity';
import { ActivityService } from '../activity/activity.service';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitQuizDto } from '../quiz/dto/submit-quiz.dto';

// #260 — submitQuiz is the single grading path every downstream reader
// (badges, course grade, certificates, CourseAnalyticsService) ultimately
// trusts; these tests exercise its actual MCQ/short-answer grading and
// input-validation branches directly, mocking every injected repo/service
// the same way courses.service.spec.ts mocks CoursesService's.
describe('ModulesService', () => {
  let service: ModulesService;

  const mockModulesRepo = { findOne: jest.fn() };
  const mockQuizQuestionsRepo = { find: jest.fn() };
  const mockQuizSubmissionsRepo = {
    count: jest.fn(),
    delete: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => x),
    save: jest.fn((x: Record<string, unknown>) => Promise.resolve(x)),
  };
  const mockProfilesRepo = { findOne: jest.fn() };
  const mockNotesRepo = {};
  const mockForumPostsRepo = {};
  const mockActivityService = { logEvent: jest.fn() };
  const mockBadgesService = { evaluateQuizSubmission: jest.fn() };
  const mockNotificationsService = {};

  const profile = { id: 'user-1' } as Profile;
  const courseModule = { id: 'module-1' } as CourseModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        {
          provide: getRepositoryToken(CourseModule),
          useValue: mockModulesRepo,
        },
        {
          provide: getRepositoryToken(QuizQuestion),
          useValue: mockQuizQuestionsRepo,
        },
        {
          provide: getRepositoryToken(QuizSubmission),
          useValue: mockQuizSubmissionsRepo,
        },
        { provide: getRepositoryToken(Profile), useValue: mockProfilesRepo },
        { provide: getRepositoryToken(ModuleNote), useValue: mockNotesRepo },
        {
          provide: getRepositoryToken(ForumPost),
          useValue: mockForumPostsRepo,
        },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: BadgesService, useValue: mockBadgesService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);

    mockProfilesRepo.findOne.mockResolvedValue(profile);
    mockModulesRepo.findOne.mockResolvedValue(courseModule);
    mockQuizSubmissionsRepo.count.mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitQuiz — MCQ grading', () => {
    const mcqQuestion = {
      id: 'q-mcq',
      type: 'mcq',
      options: [
        { id: 'opt-correct', isCorrect: true },
        { id: 'opt-wrong', isCorrect: false },
      ],
    } as QuizQuestion;

    beforeEach(() => {
      mockQuizQuestionsRepo.find.mockResolvedValue([mcqQuestion]);
    });

    it('grades the selected option as correct when it is the marked-correct one', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq', optionId: 'opt-correct' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.score).toBe(1);
      expect(result.total).toBe(1);
      expect(result.results[0].isCorrect).toBe(true);
    });

    it('grades the selected option as incorrect when it is not the marked-correct one', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq', optionId: 'opt-wrong' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.score).toBe(0);
      expect(result.results[0].isCorrect).toBe(false);
    });

    it('throws BadRequestException when the MCQ answer is missing optionId', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq' }],
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when optionId does not belong to the question', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq', optionId: 'not-a-real-option' }],
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitQuiz — short-answer grading', () => {
    const shortAnswerQuestion = {
      id: 'q-short',
      type: 'short_answer',
      options: [
        { id: 'a1', optionText: 'Paris', isCorrect: true },
        { id: 'a2', optionText: 'City of Light', isCorrect: true },
      ],
    } as QuizQuestion;

    beforeEach(() => {
      mockQuizQuestionsRepo.find.mockResolvedValue([shortAnswerQuestion]);
    });

    it('matches case-insensitively and ignoring surrounding whitespace', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-short', answerText: '  PARIS  ' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.score).toBe(1);
      expect(result.results[0].isCorrect).toBe(true);
    });

    it('matches against any one of several acceptable answers', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-short', answerText: 'city of light' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.score).toBe(1);
    });

    it('grades as incorrect when the answer matches no acceptable answer', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-short', answerText: 'London' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.score).toBe(0);
      expect(result.results[0].isCorrect).toBe(false);
    });

    it('throws BadRequestException when answerText is missing', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-short' }],
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when answerText is whitespace-only', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-short', answerText: '   ' }],
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitQuiz — answer-set validation', () => {
    const questions = [
      { id: 'q1', type: 'mcq', options: [{ id: 'q1-opt', isCorrect: true }] },
      { id: 'q2', type: 'mcq', options: [{ id: 'q2-opt', isCorrect: true }] },
    ] as QuizQuestion[];

    beforeEach(() => {
      mockQuizQuestionsRepo.find.mockResolvedValue(questions);
    });

    it('throws BadRequestException when an answer is missing for one of the questions', async () => {
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q1', optionId: 'q1-opt' }], // q2 missing
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when an answer references a question outside this module', async () => {
      const dto: SubmitQuizDto = {
        answers: [
          { questionId: 'q1', optionId: 'q1-opt' },
          { questionId: 'q2', optionId: 'q2-opt' },
          { questionId: 'not-in-this-module', optionId: 'whatever' },
        ],
      };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitQuiz — retake reporting', () => {
    const mcqQuestion = {
      id: 'q-mcq',
      type: 'mcq',
      options: [{ id: 'opt-correct', isCorrect: true }],
    } as QuizQuestion;

    beforeEach(() => {
      mockQuizQuestionsRepo.find.mockResolvedValue([mcqQuestion]);
    });

    it('reports alreadySubmitted: false on a genuine first attempt', async () => {
      mockQuizSubmissionsRepo.count.mockResolvedValue(0);
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq', optionId: 'opt-correct' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.alreadySubmitted).toBe(false);
    });

    it('reports alreadySubmitted: true when a prior submission existed, and still grades fresh', async () => {
      mockQuizSubmissionsRepo.count.mockResolvedValue(1);
      const dto: SubmitQuizDto = {
        answers: [{ questionId: 'q-mcq', optionId: 'opt-correct' }],
      };

      const result = await service.submitQuiz('user-1', 'module-1', dto);

      expect(result.alreadySubmitted).toBe(true);
      // Retake still deletes the prior row(s) before re-inserting — never
      // accumulates a second submission alongside the first (#239).
      expect(mockQuizSubmissionsRepo.delete).toHaveBeenCalled();
      expect(result.score).toBe(1);
    });
  });

  describe('submitQuiz — module with no quiz', () => {
    it('throws NotFoundException when the module has no quiz questions', async () => {
      mockQuizQuestionsRepo.find.mockResolvedValue([]);
      const dto: SubmitQuizDto = { answers: [] };

      await expect(
        service.submitQuiz('user-1', 'module-1', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
