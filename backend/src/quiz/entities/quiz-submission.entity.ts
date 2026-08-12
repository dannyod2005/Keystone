import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { QuizQuestion } from './quiz-question.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('quiz_submissions')
export class QuizSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Profile;

  // #40 — direct relation added (was previously only implied
  // transitively via option.question). Every submission has one,
  // regardless of question type — this is what makes the "already
  // submitted this question" check a plain query instead of a join
  // through quiz_options, which had no equivalent for short-answer
  // submissions anyway.
  @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  // #40 — nullable now: set for an MCQ submission (question.type ===
  // 'mcq'), null for a short-answer one. Exactly one of option/answerText
  // is ever set — enforced by a DB CHECK constraint, not just convention.
  @ManyToOne(() => QuizOption, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'option_id' })
  option: QuizOption | null;

  // #40 — the learner's free-text answer for a short-answer submission,
  // null for MCQ.
  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText: string | null;

  // #40 — auto-graded and stored at submission time for both question
  // types (decision: keyword/exact-match auto-grading, not manual —
  // see the migration comment). Previously this was derived on every
  // read via option.isCorrect; short-answer submissions have no option
  // to derive it from, so grading now happens once, at insert time, for
  // both types alike.
  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}
