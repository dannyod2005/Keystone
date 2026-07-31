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

  @Column({ type: 'int', default: 0 })
  projects: number;

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

  @OneToMany(() => CourseModule, (m) => m.course)
  modules: CourseModule[];

  @OneToMany(() => CourseCredit, (c) => c.course)
  credits: CourseCredit[];

  @OneToMany(() => CourseFaq, (f) => f.course)
  faqs: CourseFaq[];
}