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

  @OneToMany(() => QuizOption, (option) => option.question)
  options: QuizOption[];
}