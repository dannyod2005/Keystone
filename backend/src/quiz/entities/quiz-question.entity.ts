import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CourseModule } from '../../courses/entities/course-module.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseModule, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'module_id' })
  module: CourseModule;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'int' })
  position: number;

  // #40 — 'mcq' (default, matches every pre-existing question) or
  // 'short_answer'. For 'short_answer' questions, `options` below holds
  // the acceptable-answer keywords instead of MCQ choices (see the
  // QuizOption comment) — never sent to learners as selectable options.
  @Column({ type: 'text', default: 'mcq' })
  type: 'mcq' | 'short_answer';

  @OneToMany(() => QuizOption, (option) => option.question)
  options: QuizOption[];
}
