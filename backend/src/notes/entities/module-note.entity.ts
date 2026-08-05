import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CourseModule } from '../../courses/entities/course-module.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity('module_notes')
@Unique(['module', 'user'])
export class ModuleNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}