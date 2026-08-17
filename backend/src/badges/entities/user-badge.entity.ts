import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

// #225 — one row per (user, badge) the moment it's earned. badgeKey is a
// plain string matched against BADGE_DEFINITIONS at read time (see
// BadgesService.getBadgesForUser) rather than a foreign key into a
// badges table — the definition set is fixed application code, not data,
// so there's nothing to join against. The unique constraint is what
// makes BadgesService.award idempotent: awarding an already-earned badge
// again is a no-op (23505 caught and swallowed), not an error.
@Entity('user_badges')
@Unique(['user', 'badgeKey'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @Column({ name: 'badge_key', type: 'text' })
  badgeKey: string;

  @CreateDateColumn({ name: 'earned_at' })
  earnedAt: Date;
}
