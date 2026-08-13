export class ActivityDayDto {
  date: string; // 'YYYY-MM-DD', UTC
  minutes: number;
  goalHit: boolean;
}

export class ActivitySummaryResponseDto {
  streak: number;
  minutesThisWeek: number;
  dailyGoalMin: number;
  goalHitDays: number;
  // #183 — Monday -> Sunday (UTC), 7 entries, for the requested
  // weekOffset (default: the current week).
  week: ActivityDayDto[];
}
