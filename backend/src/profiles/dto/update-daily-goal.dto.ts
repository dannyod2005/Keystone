import { IsInt, Max, Min } from 'class-validator';

// #188 — the dashboard's inline daily-goal editor writes here. Bounds are
// loose on purpose (5 min floor rules out a functionally-zero goal that'd
// make goalHit trivially true every day; 240 min / 4h ceiling rules out
// fat-fingering a value the goalHit/streak math was never meant to
// reason about) — not trying to encode a "recommended" range.
export class UpdateDailyGoalDto {
  @IsInt()
  @Min(5)
  @Max(240)
  dailyGoalMin: number;
}
