import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseModule } from '../../courses/entities/course-module.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('forum_posts')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  // Nullable, forward-compatible column for threading (#39) — not yet
  // used anywhere in application logic. SET NULL rather than CASCADE:
  // deleting a parent post shouldn't silently delete its replies too;
  // they become orphaned top-level posts instead.
  @ManyToOne(() => ForumPost, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_post_id' })
  parentPost: ForumPost | null;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Bumped automatically by TypeORM on every save() that changes the row.
  // A post is considered edited when this no longer matches createdAt —
  // see PostResponseDto.edited.
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}