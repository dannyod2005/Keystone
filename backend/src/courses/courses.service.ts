import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { QuizOption } from '../quiz/entities/quiz-option.entity';
import { UpsertQuestionDto } from '../quiz/dto/upsert-quiz.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  findAll(): Promise<Course[]> {
    return this.coursesRepo.find({
      // Catalogue view — soft-deleted courses are excluded here, but this
      // filter is deliberately local to this query, not baked into the
      // entity (see Course.deletedAt comment). An enrolled learner's
      // course join elsewhere is untouched by this.
      where: { deletedAt: IsNull() },
      relations: { modules: true, credits: true, faqs: true },
      order: {
        modules: { position: 'ASC' },
        credits: { position: 'ASC' },
        faqs: { position: 'ASC' },
      },
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { modules: true, credits: true, faqs: true },
      order: {
        modules: { position: 'ASC' },
        credits: { position: 'ASC' },
        faqs: { position: 'ASC' },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with id "${id}" not found`);
    }

    return course;
  }

  async remove(id: string): Promise<void> {
    // update() rather than a find-then-save round trip — also naturally
    // covers "already deleted" as a no-op match failure, which we want to
    // surface as 404 rather than silently succeeding.
    const result = await this.coursesRepo.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Course with id "${id}" not found`);
    }
  }

  async create(dto: CreateCourseDto, ownerId: string): Promise<Course> {
    // #137 — ownerId always comes from the authenticated caller
    // (req.user.id), never from the DTO/client. providerId is derived
    // server-side too, from the owner's own profile — a course is only
    // ever provider-scoped because its creator belongs to that provider
    // at creation time, not because anyone asked for it in the request.
    const owner = await this.profilesRepo.findOne({ where: { id: ownerId } });

    // #274 — validate every inline quiz question up front, before
    // touching the database at all, same fail-fast principle as
    // ModulesService.upsertQuiz's equivalent check for the edit-mode
    // quiz endpoint.
    for (const m of dto.modules) {
      for (const q of m.quizQuestions ?? []) {
        this.validateQuizQuestion(q);
      }
    }

    // #274 — the whole create is one transaction: course, modules, and
    // any inline quiz questions/options are all inserted together, so a
    // trainer authoring quizzes in the "New course" flow (before any
    // module has a real id) can never end up with a course that saved
    // but left some quiz content out, or vice versa.
    return this.coursesRepo.manager.transaction(async (manager) => {
      const course = manager.create(Course, {
        title: dto.title,
        provider: dto.provider,
        category: dto.category,
        level: dto.level,
        hours: dto.hours,
        color: dto.color,
        blurb: dto.blurb ?? null,
        skills: dto.skills ?? [],
        ownerId,
        providerId: owner?.providerId ?? null,
        modules: dto.modules.map((m, i) => ({
          position: i,
          title: m.title,
          videoUrl: m.videoUrl ?? null,
        })),
        credits: (dto.credits ?? []).map((c, i) => ({
          position: i,
          line: c.line,
        })),
        faqs: (dto.faqs ?? []).map((f, i) => ({
          position: i,
          question: f.question,
          answer: f.answer,
        })),
      });

      const saved = await manager.save(Course, course);

      // #274 — saved.modules is cascade-inserted from the same
      // dto.modules.map(...) array above, in the same order, so each
      // dto.modules[i] pairs positionally with the now-persisted
      // saved.modules[i] — that's the real module row/id a trainer's
      // inline quiz questions attach to.
      for (const [i, m] of dto.modules.entries()) {
        const questions = m.quizQuestions ?? [];
        if (questions.length === 0) continue;

        const moduleEntity = saved.modules[i];
        await this.createQuizQuestions(manager, moduleEntity, questions);
      }

      return saved;
    });
  }

  // #274 — same validation ModulesService.upsertQuiz applies to
  // edit-mode quiz saves: an mcq question needs exactly one option
  // marked correct, a short_answer question needs at least one
  // acceptable answer.
  private validateQuizQuestion(q: UpsertQuestionDto): void {
    const type = q.type ?? 'mcq';
    if (type === 'mcq') {
      const correctCount = (q.options ?? []).filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException(
          `Question "${q.question}" must have exactly one correct option (found ${correctCount})`,
        );
      }
    } else if (!q.acceptableAnswers || q.acceptableAnswers.length === 0) {
      throw new BadRequestException(
        `Question "${q.question}" needs at least one acceptable answer`,
      );
    }
  }

  // #274 — pure create path (no existing rows to merge/delete-by-id the
  // way ModulesService.upsertQuiz has to for an edit): every module here
  // is brand new, so every question and option is simply inserted.
  private async createQuizQuestions(
    manager: EntityManager,
    moduleEntity: CourseModule,
    questions: UpsertQuestionDto[],
  ): Promise<void> {
    for (const [qIndex, q] of questions.entries()) {
      const type = q.type ?? 'mcq';
      const questionEntity = await manager.save(
        QuizQuestion,
        manager.create(QuizQuestion, {
          module: moduleEntity,
          question: q.question,
          position: qIndex,
          type,
        }),
      );

      const optionRows =
        type === 'mcq'
          ? (q.options ?? []).map((o, oIndex) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              position: oIndex,
            }))
          : (q.acceptableAnswers ?? []).map((text, oIndex) => ({
              optionText: text,
              isCorrect: true,
              position: oIndex,
            }));

      await manager.save(
        QuizOption,
        optionRows.map((o) =>
          manager.create(QuizOption, { ...o, question: questionEntity }),
        ),
      );
    }
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id); // 404s if missing

    return this.coursesRepo.manager.transaction(async (manager) => {
      // Delete orphaned children FIRST, in their own statements, before
      // any insert/update happens. TypeORM's cascade-save always runs
      // inserts before deletes within a single save() call, which trips
      // the (course_id, position) unique constraint the moment a new
      // module reuses a position a soon-to-be-deleted module still
      // occupies. Deleting explicitly beforehand means that position is
      // already free by the time save() runs.
      await this.deleteOrphaned(
        manager,
        CourseModule,
        course.modules,
        dto.modules,
      );
      await this.deleteOrphaned(
        manager,
        CourseCredit,
        course.credits,
        dto.credits ?? [],
      );
      await this.deleteOrphaned(
        manager,
        CourseFaq,
        course.faqs,
        dto.faqs ?? [],
      );

      course.title = dto.title;
      course.provider = dto.provider;
      course.category = dto.category;
      course.level = dto.level;
      course.hours = dto.hours;
      course.color = dto.color;
      course.blurb = dto.blurb ?? null;
      course.skills = dto.skills ?? [];

      course.modules = this.mergeChildren(
        course.modules,
        dto.modules,
        (m, position) => ({
          position,
          title: m.title,
          videoUrl: m.videoUrl ?? null,
        }),
      ) as Course['modules'];
      course.credits = this.mergeChildren(
        course.credits,
        dto.credits ?? [],
        (c, position) => ({ position, line: c.line }),
      ) as Course['credits'];
      course.faqs = this.mergeChildren(
        course.faqs,
        dto.faqs ?? [],
        (f, position) => ({ position, question: f.question, answer: f.answer }),
      ) as Course['faqs'];

      return manager.save(Course, course);
    });
  }

  /**
   * Deletes existing child rows whose id is not present in the incoming
   * DTO array at all — i.e. genuinely removed by the client. Runs BEFORE
   * mergeChildren/save so the (course_id, position) unique constraint
   * never sees a stale row still occupying a position a new row wants.
   */
  private async deleteOrphaned<
    Existing extends { id: string },
    Incoming extends { id?: string },
  >(
    manager: import('typeorm').EntityManager,
    entityClass: new () => Existing,
    existing: Existing[],
    incoming: Incoming[],
  ): Promise<void> {
    const incomingIds = new Set(incoming.map((i) => i.id).filter(Boolean));
    const removedIds = existing
      .map((e) => e.id)
      .filter((existingId) => !incomingIds.has(existingId));

    if (removedIds.length > 0) {
      await manager.delete(entityClass, { id: In(removedIds) });
    }
  }

  /**
   * Builds the final array to assign to course.modules/credits/faqs.
   * - Incoming item WITH a matching existing id -> updated in place,
   *   same id preserved.
   * - Incoming item with no id (or an id no longer present, e.g. it was
   *   already deleted above) -> treated as new, inserted as a fresh row.
   * position is always re-derived from array order, never trusted from
   * the client.
   */
  private mergeChildren<
    Existing extends { id: string },
    Incoming extends { id?: string },
    Fields,
  >(
    existing: Existing[],
    incoming: Incoming[],
    toFields: (item: Incoming, position: number) => Fields,
  ): (Existing | Fields)[] {
    const existingById = new Map(existing.map((e) => [e.id, e]));

    return incoming.map((item, position) => {
      const fields = toFields(item, position);
      if (item.id && existingById.has(item.id)) {
        return { ...existingById.get(item.id), ...fields };
      }
      return fields;
    });
  }
}
