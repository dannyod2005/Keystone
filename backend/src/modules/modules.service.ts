import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, EntityManager } from 'typeorm';
import { CourseModule } from '../courses/entities/course-module.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizSubmission } from '../quiz/entities/quiz-submission.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ModuleNote } from '../notes/entities/module-note.entity';
import { ForumPost } from '../forum/entities/forum-post.entity';
import { QuizQuestionResponseDto } from '../quiz/dto/quiz-question-response.dto';
import { SubmitQuizDto } from '../quiz/dto/submit-quiz.dto';
import { QuizResultDto } from '../quiz/dto/quiz-result.dto';
import { UpsertNoteDto } from '../notes/dto/upsert-note.dto';
import { NoteResponseDto } from '../notes/dto/note-response.dto';
import { CreatePostDto } from '../forum/dto/create-post.dto';
import { UpdatePostDto } from '../forum/dto/update-post.dto';
import { PostResponseDto } from '../forum/dto/post-response.dto';
import { UpsertQuizDto } from '../quiz/dto/upsert-quiz.dto';
import { QuizOption } from '../quiz/entities/quiz-option.entity';
import { QuizQuestionEditResponseDto } from '../quiz/dto/quiz-question-edit-response.dto';
import { ActivityService } from '../activity/activity.service';

// Fixed per-event minute estimates for actions that aren't naturally
// scaled by course length the way module completion is (see #37).
const QUIZ_SUBMIT_MINUTES = 5;
const NOTE_SAVE_MINUTES = 3;
const FORUM_POST_MINUTES = 3;

