import { IsInt, Max, Min } from 'class-validator';

// #188 — the dashboard's inline daily-goal editor writes here. Bounds are
// loose on purpose (50 pt floor rules out a functionally-zero goal that'd
// make goalHit trivially true every day; ceiling rules out fat-fingering
// a value the goalHit/streak math was never meant to reason about) — not
// trying to encode a "recommended" range. #246 — originally rescaled from
// the old 5-240 minute bounds by the x10 POINTS_PER_MINUTE factor used
// everywhere else in that migration (giving 2400). #296 — raised to 3200:
// the SettingsScreen presets now top out at 3000 (see
// DAILY_GOAL_PRESETS's comment for why — 2400 sat below the recalibrated
// top preset, which would have made picking it a silent no-op).
export class UpdateDailyGoalDto {
  @IsInt()
  @Min(50)
  @Max(3200)
  dailyGoalPoints: number;
}
