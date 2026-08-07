import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CourseModule } from './course-module.entity';
import { CourseCredit } from './course-credit.entity';
import { CourseFaq } from './course-faq.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  provider: string;

  @Column()
  category: string; // Technical | Business | Leadership

  @Column()
  level: string; // Beginner | Intermediate | Advanced

  @Column({ type: 'int', default: 0 })
  hours: number;

  @Column({ type: 'decimal', nullable: true })
  rating: number | null;

  @Column({ type: 'int', default: 0 })
  learners: number;

  @Column()
  color: string; // ink | gold | success | coral

  @Column({ type: 'text', nullable: true })
  blurb: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Deliberately a plain column, not @DeleteDateColumn — see the migration
  // comment for why: TypeORM's built-in soft-delete auto-filters this
  // entity out of every join, which would hide an already-enrolled
  // learner's course from their own dashboard. Filtering is applied
  // explicitly in CoursesService instead, only where it belongs.
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true, orphanedRowAction: 'delete' })
  modules: CourseModule[];

  @OneToMany(() => CourseCredit, (c) => c.course, { cascade: true, orphanedRowAction: 'delete' })
  credits: CourseCredit[];

  @OneToMany(() => CourseFaq, (f) => f.course, { cascade: true, orphanedRowAction: 'delete' })
  faqs: CourseFaq[];
}