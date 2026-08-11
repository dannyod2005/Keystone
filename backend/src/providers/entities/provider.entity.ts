import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// #137 — a real, first-class entity distinct from courses.provider (which
// stays a free-text display string). This is the actual auth-relevant
// concept: a group of trainers who share edit access on courses scoped to
// it. Kept deliberately minimal here — creation/join endpoints are a
// separate follow-up issue; this table exists now so profiles.providerId
// and courses.providerId have something to point at.
@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  // Shared, regenerable join code (Discord/Zoom-link style) — the join
  // mechanism decided for the follow-up invite/join-flow issue. The column
  // exists from day one so this migration doesn't need revisiting later.
  @Column({ name: 'invite_code', type: 'text', unique: true })
  inviteCode: string;

  // #138 — the creator, permanently. Independent of current membership
  // (profiles.provider_id) so ownership survives the owner later leaving.
  // Gates the regenerate-invite-code endpoint. Nullable/SET NULL — see
  // migration comment.
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