function isEdited(post: ForumPost): boolean {
  return post.updatedAt.getTime() !== post.createdAt.getTime();
}

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
    @InjectRepository(ModuleNote)
    private readonly notesRepo: Repository<ModuleNote>,
    @InjectRepository(ForumPost)
    private readonly forumPostsRepo: Repository<ForumPost>,
    private readonly activityService: ActivityService,
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
    await this.activityService.logEvent(userId, 'quiz_submit', QUIZ_SUBMIT_MINUTES);

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

  async getNote(userId: string, moduleId: string): Promise<NoteResponseDto> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    const note = await this.notesRepo.findOne({
      where: { module: { id: moduleId }, user: { id: userId } },
    });

    return {
      content: note?.content ?? null,
      updatedAt: note?.updatedAt ?? null,
    };
  }

  async saveNote(
    userId: string,
    moduleId: string,
    dto: UpsertNoteDto,
  ): Promise<NoteResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    let note = await this.notesRepo.findOne({
      where: { module: { id: moduleId }, user: { id: userId } },
    });

    if (note) {
      note.content = dto.content ?? null;
    } else {
      note = this.notesRepo.create({
        module,
        user: profile,
        content: dto.content ?? null,
      });
    }

    const saved = await this.notesRepo.save(note);
    await this.activityService.logEvent(userId, 'note_save', NOTE_SAVE_MINUTES);

    return {
      content: saved.content,
      updatedAt: saved.updatedAt,
    };
  }

  async listPosts(moduleId: string): Promise<PostResponseDto[]> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    const posts = await this.forumPostsRepo.find({
      where: { module: { id: moduleId } },
      relations: { user: true, parentPost: true },
      order: { createdAt: 'ASC' },
    });

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      author: {
        id: p.user.id,
        name: p.user.name,
      },
      parentPostId: p.parentPost?.id ?? null,
      edited: isEdited(p),
    }));
  }

  async createPost(
    userId: string,
    moduleId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    let parentPost: ForumPost | null = null;
    if (dto.parentPostId) {
      parentPost = await this.forumPostsRepo.findOne({
        where: { id: dto.parentPostId },
        relations: { module: true },
      });
      if (!parentPost) {
        throw new NotFoundException(`Post with id "${dto.parentPostId}" not found`);
      }
      // Never trust a client-supplied parentPostId to actually belong to
      // this module — replying to a post from a different module would
      // otherwise let a reply show up somewhere it doesn't belong.
      if (parentPost.module.id !== moduleId) {
        throw new BadRequestException(
          'parentPostId does not belong to this module',
        );
      }
    }

    const post = this.forumPostsRepo.create({
      module,
      user: profile,
      content: dto.content,
      parentPost,
    });

    const saved = await this.forumPostsRepo.save(post);
    await this.activityService.logEvent(userId, 'forum_post', FORUM_POST_MINUTES);

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      author: {
        id: profile.id,
        name: profile.name,
      },
      parentPostId: parentPost?.id ?? null,
      edited: isEdited(saved),
    };
  }

  async editPost(
    userId: string,
    moduleId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.forumPostsRepo.findOne({
      where: { id: postId, module: { id: moduleId } },
      relations: { user: true, parentPost: true },
    });
    if (!post) {
      throw new NotFoundException(`Post with id "${postId}" not found`);
    }

    // Ownership check: only the post's own author can edit it — never
    // trust the client to only send its own posts, same principle as
    // enrollment/note ownership checks elsewhere in this service.
    if (post.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    post.content = dto.content;
    const saved = await this.forumPostsRepo.save(post);

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      author: {
        id: post.user.id,
        name: post.user.name,
      },
      parentPostId: post.parentPost?.id ?? null,
      edited: isEdited(saved),
    };
  }

  async upsertQuiz(moduleId: string, dto: UpsertQuizDto): Promise<QuizQuestionResponseDto[]> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    for (const q of dto.questions) {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          `Question "${q.question}" must have exactly one correct option (found ${correctCount})`,
        );
      }
    }

    return this.quizQuestionsRepo.manager.transaction(async (manager: EntityManager) => {
      const existingQuestions = await manager.find(QuizQuestion, {
        where: { module: { id: moduleId } },
        relations: { options: true },
      });

      const incomingQuestionIds = new Set(
        dto.questions.map((q) => q.id).filter((id): id is string => !!id),
      );
      const questionsToDelete = existingQuestions.filter((q) => !incomingQuestionIds.has(q.id));
      if (questionsToDelete.length > 0) {
        await manager.delete(QuizQuestion, questionsToDelete.map((q) => q.id));
      }

      for (const existingQ of existingQuestions) {
        if (!incomingQuestionIds.has(existingQ.id)) continue;
        const incomingQ = dto.questions.find((q) => q.id === existingQ.id);
        if (!incomingQ) continue; // guarded by the Set check above, but satisfies TS

        const incomingOptionIds = new Set(
          incomingQ.options.map((o) => o.id).filter((id): id is string => !!id),
        );
        const optionsToDelete = existingQ.options.filter((o) => !incomingOptionIds.has(o.id));
        if (optionsToDelete.length > 0) {
          await manager.delete(QuizOption, optionsToDelete.map((o) => o.id));
        }
      }

      const existingQuestionById = new Map(existingQuestions.map((q) => [q.id, q]));

      for (const [qIndex, q] of dto.questions.entries()) {
        let questionEntity: QuizQuestion;
        const matchedExisting = q.id ? existingQuestionById.get(q.id) : undefined;

        if (matchedExisting) {
          matchedExisting.question = q.question;
          matchedExisting.position = qIndex;
          questionEntity = await manager.save(QuizQuestion, matchedExisting);
        } else {
          const created = manager.create(QuizQuestion, {
            module,
            question: q.question,
            position: qIndex,
          });
          questionEntity = await manager.save(QuizQuestion, created);
        }

        const existingOptionById = new Map(
          (matchedExisting?.options ?? []).map((o) => [o.id, o]),
        );

        for (const [oIndex, o] of q.options.entries()) {
          const matchedOption = o.id ? existingOptionById.get(o.id) : undefined;

          if (matchedOption) {
            matchedOption.optionText = o.optionText;
            matchedOption.isCorrect = o.isCorrect;
            matchedOption.position = oIndex;
            await manager.save(QuizOption, matchedOption);
          } else {
            const createdOption = manager.create(QuizOption, {
              question: questionEntity,
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              position: oIndex,
            });
            await manager.save(QuizOption, createdOption);
          }
        }
      }

      // Read back through the same transactional manager, not
      // this.quizQuestionsRepo — that repo uses a separate connection
      // which, under READ COMMITTED, can't see these writes until this
      // transaction commits (commit happens only after this callback
      // returns). Reading through `manager` sees the writes immediately.
      return this.fetchQuizForEdit(moduleId, manager);
    });
  }

  async getQuizForEdit(moduleId: string): Promise<QuizQuestionEditResponseDto[]> {
    const module = await this.modulesRepo.findOne({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException(`Module with id "${moduleId}" not found`);
    }

    return this.fetchQuizForEdit(moduleId, this.quizQuestionsRepo.manager);
  }

  private async fetchQuizForEdit(
    moduleId: string,
    manager: EntityManager,
  ): Promise<QuizQuestionEditResponseDto[]> {
    const questions = await manager.find(QuizQuestion, {
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
        isCorrect: o.isCorrect,
        position: o.position,
      })),
    }));
  }
}