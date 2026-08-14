// #231 — id is included (not just name/rank) so the frontend can bold/
// highlight the requesting learner's own row without a second lookup;
// no other personal data (email, etc.) is exposed to other learners.
export class LeaderboardEntryDto {
  rank: number;
  id: string;
  name: string;
  weeklyMinutes: number;
  isSelf: boolean;
}
