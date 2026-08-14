// #225 — a UserBadge row enriched with its BADGE_DEFINITIONS label/
// description at read time (see BadgesService.getBadgesForUser).
export class UserBadgeResponseDto {
  key: string;
  label: string;
  description: string;
  earnedAt: Date;
}
