import { IsInt, Max, Min } from 'class-validator';

// #188 — the dashboard's inline daily-goal editor writes here. Bounds are
// loose on purpose (50 pt floor rules out a functionally-zero goal that'd
// make goalHit trivially true every day; 2400 pt ceiling rules out
// fat-fingering a value the goalHit/streak math was never meant to
// reason about) — not trying to encode a "recommended" range. #246 —
// rescaled from the old 5-240 minute bounds by the same x10
// POINTS_PER_MINUTE factor used everywhere else in this migration.
export class UpdateDailyGoalDto {
  @IsInt()
  @Min(50)
  @Max(2400)
  dailyGoalPoints: number;
}
