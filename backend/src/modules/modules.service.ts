import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CourseModule } from '../courses/entities/course-module.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizSubmission } from '../quiz/entities/quiz-submission.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';
import { SubmitQuizDto } from '../quiz/dto/submit-quiz.dto';
import { QuizResultDto } from '../quiz/dto/quiz-result.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(CourseModule)
    private readonly modulesRepo: Repository<CourseModule>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionsRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionsRepo: Repository<QuizSubmission>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async getQuiz(moduleId: string): Promise<QuizQuestionResponseDto[]> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    const questions = await this.quizQuestionsRepo.find({
      where: { module: { id: moduleId } },
      relations: { options: true },
      order: {
        position: 'ASC',
        options: { position: 'ASC' },
      },
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      position: q.position,
      options: q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        position: o.position,
      })),
    }));
  }

  async submitQuiz(
    userId: string,
    moduleId: string,
    dto: SubmitQuizDto,
  ): Promise<QuizResultDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    const questions = await this.quizQuestionsRepo.find({
      where: { module: { id: moduleId } },
      relations: { options: true },
    });

    if (questions.length === 0) {
      throw new NotFoundException('This module has no quiz');
    }

    // Build a lookup from every question to its options and correct
    // answer, and a reverse lookup from optionId -> questionId — used
    // by both the "already submitted" path and the fresh-grading path
    // below, so correctOptionId is always derived from real question
    // data, never trusted from the client.
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const optionIdToQuestionId = new Map<string, string>();
    const allOptionIds: string[] = [];
    for (const q of questions) {
      for (const o of q.options) {
        optionIdToQuestionId.set(o.id, q.id);
        allOptionIds.push(o.id);
      }
    }

    const buildResultItem = (questionId: string, selectedOptionId: string): {
      questionId: string;
      selectedOptionId: string;
      correctOptionId: string;
      isCorrect: boolean;
    } => {
      const question = questionById.get(questionId);
      if (!question) {
        // Should be unreachable in practice — questionId always comes from
        // either a validated fresh submission or an existing submission's
        // own option->question lookup, both derived from this same
        // questions array. Throwing here is a safety net, not an expected path.
        throw new NotFoundException(`Question "${questionId}" not found in this module's quiz`);
      }

      const correctOption = question.options.find((o) => o.isCorrect);
      if (!correctOption) {
        // Data-integrity issue: a question with no correct answer marked at
        // all. Also should be unreachable with well-formed quiz data, but
        // worth surfacing loudly rather than silently returning a bad result.
        throw new Error(`Question "${questionId}" has no option marked as correct`);
      }

      const selected = question.options.find((o) => o.id === selectedOptionId);

      return {
        questionId,
        selectedOptionId,
        correctOptionId: correctOption.id,
        isCorrect: !!selected?.isCorrect,
      };
    };

    // Single-attempt check: does this user already have submissions for
    // any option belonging to this module's questions?
    const existingSubmissions = await this.quizSubmissionsRepo.find({
      where: { user: { id: userId }, option: { id: In(allOptionIds) } },
      relations: { option: true },
    });

    if (existingSubmissions.length > 0) {
      const results = existingSubmissions.map((s) => {
        const questionId = optionIdToQuestionId.get(s.option.id);
        if (!questionId) {
          throw new NotFoundException(
            `Submitted option "${s.option.id}" no longer belongs to a question in this module`,
          );
        }
        return buildResultItem(questionId, s.option.id);
      });
      return {
        score: results.filter((r) => r.isCorrect).length,
        total: questions.length,
        alreadySubmitted: true,
        results,
      };
    }

    // Fresh submission: validate the answers cover exactly this module's
    // questions — no missing, no extra — and that each optionId genuinely
    // belongs to its stated questionId, before grading or storing anything.
    const submittedQuestionIds = new Set(dto.answers.map((a) => a.questionId));
    const realQuestionIds = new Set(questions.map((q) => q.id));

    if (
      submittedQuestionIds.size !== realQuestionIds.size ||
      ![...submittedQuestionIds].every((id) => realQuestionIds.has(id))
    ) {
      throw new BadRequestException(
        'Answers must cover exactly the questions in this module\'s quiz',
      );
    }

    for (const answer of dto.answers) {
      const question = questionById.get(answer.questionId);
      if (!question) {
        // Unreachable given the exact-match check above, but keeps this
        // loop self-contained and satisfies TypeScript honestly rather
        // than asserting past it.
        throw new BadRequestException(`Unknown question "${answer.questionId}"`);
      }

      const optionBelongsToQuestion = question.options.some(
        (o) => o.id === answer.optionId,
      );
      if (!optionBelongsToQuestion) {
        throw new BadRequestException(
          `Option "${answer.optionId}" does not belong to question "${answer.questionId}"`,
        );
      }
    }

    const submissionsToSave = dto.answers.map((a) =>
      this.quizSubmissionsRepo.create({
        user: profile,
        option: { id: a.optionId } as any,
      }),
    );
    await this.quizSubmissionsRepo.save(submissionsToSave);

    const results = dto.answers.map((a) =>
      buildResultItem(a.questionId, a.optionId),
    );

    return {
      score: results.filter((r) => r.isCorrect).length,
      total: questions.length,
      alreadySubmitted: false,
      results,
    };
  }
}