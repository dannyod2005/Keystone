import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ActivityEvent } from './entities/activity-event.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ActivitySummaryResponseDto } from './dto/activity-summary-response.dto';

// Fixed for now — there's no per-user goal-setting UI yet. Matches the
// value the old LEARNER mock used, so the dashboard doesn't visually jump
// when this lands.
const DAILY_GOAL_MIN = 30;

// How far back to pull events when walking the streak. Bounded so the
// query stays cheap; generous enough that no realistic streak in this
// prototype gets cut short.
const STREAK_LOOKBACK_DAYS = 120;

@Injectable()
export class ActivityService {
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
  async logEvent(userId: string, source: string, minutes: number): Promise<void> {
    if (!minutes || minutes <= 0) return;

    const event = this.activityRepo.create({
      user: { id: userId } as Profile,
      source,
      minutes,
    });
    await this.activityRepo.save(event);
  }

  async getSummary(userId: string): Promise<ActivitySummaryResponseDto> {
    const profile = await this.profilesRepo.findOne({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    const now = new Date();
    const weekStart = startOfWeekUTC(now);
    const weekEnd = addDaysUTC(weekStart, 7);
    const historyStart = addDaysUTC(weekStart, -STREAK_LOOKBACK_DAYS);

    const events = await this.activityRepo.find({
      where: {
        user: { id: userId },
        occurredAt: Between(historyStart, weekEnd),
      },
    });

    const minutesByDate = new Map<string, number>();
    for (const e of events) {
      const key = toDateKey(e.occurredAt);
      minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + e.minutes);
    }

    const todayKey = toDateKey(now);
    const streak = computeStreak(minutesByDate, now);

    const week = Array.from({ length: 7 }, (_, i) => {
      const date = addDaysUTC(weekStart, i);
      const key = toDateKey(date);
      const minutes = minutesByDate.get(key) ?? 0;
      return { date: key, minutes, goalHit: minutes >= DAILY_GOAL_MIN };
    });

    // Only count days up to and including today — a day later this week
    // that hasn't happened yet shouldn't drag the average down or block a
    // "goal hit" count that's meant to reflect what's actually happened.
    const daysSoFar = week.filter((d) => d.date <= todayKey);
    const minutesThisWeek = daysSoFar.reduce((sum, d) => sum + d.minutes, 0);
    const goalHitDays = daysSoFar.filter((d) => d.goalHit).length;

    return {
      streak,
      minutesThisWeek,
      dailyGoalMin: DAILY_GOAL_MIN,
      goalHitDays,
      week,
    };
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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

  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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
