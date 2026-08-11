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
  // Monday -> Sunday of the current week (UTC), 7 entries.
  week: ActivityDayDto[];
}
