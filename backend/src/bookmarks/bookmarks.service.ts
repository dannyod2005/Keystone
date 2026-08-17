import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Course } from '../courses/entities/course.entity';
import { BookmarkResponseDto } from './dto/bookmark-response.dto';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarksRepo: Repository<Bookmark>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
  ) {}

  // #230 — same shape as EnrollmentsService.create: deletedAt filter so a
  // soft-deleted course can't be bookmarked (same NotFoundException a
  // genuinely missing course gets), and the unique(user, course) DB
  // constraint is what actually enforces idempotency — a duplicate call
  // surfaces as a 409 rather than silently succeeding twice.
  async create(userId: string, courseId: string): Promise<BookmarkResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const course = await this.coursesRepo.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
    if (!course) {
      throw new NotFoundException(`Course with id "${courseId}" not found`);
    }

    const bookmark = this.bookmarksRepo.create({ user: profile, course });

    try {
      const saved = await this.bookmarksRepo.save(bookmark);
      return this.toResponseDto(saved, course.id);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('This course is already bookmarked');
      }
      throw err;
    }
  }

  async findAllForUser(userId: string): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.bookmarksRepo.find({
      where: { user: { id: userId } },
      relations: { course: true },
      order: { createdAt: 'DESC' },
    });

    return bookmarks.map((b) => this.toResponseDto(b, b.course.id));
  }

  // #230 — unbookmark keyed on courseId rather than the bookmark's own id:
  // the frontend only ever tracks bookmarkedIds (a set of course ids, same
  // pattern as enrolledIds), never the bookmark row's id, so this avoids
  // making the frontend look that up first just to toggle the icon back
  // off.
  async remove(userId: string, courseId: string): Promise<void> {
    const bookmark = await this.bookmarksRepo.findOne({
      where: { user: { id: userId }, course: { id: courseId } },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.bookmarksRepo.remove(bookmark);
  }

  private toResponseDto(
    bookmark: Bookmark,
    courseId: string,
  ): BookmarkResponseDto {
    return {
      id: bookmark.id,
      courseId,
      createdAt: bookmark.createdAt,
    };
  }
}
