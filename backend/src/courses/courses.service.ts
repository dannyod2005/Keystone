import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { CourseCredit } from './entities/course-credit.entity';
import { CourseFaq } from './entities/course-faq.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

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

    const course = this.coursesRepo.create({
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

    return this.coursesRepo.save(course);
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
