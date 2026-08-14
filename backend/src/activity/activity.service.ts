import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { ActivityEvent } from './entities/activity-event.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ActivitySummaryResponseDto } from './dto/activity-summary-response.dto';

// #188 — used only as a last-resort fallback (a profile row that
// somehow has a null dailyGoalMin — shouldn't happen given the column's
// DB default, but this keeps goalHit/buildWeek from doing math against
// undefined if it ever does). The real, per-learner value now comes from
// profile.dailyGoalMin, set at signup and editable from the dashboard.
const DEFAULT_DAILY_GOAL_MIN = 30;

// How far back to pull events when walking the streak. Bounded so the
// query stays cheap; generous enough that no realistic streak in this
// prototype gets cut short.
const STREAK_LOOKBACK_DAYS = 120;

// #124 — small credit for a module being open on a given day at all,
// independent of whether anything else (a note, a quiz) was logged that
// day. Same scale as NOTE_SAVE_MINUTES/FORUM_POST_MINUTES in
// modules.service.ts. Its main job isn't really the minutes — it's
// leaving a per-day marker so logModuleCompletion below knows which days
// to split a module's completion minutes across.
const MODULE_VIEW_MINUTES = 3;

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectRepository(ActivityEvent)
    private readonly activityRepo: Repository<ActivityEvent>,
    @InjectRepository(Profile)
    private readonly profilesRepo: Repository<Profile>,
  ) {}

  // Called by other services right after a real learning action happens
  // (module completed, quiz submitted, note saved, forum post made).
  // `minutes` is an estimate assigned by the caller, not a measured
  // duration — see #37. Deliberately swallows a missing-profile case
  // rather than throwing: the caller has already validated the profile
  // exists as part of doing the real work, and a logging hiccup shouldn't
  // be allowed to fail the action itself.
  //
  // #124 — `opts.occurredAt`, if given, overrides the default "right now"
  // timestamp. Only logModuleCompletion actually uses this, to backdate a
  // split completion event to the day it was really earned rather than
  // the day "Mark complete" was clicked. Left undefined, TypeORM's
  // @CreateDateColumn behaves exactly as before.
  //
  // #178 — that "shouldn't be allowed to fail the action itself" intent
  // was only actually enforced for the missing-minutes case above; the DB
  // write itself wasn't guarded, so any failure here (e.g. the
  // activity_events schema drifting out from under the entity) propagated
  // straight up and took the caller's whole request down with it — this
  // is exactly how forum post creation ended up 500ing even though the
  // post itself had already been saved successfully. Activity logging is
  // a best-effort side effect, never load-bearing for the action that
  // triggered it, so failures here are now caught and logged rather than
  // thrown.
  async logEvent(
    userId: string,
    source: string,
    minutes: number,
    opts?: { moduleId?: string; occurredAt?: Date },
  ): Promise<void> {
    if (!minutes || minutes <= 0) return;

    try {
      const event = this.activityRepo.create({
        user: { id: userId } as Profile,
        source,
        minutes,
        module: opts?.moduleId ? { id: opts.moduleId } : null,
      });
      if (opts?.occurredAt) {
        event.occurredAt = opts.occurredAt;
      }
      await this.activityRepo.save(event);
    } catch (err) {
      this.logger.error(
        `Failed to log activity event (userId=${userId}, source=${source}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // #124 — one credit per (user, module, day), regardless of how many
  // times the module is opened that day. Called from ModulesService.logView
  // on every module focus; the dedup check here is what keeps repeated
  // calls within the same day a no-op rather than stacking up minutes.
  async logModuleView(userId: string, moduleId: string): Promise<void> {
    const now = new Date();
    const dayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const dayEnd = addDaysUTC(dayStart, 1);

    // #178 — same fault-tolerance as logEvent below: this dedup check is
    // itself a DB read against activity_events, so it can fail for the
    // same reasons logEvent's write can. Guarded the same way, since
    // logView (the caller) has already done its own real work (confirming
    // the module exists) by the time this runs.
    try {
      const existing = await this.activityRepo.findOne({
        where: {
          user: { id: userId },
          module: { id: moduleId },
          source: 'module_view',
          occurredAt: Between(dayStart, dayEnd),
        },
      });
      if (existing) return;
    } catch (err) {
      this.logger.error(
        `Failed to check existing module_view activity (userId=${userId}, moduleId=${moduleId}): ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    await this.logEvent(userId, 'module_view', MODULE_VIEW_MINUTES, {
      moduleId,
    });
  }

  // #124 — the actual fix for the issue: instead of logging a module's
  // whole estimated `totalMinutes` on the single day it's marked complete,
  // split it across every distinct day the module was viewed (per
  // logModuleView above), each dated to the day it happened. Completion
  // day is always included even if no view was separately logged for it
  // today — clicking "Mark complete" is itself evidence of work done that
  // day, matching the old single-day behavior for a module worked in one
  // sitting.
  async logModuleCompletion(
    userId: string,
    moduleId: string,
    totalMinutes: number,
  ): Promise<void> {
    if (!totalMinutes || totalMinutes <= 0) return;

    const viewedDayKeys = await this.getViewedDayKeys(userId, moduleId);
    const todayKey = toDateKey(new Date());
    const dayKeys = Array.from(new Set([...viewedDayKeys, todayKey])).sort();

    const base = Math.floor(totalMinutes / dayKeys.length);
    let remainder = totalMinutes - base * dayKeys.length;

    // Remainder goes to the most recent day(s) first — the day the
    // learner actually finished feels like the natural place for the
    // rounding-up minute(s) to land.
    for (let i = dayKeys.length - 1; i >= 0; i--) {
      let minutes = base;
      if (remainder > 0) {
        minutes += 1;
        remainder -= 1;
      }
      if (minutes <= 0) continue;
      await this.logEvent(userId, 'module_complete', minutes, {
        moduleId,
        occurredAt: dateKeyToNoonUTC(dayKeys[i]),
      });
    }
  }

  // Distinct UTC date-keys this user has a 'module_view' event for this
  // module, ascending. Not date-bounded like getSummary's streak lookback
  // — the result set is naturally small (however many days one learner
  // spent on one module), so there's no cheap-query reason to cap it.
  private async getViewedDayKeys(
    userId: string,
    moduleId: string,
  ): Promise<string[]> {
    const events = await this.activityRepo.find({
      where: {
        user: { id: userId },
        module: { id: moduleId },
        source: 'module_view',
      },
    });
    const keys = new Set(events.map((e) => toDateKey(e.occurredAt)));
    return Array.from(keys).sort();
  }

  // #183 — weekOffset pages the calendar card's day grid to an adjacent
  // week (-1 = last week, 1 = next week, 0/default = the real current
  // week) without disturbing streak/minutesThisWeek/goalHitDays, which
  // stay pinned to the real current week regardless — those back the
  // separate "This week" card and the streak badge, neither of which the
  // calendar's arrows are meant to page.
  async getSummary(
    userId: string,
    weekOffset = 0,
  ): Promise<ActivitySummaryResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }
    const dailyGoalMin = profile.dailyGoalMin ?? DEFAULT_DAILY_GOAL_MIN;

    const now = new Date();
    const currentWeekStart = startOfWeekUTC(now);
    const currentWeekEnd = addDaysUTC(currentWeekStart, 7);
    const historyStart = addDaysUTC(currentWeekStart, -STREAK_LOOKBACK_DAYS);

    const viewedWeekStart = addDaysUTC(currentWeekStart, weekOffset * 7);
    const viewedWeekEnd = addDaysUTC(viewedWeekStart, 7);

    // Widen the fetch window to cover whichever is further out: the
    // streak lookback, or the week actually being viewed — a learner can
    // page further back than STREAK_LOOKBACK_DAYS, or forward past the
    // current week (harmless; nothing will be logged there).
    const fetchStart =
      viewedWeekStart < historyStart ? viewedWeekStart : historyStart;
    const fetchEnd =
      viewedWeekEnd > currentWeekEnd ? viewedWeekEnd : currentWeekEnd;

    // #179 — this is a read endpoint, not a side-effect, so it can't
    // "swallow and continue" the way #178's write paths do — there's no
    // real action to protect here, just this data itself. But the safest
    // failure mode is still a zeroed summary rather than a hard 500: if
    // the query fails (e.g. the same activity_events schema drift behind
    // #178/#179), fall back to an empty event list, which flows through
    // the exact same computation below to a legitimate "nothing logged
    // yet" response instead of taking the whole dashboard down with it.
    let events: ActivityEvent[] = [];
    try {
      events = await this.activityRepo.find({
        where: {
          user: { id: userId },
          occurredAt: Between(fetchStart, fetchEnd),
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to load activity events for summary (userId=${userId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const minutesByDate = new Map<string, number>();
    for (const e of events) {
      const key = toDateKey(e.occurredAt);
      minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + e.minutes);
    }

    const todayKey = toDateKey(now);
    const streak = computeStreak(minutesByDate, now);

    const week = buildWeek(viewedWeekStart, minutesByDate, dailyGoalMin);

    // Always the real current week, independent of weekOffset — see the
    // note above. Only count days up to and including today within that
    // week — a day later this week that hasn't happened yet shouldn't
    // drag the average down or block a "goal hit" count that's meant to
    // reflect what's actually happened.
    const currentWeekDays = buildWeek(
      currentWeekStart,
      minutesByDate,
      dailyGoalMin,
    );
    const daysSoFar = currentWeekDays.filter((d) => d.date <= todayKey);
    const minutesThisWeek = daysSoFar.reduce((sum, d) => sum + d.minutes, 0);
    const goalHitDays = daysSoFar.filter((d) => d.goalHit).length;

    return {
      streak,
      minutesThisWeek,
      dailyGoalMin,
      goalHitDays,
      week,
    };
  }

  // #231 — batch version of getSummary's minutesThisWeek, for
  // LeaderboardService ranking many opted-in learners at once rather than
  // running getSummary's full per-user query (streak/week breakdown/etc.)
  // once per row. Same fetch-then-reduce-in-JS convention as getSummary
  // (no SQL aggregates), just reduced by user instead of by date. Every
  // requested userId is present in the returned map, defaulting to 0, so
  // a learner with zero logged minutes this week still ranks (last),
  // rather than being silently dropped.
  async getWeeklyMinutesForUsers(
    userIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>(userIds.map((id) => [id, 0]));
    if (userIds.length === 0) return result;

    const now = new Date();
    const weekStart = startOfWeekUTC(now);
    const weekEnd = addDaysUTC(weekStart, 7);

    let events: ActivityEvent[] = [];
    try {
      events = await this.activityRepo.find({
        where: {
          user: { id: In(userIds) },
          occurredAt: Between(weekStart, weekEnd),
        },
        relations: { user: true },
      });
    } catch (err) {
      // #179 — same reasoning as getSummary: fall back to the zeroed map
      // already built above rather than failing the whole leaderboard.
      this.logger.error(
        `Failed to load activity events for leaderboard (userIds=${userIds.length}): ${err instanceof Error ? err.message : String(err)}`,
      );
      return result;
    }

    for (const e of events) {
      result.set(e.user.id, (result.get(e.user.id) ?? 0) + e.minutes);
    }
    return result;
  }
}

function buildWeek(
  weekStart: Date,
  minutesByDate: Map<string, number>,
  dailyGoalMin: number,
) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysUTC(weekStart, i);
    const key = toDateKey(date);
    const minutes = minutesByDate.get(key) ?? 0;
    return { date: key, minutes, goalHit: minutes >= dailyGoalMin };
  });
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// #124 — noon UTC rather than midnight, so a backdated completion event
// can never drift onto the adjacent day's date-key when re-read through
// toDateKey (midnight is right on the UTC day boundary; noon has a full
// 12-hour margin on both sides — pure defensiveness, toDateKey's own
// slice(0, 10) wouldn't actually shift it either way, but this way the
// intent doesn't rely on that).
function dateKeyToNoonUTC(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function startOfWeekUTC(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0 = Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDaysUTC(d, mondayOffset);
}

// Consecutive days with logged activity, counting back from today. If
// nothing's been logged yet today, that's not treated as a broken streak
// — today isn't over yet — so counting falls back to yesterday instead.
// The streak only actually resets once a full day passes with zero
// activity.
function computeStreak(minutesByDate: Map<string, number>, now: Date): number {
  const isActive = (d: Date) => (minutesByDate.get(toDateKey(d)) ?? 0) > 0;

  let cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (!isActive(cursor)) {
    cursor = addDaysUTC(cursor, -1);
    if (!isActive(cursor)) return 0;
  }

  let streak = 0;
  while (isActive(cursor)) {
    streak++;
    cursor = addDaysUTC(cursor, -1);
  }
  return streak;
}
