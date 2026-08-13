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

  @Column({ name: 'daily_goal_min', type: 'int', default: 30 })
  dailyGoalMin: number;

  // #137 — single, optional provider membership. Plain nullable scalar FK
  // rather than a join table: v1 only needs "at most one provider per
  // trainer", and a join table (supporting multiple memberships) is
  // deliberately deferred until that's actually needed.
  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId: string | null;
}
