import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { LearningPath } from './entities/learning-path.entity';
import { LearningPathCourse } from './entities/learning-path-course.entity';
import { Course } from '../courses/entities/course.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { LearningPathResponseDto } from './dto/learning-path-response.dto';

@Injectable()
export class LearningPathsService {
  constructor(
    @InjectRepository(LearningPath)
    private readonly pathsRepo: Repository<LearningPath>,
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  async findAll(): Promise<LearningPathResponseDto[]> {
    const paths = await this.pathsRepo.find({
      where: { deletedAt: IsNull() },
      relations: { pathCourses: { course: true } },
      order: { pathCourses: { position: 'ASC' } },
    });
    return paths.map((p) => this.toResponseDto(p));
  }

  async findOne(id: string): Promise<LearningPathResponseDto> {
    return this.toResponseDto(await this.findPathEntity(id));
  }

  async create(
    dto: CreateLearningPathDto,
    ownerId: string,
  ): Promise<LearningPathResponseDto> {
    const courses = await this.validateCourseIds(dto.courseIds);
    // #137 — same ownership-stamping pattern as CoursesService.create:
    // ownerId always comes from the authenticated caller, providerId is
    // derived server-side from the owner's own profile, never client-supplied.
    const owner = await this.profilesRepo.findOne({ where: { id: ownerId } });

    const path = this.pathsRepo.create({
      title: dto.title,
      description: dto.description ?? null,
      ownerId,
      providerId: owner?.providerId ?? null,
      pathCourses: dto.courseIds.map((courseId, i) => ({
        position: i,
        course: courses.find((c) => c.id === courseId)!,
      })),
    });

    const saved = await this.pathsRepo.save(path);
    return this.toResponseDto(await this.findPathEntity(saved.id));
  }

  async update(
    id: string,
    dto: UpdateLearningPathDto,
  ): Promise<LearningPathResponseDto> {
    const path = await this.findPathEntity(id); // 404s if missing
    const courses = await this.validateCourseIds(dto.courseIds);

    return this.pathsRepo.manager.transaction(async (manager) => {
      // #224 — wholesale replace of the ordered course list rather than the
      // id-preserving diff/merge CoursesService.update() needs for
      // modules/credits/faqs: nothing downstream ever references a
      // LearningPathCourse row's own id (see that entity's comment), so
      // there's no identity to preserve across an edit. Delete the old set
      // first, in its own statement — same reasoning as
      // CoursesService.deleteOrphaned: cascade-save runs inserts before
      // deletes within a single save() call, which would trip the
      // (learning_path_id, position) unique constraint otherwise.
      const existingIds = path.pathCourses.map((pc) => pc.id);
      if (existingIds.length > 0) {
        await manager.delete(LearningPathCourse, { id: In(existingIds) });
      }

      path.title = dto.title;
      path.description = dto.description ?? null;
      path.pathCourses = dto.courseIds.map((courseId, i) => ({
        position: i,
        course: courses.find((c) => c.id === courseId)!,
      })) as LearningPathCourse[];

      await manager.save(LearningPath, path);
      return this.toResponseDto(await this.findPathEntity(id));
    });
  }

  async remove(id: string): Promise<void> {
    // update() rather than find-then-save, same as CoursesService.remove —
    // an "already deleted" match failure surfaces as 404 instead of
    // silently succeeding.
    const result = await this.pathsRepo.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
    if (result.affected === 0) {
      throw new NotFoundException(`Learning path with id "${id}" not found`);
    }
  }

  private async findPathEntity(id: string): Promise<LearningPath> {
    const path = await this.pathsRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { pathCourses: { course: true } },
      order: { pathCourses: { position: 'ASC' } },
    });
    if (!path) {
      throw new NotFoundException(`Learning path with id "${id}" not found`);
    }
    return path;
  }

  // #224 — every referenced courseId must exist and not be soft-deleted (a
  // trainer can't build a path around a course no longer in the catalogue),
  // and no courseId may repeat (a path listing the same course twice would
  // break the "X of Y complete" progress math one-to-one against Enrollment
  // rows).
  private async validateCourseIds(courseIds: string[]): Promise<Course[]> {
    const uniqueIds = new Set(courseIds);
    if (uniqueIds.size !== courseIds.length) {
      throw new BadRequestException(
        'A learning path cannot list the same course twice',
      );
    }

    const courses = await this.coursesRepo.find({
      where: { id: In(courseIds), deletedAt: IsNull() },
    });
    if (courses.length !== courseIds.length) {
      throw new BadRequestException('One or more courses could not be found');
    }
    return courses;
  }

  private toResponseDto(path: LearningPath): LearningPathResponseDto {
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      ownerId: path.ownerId,
      providerId: path.providerId,
      courses: (path.pathCourses ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((pc) => pc.course),
      createdAt: path.createdAt,
    };
  }
}
