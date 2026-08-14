import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  // #186 — nullable: NULL means "hasn't picked a role yet" (currently only
  // reachable via Google sign-in, which has no role-toggle step before the
  // OAuth redirect). Email signup always sends a role at signUp() time, so
  // those accounts never see NULL here. See MakeProfileRoleNullable
  // migration for why this mirrors `goal`'s nullable "unset" pattern.
  @Column({ type: 'text', nullable: true })
  role: string | null; // learner | trainer | null (not chosen yet)

  @Column({ type: 'text', nullable: true })
  goal: string | null;

  @Column({ type: 'int', default: 0 })
  streak: number;

  // #246 — was a raw minutes count; now points (see ActivityService's
  // POINTS_PER_MINUTE), rescaled by the same factor in the
  // RenameProfilesDailyGoalMinToPoints migration.
  @Column({ name: 'daily_goal_points', type: 'int', default: 300 })
  dailyGoalPoints: number;

  // #137 — single, optional provider membership. Plain nullable scalar FK
  // rather than a join table: v1 only needs "at most one provider per
  // trainer", and a join table (supporting multiple memberships) is
  // deliberately deferred until that's actually needed.
  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId: string | null;

  // #231 — opt-in to appearing on the global leaderboard, ranked by
  // weekly learning points. Defaults false/off: competitive rankings
  // aren't for everyone, and an opted-out learner must never appear —
  // see LeaderboardService, which filters on this column directly rather
  // than relying on the frontend to hide anyone.
  @Column({ name: 'leaderboard_opt_in', type: 'boolean', default: false })
  leaderboardOptIn: boolean;
}
