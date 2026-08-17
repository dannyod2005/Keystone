import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UserBadge } from './entities/user-badge.entity';
import { UserBadgeResponseDto } from './dto/user-badge-response.dto';
import { BADGE_DEFINITIONS_BY_KEY } from './badge-definitions';

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(UserBadge)
    private readonly userBadgesRepo: Repository<UserBadge>,
  ) {}

  // #225 — the only place that actually inserts a user_badges row. Every
  // evaluate* method below is just "does this event's data qualify for
  // one of the fixed badge keys" — this is the single idempotent
  // write, shared by all of them. `.insert()` rather than
  // find-then-create: the unique (user, badge_key) constraint (see
  // UserBadge) already guarantees "at most once," so relying on it via
  // a caught 23505 is simpler and race-safe, unlike a
  // check-then-insert that could still double-write under concurrent
  // calls.
  async award(userId: string, badgeKey: string): Promise<void> {
    try {
      await this.userBadgesRepo.insert({
        user: { id: userId },
        badgeKey,
      });
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as { code?: string }).code === '23505'
      ) {
        return; // already earned — idempotent no-op
      }
      throw err;
    }
  }

  // #225 — called from EnrollmentsService.updateProgress right after an
  // enrollment's status transitions to 'complete', with the learner's
  // total completed-course count (computed there, not here — this
  // service stays generic and doesn't need to know about the enrollments
  // table). Each threshold only ever matches the exact count at which it
  // was first crossed, so this is naturally called at most once per
  // learner per badge even without the award() idempotency guarantee.
  async evaluateCourseCompletion(
    userId: string,
    completedCourseCount: number,
  ): Promise<void> {
    if (completedCourseCount === 1) {
      await this.award(userId, 'first_course_complete');
    }
    if (completedCourseCount === 5) {
      await this.award(userId, 'five_courses_complete');
    }
  }

  // #225 — called from ModulesService.submitQuiz on a fresh (not
  // already-submitted) quiz submission. A learner scoring 100% on more
  // than one quiz just re-hits the same already-earned badge — award()
  // absorbs that as a no-op.
  async evaluateQuizSubmission(
    userId: string,
    score: number,
    total: number,
  ): Promise<void> {
    if (total > 0 && score === total) {
      await this.award(userId, 'perfect_quiz_score');
    }
  }

  // #225 — called from ModulesService.createPost; isFirstPost is
  // whether the post just saved was this user's very first ever
  // (computed there via a post count, same reasoning as
  // evaluateCourseCompletion above).
  async evaluateForumPost(userId: string, isFirstPost: boolean): Promise<void> {
    if (isFirstPost) {
      await this.award(userId, 'first_forum_post');
    }
  }

  // #225 — Dashboard's badges section. Earned-order (oldest first) so
  // a learner's badge list reads chronologically, same as most
  // "achievements" UIs. Any badge_key with no matching definition (e.g.
  // a badge retired from BADGE_DEFINITIONS after being earned by
  // someone) is silently dropped rather than crashing the response —
  // there's no display text left to show for it.
  async getBadgesForUser(userId: string): Promise<UserBadgeResponseDto[]> {
    const earned = await this.userBadgesRepo.find({
      where: { user: { id: userId } },
      order: { earnedAt: 'ASC' },
    });

    return earned
      .map((b) => {
        const def = BADGE_DEFINITIONS_BY_KEY.get(b.badgeKey);
        if (!def) return null;
        return {
          key: def.key,
          label: def.label,
          description: def.description,
          earnedAt: b.earnedAt,
        };
      })
      .filter((b): b is UserBadgeResponseDto => b !== null);
  }
}
