export class ActivityDayDto {
  date: string; // 'YYYY-MM-DD', UTC
  points: number;
  goalHit: boolean;
}

export class ActivitySummaryResponseDto {
  streak: number;
  pointsThisWeek: number;
  dailyGoalPoints: number;
  goalHitDays: number;
  // #183 — Monday -> Sunday (UTC), 7 entries, for the requested
  // weekOffset (default: the current week).
  week: ActivityDayDto[];
}
